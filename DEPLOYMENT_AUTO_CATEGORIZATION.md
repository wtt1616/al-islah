# Deployment Guide: Auto-Categorization Feature

## Feature Summary
Auto-categorization system untuk financial transactions menggunakan keyword matching. Bendahari boleh manage keywords dan auto-categorize transactions dengan satu klik.

## Deployment Date
2025-11-23

## Files Changed/Created

### New Files
1. `migrations/create_rujukan_kategori.sql` - Database table creation
2. `migrations/seed_rujukan_kategori.sql` - Initial keyword data
3. `app/api/financial/keywords/route.ts` - CRUD API for keywords
4. `app/api/financial/auto-categorize/route.ts` - Auto-categorization logic
5. `app/financial/keywords/page.tsx` - Keyword management UI

### Modified Files
1. `types/index.ts` - Added RujukanKategori interface
2. `app/financial/transactions/page.tsx` - Added Jana Kategori button and preview modal

## Pre-Deployment Checklist

- [x] Build project successfully (`npm run build`)
- [x] All TypeScript types defined
- [x] API endpoints tested
- [ ] Database migrations prepared
- [ ] Initial data seed ready

## Deployment Steps

### Step 1: Local Testing (Optional but Recommended)
```bash
# On local machine
npm run dev

# Test:
# 1. Login as bendahari
# 2. Go to Financial Management > Keyword Management
# 3. Add a test keyword
# 4. Go to Transactions page
# 5. Click "Jana Kategori" button
# 6. Verify preview modal works
```

### Step 2: Commit and Push Code
```bash
# On local machine (C:\Users\Lenovo\iSAR)
git add .
git commit -m "$(cat <<'EOF'
Add auto-categorization feature for financial transactions

Features:
- Keyword management for bendahari
- Auto-categorize transactions based on keywords
- Preview before applying categorization
- Support for both penerimaan and pembayaran

Files:
- New API: /api/financial/keywords (CRUD)
- New API: /api/financial/auto-categorize (POST)
- New page: /financial/keywords
- Updated: /financial/transactions (Jana Kategori button)
- Database: rujukan_kategori table

🤖 Generated with Claude Code
https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push origin main
```

### Step 3: SSH to Production Server
```bash
ssh myopensoft-isar@isar.myopensoft.net -p 8288
# Password: R57aVmtLpj6JvFHREbtt
```

### Step 4: Pull Latest Code
```bash
cd ~/isar
git pull origin main
```

### Step 5: Run Database Migrations
```bash
# Connect to MySQL
mysql -u your_db_user -p your_db_name

# Or if using specific credentials, adjust accordingly
# Run the migration SQL files
```

**IMPORTANT: Run these SQL commands in order:**

```sql
-- 1. Create table
source ~/isar/migrations/create_rujukan_kategori.sql

-- OR copy-paste the content manually:
CREATE TABLE IF NOT EXISTS rujukan_kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis_transaksi ENUM('penerimaan', 'pembayaran') NOT NULL,
  kategori_nama VARCHAR(255) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jenis_transaksi (jenis_transaksi),
  INDEX idx_keyword (keyword),
  INDEX idx_aktif (aktif),
  INDEX idx_kategori_nama (kategori_nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Verify table created
SHOW TABLES LIKE 'rujukan_kategori';
DESC rujukan_kategori;

-- 3. Seed initial data
source ~/isar/migrations/seed_rujukan_kategori.sql

-- OR copy-paste the INSERT statements from seed_rujukan_kategori.sql

-- 4. Verify data inserted
SELECT COUNT(*) FROM rujukan_kategori;
SELECT jenis_transaksi, kategori_nama, COUNT(*) as keyword_count
FROM rujukan_kategori
GROUP BY jenis_transaksi, kategori_nama;

-- Expected: ~40 rows total
```

### Step 6: Install Dependencies
```bash
npm install
```

### Step 7: Build Application
```bash
npm run build
```

### Step 8: Restart PM2
```bash
pm2 restart isar
```

