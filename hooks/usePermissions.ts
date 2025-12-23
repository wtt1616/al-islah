'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ModulePermission {
  module_id: string;
  module_nama: string;
  module_icon: string;
  module_path: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UsePermissionsResult {
  permissions: ModulePermission[];
  loading: boolean;
  error: string | null;
  hasPermission: (moduleId: string, action: PermissionAction) => boolean;
  canView: (moduleId: string) => boolean;
  canCreate: (moduleId: string) => boolean;
  canEdit: (moduleId: string) => boolean;
  canDelete: (moduleId: string) => boolean;
  getViewableModules: () => ModulePermission[];
  refetch: () => Promise<void>;
}

// Cache to avoid refetching on every component mount
let permissionsCache: ModulePermission[] | null = null;
let cacheRole: string | null = null;

export function usePermissions(): UsePermissionsResult {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<ModulePermission[]>(permissionsCache || []);
  const [loading, setLoading] = useState(permissionsCache === null);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.role) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const currentRole = session.user.role;

    // Use cache if role hasn't changed
    if (permissionsCache && cacheRole === currentRole) {
      setPermissions(permissionsCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/permissions?role=${encodeURIComponent(currentRole)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await res.json();
      const perms = data.data || [];

      // Update cache
      permissionsCache = perms;
      cacheRole = currentRole;

      setPermissions(perms);
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role, status]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (moduleId: string, action: PermissionAction): boolean => {
      const perm = permissions.find(p => p.module_id === moduleId);
      if (!perm) return false;

      switch (action) {
        case 'view':
          return perm.can_view;
        case 'create':
          return perm.can_create;
        case 'edit':
          return perm.can_edit;
        case 'delete':
          return perm.can_delete;
        default:
          return false;
      }
    },
    [permissions]
  );

  const canView = useCallback(
    (moduleId: string): boolean => hasPermission(moduleId, 'view'),
    [hasPermission]
  );

  const canCreate = useCallback(
    (moduleId: string): boolean => hasPermission(moduleId, 'create'),
    [hasPermission]
  );

  const canEdit = useCallback(
    (moduleId: string): boolean => hasPermission(moduleId, 'edit'),
    [hasPermission]
  );

  const canDelete = useCallback(
    (moduleId: string): boolean => hasPermission(moduleId, 'delete'),
    [hasPermission]
  );

  const getViewableModules = useCallback((): ModulePermission[] => {
    return permissions.filter(p => p.can_view);
  }, [permissions]);

  const refetch = useCallback(async () => {
    // Clear cache to force refetch
    permissionsCache = null;
    cacheRole = null;
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    getViewableModules,
    refetch,
  };
}

// Export a function to clear permissions cache (use when permissions are updated)
export function clearPermissionsCache(): void {
  permissionsCache = null;
  cacheRole = null;
}
