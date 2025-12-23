'use client';

import { useEffect, useState } from 'react';

export default function DebugSundayPage() {
  const [info, setInfo] = useState<string>('Loading...');

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    let output = '';

    try {
      // Fetch schedules
      const response = await fetch('/api/schedules?start_date=2025-11-10&end_date=2025-11-16');
      const data = await response.json();

      output += `Total schedules fetched: ${data.length}\n\n`;

      // Check Sunday schedules
      const sundaySchedules = data.filter((s: any) => s.date.includes('2025-11-16'));
      output += `Sunday (2025-11-16) schedules: ${sundaySchedules.length}\n\n`;

      if (sundaySchedules.length > 0) {
        output += 'Sunday schedule details:\n';
        sundaySchedules.forEach((s: any) => {
          output += `  ${s.prayer_time}: Imam ${s.imam_name}, Bilal ${s.bilal_name}\n`;
          output += `    Date field: "${s.date}"\n`;
          output += `    Date split: "${s.date.split('T')[0]}"\n`;
        });
      } else {
        output += 'NO SUNDAY SCHEDULES FOUND!\n';
      }

      output += '\n\nAll schedule dates:\n';
      const uniqueDates = [...new Set(data.map((s: any) => s.date.split('T')[0]))];
      uniqueDates.sort();
      uniqueDates.forEach((date: any) => {
        const count = data.filter((s: any) => s.date.split('T')[0] === date).length;
        output += `  ${date}: ${count} prayers\n`;
      });

      // Test date generation
      output += '\n\nFrontend date generation test:\n';
      const monday = new Date('2025-11-10');
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        const matchingSchedules = data.filter((s: any) => s.date.split('T')[0] === dateStr);
        output += `  ${dateStr} (${dayName}): ${matchingSchedules.length} schedules\n`;
      }

      setInfo(output);
    } catch (error: any) {
      setInfo('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Sunday Schedule Diagnostics</h1>
      <button onClick={runDiagnostics} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Reload Test
      </button>
      <pre style={{
        background: '#000',
        color: '#0f0',
        padding: '15px',
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {info}
      </pre>
    </div>
  );
}
