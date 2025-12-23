# Stories & Epic Breakdown
## Sistem iSAR - Islamic Surau Administration & Roster

**Version:** 1.0
**Last Updated:** December 2025
**Document Type:** Agile Stories & Epics

---

## Table of Contents
1. [Epic Overview](#1-epic-overview)
2. [Epic 1: User Authentication & Profile](#2-epic-1-user-authentication--profile)
3. [Epic 2: Schedule Management](#3-epic-2-schedule-management)
4. [Epic 3: Financial Management](#4-epic-3-financial-management)
5. [Epic 4: Khairat Kematian](#5-epic-4-khairat-kematian)
6. [Epic 5: Asset Management](#6-epic-5-asset-management)
7. [Epic 6: Community Services](#7-epic-6-community-services)
8. [Epic 7: Notifications](#8-epic-7-notifications)
9. [Epic 8: Reporting](#9-epic-8-reporting)
10. [Epic 9: Help & Documentation](#10-epic-9-help--documentation)
11. [Story Status Summary](#11-story-status-summary)

---

## 1. Epic Overview

| Epic ID | Epic Name | Stories | Completed | Status |
|---------|-----------|---------|-----------|--------|
| EP-001 | User Authentication & Profile | 10 | 10 | Done |
| EP-002 | Schedule Management | 12 | 12 | Done |
| EP-003 | Financial Management | 18 | 18 | Done |
| EP-004 | Khairat Kematian | 10 | 10 | Done |
| EP-005 | Asset Management | 14 | 14 | Done |
| EP-006 | Community Services | 10 | 10 | Done |
| EP-007 | Notifications | 6 | 6 | Done |
| EP-008 | Reporting | 12 | 12 | Done |
| EP-009 | Help & Documentation | 6 | 6 | Done |
| **Total** | | **98** | **98** | **100%** |

---

## 2. Epic 1: User Authentication & Profile

**Epic ID:** EP-001
**Epic Name:** User Authentication & Profile
**Description:** Sistem pengesahan pengguna dan pengurusan profil untuk semua peranan dalam sistem iSAR.

### Stories

#### US-001: User Login
**As a** user
**I want to** log in with email and password
**So that** I can access the system based on my role

**Acceptance Criteria:**
- [x] User can enter email and password
- [x] Invalid credentials show error message
- [x] Successful login redirects to dashboard
- [x] Session persists across browser refresh
- [x] Inactive users cannot log in

**Status:** Done
**Points:** 5

---

#### US-002: User Logout
**As a** logged-in user
**I want to** log out of the system
**So that** my session is terminated securely

**Acceptance Criteria:**
- [x] Logout button in navbar dropdown
- [x] Session is cleared on logout
- [x] User is redirected to login page
- [x] Protected routes inaccessible after logout

**Status:** Done
**Points:** 2

---

#### US-003: View Profile
**As a** logged-in user
**I want to** view my profile information
**So that** I can see my account details

**Acceptance Criteria:**
- [x] Profile accessible from navbar dropdown
- [x] Display name, email, phone, role
- [x] Show account status (active/inactive)

**Status:** Done
**Points:** 3

---

#### US-004: Update Profile
**As a** logged-in user
**I want to** update my profile information
**So that** my details stay current

**Acceptance Criteria:**
- [x] Can edit name, email, phone
- [x] Email uniqueness validation
- [x] Success message on update
- [x] Changes reflect immediately

**Status:** Done
**Points:** 3

---

#### US-005: Change Password
**As a** logged-in user
**I want to** change my password
**So that** I can maintain account security

**Acceptance Criteria:**
- [x] Requires current password verification
- [x] New password minimum 6 characters
- [x] Confirmation must match new password
- [x] Success message after change
- [x] Can log in with new password

**Status:** Done
**Points:** 5

---

#### US-006: User Management List
**As an** admin
**I want to** view list of all users
**So that** I can manage system users

**Acceptance Criteria:**
- [x] Display all users in table
- [x] Show name, email, role, status
- [x] Filter by role
- [x] Only admin can access

**Status:** Done
**Points:** 3

---

#### US-007: Create User
**As an** admin
**I want to** create new users
**So that** I can add staff to the system

**Acceptance Criteria:**
- [x] Form with name, email, password, role, phone
- [x] Email uniqueness validation
- [x] Password hashed before storage
- [x] Success message on creation

**Status:** Done
**Points:** 5

---

#### US-008: Edit User
**As an** admin
**I want to** edit user information
**So that** I can update user details

**Acceptance Criteria:**
- [x] Edit name, email, role, phone
- [x] Email uniqueness validation
- [x] Cannot change own role (prevent self-demotion)
- [x] Changes reflect immediately

**Status:** Done
**Points:** 3

---

#### US-009: Activate/Deactivate User
**As an** admin
**I want to** activate or deactivate users
**So that** I can control system access

**Acceptance Criteria:**
- [x] Toggle active status
- [x] Deactivated users cannot log in
- [x] Cannot deactivate self
- [x] Confirmation before deactivation

**Status:** Done
**Points:** 3

---

#### US-010: Reset User Password
**As an** admin
**I want to** reset a user's password
**So that** I can help users who forgot their password

**Acceptance Criteria:**
- [x] Set new password for user
- [x] Password hashed before storage
- [x] User notified of reset (optional)
- [x] User can log in with new password

**Status:** Done
**Points:** 3

---

## 3. Epic 2: Schedule Management

**Epic ID:** EP-002
**Epic Name:** Schedule Management
**Description:** Pengurusan jadual Imam, Bilal, dan Penceramah untuk aktiviti solat dan kuliah.

### Stories

#### US-011: View Weekly Schedule
**As a** user (Imam/Bilal/Head Imam)
**I want to** view the weekly prayer schedule
**So that** I know my duty assignments

**Acceptance Criteria:**
- [x] Display schedule from Wednesday to Tuesday
- [x] Show all 5 prayer times per day
- [x] Display Imam and Bilal for each slot
- [x] Color-coded by person
- [x] Show current week by default

**Status:** Done
**Points:** 5

---

#### US-012: Generate Weekly Schedule
**As a** Head Imam
**I want to** automatically generate weekly schedule
**So that** duties are fairly distributed

**Acceptance Criteria:**
- [x] Select week to generate
- [x] Fair distribution algorithm
- [x] Exclude unavailable users
- [x] No duplicate assignments per slot
- [x] Confirmation before generation

**Status:** Done
**Points:** 8

---

#### US-013: Edit Schedule Slot
**As a** Head Imam
**I want to** manually edit schedule slots
**So that** I can make adjustments

**Acceptance Criteria:**
- [x] Click slot to edit
- [x] Select from available Imams/Bilals
- [x] Changes save immediately
- [x] Show who modified and when

**Status:** Done
**Points:** 5

---

#### US-014: Copy Schedule to Another Week
**As a** Head Imam
**I want to** copy schedule to another week
**So that** I don't have to recreate similar patterns

**Acceptance Criteria:**
- [x] Select source and target week
- [x] Preview before copying
- [x] Target week must be empty
- [x] Success message after copy

**Status:** Done
**Points:** 3

---

#### US-015: Print Schedule
**As a** Head Imam
**I want to** print the weekly schedule
**So that** I can post it at the surau

**Acceptance Criteria:**
- [x] A4 landscape format
- [x] Include all prayer times
- [x] Color-coded (print-friendly)
- [x] Show week dates

**Status:** Done
**Points:** 3

---

#### US-016: Color Legend for Schedule
**As a** user
**I want to** see a color legend
**So that** I can identify who is assigned

**Acceptance Criteria:**
- [x] Unique color per Imam/Bilal
- [x] Legend shows name and color
- [x] Show assignment count per person
- [x] Colors consistent across views

**Status:** Done
**Points:** 3

---

#### US-017: Request Unavailability
**As an** Imam or Bilal
**I want to** request unavailability
**So that** I'm not scheduled when unavailable

**Acceptance Criteria:**
- [x] Select date(s) and prayer time(s)
- [x] Provide reason (optional)
- [x] Submit request
- [x] View my submitted requests

**Status:** Done
**Points:** 5

---

#### US-018: View Unavailability List
**As a** Head Imam
**I want to** view all unavailability requests
**So that** I can plan schedules accordingly

**Acceptance Criteria:**
- [x] List all requests by date
- [x] Filter by person or date range
- [x] Show reason if provided
- [x] Delete/cancel requests

**Status:** Done
**Points:** 3

---

#### US-019: Manage Preachers
**As a** Head Imam
**I want to** manage preacher list
**So that** I can assign ceramah schedules

**Acceptance Criteria:**
- [x] Add/edit/delete preachers
- [x] Name, phone, photo fields
- [x] Active/inactive status
- [x] List all preachers

**Status:** Done
**Points:** 5

---

#### US-020: Assign Preacher Schedule
**As a** Head Imam
**I want to** assign preachers to kuliah slots
**So that** ceramah schedule is organized

**Acceptance Criteria:**
- [x] Slots: Subuh, Dhuha (Weekend), Dhuha Jumaat, Tazkirah Jumaat, Maghrib
- [x] Select preacher per slot
- [x] Weekly scheduling
- [x] View preacher schedule

**Status:** Done
**Points:** 5

---

#### US-021: Upload Preacher Photo
**As a** Head Imam
**I want to** upload preacher photos
**So that** jemaah can recognize them

**Acceptance Criteria:**
- [x] Upload image file (JPG/PNG)
- [x] Max file size limit
- [x] Display in preacher list
- [x] Optional field

**Status:** Done
**Points:** 3

---

#### US-022: Batch Schedule Operations
**As a** Head Imam
**I want to** perform batch operations on schedules
**So that** I can make multiple changes efficiently

**Acceptance Criteria:**
- [x] Select multiple slots
- [x] Assign same person to selected
- [x] Clear selected slots
- [x] Confirmation before action

**Status:** Done
**Points:** 5

---

## 4. Epic 3: Financial Management

**Epic ID:** EP-003
**Epic Name:** Financial Management
**Description:** Pengurusan kewangan termasuk muat naik penyata bank, pengkategorian transaksi, dan laporan kewangan.

### Stories

#### US-023: Upload Bank Statement
**As a** Bendahari
**I want to** upload bank statement CSV
**So that** transactions are imported into the system

**Acceptance Criteria:**
- [x] Select CSV file
- [x] Specify month and year
- [x] Set opening balance
- [x] Auto-parse transactions
- [x] Show import summary

**Status:** Done
**Points:** 8

---

#### US-024: Suggest Opening Balance
**As a** Bendahari
**I want to** see suggested opening balance
**So that** I can ensure continuity from previous month

**Acceptance Criteria:**
- [x] Calculate from previous month's Buku Tunai
- [x] Handle bulan_perkiraan adjustments
- [x] Display as default value
- [x] Allow manual override

**Status:** Done
**Points:** 5

---

#### US-025: View Transactions List
**As a** Bendahari
**I want to** view imported transactions
**So that** I can review and categorize them

**Acceptance Criteria:**
- [x] Filter by statement
- [x] Filter by type (penerimaan/pembayaran/uncategorized)
- [x] Show transaction details
- [x] Show categorization status

**Status:** Done
**Points:** 5

---

#### US-026: Categorize Transaction
**As a** Bendahari
**I want to** categorize a transaction
**So that** it appears correctly in reports

**Acceptance Criteria:**
- [x] Select main category
- [x] Select sub-category (if applicable)
- [x] Add notes (optional)
- [x] Set bulan_perkiraan (current/next/previous)
- [x] Track who categorized

**Status:** Done
**Points:** 5

---

#### US-027: Sub-category for Penerimaan
**As a** Bendahari
**I want to** select sub-categories for penerimaan
**So that** income is properly classified

**Acceptance Criteria:**
- [x] Sub-categories per main category
- [x] Investment details for Hibah Pelaburan
- [x] Dynamic field visibility
- [x] Save with transaction

**Status:** Done
**Points:** 5

---

#### US-028: Sub-category for Pembayaran
**As a** Bendahari
**I want to** select sub-categories for pembayaran
**So that** expenses are properly classified

**Acceptance Criteria:**
- [x] Two-level sub-categories
- [x] Dynamic based on main category
- [x] Save with transaction
- [x] Display in reports

**Status:** Done
**Points:** 5

---

#### US-029: Auto-Categorization Keywords
**As a** Bendahari
**I want to** manage auto-categorization keywords
**So that** common transactions are categorized automatically

**Acceptance Criteria:**
- [x] Add keywords per category
- [x] Separate penerimaan and pembayaran keywords
- [x] Enable/disable keywords
- [x] Edit existing keywords
- [x] Delete keywords

**Status:** Done
**Points:** 5

---

#### US-030: Auto-Categorize Transactions
**As a** Bendahari
**I want to** auto-categorize transactions using keywords
**So that** I save time on repetitive categorization

**Acceptance Criteria:**
- [x] Preview mode shows matches
- [x] Apply to uncategorized only
- [x] Longest keyword match first
- [x] Track auto-categorized count
- [x] Business rules for edge cases

**Status:** Done
**Points:** 8

---

#### US-031: Bulan Perkiraan Setting
**As a** Bendahari
**I want to** set bulan perkiraan for transactions
**So that** they appear in the correct month's report

**Acceptance Criteria:**
- [x] Options: Bulan Semasa, Bulan Depan, Bulan Sebelum
- [x] Default to Bulan Semasa
- [x] Apply during categorization
- [x] Reflect in Buku Tunai

**Status:** Done
**Points:** 3

---

#### US-032: Delete Bank Statement
**As a** Bendahari
**I want to** delete a bank statement
**So that** I can remove incorrect imports

**Acceptance Criteria:**
- [x] Confirmation dialog
- [x] Cascades to all transactions
- [x] Cannot delete if reports generated
- [x] Success message

**Status:** Done
**Points:** 3

---

#### US-033: View Categorization Progress
**As a** Bendahari
**I want to** see categorization progress
**So that** I know how many transactions need attention

**Acceptance Criteria:**
- [x] Show total vs categorized count
- [x] Progress bar or percentage
- [x] Filter to uncategorized
- [x] Update in real-time

**Status:** Done
**Points:** 3

---

#### US-034: Investment Details for Hibah
**As a** Bendahari
**I want to** record investment details
**So that** Hibah Pelaburan is properly documented

**Acceptance Criteria:**
- [x] Investment type field
- [x] Institution name field
- [x] Only shown for Hibah Pelaburan category
- [x] Display in nota report

**Status:** Done
**Points:** 3

---

#### US-035: Bank Reconciliation
**As a** Bendahari
**I want to** perform bank reconciliation
**So that** book balance matches bank balance

**Acceptance Criteria:**
- [x] Select month and year
- [x] Auto-calculate terimaan/cek amounts
- [x] Enter manual adjustments
- [x] Generate BR-KMS 020 report
- [x] Show reconciliation summary

**Status:** Done
**Points:** 8

---

#### US-036: Transaction Notes
**As a** Bendahari
**I want to** add notes to transactions
**So that** I can record additional information

**Acceptance Criteria:**
- [x] Free text notes field
- [x] Save with categorization
- [x] Display in transaction list
- [x] Optional field

**Status:** Done
**Points:** 2

---

#### US-037: Filter Transactions by Type
**As a** Bendahari
**I want to** filter transactions by type
**So that** I can focus on specific categories

**Acceptance Criteria:**
- [x] Filter tabs: All, Penerimaan, Pembayaran, Uncategorized
- [x] Count per filter
- [x] Maintain filter on refresh
- [x] Clear filter option

**Status:** Done
**Points:** 3

---

#### US-038: Categorization Audit Trail
**As a** Bendahari
**I want to** see who categorized transactions
**So that** there's accountability

**Acceptance Criteria:**
- [x] Store categorized_by user ID
- [x] Store categorized_at timestamp
- [x] Display in transaction detail
- [x] Auto-set on categorization

**Status:** Done
**Points:** 3

---

#### US-039: Bulk Transaction Operations
**As a** Bendahari
**I want to** perform bulk operations on transactions
**So that** I can categorize multiple items at once

**Acceptance Criteria:**
- [x] Select multiple transactions
- [x] Apply same category to all
- [x] Preview before applying
- [x] Success count message

**Status:** Done
**Points:** 5

---

#### US-040: Transaction Search
**As a** Bendahari
**I want to** search transactions
**So that** I can find specific entries

**Acceptance Criteria:**
- [x] Search by description
- [x] Search by amount
- [x] Search by date range
- [x] Clear search option

**Status:** Done
**Points:** 3

---

## 5. Epic 4: Khairat Kematian

**Epic ID:** EP-004
**Epic Name:** Khairat Kematian
**Description:** Pengurusan keahlian khairat kematian termasuk pendaftaran awam dan pengurusan admin.

### Stories

#### US-041: Public Registration Form
**As a** public user
**I want to** register for khairat membership
**So that** my family is covered

**Acceptance Criteria:**
- [x] No login required
- [x] Personal details form
- [x] Add dependents
- [x] Upload payment receipt
- [x] Submit application
- [x] Receive confirmation

**Status:** Done
**Points:** 8

---

#### US-042: Add Dependents
**As a** public user
**I want to** add dependents to my application
**So that** they're covered under my membership

**Acceptance Criteria:**
- [x] Add multiple dependents
- [x] Name, IC, relationship fields
- [x] Relationships: Isteri, Anak, Anak OKU
- [x] Remove dependent option
- [x] Save with application

**Status:** Done
**Points:** 5

---

#### US-043: Upload Payment Receipt
**As a** public user
**I want to** upload payment receipt
**So that** my payment is verified

**Acceptance Criteria:**
- [x] Accept image and PDF
- [x] Max file size 5MB
- [x] Preview before submit
- [x] Store securely
- [x] Optional but encouraged

**Status:** Done
**Points:** 5

---

#### US-044: Check Membership Status
**As a** public user
**I want to** check my membership status
**So that** I know if I'm covered

**Acceptance Criteria:**
- [x] Search by IC number
- [x] Display membership details
- [x] Show payment history
- [x] Show dependents
- [x] Show status badge

**Status:** Done
**Points:** 5

---

#### US-045: View Khairat Applications
**As an** admin
**I want to** view all khairat applications
**So that** I can process them

**Acceptance Criteria:**
- [x] List all applications
- [x] Filter by status (pending/approved/rejected)
- [x] Show applicant details
- [x] Show submission date
- [x] Sort by date

**Status:** Done
**Points:** 3

---

#### US-046: Approve Khairat Application
**As an** admin
**I want to** approve applications
**So that** members are officially registered

**Acceptance Criteria:**
- [x] Review application details
- [x] View uploaded receipt
- [x] Approve button
- [x] Set approval date
- [x] Send approval notification

**Status:** Done
**Points:** 5

---

#### US-047: Reject Khairat Application
**As an** admin
**I want to** reject applications
**So that** incomplete applications are returned

**Acceptance Criteria:**
- [x] Provide rejection reason
- [x] Reject button
- [x] Send rejection notification
- [x] Applicant can resubmit

**Status:** Done
**Points:** 3

---

#### US-048: Import Members from Excel
**As an** admin
**I want to** bulk import members
**So that** existing records are migrated

**Acceptance Criteria:**
- [x] Upload Excel file
- [x] Map columns to fields
- [x] Preview before import
- [x] Skip duplicates
- [x] Import summary

**Status:** Done
**Points:** 5

---

#### US-049: Edit Member Details
**As an** admin
**I want to** edit member details
**So that** information stays current

**Acceptance Criteria:**
- [x] Edit all fields
- [x] Edit dependents
- [x] Change status
- [x] Save changes
- [x] Audit trail

**Status:** Done
**Points:** 3

---

#### US-050: Delete Member
**As an** admin
**I want to** delete members
**So that** records can be cleaned up

**Acceptance Criteria:**
- [x] Confirmation dialog
- [x] Cascades to dependents
- [x] Cannot undo
- [x] Admin only

**Status:** Done
**Points:** 2

---

## 6. Epic 5: Asset Management

**Epic ID:** EP-005
**Epic Name:** Asset Management
**Description:** Pengurusan aset surau mengikut piawaian JAIS BR-AMS.

### Stories

#### US-051: Register Inventory Item
**As an** inventory staff
**I want to** register inventory items
**So that** all items are tracked

**Acceptance Criteria:**
- [x] Name, category, quantity
- [x] Brand, model, serial number
- [x] Receipt date, price
- [x] Location assignment
- [x] Photo upload

**Status:** Done
**Points:** 5

---

#### US-052: Register Capital Asset (Harta Modal)
**As an** inventory staff
**I want to** register capital assets
**So that** high-value assets are tracked

**Acceptance Criteria:**
- [x] All inventory fields
- [x] Expected lifespan
- [x] Current value
- [x] Depreciation tracking
- [x] BR-AMS 001 compliance

**Status:** Done
**Points:** 5

---

#### US-053: Manage Asset Categories
**As an** inventory staff
**I want to** manage asset categories
**So that** assets are organized

**Acceptance Criteria:**
- [x] Add/edit/delete categories
- [x] Separate for inventory and harta modal
- [x] Sub-categories support
- [x] Active/inactive status

**Status:** Done
**Points:** 3

---

#### US-054: Manage Asset Locations
**As an** inventory staff
**I want to** manage asset locations
**So that** assets can be tracked by location

**Acceptance Criteria:**
- [x] Location code and name
- [x] Responsible person
- [x] Contact number
- [x] Active/inactive status
- [x] BR-AMS compliance

**Status:** Done
**Points:** 3

---

#### US-055: Record Asset Movement
**As an** inventory staff
**I want to** record asset movements
**So that** loans and transfers are tracked

**Acceptance Criteria:**
- [x] Movement type (loan/transfer/return)
- [x] From and to location
- [x] Borrower details
- [x] Expected return date
- [x] BR-AMS 004 compliance

**Status:** Done
**Points:** 5

---

#### US-056: Record Asset Inspection
**As an** inventory staff
**I want to** record asset inspections
**So that** condition is documented

**Acceptance Criteria:**
- [x] Inspection date
- [x] Inspector name
- [x] Condition assessment
- [x] Findings/remarks
- [x] BR-AMS 003 compliance

**Status:** Done
**Points:** 5

---

#### US-057: Record Asset Maintenance
**As an** inventory staff
**I want to** record maintenance activities
**So that** repairs are documented

**Acceptance Criteria:**
- [x] Maintenance date
- [x] Type (repair/service/upgrade)
- [x] Cost
- [x] Vendor/contractor
- [x] BR-AMS 006 compliance

**Status:** Done
**Points:** 5

---

#### US-058: Record Asset Disposal
**As an** inventory staff
**I want to** record asset disposal
**So that** write-offs are documented

**Acceptance Criteria:**
- [x] Disposal date
- [x] Method (sale/donation/scrap)
- [x] Approval reference
- [x] Proceeds amount
- [x] BR-AMS 008 compliance

**Status:** Done
**Points:** 5

---

#### US-059: Record Asset Loss
**As an** inventory staff
**I want to** record lost/stolen assets
**So that** losses are documented

**Acceptance Criteria:**
- [x] Loss date
- [x] Circumstances
- [x] Police report reference
- [x] Write-off approval
- [x] BR-AMS 009 compliance

**Status:** Done
**Points:** 5

---

#### US-060: View Asset List
**As an** inventory staff
**I want to** view all assets
**So that** I can manage inventory

**Acceptance Criteria:**
- [x] Combined inventory and harta modal view
- [x] Filter by type, category, location, status
- [x] Search by name
- [x] Export to Excel

**Status:** Done
**Points:** 3

---

#### US-061: Asset Status Update
**As an** inventory staff
**I want to** update asset status
**So that** current state is reflected

**Acceptance Criteria:**
- [x] Status options: Active, Inactive, Under Repair, Disposed
- [x] Quick status change
- [x] Status history
- [x] Auto-update on disposal

**Status:** Done
**Points:** 3

---

#### US-062: Upload Asset Photo
**As an** inventory staff
**I want to** upload asset photos
**So that** visual records exist

**Acceptance Criteria:**
- [x] Image upload
- [x] Max file size
- [x] Display in asset detail
- [x] Optional field

**Status:** Done
**Points:** 3

---

#### US-063: Asset Reports
**As an** inventory staff
**I want to** generate asset reports
**So that** inventory is documented

**Acceptance Criteria:**
- [x] BR-AMS 001 (Inventory Register)
- [x] BR-AMS 002 (Capital Asset Register)
- [x] Filter by date range
- [x] Print-friendly format

**Status:** Done
**Points:** 5

---

#### US-064: Asset Value Summary
**As an** inventory staff
**I want to** see asset value summary
**So that** total worth is known

**Acceptance Criteria:**
- [x] Total purchase value
- [x] Total current value (harta modal)
- [x] By category breakdown
- [x] By location breakdown

**Status:** Done
**Points:** 3

---

## 7. Epic 6: Community Services

**Epic ID:** EP-006
**Epic Name:** Community Services
**Description:** Perkhidmatan komuniti termasuk permohonan majlis, aktiviti, dan maklum balas.

### Stories

#### US-065: Facility Booking Request
**As a** public user
**I want to** request facility booking
**So that** I can use the surau for events

**Acceptance Criteria:**
- [x] Event details form
- [x] Date and time selection
- [x] Equipment checklist
- [x] Contact information
- [x] Submit request
- [x] Confirmation message

**Status:** Done
**Points:** 5

---

#### US-066: Check Booking Status
**As a** public user
**I want to** check my booking status
**So that** I know if it's approved

**Acceptance Criteria:**
- [x] Search by phone/reference
- [x] Show booking details
- [x] Show status (pending/approved/rejected)
- [x] Show admin response

**Status:** Done
**Points:** 3

---

#### US-067: View Booked Dates
**As a** public user
**I want to** see booked dates
**So that** I can choose available dates

**Acceptance Criteria:**
- [x] Calendar view
- [x] Show booked dates
- [x] Prevent double-booking selection
- [x] Available dates highlighted

**Status:** Done
**Points:** 3

---

#### US-068: Manage Booking Requests
**As an** admin or Head Imam
**I want to** manage booking requests
**So that** I can approve/reject them

**Acceptance Criteria:**
- [x] List all requests
- [x] Filter by status
- [x] View request details
- [x] Approve with notes
- [x] Reject with reason
- [x] Send notification

**Status:** Done
**Points:** 5

---

#### US-069: Public Feedback Form
**As a** public user
**I want to** submit feedback
**So that** I can share suggestions/complaints

**Acceptance Criteria:**
- [x] Name, phone, email fields
- [x] Address field
- [x] Message textarea
- [x] Submit feedback
- [x] Confirmation message

**Status:** Done
**Points:** 3

---

#### US-070: Manage Feedback
**As an** admin
**I want to** manage feedback submissions
**So that** I can respond to community

**Acceptance Criteria:**
- [x] List all feedback
- [x] View feedback details
- [x] Reply to feedback
- [x] Send reply notification
- [x] Mark as addressed

**Status:** Done
**Points:** 5

---

#### US-071: Create Activity
**As an** admin
**I want to** create surau activities
**So that** events are publicized

**Acceptance Criteria:**
- [x] Title, description
- [x] Date, time, location
- [x] Category selection
- [x] Organizer info
- [x] Status (active/cancelled)

**Status:** Done
**Points:** 3

---

#### US-072: Edit/Delete Activity
**As an** admin
**I want to** edit or delete activities
**So that** information stays current

**Acceptance Criteria:**
- [x] Edit all fields
- [x] Cancel activity
- [x] Delete activity
- [x] Confirmation dialogs

**Status:** Done
**Points:** 3

---

#### US-073: Public Activity Calendar
**As a** public user
**I want to** view activity calendar
**So that** I know upcoming events

**Acceptance Criteria:**
- [x] Monthly calendar view
- [x] List upcoming activities
- [x] Click date for details
- [x] Activity categories
- [x] Navigate months

**Status:** Done
**Points:** 5

---

#### US-074: Activity Details View
**As a** public user
**I want to** view activity details
**So that** I have complete information

**Acceptance Criteria:**
- [x] Full description
- [x] Date and time
- [x] Location
- [x] Organizer contact
- [x] Multi-day events support

**Status:** Done
**Points:** 3

---

## 8. Epic 7: Notifications

**Epic ID:** EP-007
**Epic Name:** Notifications
**Description:** Sistem notifikasi WhatsApp dan e-mel untuk peringatan dan status.

### Stories

#### US-075: Daily Duty Reminder (Imam/Bilal)
**As an** Imam or Bilal
**I want to** receive duty reminders
**So that** I don't miss my assignments

**Acceptance Criteria:**
- [x] WhatsApp message at 10pm
- [x] Lists tomorrow's duties
- [x] Prayer times and roles
- [x] Template message format
- [x] Batch sending with delays

**Status:** Done
**Points:** 5

---

#### US-076: Preacher Duty Reminder
**As a** preacher
**I want to** receive ceramah reminders
**So that** I don't miss my slots

**Acceptance Criteria:**
- [x] WhatsApp message
- [x] Upcoming ceramah details
- [x] Date, time, topic
- [x] Template message format

**Status:** Done
**Points:** 5

---

#### US-077: Khairat Status Notification
**As a** khairat applicant
**I want to** receive status notifications
**So that** I know if approved/rejected

**Acceptance Criteria:**
- [x] WhatsApp and email
- [x] Approval notification with details
- [x] Rejection with reason
- [x] Immediate send on status change

**Status:** Done
**Points:** 5

---

#### US-078: Booking Status Notification
**As a** facility requester
**I want to** receive booking notifications
**So that** I know if approved/rejected

**Acceptance Criteria:**
- [x] WhatsApp notification
- [x] Approval with event details
- [x] Rejection with reason
- [x] Send on status change

**Status:** Done
**Points:** 5

---

#### US-079: Feedback Reply Notification
**As a** feedback submitter
**I want to** receive reply notifications
**So that** I know my feedback was addressed

**Acceptance Criteria:**
- [x] WhatsApp and email
- [x] Include admin's response
- [x] Thank you message
- [x] Send on reply

**Status:** Done
**Points:** 3

---

#### US-080: Test Notification
**As an** admin
**I want to** send test notifications
**So that** I can verify system works

**Acceptance Criteria:**
- [x] Test WhatsApp send
- [x] Test email send
- [x] Recipient input
- [x] Success/failure feedback

**Status:** Done
**Points:** 3

---

## 9. Epic 8: Reporting

**Epic ID:** EP-008
**Epic Name:** Reporting
**Description:** Laporan kewangan mengikut format JAIS BR-KMS.

### Stories

#### US-081: Buku Tunai Report
**As a** Bendahari
**I want to** generate Buku Tunai
**So that** I have monthly cash book

**Acceptance Criteria:**
- [x] BR-KMS 002 format
- [x] Select month and year
- [x] Opening and closing balance
- [x] All transactions listed
- [x] Bulan perkiraan respected
- [x] Print-friendly

**Status:** Done
**Points:** 8

---

#### US-082: Monthly Report
**As a** Bendahari
**I want to** generate monthly report
**So that** I have income/expense summary

**Acceptance Criteria:**
- [x] BR-KMS 018 format
- [x] Income by category
- [x] Expenses by category
- [x] Month comparison
- [x] Print-friendly

**Status:** Done
**Points:** 5

---

#### US-083: Annual Financial Statement
**As a** Bendahari
**I want to** generate annual statement
**So that** I have yearly summary

**Acceptance Criteria:**
- [x] BR-KMS 019 format
- [x] Full year data
- [x] 1 Jan and 31 Dec balances
- [x] Category summaries
- [x] Print-friendly

**Status:** Done
**Points:** 8

---

#### US-084: Bank Reconciliation Report
**As a** Bendahari
**I want to** generate reconciliation report
**So that** books match bank

**Acceptance Criteria:**
- [x] BR-KMS 020 format
- [x] Auto-calculate terimaan/cek
- [x] Outstanding items
- [x] Reconciled balance
- [x] Print-friendly

**Status:** Done
**Points:** 8

---

#### US-085: Budget Report
**As a** Bendahari
**I want to** generate budget report
**So that** I can plan finances

**Acceptance Criteria:**
- [x] BR-KMS 001 format
- [x] Budget vs actual
- [x] Variance analysis
- [x] By category
- [x] Print-friendly

**Status:** Done
**Points:** 5

---

#### US-086: Nota Butiran Baki
**As a** Bendahari
**I want to** generate balance notes
**So that** balances are documented

**Acceptance Criteria:**
- [x] 1 Jan balance breakdown
- [x] 31 Dec balance breakdown
- [x] Supporting details
- [x] Print-friendly

**Status:** Done
**Points:** 3

---

#### US-087-093: Nota Penerimaan (7 categories)
**As a** Bendahari
**I want to** generate income category notes
**So that** income is detailed

**Acceptance Criteria:**
- [x] Sumbangan Am
- [x] Sumbangan Khas
- [x] Hasil Sewaan
- [x] Deposit
- [x] Elaun/Bantuan
- [x] Hibah Pelaburan (with investment details)
- [x] Lain-lain Penerimaan
- [x] Print-friendly for each

**Status:** Done
**Points:** 5

---

#### US-094-099: Nota Pembayaran (6 categories)
**As a** Bendahari
**I want to** generate expense category notes
**So that** expenses are detailed

**Acceptance Criteria:**
- [x] Pentadbiran
- [x] Sumber Manusia
- [x] Pembangunan
- [x] Dakwah
- [x] Khidmat Sosial
- [x] Aset
- [x] Print-friendly for each

**Status:** Done
**Points:** 5

---

## 10. Epic 9: Help & Documentation

**Epic ID:** EP-009
**Epic Name:** Help & Documentation
**Description:** Sistem bantuan dan dokumentasi untuk pengguna.

### Stories

#### US-100: Help Page for Users
**As a** logged-in user
**I want to** access help documentation
**So that** I can learn how to use the system

**Acceptance Criteria:**
- [x] Accessible from navbar
- [x] Module-by-module guide
- [x] FAQ section
- [x] Search functionality
- [x] Quick links sidebar

**Status:** Done
**Points:** 5

---

#### US-101: Help Page for Public
**As a** public user
**I want to** access public help
**So that** I can use public features

**Acceptance Criteria:**
- [x] Accessible from login page
- [x] Public features guide
- [x] FAQ for public services
- [x] Contact information
- [x] No login required

**Status:** Done
**Points:** 5

---

#### US-102: FAQ System
**As a** user
**I want to** browse FAQ
**So that** I can find quick answers

**Acceptance Criteria:**
- [x] Accordion format
- [x] Categorized questions
- [x] Expandable answers
- [x] Separate FAQ for users and public

**Status:** Done
**Points:** 3

---

#### US-103: Public Footer Component
**As a** public user
**I want to** see consistent footer
**So that** I can navigate public pages

**Acceptance Criteria:**
- [x] System name
- [x] Help link
- [x] Login link
- [x] Consistent across public pages

**Status:** Done
**Points:** 2

---

#### US-104: User Manual Document
**As an** admin
**I want to** access user manual
**So that** I can train new users

**Acceptance Criteria:**
- [x] Comprehensive guide
- [x] All modules covered
- [x] Screenshot placeholders
- [x] Bahasa Melayu
- [x] Markdown format

**Status:** Done
**Points:** 5

---

#### US-105: BMAD Documentation
**As a** developer
**I want to** access BMAD documents
**So that** I understand system architecture

**Acceptance Criteria:**
- [x] PRD document
- [x] Technical Spec
- [x] Architecture Doc
- [x] Stories/Epics breakdown

**Status:** Done
**Points:** 5

---

## 11. Story Status Summary

### By Epic

| Epic | Total Stories | Done | In Progress | To Do |
|------|---------------|------|-------------|-------|
| EP-001: Authentication | 10 | 10 | 0 | 0 |
| EP-002: Schedule | 12 | 12 | 0 | 0 |
| EP-003: Financial | 18 | 18 | 0 | 0 |
| EP-004: Khairat | 10 | 10 | 0 | 0 |
| EP-005: Asset | 14 | 14 | 0 | 0 |
| EP-006: Community | 10 | 10 | 0 | 0 |
| EP-007: Notifications | 6 | 6 | 0 | 0 |
| EP-008: Reporting | 12 | 12 | 0 | 0 |
| EP-009: Help | 6 | 6 | 0 | 0 |
| **Total** | **98** | **98** | **0** | **0** |

### By Story Points

| Category | Points |
|----------|--------|
| Total Estimated | ~400 |
| Completed | ~400 |
| Remaining | 0 |

### Completion Rate

```
Progress: [====================] 100%

All 98 stories completed!
```

---

## Appendix: Story Point Reference

| Points | Complexity | Example |
|--------|------------|---------|
| 1 | Trivial | Text change, simple styling |
| 2 | Simple | Add a field, minor feature |
| 3 | Medium | Standard CRUD operation |
| 5 | Complex | Feature with multiple components |
| 8 | Very Complex | Algorithm, integration, report |
| 13 | Epic-level | Major feature requiring breakdown |

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Claude Code | Initial Stories Document |
