# iSAR - Imam and Bilal Schedule Management System

A comprehensive web-based system for managing prayer schedules for mosques and surau. The system automates the scheduling of Imam and Bilal for the five daily prayers (Fardhu) throughout the week.

## Features

### User Roles

1. **Admin**
   - Full system access
   - User management (create, edit, delete users)
   - Schedule management
   - Generate and modify schedules

2. **Head Imam**
   - Generate weekly prayer schedules automatically
   - Modify auto-generated schedules
   - View all schedules
   - Manage schedule assignments

3. **Imam**
   - View prayer schedules
   - Mark unavailability for specific dates and prayer times
   - View personal schedule

4. **Bilal**
   - View prayer schedules
   - Mark unavailability for specific dates and prayer times
   - View personal schedule

### Core Functionality

- **Automated Schedule Generation**: Automatically creates fair and balanced weekly schedules based on availability
- **Availability Management**: Imam and Bilal can mark when they cannot be on duty
- **Manual Adjustments**: Head Imam can manually modify any generated schedule
- **Weekly View**: Monday to Sunday schedule display
- **Print Support**: Print-friendly weekly schedule format
- **Five Daily Prayers**: Subuh, Zohor, Asar, Maghrib, Isyak

## Technology Stack

- **Frontend**: Next.js 14 (React 18)
- **Styling**: Bootstrap 5
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **Language**: TypeScript

## Prerequisites

Before installation, ensure you have:

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn package manager

## Installation

### 1. Clone or Download the Project

```bash
cd c:\Users\Lenovo\iSAR
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Start your MySQL server

2. Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or manually run the SQL commands in `database/schema.sql` using your MySQL client.

### 4. Environment Configuration

1. Copy the example environment file:

```bash
copy .env.example .env
```

2. Edit `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=isar_db
DB_PORT=3306

# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**Important**: Generate a secure random string for `NEXTAUTH_SECRET`. You can use:

```bash
openssl rand -base64 32
```

### 5. Run the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

The system comes with pre-configured test users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@isar.com | admin123 |
| Head Imam | headimam@isar.com | admin123 |
| Imam | imam1@isar.com | admin123 |
| Imam | imam2@isar.com | admin123 |
| Bilal | bilal1@isar.com | admin123 |
| Bilal | bilal2@isar.com | admin123 |

**Security Note**: Change these passwords immediately in production!

## Usage Guide

### For Admin

1. **User Management**
   - Navigate to "Manage Users"
   - Add new users (Imam, Bilal, Head Imam)
   - Edit or deactivate existing users

2. **Schedule Management**
   - Access "Manage Schedules"
   - Generate weekly schedules
   - Modify assignments as needed

### For Head Imam

1. **Generate Schedule**
   - Go to "Manage Schedules"
   - Select the week start date
   - Click "Generate Schedule"
   - The system will automatically assign Imam and Bilal fairly

2. **Modify Schedule**
   - Click "Edit" on any schedule slot
   - Select different Imam or Bilal from dropdowns
   - Click "Save"

3. **View Schedule**
   - Navigate weeks using Previous/Next buttons
   - Print schedules using the Print button

### For Imam/Bilal

1. **Mark Unavailability**
   - Go to "My Availability"
   - Select date and prayer time you cannot attend
   - Optionally add a reason
   - Submit the form

2. **View Schedule**
   - Dashboard shows your assigned schedules
   - Navigate weeks to view future assignments

## Schedule Generation Algorithm

The system uses a fair distribution algorithm that:

1. Checks each person's availability for the week
2. Distributes assignments evenly across all available personnel
3. Ensures each prayer time has exactly 1 Imam and 1 Bilal
4. Balances workload to prevent overloading any individual

## Database Schema

### Tables

- **users**: Stores user accounts with roles
- **prayer_times**: Reference table for the 5 daily prayers
- **availability**: Tracks when users are unavailable
- **schedules**: Stores weekly prayer assignments

### Relationships

- Schedules link to Users (Imam and Bilal)
- Availability links to Users
- All tables use proper foreign key constraints

## Printing Schedules

The system includes print-optimized CSS:

1. Navigate to any schedule view
2. Click "Print Schedule" button
3. Use browser's print function (Ctrl+P)
4. Navigation and buttons are automatically hidden in print view

## Troubleshooting

### Database Connection Issues

- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Authentication Issues

- Clear browser cookies
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Check user exists and is active in database

### Schedule Generation Fails

- Ensure you have at least 1 Imam and 1 Bilal in the system
- Check that users are marked as active
- Verify there are no conflicting schedules for the week

## Development

### Project Structure

```
iSAR/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard page
│   ├── login/         # Login page
│   ├── schedules/     # Schedule management
│   ├── availability/  # Availability input
│   └── users/         # User management
├── components/        # Reusable components
├── lib/              # Utility functions
├── types/            # TypeScript types
└── database/         # SQL schema
```

### Adding New Features

1. API routes go in `app/api/`
2. Pages go in `app/[page-name]/`
3. Shared components in `components/`
4. Database utilities in `lib/`

## Security Considerations

1. **Change Default Passwords**: Update all default user passwords
2. **Secure NEXTAUTH_SECRET**: Use a strong random value
3. **Database Security**: Use strong MySQL passwords
4. **HTTPS in Production**: Always use HTTPS in production
5. **Environment Variables**: Never commit `.env` to version control

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review database schema and ensure data integrity
3. Check browser console for errors
4. Verify all environment variables are set correctly

## License

This project is for internal use by mosques and surau for managing prayer schedules.

## Version

Version 1.0.0 - Initial Release

---

**Note**: This system is designed specifically for Malaysian mosques and surau, with prayer times labeled in Malay (Subuh, Zohor, Asar, Maghrib, Isyak).
