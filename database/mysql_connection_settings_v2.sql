-- ============================================================================
-- MySQL Connection Management Settings for iSAR (Version 2)
-- ============================================================================
-- Purpose: Configure MySQL server for optimal connection management
-- Run this after starting MySQL to prevent "Too many connections" errors
--
-- Usage:
--   mysql -u root < database/mysql_connection_settings_v2.sql
-- ============================================================================

-- Increase maximum connections (default: 151)
SET GLOBAL max_connections = 200;

-- Set connection timeout for GLOBAL and SESSION
-- Close idle connections after 10 minutes (600 seconds)
SET GLOBAL wait_timeout = 600;
SET SESSION wait_timeout = 600;
SET GLOBAL interactive_timeout = 600;
SET SESSION interactive_timeout = 600;

-- Connection pool thread cache
SET GLOBAL thread_cache_size = 16;

-- ============================================================================
-- Verification: Show current settings
-- ============================================================================

SELECT '============================================' as '';
SELECT 'MySQL Connection Settings Updated' as 'Status';
SELECT '============================================' as '';

SELECT
    @@global.max_connections as 'Max Connections (Global)',
    @@global.wait_timeout as 'Wait Timeout Global (seconds)',
    @@session.wait_timeout as 'Wait Timeout Session (seconds)',
    @@global.interactive_timeout as 'Interactive Timeout Global (seconds)',
    @@global.thread_cache_size as 'Thread Cache Size';

SELECT '' as '';
SELECT 'Current Active Connections:' as '';
SELECT COUNT(*) as 'Total' FROM information_schema.processlist;

SELECT '' as '';
SELECT 'Connections by User:' as '';
SELECT
    user as 'User',
    SUBSTRING_INDEX(host, ':', 1) as 'Host',
    COUNT(*) as 'Count'
FROM information_schema.processlist
GROUP BY user, SUBSTRING_INDEX(host, ':', 1)
ORDER BY COUNT(*) DESC;

SELECT '' as '';
SELECT '============================================' as '';
SELECT 'Configuration completed successfully!' as 'Result';
SELECT 'New connections will use 600s timeout' as 'Note';
SELECT '============================================' as '';