### Step 9: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs for any errors
pm2 logs isar --lines 50
```

### Step 10: Test on Production

1. **Open browser**: https://isar.myopensoft.net
2. **Login as bendahari**
3. **Test Keyword Management**:
   - Navigate to: Financial Management → (should see new menu or button for Keywords)
   - Or directly: https://isar.myopensoft.net/financial/keywords
   - Verify keywords are loaded from database
   - Try adding a new keyword
   - Try editing a keyword
   - Try toggling active/inactive
4. **Test Auto-Categorization**:
   - Go to Financial Management → Transactions
   - Select a bank statement that has transactions
   - Click "Jana Kategori" button
   - Verify preview modal appears
   - Check if any matches found
   - Click "Teruskan" to apply
   - Verify transactions are categorized correctly

## Rollback Plan (If Issues Occur)

### Option 1: Quick Rollback (Revert Code)
```bash
# On production server
cd ~/isar
git log --oneline -5  # Find previous commit hash
git reset --hard <previous-commit-hash>
npm install
npm run build
pm2 restart isar
```

### Option 2: Keep Code, Remove Table (If database issue)
```sql
-- Only if you need to rollback database changes
DROP TABLE IF EXISTS rujukan_kategori;
```

The code will still work, but keywords feature will show empty until table is recreated.

## Post-Deployment

### 1. Monitor Logs
```bash
pm2 logs isar --lines 100
```
Watch for any errors related to:
- `/api/financial/keywords`
- `/api/financial/auto-categorize`
- Database connection errors

### 2. User Training
Inform Bendahari about new features:
- Where to find Keyword Management page
- How to add/edit keywords
- How to use "Jana Kategori" button
- Understanding the preview modal

### 3. Data Maintenance
- Review keyword effectiveness after first week
- Add new keywords based on transaction patterns
- Remove or disable ineffective keywords

## Troubleshooting

### Issue: Table already exists
**Error**: `Table 'rujukan_kategori' already exists`
**Solution**:
```sql
-- Check if table has data
SELECT COUNT(*) FROM rujukan_kategori;
-- If empty, drop and recreate. If has data, skip creation.
```

### Issue: Keywords not showing
**Symptoms**: Keyword management page is empty
**Debug**:
1. Check database: `SELECT * FROM rujukan_kategori LIMIT 10;`
2. Check API: https://isar.myopensoft.net/api/financial/keywords
3. Check browser console for JavaScript errors
4. Check PM2 logs: `pm2 logs isar --lines 50`

### Issue: Auto-categorization not working
**Symptoms**: "Jana Kategori" button does nothing or shows 0 matches
**Debug**:
1. Verify keywords exist and are active: `SELECT * FROM rujukan_kategori WHERE aktif = TRUE;`
2. Check transactions have `customer_eft_no` and `payment_details` populated
3. Manually test keyword matching:
   ```sql
   SELECT * FROM financial_transactions
   WHERE LOWER(CONCAT(customer_eft_no, ' ', payment_details)) LIKE '%infaq%'
   LIMIT 5;
   ```
4. Check browser Network tab for API response from `/api/financial/auto-categorize`

### Issue: Permission denied errors
**Symptoms**: 403 Forbidden when accessing keyword management
**Debug**:
1. Verify user is logged in as bendahari or admin
2. Check session: Browser → Developer Tools → Application → Cookies
3. Check authOptions in `lib/auth.ts` includes 'bendahari' role

## Success Criteria

- ✅ Build completes without errors
- ✅ PM2 process restarts successfully
- ✅ No errors in PM2 logs
- ✅ Keyword management page loads and shows initial keywords
- ✅ Can add/edit/delete keywords
- ✅ "Jana Kategori" button appears on transactions page
- ✅ Auto-categorization preview works
- ✅ Transactions get categorized correctly
- ✅ Bendahari confirms feature is useful

## Notes

- This feature only auto-categorizes **uncategorized** transactions
- Manual categorizations are never overwritten
- Keyword matching is case-insensitive
- Longest keywords are matched first (more specific)
- All auto-categorizations are tracked (`categorized_by`, `categorized_at`)

## Support

If any issues during deployment:
1. Check PM2 logs: `pm2 logs isar --err`
2. Check database connectivity
3. Verify all migration SQL ran successfully
4. Contact development team with error logs

---

**Deployed By**: [Your Name]
**Date**: 2025-11-23
**Status**: ⏳ Pending Deployment
