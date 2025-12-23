import pool from './db';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface Permission {
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ModulePermission extends Permission {
  module_nama: string;
  module_icon: string;
  module_path: string;
}

// Cache for permissions to reduce database calls
const permissionCache = new Map<string, { permissions: ModulePermission[], timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: string): Promise<ModulePermission[]> {
  // Check cache first
  const cached = permissionCache.get(role);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        rp.module_id,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete,
        m.nama as module_nama,
        m.icon as module_icon,
        m.path as module_path
      FROM role_permissions rp
      JOIN modules m ON rp.module_id = m.id
      WHERE rp.role = ? AND m.is_active = TRUE
      ORDER BY m.urutan ASC
    `, [role]) as any[];

    const permissions = rows as ModulePermission[];

    // Cache the result
    permissionCache.set(role, { permissions, timestamp: Date.now() });

    return permissions;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

/**
 * Check if a role has specific permission for a module
 */
export async function checkPermission(
  role: string,
  moduleId: string,
  action: PermissionAction
): Promise<boolean> {
  try {
    const permissions = await getRolePermissions(role);
    const modulePerm = permissions.find(p => p.module_id === moduleId);

    if (!modulePerm) return false;

    switch (action) {
      case 'view':
        return modulePerm.can_view;
      case 'create':
        return modulePerm.can_create;
      case 'edit':
        return modulePerm.can_edit;
      case 'delete':
        return modulePerm.can_delete;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a role can view a module
 */
export async function canView(role: string, moduleId: string): Promise<boolean> {
  return checkPermission(role, moduleId, 'view');
}

/**
 * Check if a role can create in a module
 */
export async function canCreate(role: string, moduleId: string): Promise<boolean> {
  return checkPermission(role, moduleId, 'create');
}

/**
 * Check if a role can edit in a module
 */
export async function canEdit(role: string, moduleId: string): Promise<boolean> {
  return checkPermission(role, moduleId, 'edit');
}

/**
 * Check if a role can delete in a module
 */
export async function canDelete(role: string, moduleId: string): Promise<boolean> {
  return checkPermission(role, moduleId, 'delete');
}

/**
 * Get viewable modules for a role (for navbar/menu)
 */
export async function getViewableModules(role: string): Promise<ModulePermission[]> {
  const permissions = await getRolePermissions(role);
  return permissions.filter(p => p.can_view);
}

/**
 * Clear permission cache (call when permissions are updated)
 */
export function clearPermissionCache(role?: string): void {
  if (role) {
    permissionCache.delete(role);
  } else {
    permissionCache.clear();
  }
}

/**
 * Get all available roles from role_permissions table
 */
export async function getAllRoles(): Promise<string[]> {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT role FROM role_permissions ORDER BY role
    `) as any[];

    return rows.map((r: { role: string }) => r.role);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

/**
 * Get permission summary for admin UI
 * Returns all modules with permissions for each role
 */
export async function getPermissionMatrix(): Promise<{
  modules: { id: string; nama: string; icon: string; path: string }[];
  roles: string[];
  permissions: Record<string, Record<string, Permission>>;
}> {
  try {
    // Get all active modules
    const [modules] = await pool.query(`
      SELECT id, nama, icon, path FROM modules WHERE is_active = TRUE ORDER BY urutan
    `) as any[];

    // Get all roles
    const roles = await getAllRoles();

    // Get all permissions
    const [allPerms] = await pool.query(`
      SELECT role, module_id, can_view, can_create, can_edit, can_delete
      FROM role_permissions
    `) as any[];

    // Build permission matrix
    const permissions: Record<string, Record<string, Permission>> = {};

    for (const role of roles) {
      permissions[role] = {};
      for (const mod of modules) {
        const perm = allPerms.find((p: any) => p.role === role && p.module_id === mod.id);
        permissions[role][mod.id] = perm ? {
          module_id: mod.id,
          can_view: Boolean(perm.can_view),
          can_create: Boolean(perm.can_create),
          can_edit: Boolean(perm.can_edit),
          can_delete: Boolean(perm.can_delete),
        } : {
          module_id: mod.id,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        };
      }
    }

    return { modules, roles, permissions };
  } catch (error) {
    console.error('Error getting permission matrix:', error);
    return { modules: [], roles: [], permissions: {} };
  }
}

// Role display names mapping
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Admin',
  bendahari: 'Bendahari',
  head_imam: 'Ketua Imam',
  aset: 'Pegawai Aset',
  pegawai: 'Pegawai',
  imam: 'Imam',
  bilal: 'Bilal',
  imam_jumaat: 'Imam Jumaat',
  bilal_jumaat: 'Bilal Jumaat',
  penceramah: 'Penceramah',
};

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}
