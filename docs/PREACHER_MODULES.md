# Preacher Management Modules

This document describes the two new modules added to the iSAR system for managing preachers and their schedules.

## Overview

Two new modules have been implemented:

1. **Preacher Management** (Admin only) - Add, edit, and delete preacher information
2. **Preacher Schedules** (Head Imam creates, all can view) - Monthly scheduling for Subuh and Maghrib preaching with calendar and list views

---

## Module 1: Preacher Management (Admin Only)

### Purpose
Allows administrators to manage the list of preachers who can be scheduled for Subuh and Maghrib preaching sessions.

### Access
- **Role Required**: Admin
- **URL**: `/preachers/manage`
- **Navbar**: "Manage Preachers" (visible only to admin)

### Features
- **Add Preacher**: Create new preacher with name, phone, email
- **Edit Preacher**: Update preacher information and active status
- **Delete Preacher**: Remove preacher (sets to NULL in schedules)
- **Active/Inactive Status**: Control which preachers appear in scheduling dropdowns
- **Email Validation**: Ensures unique email addresses

### Files Created
- `app/preachers/manage/page.tsx` - Admin UI for preacher CRUD operations
- `app/api/preachers/route.ts` - API endpoints (GET, POST, PUT, DELETE)

### API Endpoints

#### GET `/api/preachers`
Fetches all preachers
- **Query Parameters**:
  - `active=true` - Returns only active preachers
- **Authentication**: Required (any logged-in user)
- **Response**: Array of preacher objects

#### POST `/api/preachers`
Creates a new preacher
- **Role**: Admin only
- **Body**: `{ name, phone, email }`
- **Validation**: Name required, email must be unique
- **Response**: Success message and preacher ID

#### PUT `/api/preachers`
Updates an existing preacher
- **Role**: Admin only
- **Body**: `{ id, name, phone, email, is_active }`
- **Validation**: Name required, email uniqueness check
- **Response**: Success message

#### DELETE `/api/preachers?id={id}`
Deletes a preacher
- **Role**: Admin only
- **Effect**: Sets preacher to NULL in existing schedules
- **Response**: Success message

---

## Module 2: Preacher Schedules

### Purpose
Allows Head Imam to create monthly preacher schedules assigning preachers to Subuh and Maghrib time slots for each day. All users can view the schedules.

### Access
- **Create/Edit**: Head Imam only
- **View**: All roles
- **URL**: `/preacher-schedules`
- **Navbar**: "Preacher Schedules" (visible to all)

### Features

#### Calendar View
- Full month calendar with 7-day week layout
- Each day shows two time slots: Subuh and Maghrib
- Dropdown selectors for Head Imam to assign preachers
- Read-only view for non-Head Imam users
- Navigate between months with Previous/Next buttons

#### List View
- Tabular format showing all days in the month
- Date, Day of Week, Subuh Preacher, Maghrib Preacher columns
- Easier for quick edits and data entry
- Same edit permissions as calendar view

#### Save & Print
- **Save Button**: Saves all schedule changes for the month
- **Print Button**: Opens browser print dialog with optimized layout
- **Print Optimization**:
  - Landscape orientation recommended
  - Hides navigation and action buttons
  - Compact font sizes for better page fit

### Files Created
- `app/preacher-schedules/page.tsx` - Schedule UI with calendar and list views
- `app/api/preacher-schedules/route.ts` - API endpoints for schedule management

### API Endpoints

#### GET `/api/preacher-schedules`
Fetches schedules for a month or date range
- **Query Parameters**:
  - `year={year}&month={month}` - Get schedules for specific month
  - `startDate={date}&endDate={date}` - Get schedules for date range
- **Authentication**: Required (any logged-in user)
- **Response**: Array of schedule objects with preacher details

