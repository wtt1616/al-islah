// Test authentication directly
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'isar_db',
    port: 3306
  });

  try {
    console.log('Testing database connection...');
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      ['admin@isar.com']
    );

    console.log('User found:', rows.length > 0);
    if (rows.length > 0) {
      const user = rows[0];
      console.log('User data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        password_length: user.password ? user.password.length : 0,
        password_prefix: user.password ? user.password.substring(0, 20) : 'null'
      });

      console.log('\nTesting password comparison...');
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log('Password valid:', isValid);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();
