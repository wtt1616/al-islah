# Claude Development Log

This document tracks all features and changes implemented with Claude Code assistance.

## Table of Contents
- [Recent Changes](#recent-changes)
- [Feature: Dynamic RBAC Permission Management](#feature-dynamic-rbac-permission-management)
- [Feature: Khairat Privacy & Encryption](#feature-khairat-privacy--encryption)
- [Fix: Laporan Bulanan Dynamic Categories](#fix-laporan-bulanan-dynamic-categories)
- [Fix: Bank Reconciliation Logic](#fix-bank-reconciliation-logic)
- [Feature: Auto-Categorization for Financial Transactions](#feature-auto-categorization-for-financial-transactions)
- [Feature: User Profile Management](#feature-user-profile-management)
- [Feature: Color-Coded Schedules](#feature-color-coded-schedules)
- [Database Access](#database-access)
- [Deployment History](#deployment-history)

---

## Recent Changes

### 2025-12-21: Database Encryption Fix

Fixed critical bug where encrypted IC numbers were being truncated:

1. **Bug Identified** - `no_kp` column was VARCHAR(20) but AES-256-GCM encrypted data is ~90 characters
2. **Root Cause** - MySQL silently truncated encrypted data to 20 characters
3. **Solution** - Expanded `khairat_ahli.no_kp` and `khairat_tanggungan.no_kp` to VARCHAR(255)
4. **Impact** - 5 existing records have corrupted IC data that cannot be recovered

### 2025-12-20: Khairat Privacy Features

Added privacy protection for sensitive data on public khairat pages:

1. **IC Masking** - Public page shows masked IC: `800101-**-**55` instead of full number
2. **Phone Masking** - Public page shows masked phone: `012-***-6789`
3. **Admin Full View** - Admin approval page shows full IC in standard format: `800101-12-5555`

### 2025-12-19: Dynamic RBAC Permission Management

Implemented complete Role-Based Access Control (RBAC) system:

1. **Database Tables** - Created `modules` and `role_permissions` tables
2. **Admin UI** - Built `/admin/permissions` page for managing role permissions
3. **Permission Hook** - Created `usePermissions` React hook for client-side checks
4. **8 Modules** - Dashboard, Penjadualan, Aset, Kewangan, Laporan, Aktiviti, Khairat, Pentadbiran
5. **4 Permission Levels** - View, Create, Edit, Delete per module

### 2025-12-18: Laporan Bulanan Dynamic Categories Fix

Fixed Laporan Kewangan Bulanan (BR-KMS-018) to use dynamic categories from database:

1. **Bug Identified** - Categories were hardcoded instead of fetched from database
2. **Bug Identified** - Values were incorrect due to missing bulan_perkiraan logic
3. **Solution** - Fetch categories from `kategori_penerimaan` and `kategori_pembayaran` tables
4. **Solution** - Apply same bulan_perkiraan logic as Buku Tunai report

### 2025-12-18: Bank Reconciliation Logic Fix

Fixed critical bug in Penyesuaian Bank (Bank Reconciliation) where Baki Buku Tunai calculation was incorrect:

1. **Bug Identified** - Terimaan dari bulan lain was incorrectly placed in TOLAK instead of CAMPUR
2. **Root Cause** - Misunderstanding of reconciliation logic for transactions from other months
3. **Solution** - Moved terimaan dari bulan lain to CAMPUR section (bank is lower, need to add)

### 2025-11-23: Auto-Categorization System for Financial Transactions

Added intelligent auto-categorization system for financial transactions using keyword matching:

1. **Keyword Management** - Bendahari can manage keywords for automatic category detection
2. **Auto-Categorization** - Automatically categorize transactions based on configured keywords
3. **Preview System** - Preview matches before applying categorization

### 2025-11-17: User Profile & Color-Coded Schedules

Two major features were added to the iSAR system:

1. **User Profile Management** - Users can now view and update their profile information and change passwords
2. **Color-Coded Schedules** - Each Imam and Bilal gets a unique color in schedules with distribution tracking

---

## Feature: Dynamic RBAC Permission Management

### Overview
Implemented a complete Role-Based Access Control (RBAC) system that allows admin to dynamically manage module access for each role through a user interface, without requiring code changes.

### Database Schema

#### Table: `modules`
Stores the list of system modules:
```sql
CREATE TABLE modules (
  id VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  path VARCHAR(255),
  urutan INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `role_permissions`
Stores permission assignments for each role:
```sql
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_module (role, module_id),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
```

### System Modules (8 Total)

| ID | Module | Icon | Path |
|----|--------|------|------|
| dashboard | Dashboard | bi-speedometer2 | /dashboard |
| penjadualan | Penjadualan | bi-calendar-week | /schedules |
| aset | Aset | bi-box-seam | /aset |
| kewangan | Kewangan | bi-cash-coin | /financial |
| laporan | Laporan | bi-file-earmark-text | /dashboard/reports |
| aktiviti | Aktiviti | bi-calendar-event | /dashboard/aktiviti |
| khairat | Khairat | bi-heart | /dashboard/khairat |
| pentadbiran | Pentadbiran | bi-gear | /admin |

### User Roles

| Category | Roles |
|----------|-------|
| Internal Staff | admin, bendahari, aset, pegawai |
| Petugas | head_imam, imam, bilal, imam_jumaat, bilal_jumaat, penceramah |

### Files Created

#### 1. `migrations/create_rbac_tables.sql`
Database migration for creating modules and role_permissions tables.

#### 2. `migrations/seed_rbac_data.sql`
Seed data for 8 modules and default permissions for admin, bendahari, head_imam, and aset roles.

#### 3. `app/api/permissions/setup/route.ts`
One-time setup API to create tables and seed initial data.

#### 4. `app/api/permissions/modules/route.ts`
API endpoint to fetch list of active modules.

#### 5. `app/api/permissions/route.ts`
- **GET**: Fetch permissions for a specific role
- **PUT**: Update permissions for a role (admin only)

#### 6. `lib/permissions.ts`
Server-side permission checking utilities:
```typescript
export async function checkPermission(
  role: string,
  moduleId: string,
  action: PermissionAction
): Promise<boolean>

export async function getUserPermissions(
  role: string
): Promise<ModulePermission[]>
```

#### 7. `hooks/usePermissions.ts`
React hook for client-side permission checking:
```typescript
const {
  permissions,    // Array of ModulePermission
  loading,        // Boolean
  hasPermission,  // (moduleId, action) => boolean
  canView,        // (moduleId) => boolean
  canCreate,      // (moduleId) => boolean
  canEdit,        // (moduleId) => boolean
  canDelete,      // (moduleId) => boolean
  refetch         // () => Promise<void>
} = usePermissions();
```

#### 8. `app/admin/permissions/page.tsx`
Admin UI for managing permissions with:
- Role selector dropdown
- Grid of modules with checkboxes for each permission level
- "Select All" options for each permission type
- Save button to persist changes

### Usage Examples

#### In React Components (Client-side)
```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, canEdit, loading } = usePermissions();

  if (loading) return <Spinner />;

  return (
    <div>
      {hasPermission('kewangan', 'view') && <FinancialReport />}
      {canEdit('khairat') && <EditButton />}
    </div>
  );
}
```

#### In API Routes (Server-side)
```typescript
import { checkPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!await checkPermission(session.user.role, 'kewangan', 'create')) {
    return NextResponse.json({ error: 'Tiada kebenaran' }, { status: 403 });
  }

  // Proceed with operation...
}
```

### Default Permissions

| Role | Modules with Full Access |
|------|--------------------------|
| admin | All 8 modules (view/create/edit/delete) |
| bendahari | Dashboard (view), Kewangan (all), Laporan (view) |
| head_imam | Dashboard, Penjadualan, Kewangan (view), Laporan, Aktiviti, Khairat |
| aset | Dashboard (view), Aset (all) |

---

## Feature: Khairat Privacy & Encryption

### Overview
Implemented privacy protection for sensitive member data (IC numbers, phone numbers) with data masking on public pages and AES-256-GCM encryption for database storage.

### Data Masking

#### IC Number Masking (Public Page)
```typescript
// Input: 800101125555
// Output: 800101-**-**55
const maskNoKP = (noKp: string): string => {
  const cleaned = noKp.replace(/[-\s]/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 6)}-**-**${cleaned.slice(-2)}`;
  }
  return '*'.repeat(cleaned.length);
};
```

#### Phone Number Masking (Public Page)
```typescript
// Input: 0123456789
// Output: 012-***-6789
const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(-4)}`;
  }
  return '*'.repeat(cleaned.length);
};
```

#### IC Number Formatting (Admin Page)
```typescript
// Input: 800101125555
// Output: 800101-12-5555
const formatNoKP = (noKp: string): string => {
  const cleaned = noKp.replace(/[-\s]/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }
  return noKp;
};
```

### AES-256-GCM Encryption

#### Encryption Configuration
```typescript
// lib/encryption.ts
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16;  // 16 bytes for GCM auth tag

// Encrypted format: iv:authTag:encryptedData (hex encoded)
// Example output: 02bec662...7c:5b73f0d5...9a:8f45aad5...77
// Total length: ~90 characters
```

#### Environment Variable
```bash
# .env.local
ENCRYPTION_KEY=5902bb77f4addac4972d808951625f0683ed52fe8295bd3b63711a7e76986c84
```

#### Encrypted Fields
| Table | Column | Purpose |
|-------|--------|---------|
| khairat_ahli | no_kp | Member IC number |
| khairat_tanggungan | no_kp | Dependent IC number |
| preachers | no_akaun | Bank account number |

### Files Modified

#### 1. `app/khairat/page.tsx`
Added `maskNoKP()` and `maskPhone()` functions for public search results.

#### 2. `app/dashboard/khairat/[id]/page.tsx`
Added `formatNoKP()` function for admin approval page to show full IC in standard format.

#### 3. `lib/encryption.ts`
Encryption/decryption utilities with AES-256-GCM.

#### 4. `app/api/khairat/daftar/route.ts`
Encrypts IC number before storing in database.

### Database Column Fix (2025-12-21)

**Problem**: `no_kp` columns were VARCHAR(20) but encrypted data requires ~90 characters.

**Solution**: Expanded columns to VARCHAR(255):
```sql
ALTER TABLE khairat_ahli MODIFY COLUMN no_kp VARCHAR(255) NOT NULL;
ALTER TABLE khairat_tanggungan MODIFY COLUMN no_kp VARCHAR(255);
```

**Migration File**: `migrations/expand_no_kp_for_encryption.sql`

### Security Summary
- **Public Access**: Masked IC and phone numbers
- **Admin Access**: Full IC in formatted display
- **Database Storage**: AES-256-GCM encrypted
- **Key Management**: Environment variable (not in code)

---

## Fix: Bank Reconciliation Logic

### Overview
Fixed a critical bug in Penyesuaian Bank (Bank Reconciliation) where the calculated Baki Buku Tunai did not match the actual Buku Tunai balance.

### Problem
- Buku Tunai Feb 2025: RM129,759.67
- Penyesuaian Bank Feb 2025: RM132,100.67
- Discrepancy: RM2,341

### Root Cause
The bug was in the CAMPUR/TOLAK logic for transactions from other months (`transaksi_dari_bulan_lain`).

**Incorrect Logic (Before):**
- Terimaan dari bulan lain → TOLAK (wrong!)
- Pembayaran dari bulan lain → TOLAK

**Correct Logic (After):**
- Terimaan dari bulan lain → CAMPUR (bank is lower, need to add)
- Pembayaran dari bulan lain → TOLAK (bank is higher, need to subtract)

### Formula
```
Baki Penyata Bank + CAMPUR - TOLAK = Baki Buku Tunai
```

### Complete Reconciliation Logic Table

| Jenis | Lokasi Transaksi | bulan_perkiraan | Dalam Bank? | Dalam Buku Tunai? | Bank vs Buku Tunai | Kategori |
|-------|------------------|-----------------|-------------|-------------------|-------------------|----------|
| Terimaan | Bulan semasa | bulan_depan/sebelum | Ya | Tidak | Bank TINGGI | **TOLAK** |
| Terimaan | Bulan lain | bulan_depan/sebelum | Tidak | Ya | Bank RENDAH | **CAMPUR** |
| Pembayaran | Bulan semasa | bulan_depan/sebelum | Ya | Tidak | Bank RENDAH | **CAMPUR** |
| Pembayaran | Bulan lain | bulan_depan/sebelum | Tidak | Ya | Bank TINGGI | **TOLAK** |

### Files Modified

#### 1. `app/financial/penyesuaian-bank/page.tsx`

**Calculation Logic (Lines 192-201):**
```typescript
// CAMPUR: Bank LEBIH RENDAH daripada buku tunai
const jumlahCampur = formData.terimaan_belum_dimasukkan + formData.caj_bank +
  formData.komisen_bank + formData.cek_tak_laku +
  totalPembayaranBulanSemasa +    // Pembayaran semasa dengan perkiraan
  totalTerimaanDariBulanLain;      // Terimaan dari bulan lain (MOVED HERE)

// TOLAK: Bank LEBIH TINGGI daripada buku tunai
const jumlahTolak = formData.cek_belum_dikemukakan + formData.dividen_hibah +
  totalTerimaanBulanSemasa +       // Terimaan semasa dengan perkiraan
  totalPembayaranDariBulanLain;    // Pembayaran dari bulan lain
```

**UI Changes:**
- Moved "Terimaan dari bulan lain" display from TOLAK section to CAMPUR section
- Updated display format (positive value instead of negative with parentheses)

#### 2. `app/api/financial/penyesuaian-bank/route.ts`

**Updated Comments (Lines 78-88):**
```typescript
// CAMPUR (Bank LEBIH RENDAH daripada Buku Tunai):
//   - Pembayaran bulan semasa dengan bulan_perkiraan
//   - Terimaan dari bulan lain
//
// TOLAK (Bank LEBIH TINGGI daripada Buku Tunai):
//   - Terimaan bulan semasa dengan bulan_perkiraan
//   - Pembayaran dari bulan lain
```

### Bank Closing Balance Calculation

The bank closing balance is auto-calculated:
```typescript
Baki Penyata Bank = Opening Balance + Total Credits - Total Debits
```

For February 2025:
- Opening Balance: RM133,278.22
- Total Credits: RM42,429.60
- Total Debits: RM39,607.15
- **Calculated Closing: RM136,100.67**

### Testing Verified
- January 2025: Baki Penyesuaian Bank = Baki Buku Tunai ✓
- February 2025: Baki Penyesuaian Bank = Baki Buku Tunai ✓

### Commit
- **Hash**: `9d47e2f`
- **Message**: "Fix bank reconciliation: move terimaan dari bulan lain to CAMPUR"

---

## Fix: Laporan Bulanan Dynamic Categories

### Overview
Fixed the Laporan Kewangan Bulanan Dan Berkala (BR-KMS-018) report to dynamically fetch categories from the database and calculate values correctly using bulan_perkiraan logic.

### Problems
1. **Hardcoded Categories** - Categories were hardcoded in the API instead of fetched from database tables
2. **Incorrect Values** - Transaction amounts were not calculated correctly because bulan_perkiraan logic was missing
3. **Missing Categories** - New categories added to the database were not appearing in the report

### Solution

#### 1. Dynamic Category Fetching
Changed from hardcoded arrays to database queries:

**Before (Hardcoded):**
```typescript
const TERIMAAN_CATEGORIES = ['Sumbangan Am', 'Sumbangan Khas', ...];
const PERBELANJAAN_CATEGORIES = ['Pentadbiran', 'Dakwah', ...];
```

**After (Dynamic):**
```typescript
// Fetch active penerimaan categories from database
const [penerimaanCats] = await pool.query<RowDataPacket[]>(
  `SELECT nama_kategori FROM kategori_penerimaan WHERE aktif = TRUE ORDER BY urutan ASC, nama_kategori ASC`
);
const TERIMAAN_CATEGORIES = penerimaanCats.map(c => c.nama_kategori);

// Fetch active pembayaran categories from database
const [pembayaranCats] = await pool.query<RowDataPacket[]>(
  `SELECT nama_kategori FROM kategori_pembayaran WHERE aktif = TRUE ORDER BY urutan ASC, nama_kategori ASC`
);
const PERBELANJAAN_CATEGORIES = pembayaranCats.map(c => c.nama_kategori);
```

#### 2. bulan_perkiraan Logic
Applied the same transaction filtering logic as Buku Tunai report:

```typescript
// For each month, include:
// 1. Current month transactions with bulan_semasa or NULL
// 2. Previous month transactions with bulan_depan (carried forward)
// 3. Next month transactions with bulan_sebelum (carried back)

const [transactions] = await pool.query<RowDataPacket[]>(
  `SELECT ... FROM financial_transactions ft
   WHERE ft.transaction_type IN ('penerimaan', 'pembayaran')
   AND (
     -- Current month with bulan_semasa or NULL
     (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
      AND (ft.bulan_perkiraan = 'bulan_semasa' OR ft.bulan_perkiraan IS NULL))
     OR
     -- Previous month carried forward
     (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
      AND ft.bulan_perkiraan = 'bulan_depan')
     OR
     -- Next month carried back
     (MONTH(ft.transaction_date) = ? AND YEAR(ft.transaction_date) = ?
      AND ft.bulan_perkiraan = 'bulan_sebelum')
   )`,
  [month, year, prevMonth, prevYear, nextMonth, nextYear]
);
```

### Files Modified

#### `app/api/financial/reports/laporan-bulanan/route.ts`
Complete rewrite of the API endpoint:

1. **Lines 29-38**: Fetch categories from database instead of hardcoded arrays
2. **Lines 52-112**: Process each month with bulan_perkiraan logic
3. **Lines 139-173**: Calculate opening balance with same logic as buku-tunai

### Database Tables Used
- `kategori_penerimaan` - Active receipt categories (ordered by `urutan`)
- `kategori_pembayaran` - Active payment categories (ordered by `urutan`)
- `financial_transactions` - Transaction data with bulan_perkiraan field
- `bank_statements` - Opening balance data

### Report Structure
The Laporan Bulanan (BR-KMS-018) displays:
- **TERIMAAN** (Receipts): All active penerimaan categories with monthly totals
- **PERBELANJAAN** (Expenses): All active pembayaran categories with monthly totals
- **Lebih/Kurang** (Surplus/Deficit): Monthly and annual totals
- **Baki Awal Bulan** (Opening Balance): Carried forward from previous month
- **Baki Akhir** (Closing Balance): Opening + Surplus/Deficit

### Testing Verified
- Categories display correctly from database ✓
- Values match Buku Tunai report for each month ✓
- bulan_perkiraan transactions allocated to correct months ✓
- Opening/closing balances calculated correctly ✓

### Commit
- **Hash**: `74c0dbf`
- **Message**: "Fix laporan bulanan to use dynamic categories from database"

---

## Feature: User Profile Management

### Overview
Added comprehensive user profile management allowing users to view and update their personal information and change their password securely.

### Files Created

#### 1. `app/api/profile/route.ts`
- **Purpose**: API endpoint for fetching and updating user profile data
- **Methods**:
  - `GET`: Fetches user profile (name, email, role, phone, is_active)
  - `PUT`: Updates user profile with email uniqueness validation

#### 2. `app/api/profile/change-password/route.ts`
- **Purpose**: Secure password change endpoint
- **Security Features**:
  - Verifies current password before allowing change
  - Requires new password confirmation
  - Minimum 6 character password length
  - Uses bcrypt for password hashing

#### 3. `app/dashboard/profile/page.tsx`
- **Purpose**: User-facing profile management interface
- **Features**:
  - Tabbed interface (Profile Information / Change Password)
  - Form validation
  - Success/error notifications
  - Role-based information display

### Files Modified

#### `components/Navbar.tsx`
- **Changes**:
  - Replaced simple logout button with dropdown menu
  - Added "My Profile" link with person icon
  - Maintained logout functionality with visual separation

### Usage
1. Users click their name in the navbar
2. Select "My Profile" from dropdown
3. Can switch between two tabs:
   - **Profile Information**: Update name, email, phone
   - **Change Password**: Securely change password

### Security Considerations
- Session-based authentication required
- Current password verification for password changes
- Email uniqueness validation
- Password hashing with bcrypt (10 rounds)
- All inputs validated server-side

---

## Feature: Color-Coded Schedules

### Overview
Implemented unique color coding for each Imam and Bilal in schedules to help Head Imam identify weekly distribution at a glance. Each user gets a consistent, unique color with a color legend showing distribution counts.

### Files Created

#### `lib/userColors.ts`
- **Purpose**: Centralized color management system
- **Features**:
  - 24 unique color combinations (background, text, border)
  - Smart color assignment algorithm preventing duplicates
  - Consistent colors per user ID
  - Color tracking with Map and Set
- **Functions**:
  - `getUserColor(userId)`: Get unique color for user by ID
  - `getUserColorByName(userName)`: Get color by name using hash
  - `clearUserColorMap()`: Reset color assignments (for testing)

### Color Palette
24 distinct colors including:
- Dark Red, Dark Blue, Dark Green, Orange, Indigo
- Dark Yellow, Dark Cyan, Dark Magenta, Dark Olive
- Firebrick, Midnight Blue, Dark Slate Gray, Crimson
- Royal Blue, Forest Green, Dark Orange, Medium Purple
- Goldenrod, Light Sea Green, Medium Violet Red, Yellow Green
- Indian Red, Slate Blue, Steel Blue

### Files Modified

#### `app/dashboard/page.tsx`
- **Changes**:
  - Added color legend at top showing all Imams/Bilals with distribution counts
  - Applied unique colors to Imam and Bilal cells in schedule
  - Color format: `{background, text, border}`
  - Shows count badges (e.g., "5x" meaning 5 appearances that week)

#### `app/schedules/manage/page.tsx`
- **Changes**:
  - Same color implementation as dashboard
  - Color legend with distribution tracking
  - Maintains consistency across all schedule views

#### `app/globals.css`
- **Changes**:
  - Added print-specific CSS for color preservation
  - `print-color-adjust: exact` for accurate color printing
  - `-webkit-print-color-adjust: exact` for Safari/Chrome
  - Maintains colored borders in print view
  - Hides color legend and buttons when printing

### Color Assignment Algorithm
1. Check if user already has assigned color (return cached)
2. Calculate initial color index: `(userId - 1) % 24`
3. If color already used, find first unused color
4. Track used colors to prevent duplicates
5. If all 24 colors used, wrap around with modulo

### Usage
- Colors automatically appear in schedules
- Color legend shows at top of schedule pages
- Each Imam/Bilal has unique color when < 24 users
- Distribution counts show appearances per week
- Colors preserved when printing schedules

### Print Compatibility
- Colors print correctly on all modern browsers
- Color legend hidden in print view
- Border colors maintained for clarity
- Optimized for A4 landscape printing

---

## Feature: Auto-Categorization for Financial Transactions

### Overview
Implemented intelligent keyword-based auto-categorization system that automatically assigns categories to financial transactions (penerimaan and pembayaran) by matching keywords in transaction details.

### Problem Solved
Previously, Bendahari had to manually categorize every transaction, which was time-consuming and error-prone. This feature automates the process by matching keywords in the transaction's `customer_eft_no` and `payment_details` fields.

### Files Created

#### 1. Database Migration Files

**`migrations/create_rujukan_kategori.sql`**
- Creates `rujukan_kategori` table for storing keyword mappings
- Fields:
  - `id`: Primary key
  - `jenis_transaksi`: ENUM('penerimaan', 'pembayaran')
  - `kategori_nama`: Name of category (matches PenerimaanCategory or PembayaranCategory)
  - `keyword`: The search keyword
  - `aktif`: Boolean to enable/disable keyword
  - `created_at`, `updated_at`: Timestamps
- Indexes on `jenis_transaksi`, `keyword`, `aktif`, and `kategori_nama` for performance

**`migrations/seed_rujukan_kategori.sql`**
- Seeds initial keyword data from `kategori.csv`
- **Penerimaan keywords**: infaq, wakaf, karpet, kopiah, tahlil, korban, etc.
- **Pembayaran keywords**: elaun, cleaner, baiki, servis, program, etc.
- Total ~40 initial keywords across all categories

#### 2. API Endpoints

**`app/api/financial/keywords/route.ts`**
- **GET**: Fetch all keywords or filter by `jenis_transaksi`
- **POST**: Create new keyword (Bendahari/Admin only)
  - Validates jenis_transaksi and kategori_nama
  - Prevents duplicate keywords for same category
- **PUT**: Update keyword (modify keyword text, category, or active status)
- **DELETE**: Remove keyword by ID
- Authorization: bendahari, admin, head_imam can view; bendahari and admin can modify

**`app/api/financial/auto-categorize/route.ts`**
- **POST**: Auto-categorize transactions based on keywords
- Features:
  - Preview mode: Returns matches without applying changes
  - Concatenates `customer_eft_no + payment_details` for matching
  - Case-insensitive partial matching
  - Longest keyword first (sorted by LENGTH DESC) for most specific matches
  - Only updates uncategorized transactions
  - Tracks who categorized and when (`categorized_by`, `categorized_at`)
- Request body:
  ```json
  {
    "statement_id": 123,
    "transaction_ids": [1, 2, 3], // optional: specific transactions
    "preview": true // if true, only return matches without updating
  }
  ```
- Response (preview mode):
  ```json
  {
    "preview": true,
    "total_transactions": 100,
    "matches_found": 45,
    "updates": [
      {
        "id": 1,
        "category_penerimaan": "Sumbangan Am",
        "matched_keyword": "infaq",
        "search_text": "TRF123 Sumbangan Infaq Masjid"
      }
    ]
  }
  ```

#### 3. UI Components

**`app/financial/keywords/page.tsx`**
- Keyword management interface for Bendahari
- Features:
  - View keywords grouped by jenis_transaksi and kategori
  - Filter by penerimaan/pembayaran/all
  - Add new keywords with modal form
  - Edit existing keywords
  - Toggle active/inactive status
  - Delete keywords with confirmation
  - Color-coded badges (green for penerimaan, red for pembayaran)
  - Responsive card-based layout

**Updated: `app/financial/transactions/page.tsx`**
- Added "Jana Kategori" button next to filter tabs
- Added "Urus Keyword" button for quick access to keyword management
- Auto-categorization preview modal showing:
  - Number of matches found
  - List of transactions that will be categorized
  - Matched keyword for each transaction
  - Proposed category
  - Confirm/Cancel options
- Button disabled when no uncategorized transactions exist

#### 4. TypeScript Types

**Updated: `types/index.ts`**
```typescript
export interface RujukanKategori {
  id: number;
  jenis_transaksi: 'penerimaan' | 'pembayaran';
  kategori_nama: string; // PenerimaanCategory | PembayaranCategory
  keyword: string;
  aktif: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### How It Works

#### Matching Algorithm
1. Fetch all active keywords from `rujukan_kategori` (sorted by keyword length DESC)
2. For each transaction:
   - Concatenate `customer_eft_no + payment_details` (e.g., "TRF001 Sumbangan Infaq")
   - Convert to lowercase for case-insensitive matching
   - Determine if transaction is penerimaan (has credit_amount) or pembayaran (has debit_amount)
3. Loop through keywords:
   - Check if keyword exists in concatenated text
   - Match jenis_transaksi (penerimaan keywords only match penerimaan transactions)
   - Take first match (longest/most specific due to sort order)
4. Only update if transaction is currently uncategorized

#### Example Scenarios

**Scenario 1: Penerimaan Transaction**
```
Transaction:
- customer_eft_no: "TRF12345"
- payment_details: "Sumbangan Infaq untuk Masjid"
- credit_amount: 500.00

Search text: "trf12345 sumbangan infaq untuk masjid"
Matched keyword: "infaq" → Category: "Sumbangan Am"
Result: category_penerimaan = "Sumbangan Am"
```

**Scenario 2: Pembayaran Transaction**
```
Transaction:
- customer_eft_no: "PAY99"
- payment_details: "Bayaran elaun Imam bulan Jun"
- debit_amount: 1000.00

Search text: "pay99 bayaran elaun imam bulan jun"
Matched keyword: "elaun" → Category: "Pentadbiran"
Result: category_pembayaran = "Pentadbiran"
```

### Usage Workflow

1. **Initial Setup** (One-time):
   - Run database migrations to create `rujukan_kategori` table
   - Run seed SQL to import initial keywords from `kategori.csv`

2. **Keyword Management** (As needed):
   - Bendahari navigates to `/financial/keywords`
   - Add/edit/delete keywords based on common transaction patterns
   - Enable/disable keywords without deleting them

3. **Auto-Categorization**:
   - Bendahari uploads bank statement
   - Navigates to transactions page
   - Clicks "Jana Kategori" button
   - Reviews preview showing matched transactions
   - Clicks "Teruskan" to apply categorization
   - System updates only uncategorized transactions
   - Manual override still possible for any transaction

### Database Schema

```sql
CREATE TABLE rujukan_kategori (
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
);
```

### Security & Access Control
- **View Keywords**: bendahari, admin, head_imam
- **Manage Keywords**: bendahari, admin only
- **Auto-Categorize**: bendahari, admin, head_imam
- All operations require valid session authentication
- Audit trail: `categorized_by` and `categorized_at` tracked for all auto-categorized transactions

### Benefits
- ⚡ **Time Saving**: Categorize dozens of transactions in seconds instead of manually one-by-one
- 🎯 **Accuracy**: Consistent categorization based on predefined rules
- 📊 **Flexibility**: Easy to add new keywords as new transaction patterns emerge
- 🔍 **Transparency**: Preview before applying changes
- 📝 **Audit Trail**: Track when and by whom transactions were categorized
- 🔄 **Non-Destructive**: Only affects uncategorized transactions; manual categorizations preserved

### Future Enhancements
- **Keyword Priority**: Allow setting priority for keywords that may match multiple categories
- **Bulk Import**: Import keywords from CSV file
- **Learning Mode**: Suggest new keywords based on manually categorized transactions
- **Statistics**: Show keyword match rate and effectiveness
- **Regular Expressions**: Support regex patterns for advanced matching
- **Category Rules**: Complex rules combining multiple keywords with AND/OR logic

---

## Database Access

### Production Database Credentials

| Setting | Value |
|---------|-------|
| Host | `isar.myopensoft.net` |
| Port | `3306` |
| User | `myopensoft-isar` |
| Password | `8zp5RP4IY6pduMucA2FT` |
| Database | `isar` |

### Access via SSH + MySQL CLI

```bash
# SSH into production server
ssh myopensoft-isar@isar.myopensoft.net -p 8288

# Run MySQL query
mysql -u myopensoft-isar -p'8zp5RP4IY6pduMucA2FT' -h isar.myopensoft.net isar -e "SELECT * FROM users;"
```

### Access via Local phpMyAdmin

To connect phpMyAdmin to production database, add to `C:\xampp\phpMyAdmin\config.inc.php`:

```php
/* Production Server */
$i++;
$cfg['Servers'][$i]['verbose'] = 'iSAR Production';
$cfg['Servers'][$i]['host'] = 'isar.myopensoft.net';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['user'] = '';
$cfg['Servers'][$i]['password'] = '';
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['AllowNoPassword'] = false;
$cfg['Servers'][$i]['connect_type'] = 'tcp';
```

Then restart Apache and select "iSAR Production" from the phpMyAdmin login dropdown.

### GUI Database Tools

Compatible tools for remote access:
- **MySQL Workbench** (free)
- **DBeaver** (free)
- **HeidiSQL** (free, Windows)
- **TablePlus** (paid)

### Key Database Tables

| Table | Purpose |
|-------|---------|
| users | System users and authentication |
| modules | RBAC module definitions |
| role_permissions | RBAC permission assignments |
| financial_transactions | Bank statement transactions |
| bank_statements | Uploaded bank statements |
| khairat_ahli | Khairat membership applications |
| khairat_tanggungan | Khairat member dependents |
| schedules | Weekly prayer schedules |
| preachers | Imam/Bilal/Penceramah records |

---

## Deployment History

### Production Server Details
- **URL**: https://isar.myopensoft.net
- **SSH**: `ssh myopensoft-isar@isar.myopensoft.net -p 8288`
- **Password**: R57aVmtLpj6JvFHREbtt
- **App Directory**: ~/isar
- **Process Manager**: PM2

### Deployment Process (2025-11-17)

#### Initial Git Setup on Production
```bash
cd ~/isar
git init
git remote add origin https://github.com/wtt1616/isar.git
git fetch origin
git checkout -b main origin/main
```

#### Standard Deployment Steps
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build production version
npm run build

# Restart PM2 process
pm2 restart isar

# Verify deployment
pm2 logs isar --lines 20
```

### Local Development Workflow

#### Making Changes Locally
1. Make changes on local machine (C:\Users\Lenovo\iSAR)
2. Test changes: `npm run dev` (runs on http://localhost:3000)
3. Commit changes to Git:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

#### Deploying to Production
1. SSH into production server
2. Navigate to app directory: `cd ~/isar`
3. Pull latest changes: `git pull origin main`
4. Install dependencies: `npm install`
5. Build: `npm run build`
6. Restart: `pm2 restart isar`
7. Verify: `pm2 logs isar --lines 20`

### Common Issues & Solutions

#### Port 3000 in Use (Local Development)
**Problem**: Dev server can't start on port 3000
**Solution**:
```bash
# Windows
taskkill /F /IM node.exe

# Then restart dev server
npm run dev
```

#### Git Remote Already Exists
**Problem**: Error when adding remote: "remote origin already exists"
**Solution**: Remote is already configured, skip `git remote add` and proceed with `git pull`

#### Compilation Errors After Changes
**Problem**: Syntax errors or compilation issues after adding features
**Solution**: Restart dev server to clear webpack cache
```bash
# Stop dev server (Ctrl+C)
# Restart
npm run dev
```

---

## Database Changes

No database schema changes were required for these features. All functionality uses existing `users` table with columns:
- `id` (primary key)
- `name`
- `email`
- `password` (bcrypt hashed)
- `role` (head_imam, imam, bilal)
- `phone`
- `is_active`

---

## Testing Checklist

### User Profile Feature
- [ ] Users can access profile from navbar dropdown
- [ ] Profile information displays correctly
- [ ] Users can update name, email, phone
- [ ] Email uniqueness is enforced
- [ ] Password change requires current password
- [ ] Password change requires confirmation
- [ ] Minimum 6 character password enforced
- [ ] Success/error messages display correctly
- [ ] Unauthorized access is blocked

### Color-Coded Schedules
- [ ] Each Imam has unique color
- [ ] Each Bilal has unique color
- [ ] Color legend displays at top of schedules
- [ ] Distribution counts are accurate
- [ ] Colors consistent across dashboard and manage pages
- [ ] Colors preserved when printing
- [ ] Color legend hidden when printing
- [ ] No color duplicates when < 24 users

---

## Future Enhancements

### Potential Improvements
1. **Profile Photos**: Add user avatar upload functionality
2. **Email Notifications**: Notify users of profile changes
3. **Password Reset**: Add "Forgot Password" functionality
4. **Color Customization**: Allow Head Imam to customize user colors
5. **Export Options**: Add CSV/PDF export for schedules with colors
6. **Activity Log**: Track profile changes for audit purposes

### Technical Debt
- Consider adding rate limiting for password change attempts
- Implement more robust password requirements (special chars, numbers)
- Add unit tests for color assignment algorithm
- Consider Redis caching for color assignments in high-traffic scenarios

---

## Dependencies Added

No new dependencies were added for these features. Used existing packages:
- `bcryptjs` - Password hashing
- `next-auth` - Session management
- `mysql2` - Database operations
- `react` - UI components
- `bootstrap` - Styling

---

## Notes

- Color assignments are reset on server restart (in-memory Map/Set)
- For persistent color assignments, consider database storage
- 24 colors supports up to 24 users without duplication
- Profile updates require re-login if email is changed (session email doesn't auto-update)

---

**Last Updated**: 2025-12-21
**Updated By**: Claude Code
**Version**: iSAR v1.5