#### POST `/api/preacher-schedules`
Creates or updates multiple schedules
- **Role**: Head Imam only
- **Body**: `{ schedules: [{ schedule_date, subuh_preacher_id, maghrib_preacher_id, notes }] }`
- **Behavior**: Updates existing schedules or inserts new ones
- **Transaction**: Uses database transaction for data consistency
- **Response**: Success message

#### DELETE `/api/preacher-schedules?id={id}` or `?date={date}`
Deletes a schedule
- **Role**: Head Imam only
- **Parameters**: Either schedule ID or date
- **Response**: Success message

---

## Database Schema

### Table: `preachers`
Stores preacher information

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AI) | Unique preacher ID |
| name | VARCHAR(255) | Preacher name (required) |
| phone | VARCHAR(20) | Phone number (optional) |
| email | VARCHAR(255) | Email address (unique, optional) |
| is_active | TINYINT(1) | Active status (1 = active, 0 = inactive) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**:
- Primary key on `id`
- Unique key on `email`

### Table: `preacher_schedules`
Stores daily preacher assignments

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AI) | Unique schedule ID |
| schedule_date | DATE | Date of the schedule (unique) |
| subuh_preacher_id | INT (FK) | Reference to preachers.id for Subuh |
| maghrib_preacher_id | INT (FK) | Reference to preachers.id for Maghrib |
| notes | TEXT | Optional notes |
| created_by | INT (FK) | Reference to users.id (Head Imam who created) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Foreign Keys**:
- `subuh_preacher_id` → `preachers.id` (ON DELETE SET NULL)
- `maghrib_preacher_id` → `preachers.id` (ON DELETE SET NULL)
- `created_by` → `users.id`

**Indexes**:
- Primary key on `id`
- Unique key on `schedule_date`
- Index on `schedule_date`
- Index on `subuh_preacher_id`
- Index on `maghrib_preacher_id`

---

## Installation & Deployment

### 1. Run Database Migration
```bash
# Connect to your MySQL database
mysql -u your_user -p your_database

# Run the schema file
source database/schema/preachers.sql
```

Or manually execute the SQL in `database/schema/preachers.sql`

### 2. Local Testing
```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### 3. Test the Features
1. **As Admin**:
   - Click "Manage Preachers" in navbar
   - Add several preachers with names, phone, email
   - Edit a preacher to test updates
   - Try deleting a preacher

2. **As Head Imam**:
   - Click "Preacher Schedules" in navbar
   - Assign preachers to Subuh and Maghrib slots for the current month
   - Switch between Calendar and List views
   - Save the schedules
   - Test print functionality

3. **As Imam/Bilal**:
   - Click "Preacher Schedules" to view (read-only)
   - Verify you cannot edit schedules

### 4. Deploy to Production
```bash
# On your local machine
git add .
git commit -m "Add preacher management and scheduling modules"
git push origin main

# SSH into production server
ssh myopensoft-isar@isar.myopensoft.net -p 8288

# Navigate to app directory
cd ~/isar

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build production version
npm run build

# Restart PM2
pm2 restart isar

