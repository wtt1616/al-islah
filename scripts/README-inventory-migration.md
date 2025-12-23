# Inventory & Harta Modal Data Migration Guide

## Overview
This guide explains how to migrate inventory and harta modal data from PDF files into the iSAR database system.

## Files Included

### Data Files
- `inventory-data.csv` - 156 inventory records extracted from PDF

### Migration Scripts
- `import-inventory.js` - Node.js script to import CSV data into database
- `database/migrations/import_inventory_data.sql` - SQL backup for direct database import

## Prerequisites

1. **Database Tables Must Exist**
   - Run `database/migrations/add_inventory_module.sql` first
   - Run `database/migrations/add_harta_modal_module.sql` first

2. **Environment Setup**
   - Node.js installed
   - `.env.local` file configured with database credentials
   - `mysql2` npm package installed

## Method 1: JavaScript Import Script (Recommended)

### Advantages
- Automatic duplicate detection
- Progress reporting
- Error handling and logging
- Can skip existing records

### Usage

```bash
# Navigate to project root
cd C:\Users\Lenovo\iSAR

# Run import script
node scripts/import-inventory.js

# Or specify a different CSV file
node scripts/import-inventory.js path/to/custom-file.csv
```

### Expected Output

```
Reading CSV file: scripts/inventory-data.csv
Found 156 records to import

Connected to database
✅ Imported: SAR/I/2016/3/001
✅ Imported: SAR/I/2016/3/002
...
⏭️  Skipped (exists): SAR/I/2016/3/005
...

==================================================
IMPORT SUMMARY
==================================================
Total records:    156
✅ Imported:      156
⏭️  Skipped:       0
❌ Failed:        0
==================================================

Database connection closed
```

## Method 2: Direct SQL Import

### Advantages
- Fast bulk insert
- Can be run directly on production server
- No Node.js required

### Usage

#### Local Database
```bash
mysql -u root -p isar_db < database/migrations/import_inventory_data.sql
```

#### Production Server
```bash
# SSH into server
ssh myopensoft-isar@isar.myopensoft.net -p 8288

# Navigate to project
cd ~/isar

# Run SQL import
mysql -u isar_user -p isar_db < database/migrations/import_inventory_data.sql
```

## CSV Format Requirements

For creating additional import files, use this format:

```csv
no_siri_pendaftaran,keterangan,cara_diperolehi
SAR/I/2016/3/001,KIPAS BERDIRI,PEMBELIAN CARA TERUS: PUSAT KHIDMAT TV & VIDEO TOONG KING
SAR/I/2016/3/002,KIPAS BERDIRI,PEMBELIAN CARA TERUS: PUSAT KHIDMAT TV & VIDEO TOONG KING
```

### Column Mapping
- `no_siri_pendaftaran` → Registration Serial Number (UNIQUE)
- `keterangan` → Asset Description
- `cara_diperolehi` → How Asset was Acquired

### Important Notes
1. First line must be headers
2. All three columns are required
3. `no_siri_pendaftaran` must be unique
4. Use UTF-8 encoding for Malay characters
5. Values with commas should be quoted

## Harta Modal Migration

The same process applies for harta modal data:

1. Create `harta-modal-data.csv` with same format
2. Run: `node scripts/import-inventory.js harta-modal-data.csv`
   - OR modify script to use `harta_modal` table instead of `inventory`

## Verification

### Check Imported Records

```sql
-- Count total inventory records
SELECT COUNT(*) FROM inventory;

-- View recent imports
SELECT * FROM inventory ORDER BY created_at DESC LIMIT 10;

-- Check for duplicates
SELECT no_siri_pendaftaran, COUNT(*) as count
FROM inventory
GROUP BY no_siri_pendaftaran
HAVING count > 1;
```

### Via Web Interface
1. Login to iSAR system
2. Navigate to Inventory page
3. Verify all records are visible
4. Check search and filter functionality

## Troubleshooting

### Issue: "Database connection failed"
**Solution**: Check `.env.local` file has correct credentials

### Issue: "Duplicate entry for no_siri_pendaftaran"
**Solution**:
- Check if records already exist in database
- Script will automatically skip duplicates
- Use SQL to remove duplicates if needed:
  ```sql
  DELETE i1 FROM inventory i1
  INNER JOIN inventory i2
  WHERE i1.id > i2.id
  AND i1.no_siri_pendaftaran = i2.no_siri_pendaftaran;
  ```

### Issue: "CSV file not found"
**Solution**:
- Verify file path is correct
- Use absolute path if needed
- Check file is in `scripts/` directory

### Issue: "UTF-8 encoding errors"
**Solution**:
- Save CSV as UTF-8 encoding
- In Excel: Save As → CSV UTF-8 (Comma delimited)

## Production Deployment

### Step 1: Test Locally First
```bash
# Local test
node scripts/import-inventory.js
```

### Step 2: Backup Production Database
```bash
ssh myopensoft-isar@isar.myopensoft.net -p 8288
mysqldump -u isar_user -p isar_db > backup_before_import.sql
```

### Step 3: Upload Files to Server
```bash
# From local machine
scp -P 8288 scripts/inventory-data.csv myopensoft-isar@isar.myopensoft.net:~/isar/scripts/
scp -P 8288 scripts/import-inventory.js myopensoft-isar@isar.myopensoft.net:~/isar/scripts/
```

### Step 4: Run Import on Production
```bash
ssh myopensoft-isar@isar.myopensoft.net -p 8288
cd ~/isar
node scripts/import-inventory.js
```

### Step 5: Verify
```bash
# Check count
mysql -u isar_user -p isar_db -e "SELECT COUNT(*) FROM inventory;"

# Or use web interface
# Visit: https://isar.myopensoft.net
```

## Migration History

### 2025-11-21: Initial Inventory Import
- Source: `PRINTING VERSION - INVENTORI.pdf`
- Records: 156 inventory items
- Format: CSV with 3 columns
- Created by: Admin (user_id: 1)
- Status: ✅ Completed

## Future Imports

To import additional inventory or harta modal data:

1. Convert PDF/Excel to CSV format
2. Follow CSV format requirements above
3. Save file in `scripts/` directory
4. Run import script
5. Verify import was successful

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Check database logs
4. Contact system administrator

---

**Last Updated**: 2025-11-21
**Version**: 1.0
