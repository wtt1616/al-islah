'use client';

import { useEffect, useState } from 'react';

export default function APITestPage() {
  const [result, setResult] = useState<string>('Loading...');

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const url = '/api/schedules?start_date=2025-11-10&end_date=2025-11-16';
      console.log('🔍 Fetching:', url);

      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Data received:', data);
      console.log('📦 Data length:', data?.length);
      console.log('📦 First item:', data?.[0]);

      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Direct API Test</h1>
      <button onClick={testAPI} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Reload API Test
      </button>
      <pre style={{
        background: '#000',
        color: '#0f0',
        padding: '15px',
        borderRadius: '5px',
        overflow: 'auto',
        maxHeight: '600px'
      }}>
        {result}
      </pre>
    </div>
  );
}
