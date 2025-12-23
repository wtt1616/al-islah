# iSAR System - Complete File Structure

## Project Files Overview

Total files created: 32 files

### Configuration Files (5 files)

1. **package.json** - Project dependencies and scripts
2. **tsconfig.json** - TypeScript compiler configuration
3. **next.config.js** - Next.js framework configuration
4. **next-env.d.ts** - Next.js TypeScript definitions
5. **.env.example** - Environment variables template

### Database Files (1 file)

6. **database/schema.sql** - MySQL database schema and seed data

### Library/Utilities (2 files)

7. **lib/db.ts** - MySQL connection pool configuration
8. **lib/scheduleGenerator.ts** - Automatic schedule generation algorithm

### Type Definitions (2 files)

9. **types/index.ts** - Core TypeScript type definitions
10. **types/next-auth.d.ts** - NextAuth session type extensions

### Components (2 files)

11. **components/Navbar.tsx** - Navigation bar component
12. **components/SessionProvider.tsx** - Authentication session wrapper

### API Routes (8 files)

13. **app/api/auth/[...nextauth]/route.ts** - NextAuth authentication
14. **app/api/users/route.ts** - User list and create
15. **app/api/users/[id]/route.ts** - User update and delete
16. **app/api/availability/route.ts** - Availability management
17. **app/api/schedules/route.ts** - Schedule list and create
18. **app/api/schedules/[id]/route.ts** - Schedule update and delete
19. **app/api/schedules/generate/route.ts** - Auto schedule generation
20. **middleware.ts** - Route protection middleware

### Pages/Routes (7 files)

21. **app/page.tsx** - Root page (redirects to login)
22. **app/layout.tsx** - Root layout with Bootstrap
23. **app/globals.css** - Global CSS styles
24. **app/login/page.tsx** - Login page
25. **app/dashboard/page.tsx** - Main dashboard with schedule view
26. **app/schedules/manage/page.tsx** - Schedule management (Head Imam)
27. **app/availability/page.tsx** - Availability input (Imam/Bilal)
28. **app/users/page.tsx** - User management (Admin)

### Documentation Files (5 files)

29. **README.md** - Main user documentation
30. **INSTALLATION.md** - Detailed installation guide
31. **QUICK_START.md** - Quick start guide
32. **PROJECT_OVERVIEW.md** - Technical overview
33. **FILE_STRUCTURE.md** - This file

---

## Detailed File Descriptions

### Core Application Files

#### package.json
- **Purpose**: NPM package configuration
- **Contains**: Dependencies, scripts, metadata
- **Key Dependencies**: Next.js, React, Bootstrap, MySQL2, NextAuth

#### tsconfig.json
- **Purpose**: TypeScript compilation settings
- **Features**: Strict mode, path aliases, ESNext modules

#### next.config.js
- **Purpose**: Next.js framework configuration
- **Settings**: Basic configuration (can be extended)

#### .env.example
- **Purpose**: Template for environment variables
- **Variables**: Database credentials, NextAuth secrets

---

### Database Layer

#### database/schema.sql
- **Purpose**: Database initialization
- **Creates**: 4 tables (users, prayer_times, availability, schedules)
- **Seeds**: 6 default users, 5 prayer times
- **Size**: ~90 lines

---

### Business Logic Layer

#### lib/db.ts
- **Purpose**: Database connection management
- **Exports**: MySQL connection pool
- **Configuration**: From environment variables
- **Features**: Connection pooling, auto-reconnect

#### lib/scheduleGenerator.ts
- **Purpose**: Automatic schedule generation
- **Key Functions**:
  - `generateWeeklySchedule()` - Main algorithm
  - `selectLeastAssigned()` - Fair distribution
  - `getWeekNumber()` - ISO week calculation
  - `getMonday()` - Week start date helper
- **Algorithm**: Round-robin with availability constraints
- **Size**: ~130 lines

---

### Type System

#### types/index.ts
- **Purpose**: Core type definitions
- **Exports**:
  - `UserRole` type
  - `PrayerTime` type
  - `User` interface
  - `Availability` interface
  - `Schedule` interface
  - `WeekSchedule` interface
- **Size**: ~50 lines

#### types/next-auth.d.ts
- **Purpose**: Extend NextAuth types
- **Adds**: Role field to Session and User
- **Required**: For TypeScript compilation

---

### React Components

