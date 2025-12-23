import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isar_db',
  port: parseInt(process.env.DB_PORT || '3306'),

  // Connection Pool Settings
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections in pool
  queueLimit: 0, // Unlimited queueing

  // Connection Timeout Settings (prevent hanging connections)
  connectTimeout: 10000, // 10 seconds to establish connection
  // Note: acquireTimeout and timeout are not valid for mysql2 connection pool
  // They are handled at query level instead

  // Idle Connection Management (auto-close idle connections)
  idleTimeout: 60000, // Close idle connections after 60 seconds
  maxIdle: 5, // Keep maximum 5 idle connections

  // Connection Health Check
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Prevent connection leaks
  multipleStatements: false, // Prevent SQL injection via multiple statements
});

// Handle pool errors
pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing MySQL pool');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing MySQL pool');
  await pool.end();
  process.exit(0);
});

export default pool;
