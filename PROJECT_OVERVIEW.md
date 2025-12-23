# iSAR System - Project Overview

## Executive Summary

The **iSAR (Imam and Bilal Schedule Automation and Rostering)** system is a comprehensive web-based application designed to automate and manage prayer duty schedules for mosques and surau. The system handles scheduling for five daily fardhu prayers across a weekly cycle (Monday to Sunday), ensuring fair distribution of duties while respecting personnel availability.

## System Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Bootstrap 5
- CSS3

**Backend:**
- Next.js API Routes
- NextAuth.js for authentication
- MySQL2 for database connectivity

**Database:**
- MySQL 8.0
- InnoDB storage engine
- UTF8MB4 character set

**Authentication:**
- NextAuth.js with Credentials Provider
- JWT-based sessions
- Role-based access control (RBAC)
- bcryptjs for password hashing

## System Features

### 1. Role-Based Access Control

Four distinct user roles with specific permissions:

#### Admin
- Complete system access
- User management (CRUD operations)
- Schedule generation and modification
- Access to all modules

#### Head Imam
- Generate weekly schedules automatically
- Modify existing schedules
- View all schedules
- Cannot manage users

#### Imam
- View assigned schedules
- Mark personal unavailability
- Read-only access to schedules

#### Bilal
- View assigned schedules
- Mark personal unavailability
- Read-only access to schedules

### 2. Automatic Schedule Generation

**Algorithm Features:**
- Fair distribution using round-robin assignment
- Respects user availability constraints
- Balanced workload across all personnel
- Prevents overassignment
- Handles unavailability gracefully

**Process:**
1. Fetches all active Imams and Bilals
2. Retrieves unavailability data for the week
3. Assigns personnel using least-assigned-first algorithm
4. Ensures each prayer has exactly 1 Imam and 1 Bilal
5. Creates 35 schedule entries (7 days × 5 prayers)

### 3. Availability Management

**Features:**
- Date-specific unavailability marking
- Prayer-time granularity
- Optional reason field
- Historical tracking
- Prevents double-booking

**Use Cases:**
- Out of town
- Medical appointments
- Personal emergencies
- Planned leave

### 4. Schedule Management

**Capabilities:**
- Weekly view (Monday-Sunday)
- Individual slot editing
- Manual override of auto-generated schedules
- Week navigation (previous/next/current)
- Print-friendly format

### 5. User Management (Admin)

**Operations:**
- Create new users
- Edit user details
- Deactivate users (soft delete)
- Password management
- Role assignment

## Database Design

### Schema Overview

**users**
- Primary user information
- Role-based access control
- Soft delete capability
- Active/inactive status

**prayer_times**
- Reference data for 5 daily prayers
- Display ordering
- Standardized naming

**availability**
- User unavailability tracking
- Date and prayer-time specific
- Reason tracking
- Unique constraint prevents duplicates

**schedules**
- Weekly prayer assignments
- Links to Imam and Bilal
- Week number tracking
- Auto-generation flag
- Audit trail (created_by, modified_by)

### Key Relationships

```
users (1) -----> (M) availability
users (1) -----> (M) schedules (as imam)
users (1) -----> (M) schedules (as bilal)
users (1) -----> (M) schedules (as creator)
```

## API Architecture

### Authentication Endpoints

**POST /api/auth/signin**
- Authenticates user credentials
- Returns JWT session

**POST /api/auth/signout**
- Terminates user session

### User Management

**GET /api/users**
- Lists all active users
- Optional role filtering
- Admin only

**POST /api/users**
- Creates new user
- Password hashing
- Admin only

**PUT /api/users/[id]**
- Updates user details
- Optional password change
- Admin only

**DELETE /api/users/[id]**
- Soft deletes user
- Admin only

### Availability Management

**GET /api/availability**
- Fetches availability records
- Filtered by user, date, or range
- Authenticated users

**POST /api/availability**
- Creates/updates unavailability
- Users can only set own availability
- Upsert operation

### Schedule Management

**GET /api/schedules**
- Retrieves schedules
- Filtered by week or date range
- Includes Imam and Bilal names

**POST /api/schedules**
- Manual schedule creation
- Head Imam and Admin only

**PUT /api/schedules/[id]**
- Updates schedule assignment
- Head Imam and Admin only

**DELETE /api/schedules/[id]**
- Removes schedule entry
- Head Imam and Admin only

**POST /api/schedules/generate**
- Generates weekly schedule
- Validates no existing schedules
- Runs scheduling algorithm
- Head Imam and Admin only

## File Structure

```
iSAR/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts          # NextAuth configuration
│   │   ├── users/
│   │   │   ├── route.ts          # User list & create
│   │   │   └── [id]/route.ts     # User update & delete
│   │   ├── availability/
│   │   │   └── route.ts          # Availability management
│   │   └── schedules/
│   │       ├── route.ts          # Schedule list & create
│   │       ├── [id]/route.ts     # Schedule update & delete
│   │       └── generate/route.ts # Auto-generation
│   ├── dashboard/
│   │   └── page.tsx              # Main schedule view
│   ├── login/
│   │   └── page.tsx              # Login form
│   ├── schedules/
│   │   └── manage/
│   │       └── page.tsx          # Schedule management (Head Imam)
│   ├── availability/
│   │   └── page.tsx              # Availability input (Imam/Bilal)
│   ├── users/
│   │   └── page.tsx              # User management (Admin)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Root redirect
├── components/
│   ├── Navbar.tsx                # Navigation component
│   └── SessionProvider.tsx       # Auth session wrapper
├── lib/
│   ├── db.ts                     # Database connection pool
│   └── scheduleGenerator.ts      # Scheduling algorithm
├── types/
│   ├── index.ts                  # Type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
├── database/
│   └── schema.sql                # Database schema & seed data
├── middleware.ts                 # Route protection
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── README.md                     # User documentation
├── INSTALLATION.md               # Setup guide
└── PROJECT_OVERVIEW.md           # This file
```

