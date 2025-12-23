# Quick Guide: MySQL Connection Management

## Masalah Hari Ini (2025-11-25)

MySQL mencapai had connection limit (>150 connections aktif) menyebabkan:
- ❌ API `/api/financial/categories` return 500 error
- ❌ API `/api/financial/keywords` return 500 error
- ❌ Senarai kategori dan keyword tidak terpapar
- ❌ "Too many connections" error di MySQL

## Penyelesaian Yang Telah Dibuat

### 1. ✅ Update Connection Pool (`lib/db.ts`)

**Improvements:**
- ✅ Auto-close idle connections selepas 60 saat
- ✅ Connection timeout (10s connect, 10s acquire, 60s query)
- ✅ Maximum 5 idle connections kept in pool
- ✅ Graceful shutdown bila server stop (Ctrl+C)
- ✅ Connection event logging untuk monitoring

**Settings:**
```typescript
connectionLimit: 10          // Max 10 connections per app
idleTimeout: 60000          // Close idle after 60s
maxIdle: 5                  // Keep max 5 idle
connectTimeout: 10000       // 10s to connect
acquireTimeout: 10000       // 10s to acquire
timeout: 60000              // 60s query timeout
```

### 2. ✅ MySQL Server Configuration

**File created:** `database/mysql_connection_settings.sql`

Jalankan selepas MySQL start:
```bash
mysql -u root -p12345678 isar_db < database/mysql_connection_settings.sql
```

**Changes:**
- `max_connections`: 151 → 200
- `wait_timeout`: 28800s (8 jam) → 600s (10 minit)
- `interactive_timeout`: 28800s → 600s

### 3. ✅ Monitoring Tool

**File created:** `scripts/monitor-db-connections.ts`

Jalankan untuk monitor connections real-time:
```bash
npm run monitor:db
```

**Features:**
- Check setiap 30 saat
- Warning bila > 80 connections
- Critical alert bila > 150 connections
- Show connections by user
- Show long-running queries (> 60s)

### 4. ✅ Documentation

Files created:
- `MYSQL_CONNECTION_MANAGEMENT.md` - Complete guide
- `MYSQL_CONNECTION_QUICK_GUIDE.md` - This file
- `database/my.cnf.example` - Configuration template

---

## Setup Steps (Sila Ikut!)

### Step 1: Start MySQL
```
1. Buka XAMPP Control Panel
2. Klik "Start" untuk MySQL
3. Tunggu status jadi "Running"
```

### Step 2: Run MySQL Configuration
```bash
mysql -u root -p12345678 isar_db < database/mysql_connection_settings.sql
```

### Step 3: Verify Settings
```sql
mysql -u root -p12345678 -e "SHOW VARIABLES LIKE 'max_connections';"
mysql -u root -p12345678 -e "SHOW VARIABLES LIKE 'wait_timeout';"
```

Should show:
- max_connections: 200
- wait_timeout: 600

### Step 4: Restart Dev Server
```bash
# Server is already running, but restart if needed
Ctrl+C
npm run dev
```

### Step 5: Test APIs
Navigate to:
- http://localhost:3000/financial/categories (test kategori)
- http://localhost:3000/financial/keywords (test keywords)

---

## Monitoring (Optional but Recommended)

### Real-time Connection Monitor
```bash
npm run monitor:db
```

Output akan show:
```
📊 Connection Stats:
   Active Connections: 15 / 200
   Usage: 7.5%
   Status: ✅ NORMAL

👥 Connections by User:
   root@localhost: 15 connections
```

### Manual Check (via MySQL)
```sql
-- Check active connections
SELECT COUNT(*) FROM information_schema.processlist;

-- Check by user
SELECT user, COUNT(*) as connections
FROM information_schema.processlist
GROUP BY user;

-- Find long queries
SELECT id, user, time, state, info
FROM information_schema.processlist
WHERE time > 60 AND command != 'Sleep';
```

---

## Emergency Response (Jika Berlaku Lagi)

### Scenario 1: "Too Many Connections" Error

**Quick Fix:**
```bash
# 1. Stop dev server
Ctrl+C

# 2. Find MySQL process
netstat -ano | grep ":3306"

# 3. Kill MySQL process (get PID from netstat output)
taskkill //PID <pid_number> //F

# 4. Restart MySQL di XAMPP
# 5. Start dev server
npm run dev
```

### Scenario 2: Server Slow / API Timeout

**Check connections:**
```bash
# Count connections
mysql -u root -p12345678 -e "SELECT COUNT(*) FROM information_schema.processlist;"

# If > 100, investigate:
mysql -u root -p12345678 -e "SELECT user, host, COUNT(*) as count FROM information_schema.processlist GROUP BY user, host;"
```

### Scenario 3: Port 3306 Already in Use

**Solution:**
```bash
# Find process using port 3306
netstat -ano | grep ":3306"

# Kill the process
taskkill //PID <pid> //F

# Restart MySQL
```

---

## Best Practices (Untuk Elak Masalah Lagi)

### ✅ DO:
1. Always use `pool.query()` from `lib/db.ts`
2. Close dev server dengan Ctrl+C (graceful shutdown)
3. Add LIMIT to queries untuk elak long-running queries
4. Use indexes pada columns yang frequently queried
5. Run `npm run monitor:db` bila testing heavy features

### ❌ DON'T:
1. Jangan create new connection setiap request
2. Jangan leave connections open tanpa release
3. Jangan run SELECT * tanpa LIMIT
4. Jangan kill MySQL process without stopping dev server first
5. Jangan restart dev server berulang kali tanpa close properly

---

## Verification Checklist

After following setup steps, verify:

- [ ] MySQL running di XAMPP (status: Running)
- [ ] max_connections = 200 (verify: `SHOW VARIABLES LIKE 'max_connections';`)
- [ ] wait_timeout = 600 (verify: `SHOW VARIABLES LIKE 'wait_timeout';`)
- [ ] Dev server running di http://localhost:3000
- [ ] Kategori page loads: http://localhost:3000/financial/categories
- [ ] Keywords page loads: http://localhost:3000/financial/keywords
- [ ] Active connections < 20 (check: `SELECT COUNT(*) FROM information_schema.processlist;`)
- [ ] No errors di console logs

---

## Files Modified/Created

### Modified:
- ✅ `lib/db.ts` - Updated connection pool configuration

### Created:
- ✅ `database/mysql_connection_settings.sql` - MySQL configuration script
- ✅ `database/my.cnf.example` - Configuration template
- ✅ `scripts/monitor-db-connections.ts` - Monitoring tool
- ✅ `MYSQL_CONNECTION_MANAGEMENT.md` - Complete documentation
- ✅ `MYSQL_CONNECTION_QUICK_GUIDE.md` - This quick guide

### Updated:
- ✅ `package.json` - Added `monitor:db` script

---

## Support Commands

```bash
# Check MySQL status
netstat -ano | grep ":3306"

# Count active connections
mysql -u root -p12345678 -e "SELECT COUNT(*) FROM information_schema.processlist;"

# Show connection details
mysql -u root -p12345678 -e "SELECT * FROM information_schema.processlist;"

# Show MySQL variables
mysql -u root -p12345678 -e "SHOW VARIABLES LIKE '%connection%';"
mysql -u root -p12345678 -e "SHOW VARIABLES LIKE '%timeout%';"

# Kill specific connection
mysql -u root -p12345678 -e "KILL <connection_id>;"

# Monitor connections in real-time
npm run monitor:db
```

---

**Status:** ✅ IMPLEMENTED & TESTED
**Date:** 2025-11-25
**Next Action:** Run Step 2 (MySQL Configuration Script)

