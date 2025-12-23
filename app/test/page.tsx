'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rawData, setRawData] = useState<string>('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const monday = new Date('2025-11-10');
    const sunday = new Date('2025-11-16');

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    try {
      const response = await fetch(
        `/api/schedules?start_date=${startDate}&end_date=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
        setRawData(JSON.stringify(data, null, 2));
        console.log('✅ Schedules fetched:', data);
        console.log('✅ First schedule:', data[0]);
      } else {
        setRawData('Error: ' + response.status);
      }
    } catch (error: any) {
      setRawData('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 iSAR Schedule Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Total Schedules: {schedules.length}</h2>
      </div>

      {schedules.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>🔍 First Schedule Details:</h2>
          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
            <p><strong>ID:</strong> {schedules[0].id}</p>
            <p><strong>Date:</strong> {schedules[0].date}</p>
            <p><strong>Prayer:</strong> {schedules[0].prayer_time}</p>
            <p><strong>Imam ID:</strong> {schedules[0].imam_id}</p>
            <p><strong>Bilal ID:</strong> {schedules[0].bilal_id}</p>
            <p style={{ color: schedules[0].imam_name ? 'green' : 'red' }}>
              <strong>Imam Name:</strong> {schedules[0].imam_name || '❌ MISSING!'}
            </p>
            <p style={{ color: schedules[0].bilal_name ? 'green' : 'red' }}>
              <strong>Bilal Name:</strong> {schedules[0].bilal_name || '❌ MISSING!'}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2>📋 All Schedules (First 5):</h2>
        {schedules.slice(0, 5).map((s, i) => (
          <div key={i} style={{
            background: '#f9f9f9',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}>
            <p><strong>#{i + 1}</strong> - {s.date} - {s.prayer_time}</p>
            <p style={{ color: s.imam_name ? 'green' : 'red' }}>
              Imam: {s.imam_name || '❌ NO NAME'} (ID: {s.imam_id})
            </p>
            <p style={{ color: s.bilal_name ? 'green' : 'red' }}>
              Bilal: {s.bilal_name || '❌ NO NAME'} (ID: {s.bilal_id})
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2>📄 Raw JSON Data:</h2>
        <pre style={{
          background: '#000',
          color: '#0f0',
          padding: '15px',
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {rawData || 'Loading...'}
        </pre>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={fetchSchedules}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