# Verify deployment
pm2 logs isar --lines 20
```

---

## User Workflow

### Admin Workflow: Managing Preachers
1. Admin logs in
2. Clicks "Manage Preachers" in navbar
3. Clicks "Add Preacher" button
4. Fills in preacher information (name required)
5. Clicks "Add Preacher" to save
6. Preacher appears in the table
7. Can edit or delete preachers as needed

### Head Imam Workflow: Creating Schedules
1. Head Imam logs in
2. Clicks "Preacher Schedules" in navbar
3. Sees current month calendar
4. Selects preachers from dropdowns for each day
   - Subuh slot
   - Maghrib slot
5. Can switch to List View for easier data entry
6. Clicks "Save Schedules" when done
7. Clicks "Print" to generate PDF (using browser print to PDF)

### All Users Workflow: Viewing Schedules
1. Any user logs in
2. Clicks "Preacher Schedules" in navbar
3. Views monthly schedule (read-only if not Head Imam)
4. Can navigate between months
5. Can switch between Calendar and List views
6. Can print the schedule

---

## Navigation Updates

The navbar has been updated with new links:

**For All Users**:
- "Preacher Schedules" - View preacher schedules

**For Admin Only**:
- "Manage Preachers" - CRUD operations for preachers

---

## Print Functionality

The print feature is optimized for both calendar and list views:

### Print Optimization
- Landscape page orientation recommended
- Hides navigation buttons, save button, and alerts
- Compact font sizes for better page fitting
- Preserves preacher names and schedule information
- Works with browser's native "Print to PDF" feature

### How to Print/Export to PDF
1. Click "Print" button in the schedule page
2. In print dialog, select:
   - **Destination**: "Save as PDF" or a physical printer
   - **Layout**: Landscape (recommended)
   - **Margins**: Default or Minimum
3. Click "Save" or "Print"

---

## Security & Permissions

### Role-Based Access Control

| Feature | Admin | Head Imam | Imam | Bilal |
|---------|-------|-----------|------|-------|
| View Preachers List | ✓ | ✓ | ✓ | ✓ |
| Add/Edit/Delete Preachers | ✓ | ✗ | ✗ | ✗ |
| View Preacher Schedules | ✓ | ✓ | ✓ | ✓ |
| Create/Edit Schedules | ✗ | ✓ | ✗ | ✗ |
| Delete Schedules | ✗ | ✓ | ✗ | ✗ |

### API Security
- All endpoints require authentication
- Role-based authorization checks
- Session validation using NextAuth
- SQL injection prevention with parameterized queries
- Transaction support for data consistency

---

## Technical Details

### Frontend Technologies
- **Framework**: Next.js 14 (App Router)
- **UI**: Bootstrap 5
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: next-auth/react

### Backend Technologies
- **API Routes**: Next.js API Routes
- **Database**: MySQL with mysql2
- **Session Management**: NextAuth getServerSession
- **ORM**: Raw SQL queries with connection pooling

### Key Features
- **Calendar Generation**: Pure JavaScript date manipulation
- **Responsive Design**: Bootstrap grid system
- **Print Styles**: CSS @media print rules
- **Transaction Support**: MySQL transactions for bulk operations
- **Foreign Key Constraints**: Cascading deletes with SET NULL

---

## Future Enhancements

### Potential Improvements
1. **Bulk Import**: CSV upload for preacher list
2. **Auto-Schedule**: Algorithm to auto-assign preachers evenly
3. **Conflict Detection**: Warn if same preacher assigned to both slots
4. **Preacher Statistics**: Track preaching frequency and history
5. **Notifications**: Email/SMS reminders to preachers
6. **Notes Field**: Add notes for each day's schedule
7. **Export Options**: Export to Excel, Google Calendar, iCal
8. **Mobile App**: Dedicated mobile interface
9. **Availability Integration**: Check preacher availability before assigning

### Technical Debt
- Consider adding TypeScript interfaces for better type safety
- Add unit tests for API endpoints
- Implement loading states for better UX
- Add optimistic updates for faster perceived performance
- Consider caching frequently accessed data

---

## Troubleshooting

### Common Issues

**Issue**: Preachers not appearing in dropdown
- **Solution**: Check if preacher is marked as "Active" in Manage Preachers

**Issue**: Cannot save schedules
- **Solution**: Verify you are logged in as Head Imam role

**Issue**: Print layout is broken
- **Solution**: Use landscape orientation and ensure browser is updated

**Issue**: Database errors on schedule save
- **Solution**: Verify database tables exist and foreign keys are properly set up

**Issue**: Navbar links not showing
- **Solution**: Clear browser cache and verify user role is correct

---

## Database Migration Script

File: `database/schema/preachers.sql`

See the SQL file for complete table creation and index setup.

---

**Last Updated**: 2025-11-19
**Created By**: Claude Code
**Version**: iSAR v1.3
