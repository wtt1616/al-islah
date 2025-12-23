const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (error) {
    console.log('Note: Could not load .env.local file, using default values');
  }
}

loadEnv();

// CSV parsing function
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }
  }

  return records;
}

async function importInventory(csvFilePath) {
  let connection;

  try {
    // Read CSV file
    console.log(`Reading CSV file: ${csvFilePath}`);
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parseCSV(csvContent);
    console.log(`Found ${records.length} records to import\n`);

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'isar_db',
    });

    console.log('Connected to database');

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    // Import records
    for (const record of records) {
      try {
        const { no_siri_pendaftaran, keterangan, cara_diperolehi } = record;

        // Validate required fields
        if (!no_siri_pendaftaran || !keterangan || !cara_diperolehi) {
          console.log(`❌ Skipping record: Missing required fields`);
          failed++;
          errors.push({
            record: no_siri_pendaftaran || 'Unknown',
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if record already exists
        const [existing] = await connection.execute(
          'SELECT id FROM inventory WHERE no_siri_pendaftaran = ?',
          [no_siri_pendaftaran]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipped (exists): ${no_siri_pendaftaran}`);
          skipped++;
          continue;
        }

        // Insert record (created_by = 1 for admin)
        await connection.execute(
          'INSERT INTO inventory (no_siri_pendaftaran, keterangan, cara_diperolehi, created_by) VALUES (?, ?, ?, ?)',
          [no_siri_pendaftaran, keterangan, cara_diperolehi, 1]
        );

        console.log(`✅ Imported: ${no_siri_pendaftaran}`);
        imported++;

      } catch (error) {
        console.log(`❌ Failed: ${record.no_siri_pendaftaran} - ${error.message}`);
        failed++;
        errors.push({
          record: record.no_siri_pendaftaran,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total records:    ${records.length}`);
    console.log(`✅ Imported:      ${imported}`);
    console.log(`⏭️  Skipped:       ${skipped}`);
    console.log(`❌ Failed:        ${failed}`);
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  - ${err.record}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Main execution
const csvFile = process.argv[2] || path.join(__dirname, 'inventory-data.csv');

if (!fs.existsSync(csvFile)) {
  console.error(`Error: CSV file not found: ${csvFile}`);
  console.log('\nUsage: node import-inventory.js [csv-file-path]');
  console.log('Example: node import-inventory.js inventory-data.csv');
  process.exit(1);
}

importInventory(csvFile);
