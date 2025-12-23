'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {isOnline ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ color: '#4CAF50', marginBottom: '16px' }}>
              Back Online!
            </h1>
            <p style={{ color: '#666' }}>
              Redirecting to dashboard...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📡</div>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>
              You're Offline
            </h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              No internet connection detected. Some features may not be available.
            </p>
            <div style={{
              padding: '16px',
              backgroundColor: '#E3F2FD',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1976D2' }}>
                💡 You can still view previously loaded schedules and data
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
