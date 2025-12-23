-- ============================================================================
-- MySQL Connection Management Settings for iSAR
-- ============================================================================
-- Purpose: Configure MySQL server for optimal connection management
-- Run this after starting MySQL to prevent "Too many connections" errors
--
-- Usage:
--   mysql -u root -p12345678 isar_db < database/mysql_connection_settings.sql
-- ============================================================================

-- Increase maximum connections (default: 151)
-- This allows more concurrent connections to MySQL server
SET GLOBAL max_connections = 200;

-- Set connection timeout (default: 28800 seconds = 8 hours)
-- Close idle connections after 10 minutes (600 seconds)
-- This prevents accumulation of stale connections
SET GLOBAL wait_timeout = 600;
SET GLOBAL interactive_timeout = 600;

-- Connection pool thread cache
-- Reuse threads instead of creating new ones for each connection
SET GLOBAL thread_cache_size = 16;

-- Connection limits per user (optional - prevents single user hogging all connections)
-- Uncomment if you want to limit connections per user:
-- SET GLOBAL max_user_connections = 50;

-- ============================================================================
-- Verification: Show current settings
-- ============================================================================

SELECT '============================================' as '';
SELECT 'MySQL Connection Settings Updated' as 'Status';
SELECT '============================================' as '';
SELECT '' as '';

SELECT
    @@max_connections as 'Max Connections (should be 200)',
    @@wait_timeout as 'Wait Timeout in seconds (should be 600)',
    @@interactive_timeout as 'Interactive Timeout in seconds (should be 600)',
    @@thread_cache_size as 'Thread Cache Size (should be 16)';

SELECT '' as '';
SELECT '============================================' as '';
SELECT 'Current Connection Status' as 'Info';
SELECT '============================================' as '';
SELECT '' as '';

-- Show current active connections
SELECT COUNT(*) as 'Current Active Connections' FROM information_schema.processlist;

SELECT '' as '';

-- Show connections grouped by user
SELECT
    user as 'User',
    SUBSTRING_INDEX(host, ':', 1) as 'Host',
    COUNT(*) as 'Connection Count'
FROM information_schema.processlist
GROUP BY user, SUBSTRING_INDEX(host, ':', 1)
ORDER BY COUNT(*) DESC;

SELECT '' as '';
SELECT '============================================' as '';
SELECT 'Configuration completed successfully!' as 'Result';
SELECT '============================================' as '';