#### components/Navbar.tsx
- **Purpose**: Site navigation
- **Features**:
  - Role-based menu items
  - User info display
  - Logout button
  - Active page highlighting
- **Responsive**: Bootstrap navbar
- **Size**: ~90 lines

#### components/SessionProvider.tsx
- **Purpose**: Client-side session wrapper
- **Uses**: NextAuth SessionProvider
- **Required**: For client components
- **Size**: ~10 lines

---

### API Layer

#### app/api/auth/[...nextauth]/route.ts
- **Purpose**: Authentication handler
- **Provider**: Credentials (email/password)
- **Features**:
  - Password verification (bcrypt)
  - JWT session management
  - Role injection
  - Custom sign-in page
- **Size**: ~80 lines

#### app/api/users/route.ts
- **Endpoints**:
  - GET - List users (filterable by role)
  - POST - Create user
- **Security**: Admin only
- **Features**: Password hashing, duplicate prevention
- **Size**: ~65 lines

#### app/api/users/[id]/route.ts
- **Endpoints**:
  - PUT - Update user
  - DELETE - Soft delete user
- **Security**: Admin only
- **Features**: Optional password change
- **Size**: ~65 lines

#### app/api/availability/route.ts
- **Endpoints**:
  - GET - List availability (filterable)
  - POST - Create/update availability
- **Security**: Users can only set own availability
- **Features**: Upsert operation, date range filtering
- **Size**: ~85 lines

#### app/api/schedules/route.ts
- **Endpoints**:
  - GET - List schedules (filterable by week/date)
  - POST - Create schedule
- **Security**: Head Imam and Admin only (POST)
- **Features**: Joins with user names
- **Size**: ~70 lines

#### app/api/schedules/[id]/route.ts
- **Endpoints**:
  - PUT - Update schedule
  - DELETE - Delete schedule
- **Security**: Head Imam and Admin only
- **Features**: Tracks modification
- **Size**: ~60 lines

#### app/api/schedules/generate/route.ts
- **Endpoint**: POST - Generate weekly schedule
- **Security**: Head Imam and Admin only
- **Features**:
  - Week validation
  - Conflict detection
  - Batch insert
- **Uses**: scheduleGenerator library
- **Size**: ~70 lines

#### middleware.ts
- **Purpose**: Protect routes
- **Protects**: All /dashboard, /schedules, /availability, /users, /api routes
- **Method**: NextAuth middleware
- **Size**: ~10 lines

---

### User Interface Pages

#### app/page.tsx
- **Purpose**: Root route
- **Action**: Redirects to /login
- **Size**: ~5 lines

#### app/layout.tsx
- **Purpose**: Root layout
- **Includes**:
  - Bootstrap CSS
  - Google Fonts (Inter)
  - SessionProvider wrapper
- **Metadata**: Title, description
- **Size**: ~25 lines

#### app/globals.css
- **Purpose**: Global styles
- **Features**:
  - Print styles
  - Custom utility classes
  - Table styling
  - Alert positioning
- **Size**: ~60 lines

#### app/login/page.tsx
- **Purpose**: Login form
- **Features**:
  - Email/password fields
  - Error messages
  - Loading state
  - Default credentials display
- **Type**: Client component
- **Size**: ~110 lines

#### app/dashboard/page.tsx
- **Purpose**: Main schedule view
- **Features**:
  - Weekly calendar table
  - Week navigation
  - Print button
  - Loading states
- **Data**: Fetches schedules from API
- **Type**: Client component
- **Size**: ~190 lines

#### app/schedules/manage/page.tsx
- **Purpose**: Schedule management (Head Imam)
- **Features**:
  - Generate schedule button
  - Inline editing
  - Dropdown selectors
  - Week navigation
  - Alert notifications
- **Security**: Head Imam and Admin only
- **Type**: Client component
- **Size**: ~300 lines

#### app/availability/page.tsx
- **Purpose**: Availability input (Imam/Bilal)
- **Features**:
  - Date picker
  - Prayer time selector
  - Reason textarea
  - Unavailability list
- **Security**: Imam and Bilal only
- **Type**: Client component
- **Size**: ~200 lines

#### app/users/page.tsx
- **Purpose**: User management (Admin)
- **Features**:
  - User table
  - Add/Edit modal
  - Delete confirmation
  - Status badges
  - Alert notifications