## Security Features

### Authentication & Authorization
- JWT-based session management
- Password hashing with bcryptjs (10 rounds)
- Role-based access control
- Protected API routes
- Middleware-based route protection

### Data Security
- Prepared statements (SQL injection prevention)
- Input validation
- Foreign key constraints
- Soft deletes (data preservation)
- Unique constraints (data integrity)

### Session Security
- HTTP-only cookies
- Secure session secret
- Configurable session timeout
- CSRF protection (Next.js built-in)

## User Interface Design

### Design Principles
- Clean, professional interface
- Bootstrap-based responsive design
- Intuitive navigation
- Role-appropriate menus
- Print-optimized views

### Key UI Components

**Navigation Bar**
- Role-based menu items
- User identification
- Quick logout
- Active page highlighting

**Dashboard**
- Weekly calendar view
- Prayer time rows
- Day columns (Mon-Sun)
- Personnel assignments
- Week navigation
- Print functionality

**Schedule Management**
- Inline editing
- Dropdown selectors
- Save/Cancel actions
- Real-time updates
- Generate button

**Availability Form**
- Date picker
- Prayer time selector
- Reason textarea
- Submission feedback
- History display

**User Management**
- Data table view
- Modal forms
- Inline actions
- Status badges
- Confirmation dialogs

## Scheduling Algorithm

### Algorithm Steps

1. **Initialization**
   ```
   - Get week start date (Monday)
   - Fetch all active Imams
   - Fetch all active Bilals
   - Initialize assignment counters
   ```

2. **Weekly Iteration**
   ```
   For each day (0 to 6):
     - Calculate current date
     - Fetch unavailability for date
     - For each prayer time:
       - Filter available Imams
       - Filter available Bilals
       - Select least-assigned Imam
       - Select least-assigned Bilal
       - Create schedule entry
       - Increment assignment counters
   ```

3. **Assignment Selection**
   ```
   Function selectLeastAssigned(users, assignmentMap):
     - Find user with minimum assignments
     - Return that user
     - Break ties by user order
   ```

4. **Week Number Calculation**
   ```
   - ISO week number standard
   - Week starts Monday
   - Stored for filtering
   ```

### Algorithm Properties

- **Fairness**: Round-robin ensures equal distribution
- **Constraint Respect**: Honours unavailability
- **Completeness**: Generates all 35 slots
- **Validation**: Checks personnel availability
- **Error Handling**: Reports conflicts

## Printing System

### Print Features
- CSS media queries for print
- Hidden navigation in print view
- Optimized table layout
- Page break control
- Standard paper size (A4/Letter)

### Print CSS
```css
@media print {
  .no-print { display: none; }
  .card { box-shadow: none; }
  @page { margin: 1cm; }
}
```

## Future Enhancements (Potential)

### Version 2.0 Considerations
- SMS/Email notifications
- Mobile app (React Native)
- Multi-mosque support
- Advanced analytics
- Absence tracking
- Swap requests
- Calendar export (iCal)
- API for third-party integration

### Technical Improvements
- Redis caching
- Real-time updates (WebSocket)
- Advanced reporting
- Data export (Excel/PDF)
- Audit logging
- Backup automation

## Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Functional components
- React Hooks
- Async/await pattern
- Error boundaries

### Best Practices
- Component reusability
- API route organization
- Type safety
- Error handling
- Loading states
- User feedback
- Responsive design

### Testing Recommendations
- Unit tests for utilities
- Integration tests for API
- E2E tests for workflows
- Database seeding for tests
- Mock authentication

## Deployment Considerations

### Production Checklist
- [ ] Environment variables configured
- [ ] Database optimized and indexed
- [ ] SSL/TLS enabled
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error logging enabled
- [ ] Performance optimization
- [ ] Security audit completed

### Server Requirements
- Node.js 18+ runtime
- MySQL 8.0+ server
- 2GB+ RAM
- 10GB+ storage
- HTTPS capability
- Domain name

### Scaling Options
- Database read replicas
- CDN for static assets
- Load balancing
- Connection pooling
- Caching layer

## Maintenance

### Regular Tasks
- Database backups (daily)
- Log rotation
- Security updates
- Dependency updates
- Performance monitoring
- User feedback review

### Monitoring Metrics
- User login activity
- Schedule generation success rate
- API response times
- Database query performance
- Error rates
- Storage usage

## Support & Documentation

### User Documentation
- [README.md](README.md) - User guide
- [INSTALLATION.md](INSTALLATION.md) - Setup instructions
- This file - Technical overview

### Technical Resources
- Next.js documentation
- NextAuth.js docs
- MySQL reference
- Bootstrap documentation
- TypeScript handbook

## Conclusion

The iSAR system provides a complete solution for prayer schedule management, combining automated scheduling with manual flexibility. Built on modern web technologies, it offers a scalable, secure, and user-friendly platform for mosques and surau to efficiently manage their prayer duty roster.

---

**Project Version**: 1.0.0
**Last Updated**: 2025
**Maintained By**: Development Team
