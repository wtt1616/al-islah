// Test Head Imam login
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testHeadImamLogin() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'isar_db',
    port: 3306
  });

  try {
    console.log('Testing Head Imam login...\n');

    // Test email
    const email = 'headimam@isar.com';
    const password = 'admin123';

    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');

    // Query user
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (rows.length === 0) {
      console.log('❌ User not found or inactive');
      return;
    }

    const user = rows[0];
    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.is_active);
    console.log('  Password hash length:', user.password.length);
    console.log('  Password hash:', user.password);
    console.log('');

    // Test password
    console.log('Testing password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');

    if (isValid) {
      console.log('\n✅ Login should work!');
      console.log('Credentials: headimam@isar.com / admin123');
    } else {
      console.log('\n❌ Password does not match');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testHeadImamLogin();
