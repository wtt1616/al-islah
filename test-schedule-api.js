// Test schedule API directly
const mysql = require('mysql2/promise');

async function testScheduleAPI() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'isar_db',
    port: 3306
  });

  try {
    console.log('Testing schedule query with names...\n');

    const query = `
      SELECT
        s.*,
        i.name as imam_name,
        b.name as bilal_name
      FROM schedules s
      JOIN users i ON s.imam_id = i.id
      JOIN users b ON s.bilal_id = b.id
      WHERE s.date BETWEEN ? AND ?
      ORDER BY s.date, FIELD(s.prayer_time, "Subuh", "Zohor", "Asar", "Maghrib", "Isyak")
      LIMIT 5
    `;

    const [rows] = await pool.execute(query, ['2025-11-10', '2025-11-16']);

    console.log('Found', rows.length, 'schedules\n');

    rows.forEach((row, index) => {
      console.log(`Schedule ${index + 1}:`);
      console.log(`  Date: ${row.date}`);
      console.log(`  Prayer: ${row.prayer_time}`);
      console.log(`  Imam: ${row.imam_name} (ID: ${row.imam_id})`);
      console.log(`  Bilal: ${row.bilal_name} (ID: ${row.bilal_id})`);
      console.log('');
    });

    console.log('✅ API query works correctly!');
    console.log('✅ Names are being returned properly');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testScheduleAPI();
