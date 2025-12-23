/**
 * Migration script to encrypt existing plain text sensitive data
 * This script encrypts:
 * - no_kp in khairat_ahli table
 * - no_kp in khairat_tanggungan table
 * - no_akaun in preachers table
 *
 * Run with: npx ts-node scripts/encrypt-existing-data.ts
 * Make sure ENCRYPTION_KEY is set in environment variables before running
 */

import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  return env;
}

const envLocal = loadEnvFile(path.join(process.cwd(), '.env.local'));
const envProd = loadEnvFile(path.join(process.cwd(), '.env.production'));
const env = { ...envProd, ...envLocal };

const ENCRYPTION_KEY = env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  console.error('ERROR: ENCRYPTION_KEY environment variable is not set');
  console.log('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

function encrypt(plainText: string): string {
  if (!plainText) return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY!, 'hex');

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function isEncrypted(text: string): boolean {
  if (!text || !text.includes(':')) return false;
  const parts = text.split(':');
  if (parts.length !== 3) return false;
  const [ivHex, authTagHex] = parts;
  return (
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === 16 * 2 &&
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    /^[0-9a-fA-F]+$/.test(authTagHex)
  );
}

async function main() {
  console.log('=== Encryption Migration Script ===\n');

  const connection = await mysql.createConnection({
    host: env.DB_HOST || process.env.DB_HOST || 'localhost',
    user: env.DB_USER || process.env.DB_USER || 'root',
    password: env.DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: env.DB_NAME || process.env.DB_NAME || 'isar_db',
    port: parseInt(env.DB_PORT || process.env.DB_PORT || '3306')
  });

  try {
    console.log('Connected to database.\n');

    // 1. Encrypt khairat_ahli.no_kp
    console.log('1. Processing khairat_ahli.no_kp...');
    const [khairatRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, no_kp FROM khairat_ahli WHERE no_kp IS NOT NULL AND no_kp != ""'
    );

    let khairatEncrypted = 0;
    let khairatSkipped = 0;

    for (const row of khairatRows) {
      if (isEncrypted(row.no_kp)) {
        khairatSkipped++;
        continue;
      }

      const encrypted = encrypt(row.no_kp);
      await connection.query(
        'UPDATE khairat_ahli SET no_kp = ? WHERE id = ?',
        [encrypted, row.id]
      );
      khairatEncrypted++;
    }

    console.log(`   - Encrypted: ${khairatEncrypted} records`);
    console.log(`   - Skipped (already encrypted): ${khairatSkipped} records\n`);

    // 2. Encrypt khairat_tanggungan.no_kp
    console.log('2. Processing khairat_tanggungan.no_kp...');
    const [tanggunganRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, no_kp FROM khairat_tanggungan WHERE no_kp IS NOT NULL AND no_kp != ""'
    );

    let tanggunganEncrypted = 0;
    let tanggunganSkipped = 0;

    for (const row of tanggunganRows) {
      if (isEncrypted(row.no_kp)) {
        tanggunganSkipped++;
        continue;
      }

      const encrypted = encrypt(row.no_kp);
      await connection.query(
        'UPDATE khairat_tanggungan SET no_kp = ? WHERE id = ?',
        [encrypted, row.id]
      );
      tanggunganEncrypted++;
    }

    console.log(`   - Encrypted: ${tanggunganEncrypted} records`);
    console.log(`   - Skipped (already encrypted): ${tanggunganSkipped} records\n`);

    // 3. Encrypt preachers.no_akaun
    console.log('3. Processing preachers.no_akaun...');
    const [preacherRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, no_akaun FROM preachers WHERE no_akaun IS NOT NULL AND no_akaun != ""'
    );

    let preachersEncrypted = 0;
    let preachersSkipped = 0;

    for (const row of preacherRows) {
      if (isEncrypted(row.no_akaun)) {
        preachersSkipped++;
        continue;
      }

      const encrypted = encrypt(row.no_akaun);
      await connection.query(
        'UPDATE preachers SET no_akaun = ? WHERE id = ?',
        [encrypted, row.id]
      );
      preachersEncrypted++;
    }

    console.log(`   - Encrypted: ${preachersEncrypted} records`);
    console.log(`   - Skipped (already encrypted): ${preachersSkipped} records\n`);

    // Summary
    console.log('=== Migration Complete ===');
    console.log(`Total encrypted: ${khairatEncrypted + tanggunganEncrypted + preachersEncrypted} records`);
    console.log(`Total skipped: ${khairatSkipped + tanggunganSkipped + preachersSkipped} records`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\nDatabase connection closed.');
  }
}

main();