- **Security**: Admin only
- **Type**: Client component
- **Size**: ~330 lines

---

### Documentation

#### README.md
- **Purpose**: Main user documentation
- **Sections**:
  - Features overview
  - Technology stack
  - Installation guide
  - Usage instructions
  - Default credentials
  - Troubleshooting
- **Audience**: End users, administrators
- **Size**: ~400 lines

#### INSTALLATION.md
- **Purpose**: Detailed setup guide
- **Sections**:
  - Step-by-step installation
  - Database setup
  - Environment configuration
  - Verification checklist
  - Common issues
  - Post-installation steps
- **Audience**: IT administrators
- **Size**: ~350 lines

#### QUICK_START.md
- **Purpose**: Quick reference guide
- **Sections**:
  - 5-minute setup
  - Quick walkthrough
  - Common tasks
  - Tips and workflow
- **Audience**: First-time users
- **Size**: ~150 lines

#### PROJECT_OVERVIEW.md
- **Purpose**: Technical documentation
- **Sections**:
  - Architecture overview
  - Feature descriptions
  - Database design
  - API documentation
  - Security features
  - Algorithm details
- **Audience**: Developers, technical staff
- **Size**: ~600 lines

#### FILE_STRUCTURE.md
- **Purpose**: File organization reference
- **Sections**:
  - File listing
  - Detailed descriptions
  - Size information
- **Audience**: Developers
- **Size**: This file

---

## Project Statistics

### Line Count Summary

| Category | Files | Approx. Lines |
|----------|-------|---------------|
| TypeScript/TSX | 20 | ~2,500 |
| SQL | 1 | ~90 |
| CSS | 1 | ~60 |
| JSON | 1 | ~25 |
| JavaScript | 1 | ~5 |
| Markdown | 5 | ~1,500 |
| Config | 3 | ~50 |
| **Total** | **32** | **~4,230** |

### File Size Distribution

- **Small** (< 50 lines): 7 files
- **Medium** (50-150 lines): 13 files
- **Large** (150-350 lines): 8 files
- **Extra Large** (> 350 lines): 4 files

### Technology Breakdown

- **React Components**: 11 files
- **API Routes**: 8 files
- **Type Definitions**: 2 files
- **Utilities**: 2 files
- **Configuration**: 5 files
- **Documentation**: 5 files
- **Database**: 1 file

---

## File Dependencies

### Critical Path

```
Entry Point: app/page.tsx
    ↓
app/login/page.tsx
    ↓
app/api/auth/[...nextauth]/route.ts
    ↓
lib/db.ts → MySQL Database
    ↓
app/dashboard/page.tsx
    ↓
app/api/schedules/route.ts
```

### Import Graph

**Pages depend on:**
- components/Navbar.tsx
- types/index.ts
- next-auth (session)

**API routes depend on:**
- lib/db.ts
- types/index.ts
- next-auth (authentication)

**Schedule generation depends on:**
- lib/db.ts
- lib/scheduleGenerator.ts

---

## Files Not to Modify

These files are auto-generated or should not be edited:

- `next-env.d.ts` - Auto-generated by Next.js
- `node_modules/` - Managed by npm

## Optional Files to Create

For production deployment, consider adding:

- `.env` - Actual environment variables (don't commit!)
- `.gitignore` - Git ignore rules
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-container setup
- `.github/workflows/` - CI/CD pipelines

---

## Maintenance Notes

### When Adding Features

**New Page:**
1. Create in `app/[name]/page.tsx`
2. Update Navbar links if needed
3. Add to middleware if protected

**New API Endpoint:**
1. Create in `app/api/[name]/route.ts`
2. Add to middleware
3. Update types if needed

**New Database Table:**
1. Update `database/schema.sql`
2. Add types to `types/index.ts`
3. Create API routes

### Code Organization Rules

- **Client Components**: Use `'use client'` directive
- **Server Components**: Default in App Router
- **API Routes**: Export named GET, POST, PUT, DELETE
- **Types**: Define in `types/` directory
- **Utilities**: Place in `lib/` directory

---

## Conclusion

This file structure represents a complete, production-ready Next.js application with:
- ✅ Full-stack TypeScript
- ✅ Database integration
- ✅ Authentication & authorization
- ✅ Role-based access control
- ✅ Responsive UI
- ✅ Comprehensive documentation

All files follow Next.js 14 App Router conventions and React 18 best practices.
