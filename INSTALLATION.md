# iSAR System - Quick Installation Guide

## Step-by-Step Installation

### Step 1: Verify Prerequisites

Check that you have the required software installed:

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
mysql --version   # Should be 8.0 or higher
```

### Step 2: Install Node.js Dependencies

Open Command Prompt or PowerShell in the iSAR directory:

```bash
cd c:\Users\Lenovo\iSAR
npm install
```

This will install all required packages including:
- Next.js
- React
- Bootstrap
- MySQL2
- NextAuth
- TypeScript

### Step 3: Setup MySQL Database

1. **Start MySQL Server**
   - If using XAMPP: Start the MySQL service
   - If using standalone MySQL: Ensure the service is running

2. **Create Database**

Open MySQL command line or phpMyAdmin and run:

```sql
CREATE DATABASE isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Import Schema**

**Option A - Using MySQL Command Line:**
```bash
mysql -u root -p isar_db < database/schema.sql
```

**Option B - Using phpMyAdmin:**
- Open phpMyAdmin
- Select `isar_db` database
- Click "Import" tab
- Choose `database/schema.sql`
- Click "Go"

**Option C - Manual SQL Execution:**
- Open `database/schema.sql` in a text editor
- Copy all content
- Paste and execute in your MySQL client

### Step 4: Configure Environment Variables

1. **Copy the example environment file:**

```bash
copy .env.example .env
```

2. **Edit the `.env` file** with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=isar_db
DB_PORT=3306

# NextAuth Configuration
NEXTAUTH_SECRET=GenerateARandomSecretKey
NEXTAUTH_URL=http://localhost:3000
```

3. **Generate a secure NEXTAUTH_SECRET:**

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use any random 32+ character string:**
```
NEXTAUTH_SECRET=your-very-long-random-secret-key-here-make-it-secure
```

### Step 5: Verify Database Setup

Check that all tables were created:

```sql
USE isar_db;
SHOW TABLES;
```

You should see:
- availability
- prayer_times
- schedules
- users

Check default users:

```sql
SELECT id, name, email, role FROM users;
```

You should see 6 default users (Admin, Head Imam, 2 Imams, 2 Bilals).

### Step 6: Start the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

The application will start at: [http://localhost:3000](http://localhost:3000)

### Step 7: First Login

1. Open browser and go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Use default credentials:
   - **Admin**: admin@isar.com / admin123
   - **Head Imam**: headimam@isar.com / admin123

## Verification Checklist

After installation, verify:

- [ ] Database `isar_db` exists and has 4 tables
- [ ] 6 default users are in the database
- [ ] `.env` file is configured with correct database credentials
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Dashboard loads successfully

## Common Installation Issues

### Issue: "Cannot connect to database"

**Solution:**
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Test MySQL connection:
   ```bash
   mysql -u root -p
   ```

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Issue: "NEXTAUTH_SECRET not set"

**Solution:**
- Ensure `.env` file exists in root directory
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Restart the development server

### Issue: Database tables not created

**Solution:**
1. Drop and recreate database:
   ```sql
   DROP DATABASE IF EXISTS isar_db;
   CREATE DATABASE isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Re-run the schema.sql file

### Issue: Port 3000 already in use

**Solution:**
- Stop other applications using port 3000
- Or use a different port:
  ```bash
  npm run dev -- -p 3001
  ```

## Post-Installation Steps

### 1. Change Default Passwords

**Important**: Change all default user passwords for security!

Login as admin and go to "Manage Users" to update passwords.

### 2. Add Your Personnel

1. Login as Admin
2. Go to "Manage Users"
3. Add your actual Imam and Bilal users
4. Delete or deactivate test users

### 3. Generate First Schedule

1. Login as Head Imam
2. Go to "Manage Schedules"
3. Click "Generate Schedule"
4. Review and adjust as needed

### 4. Configure Prayer Times (Optional)

The system uses these prayer times by default:
- Subuh
- Zohor
- Asr
- Maghrib
- Isyak

These are stored in the `prayer_times` table and can be modified if needed.

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, Linux
- **RAM**: 4GB
- **Storage**: 500MB free space
- **Node.js**: v18.0.0+
- **MySQL**: 8.0+

### Recommended
- **RAM**: 8GB+
- **Storage**: 1GB free space
- **SSD**: For better performance

## Getting Help

If you encounter issues:

1. Check this installation guide
2. Review the main README.md
3. Check the troubleshooting section
4. Verify all environment variables
5. Check browser console for errors (F12)

## Production Deployment

For production deployment:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Use environment-specific configurations:**
   - Update `NEXTAUTH_URL` to your domain
   - Use strong passwords for database
   - Enable HTTPS
   - Set strong `NEXTAUTH_SECRET`

3. **Security Checklist:**
   - [ ] Changed all default passwords
   - [ ] Using HTTPS
   - [ ] Database has strong password
   - [ ] NEXTAUTH_SECRET is random and secure
   - [ ] Firewall configured
   - [ ] Regular backups enabled

## Next Steps

After successful installation:

1. Read the main [README.md](README.md) for usage guide
2. Explore the features as different user roles
3. Generate your first weekly schedule
4. Train your team on how to use the system

---

**Congratulations!** Your iSAR system is now installed and ready to use.
