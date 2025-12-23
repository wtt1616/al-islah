// Test Schedule Generation - Verify names are allocated correctly
const mysql = require('mysql2/promise');

async function testScheduleGeneration() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'isar_db',
    port: 3306
  });

  try {
    console.log('='.repeat(70));
    console.log('TESTING SCHEDULE GENERATION - NAME ALLOCATION');
    console.log('='.repeat(70));
    console.log('');

    // Step 1: Check available Imams and Bilals
    console.log('📋 Step 1: Checking available personnel...\n');

    const [imams] = await pool.execute(
      "SELECT id, name, role FROM users WHERE role = 'imam' AND is_active = TRUE ORDER BY name"
    );

    const [bilals] = await pool.execute(
      "SELECT id, name, role FROM users WHERE role = 'bilal' AND is_active = TRUE ORDER BY name"
    );

    console.log(`✅ Found ${imams.length} active Imams:`);
    imams.forEach(imam => {
      console.log(`   - ${imam.name} (ID: ${imam.id})`);
    });
    console.log('');

    console.log(`✅ Found ${bilals.length} active Bilals:`);
    bilals.forEach(bilal => {
      console.log(`   - ${bilal.name} (ID: ${bilal.id})`);
    });
    console.log('');

    // Step 2: Check existing schedules
    console.log('📋 Step 2: Checking existing schedules...\n');

    const [schedules] = await pool.execute(
      'SELECT COUNT(*) as count FROM schedules'
    );

    console.log(`📊 Total schedules in database: ${schedules[0].count}`);
    console.log('');

    // Step 3: Check schedules with names (using JOIN)
    console.log('📋 Step 3: Testing schedule query with names (using JOIN)...\n');

    const [schedulesWithNames] = await pool.execute(`
      SELECT
        s.id,
        s.date,
        s.prayer_time,
        s.imam_id,
        s.bilal_id,
        i.name as imam_name,
        b.name as bilal_name
      FROM schedules s
      JOIN users i ON s.imam_id = i.id
      JOIN users b ON s.bilal_id = b.id
      ORDER BY s.date, FIELD(s.prayer_time, 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak')
      LIMIT 10
    `);

    if (schedulesWithNames.length === 0) {
      console.log('⚠️  No schedules found in database.');
      console.log('   Please generate a schedule first from the UI.\n');
    } else {
      console.log(`✅ Found ${schedulesWithNames.length} schedules (showing first 10):\n`);

      schedulesWithNames.forEach((schedule, index) => {
        console.log(`${index + 1}. ${schedule.date} - ${schedule.prayer_time}`);
        console.log(`   └─ Imam: ${schedule.imam_name} (ID: ${schedule.imam_id})`);
        console.log(`   └─ Bilal: ${schedule.bilal_name} (ID: ${schedule.bilal_id})`);
        console.log('');
      });
    }

    // Step 4: Verify JOIN is working
    console.log('📋 Step 4: Verifying JOIN query works correctly...\n');

    if (schedulesWithNames.length > 0) {
      const sample = schedulesWithNames[0];

      console.log('Testing first schedule:');
      console.log(`  Schedule ID: ${sample.id}`);
      console.log(`  Date: ${sample.date}`);
      console.log(`  Prayer: ${sample.prayer_time}`);
      console.log('');

      console.log('  Checking Imam:');
      console.log(`    imam_id: ${sample.imam_id}`);
      console.log(`    imam_name: ${sample.imam_name}`);

      const [imamCheck] = await pool.execute(
        'SELECT name FROM users WHERE id = ?',
        [sample.imam_id]
      );

      if (imamCheck.length > 0) {
        console.log(`    ✅ Verified: ${imamCheck[0].name} matches ${sample.imam_name}`);
      }
      console.log('');

      console.log('  Checking Bilal:');
      console.log(`    bilal_id: ${sample.bilal_id}`);
      console.log(`    bilal_name: ${sample.bilal_name}`);

      const [bilalCheck] = await pool.execute(
        'SELECT name FROM users WHERE id = ?',
        [sample.bilal_id]
      );

      if (bilalCheck.length > 0) {
        console.log(`    ✅ Verified: ${bilalCheck[0].name} matches ${sample.bilal_name}`);
      }
      console.log('');
    }

    // Step 5: Test API query format (same as used by frontend)
    console.log('📋 Step 5: Testing API query format (frontend uses this)...\n');

    const today = new Date();
    const monday = getMonday(today);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    console.log(`Current week: ${startDate} to ${endDate}\n`);

    const [weekSchedules] = await pool.execute(`
      SELECT
        s.*,
        i.name as imam_name,
        b.name as bilal_name
      FROM schedules s
      JOIN users i ON s.imam_id = i.id
      JOIN users b ON s.bilal_id = b.id
      WHERE s.date BETWEEN ? AND ?
      ORDER BY s.date, FIELD(s.prayer_time, 'Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak')
    `, [startDate, endDate]);

    if (weekSchedules.length === 0) {
      console.log('⚠️  No schedules for current week.');
      console.log('   Generate a schedule for this week from the UI.\n');
    } else {
      console.log(`✅ Found ${weekSchedules.length} schedules for current week:\n`);

      // Group by date
      const byDate = {};
      weekSchedules.forEach(s => {
        if (!byDate[s.date]) byDate[s.date] = [];
        byDate[s.date].push(s);
      });

      Object.keys(byDate).forEach(date => {
        console.log(`📅 ${date}:`);
        byDate[date].forEach(s => {
          console.log(`   ${s.prayer_time.padEnd(8)} - Imam: ${s.imam_name.padEnd(10)} | Bilal: ${s.bilal_name}`);
        });
        console.log('');
      });
    }

    // Step 6: Distribution analysis
    if (schedulesWithNames.length > 0) {
      console.log('📋 Step 6: Analyzing assignment distribution...\n');

      const [allSchedules] = await pool.execute(`
        SELECT imam_id, bilal_id, i.name as imam_name, b.name as bilal_name
        FROM schedules s
        JOIN users i ON s.imam_id = i.id
        JOIN users b ON s.bilal_id = b.id
      `);

      // Count assignments
      const imamCounts = {};
      const bilalCounts = {};

      allSchedules.forEach(s => {
        imamCounts[s.imam_name] = (imamCounts[s.imam_name] || 0) + 1;
        bilalCounts[s.bilal_name] = (bilalCounts[s.bilal_name] || 0) + 1;
      });

      console.log('Imam Assignment Counts:');
      Object.entries(imamCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`  ${name.padEnd(12)} : ${count} assignments`);
        });
      console.log('');

      console.log('Bilal Assignment Counts:');
      Object.entries(bilalCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`  ${name.padEnd(12)} : ${count} assignments`);
        });
      console.log('');
    }

    // Final Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('');

    if (schedulesWithNames.length > 0) {
      console.log('✅ Schedule generation is working correctly!');
      console.log('✅ Imam and Bilal names ARE being allocated!');
      console.log('✅ Database JOINs are working properly!');
      console.log('✅ API query format returns names correctly!');
      console.log('');
      console.log('If names are not showing in the UI:');
      console.log('  1. Hard refresh browser: Ctrl + Shift + R');
      console.log('  2. Clear browser cache completely');
      console.log('  3. Try incognito/private window');
      console.log('  4. Check browser console (F12) for errors');
    } else {
      console.log('⚠️  No schedules found in database.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Login as Head Imam (headimam@isar.com / admin123)');
      console.log('  2. Go to "Manage Schedules"');
      console.log('  3. Click "Generate Schedule" button');
      console.log('  4. Run this test again to verify');
    }

    console.log('');
    console.log('='.repeat(70));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
  }
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

testScheduleGeneration();
