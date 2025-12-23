# Panduan Pengurusan MySQL Connection untuk iSAR

## Masalah Yang Diselesaikan

Sistem iSAR pernah mengalami masalah **"Too many connections"** di mana MySQL mencapai had maksimum connection dan menyebabkan semua API requests gagal. Dokumen ini menerangkan cara mencegah masalah ini berlaku lagi.

---

## 1. Apa Yang Telah Dilakukan

### A. Update Connection Pool Configuration (`lib/db.ts`)

Kami telah update database connection pool dengan settings berikut:

```typescript
{
  connectionLimit: 10,        // Max 10 connections per pool
  connectTimeout: 10000,      // 10 seconds to connect
  acquireTimeout: 10000,      // 10 seconds to acquire from pool
  timeout: 60000,             // 60 seconds query timeout
  idleTimeout: 60000,         // Close idle connections after 60s
  maxIdle: 5,                 // Keep max 5 idle connections
  enableKeepAlive: true,      // Keep connections alive
}
```

**Benefit:**
- Auto-close idle connections selepas 60 saat
- Prevent connection hanging dengan timeout
- Graceful shutdown bila server stop
- Connection pooling dengan limit 10 connections

### B. Graceful Shutdown Handler

Pool akan automatically close semua connections bila:
- Server di-stop dengan Ctrl+C (SIGINT)
- Process di-terminate (SIGTERM)

### C. Connection Event Logging

Sekarang setiap connection activity akan di-log:
- `New database connection established` - bila connection dibuat
- `Connection X acquired` - bila connection diambil dari pool
- `Connection X released` - bila connection dikembalikan ke pool
- `Waiting for available connection slot` - bila semua connections busy

---

## 2. MySQL Server Configuration

### Setup 1: Jalankan SQL Script (RECOMMENDED)

Selepas MySQL start, jalankan script ini untuk update settings:

```bash
mysql -u root -p12345678 isar_db < database/mysql_connection_settings.sql
```

Script ini akan:
- Set `max_connections` = 200 (dari 151)
- Set `wait_timeout` = 600 seconds (10 minit)
- Set `interactive_timeout` = 600 seconds
- Display current settings dan active connections

**Verify settings:**
```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE '%timeout%';
SELECT COUNT(*) FROM information_schema.processlist;
```

### Setup 2: Update my.ini (OPTIONAL - for permanent changes)

Untuk permanent changes, edit `C:\xampp\mysql\bin\my.ini`:

1. Buka file `C:\xampp\mysql\bin\my.ini`
2. Cari section `[mysqld]`
3. Tambah atau update lines berikut:

```ini
[mysqld]
max_connections = 200
wait_timeout = 600
interactive_timeout = 600
thread_cache_size = 16
```

4. Restart MySQL di XAMPP Control Panel

**Atau copy dari template:**
```bash
# Refer to database/my.cnf.example for complete configuration
```

---

## 3. Best Practices untuk Developer

### A. Always Use Connection Pool

✅ **BETUL:**
```typescript
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const [rows] = await pool.query('SELECT * FROM table');
  return NextResponse.json(rows);
}
```

❌ **SALAH:** Jangan create connection baru setiap kali:
```typescript
const connection = await mysql.createConnection({...});
```

### B. Avoid Long-Running Queries

Query yang terlalu lama akan hold connection dan prevent others dari menggunakan.

✅ **BETUL:** Add LIMIT, use indexes, optimize queries
```sql
SELECT * FROM financial_transactions WHERE id = ? LIMIT 100;
```

❌ **SALAH:** Full table scan tanpa limit
```sql
SELECT * FROM financial_transactions; -- Baca semua!
```

### C. Gunakan Transactions dengan Betul

Bila guna transactions, pastikan COMMIT atau ROLLBACK:

✅ **BETUL:**
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.query('INSERT INTO ...');
  await connection.query('UPDATE ...');
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release(); // PENTING!
}
```

### D. Elakkan N+1 Query Problem

❌ **SALAH:**
```typescript
const categories = await pool.query('SELECT * FROM kategori_penerimaan');
for (const cat of categories) {
  // N queries!
  const subs = await pool.query('SELECT * FROM subkategori_penerimaan WHERE kategori_id = ?', [cat.id]);
}
```

✅ **BETUL:** Use JOIN atau batch queries
```typescript
const [rows] = await pool.query(`
  SELECT k.*, s.*
  FROM kategori_penerimaan k
  LEFT JOIN subkategori_penerimaan s ON k.id = s.kategori_id
`);
```

---

## 4. Monitoring & Troubleshooting

### Semak Active Connections

```sql
-- Via MySQL
SELECT COUNT(*) as active_connections
FROM information_schema.processlist;

