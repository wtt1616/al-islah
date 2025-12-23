/**
 * MySQL Connection Monitor
 *
 * This script monitors active database connections and alerts when threshold is reached.
 *
 * Usage:
 *   npx ts-node scripts/monitor-db-connections.ts
 *
 * Or add to package.json:
 *   "scripts": {
 *     "monitor:db": "ts-node scripts/monitor-db-connections.ts"
 *   }
 */

import pool from '../lib/db';

const CHECK_INTERVAL = 30000; // 30 seconds
const WARNING_THRESHOLD = 80; // Warn if > 80 connections
const CRITICAL_THRESHOLD = 150; // Critical if > 150 connections

interface ConnectionStats {
  totalConnections: number;
  maxConnections: number;
  connectionsByUser: Array<{
    user: string;
    host: string;
    count: number;
  }>;
  longRunningQueries: Array<{
    id: number;
    user: string;
    host: string;
    db: string;
    time: number;
    state: string;
    info: string;
  }>;
}

async function getConnectionStats(): Promise<ConnectionStats> {
  try {
    // Get total active connections
    const [totalRows] = await pool.query<any[]>(
      'SELECT COUNT(*) as count FROM information_schema.processlist'
    );
    const totalConnections = totalRows[0].count;

    // Get max_connections setting
    const [maxRows] = await pool.query<any[]>(
      "SHOW VARIABLES LIKE 'max_connections'"
    );
    const maxConnections = parseInt(maxRows[0].Value);

    // Get connections grouped by user
    const [userRows] = await pool.query<any[]>(`
      SELECT
        user,
        SUBSTRING_INDEX(host, ':', 1) as host,
        COUNT(*) as count
      FROM information_schema.processlist
      GROUP BY user, host
      ORDER BY count DESC
    `);
    const connectionsByUser = userRows;

    // Get long-running queries (> 60 seconds, not sleeping)
    const [longRows] = await pool.query<any[]>(`
      SELECT
        id,
        user,
        SUBSTRING_INDEX(host, ':', 1) as host,
        db,
        time,
        state,
        SUBSTRING(info, 1, 100) as info
      FROM information_schema.processlist
      WHERE time > 60 AND command != 'Sleep'
      ORDER BY time DESC
      LIMIT 10
    `);
    const longRunningQueries = longRows;

    return {
      totalConnections,
      maxConnections,
      connectionsByUser,
      longRunningQueries
    };
  } catch (error) {
    console.error('Error getting connection stats:', error);
    throw error;
  }
}

function formatStats(stats: ConnectionStats): void {
  const percentage = (stats.totalConnections / stats.maxConnections) * 100;
  const timestamp = new Date().toISOString();

  console.log('\n' + '='.repeat(80));
  console.log(`[${timestamp}] MySQL Connection Monitor`);
  console.log('='.repeat(80));

  // Overall stats
  console.log(`\n📊 Connection Stats:`);
  console.log(`   Active Connections: ${stats.totalConnections} / ${stats.maxConnections}`);
  console.log(`   Usage: ${percentage.toFixed(1)}%`);

  // Status indicator
  let status = '✅ NORMAL';
  if (stats.totalConnections > CRITICAL_THRESHOLD) {
    status = '🔴 CRITICAL';
  } else if (stats.totalConnections > WARNING_THRESHOLD) {
    status = '⚠️  WARNING';
  }
  console.log(`   Status: ${status}`);

  // Connections by user
  if (stats.connectionsByUser.length > 0) {
    console.log(`\n👥 Connections by User:`);
    stats.connectionsByUser.forEach(conn => {
      console.log(`   ${conn.user}@${conn.host}: ${conn.count} connections`);
    });
  }

  // Long-running queries
  if (stats.longRunningQueries.length > 0) {
    console.log(`\n⏱️  Long-Running Queries (> 60s):`);
    stats.longRunningQueries.forEach(query => {
      console.log(`   [ID: ${query.id}] ${query.user}@${query.host} | ${query.time}s`);
      console.log(`   State: ${query.state}`);
      if (query.info) {
        console.log(`   Query: ${query.info}...`);
      }
      console.log('');
    });
  }

  // Warnings
  if (stats.totalConnections > CRITICAL_THRESHOLD) {
    console.log(`\n🚨 CRITICAL: Connection count is very high!`);
    console.log(`   Consider:`);
    console.log(`   1. Restart the application to close idle connections`);
    console.log(`   2. Check for connection leaks in the code`);
    console.log(`   3. Review long-running queries above`);
  } else if (stats.totalConnections > WARNING_THRESHOLD) {
    console.log(`\n⚠️  WARNING: Connection count is approaching limit`);
    console.log(`   Monitor closely and investigate if it continues to rise.`);
  }

  console.log('\n' + '='.repeat(80));
}

async function monitor(): Promise<void> {
  console.log('🔍 Starting MySQL Connection Monitor...');
  console.log(`   Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`   Warning threshold: ${WARNING_THRESHOLD}`);
  console.log(`   Critical threshold: ${CRITICAL_THRESHOLD}`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Initial check
  try {
    const stats = await getConnectionStats();
    formatStats(stats);
  } catch (error) {
    console.error('Failed to get initial stats:', error);
  }

  // Periodic checks
  const interval = setInterval(async () => {
    try {
      const stats = await getConnectionStats();
      formatStats(stats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  }, CHECK_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down monitor...');
    clearInterval(interval);
    await pool.end();
    console.log('✅ Monitor stopped');
    process.exit(0);
  });
}

// Run monitor
monitor().catch(error => {
  console.error('Monitor failed:', error);
  process.exit(1);
});
