'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    // Dynamically import Bootstrap JavaScript
    import('bootstrap/dist/js/bootstrap.bundle.min.js').catch((error) => {
      console.error('Failed to load Bootstrap JS:', error);
    });
  }, []);

  return null;
}