-- Via command line
netstat -ano | grep ":3306" | wc -l
```

### Semak Connection Usage by User

```sql
SELECT
  user,
  host,
  COUNT(*) as connections,
  time as idle_time
FROM information_schema.processlist
GROUP BY user, host
ORDER BY connections DESC;
```

### Kill Hanging Connections

```sql
-- Find long-running queries
SELECT id, user, host, db, command, time, state, info
FROM information_schema.processlist
WHERE time > 300 AND command != 'Sleep'
ORDER BY time DESC;

-- Kill specific connection
KILL CONNECTION_ID;
```

### Semak Jika Ada Connection Leak

```bash
# Check connections over time
watch -n 5 'netstat -ano | grep ":3306" | wc -l'

# If number keeps increasing without decreasing = connection leak!
```

---

## 5. Emergency Response Plan

### Jika Berlaku "Too Many Connections" Lagi:

#### Step 1: Identify Problem
```bash
netstat -ano | grep ":3306"
```
Dapatkan PID dari proses yang mempunyai banyak connections.

#### Step 2: Check Process
```bash
# Windows
tasklist | findstr "PID"

# Check if it's MySQL or Node.js
```

#### Step 3: Graceful Restart
```bash
# Stop development server first (Ctrl+C)
# Then restart MySQL in XAMPP Control Panel
```

#### Step 4: Force Kill (if graceful fails)
```bash
# Windows
taskkill //PID <process_id> //F
```

#### Step 5: Verify Port Free
```bash
netstat -ano | grep ":3306"
# Should be empty or only show LISTENING
```

#### Step 6: Restart Services
1. Start MySQL di XAMPP
2. Start development server: `npm run dev`

---

## 6. Automatic Monitoring (Future Enhancement)

Boleh tambah monitoring script untuk auto-alert bila connections terlalu banyak:

```typescript
// monitor-connections.ts
import pool from './lib/db';

setInterval(async () => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM information_schema.processlist'
  );

  const activeConnections = rows[0].count;
  console.log(`Active connections: ${activeConnections}`);

  if (activeConnections > 150) {
    console.error('⚠️ WARNING: Too many connections!');
    // Send alert email/SMS
  }
}, 60000); // Check every 60 seconds
```

---

## 7. Settings Summary

| Setting | Old Value | New Value | Purpose |
|---------|-----------|-----------|---------|
| `max_connections` | 151 | 200 | Increase connection limit |
| `wait_timeout` | 28800s (8h) | 600s (10m) | Close idle connections faster |
| `interactive_timeout` | 28800s (8h) | 600s (10m) | Close idle connections faster |
| `connectionLimit` (pool) | 10 | 10 | Keep at 10 per app instance |
| `idleTimeout` (pool) | None | 60s | Auto-close idle connections |
| `maxIdle` (pool) | None | 5 | Keep max 5 idle connections |

---

## 8. Checklist Penyelenggaraan Berkala

### Mingguan:
- [ ] Check connection count: `SELECT COUNT(*) FROM information_schema.processlist;`
- [ ] Review slow query log (jika enabled)

### Bulanan:
- [ ] Verify MySQL settings masih aktif
- [ ] Review error logs: `C:\xampp\mysql\data\mysql_error.log`
- [ ] Optimize tables: `OPTIMIZE TABLE financial_transactions;`

### Selepas Deploy:
- [ ] Monitor connection count untuk 24 jam pertama
- [ ] Verify no connection leaks
- [ ] Check application logs untuk errors

---

## 9. Resources & References

- MySQL Connection Pooling: https://github.com/mysqljs/mysql#pooling-connections
- MySQL2 Options: https://github.com/sidorares/node-mysql2#using-connection-pools
- MySQL Server Variables: https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html

---

**Last Updated:** 2025-11-25
**Version:** 1.0
**Status:** ✅ IMPLEMENTED

