# iSAR Database Setup Guide

## 🔍 Current Status

**MySQL is not currently installed on your system.**

You have several options to set up the database:

---

## ✅ Option 1: Install XAMPP (Recommended for Windows)

XAMPP is the easiest way to get MySQL running on Windows.

### Step 1: Download XAMPP

1. Go to: https://www.apachefriends.org/download.html
2. Download XAMPP for Windows (latest version)
3. Run the installer

### Step 2: Install XAMPP

1. Run the downloaded installer
2. Select components:
   - ✅ Apache
   - ✅ MySQL
   - ✅ phpMyAdmin
   - ⬜ Others (optional)
3. Choose installation directory (default: `C:\xampp`)
4. Complete installation

### Step 3: Start MySQL

1. Open **XAMPP Control Panel**
2. Click **Start** next to MySQL
3. MySQL should show as running (green highlight)

### Step 4: Create Database Using phpMyAdmin

1. Open browser: **http://localhost/phpmyadmin**
2. Click **"SQL"** tab at the top
3. Open the file: `C:\Users\Lenovo\iSAR\database\schema.sql`
4. Copy **ALL** content from the file
5. Paste into the SQL window in phpMyAdmin
6. Click **"Go"** button
7. You should see success messages

### Step 5: Verify Database

In phpMyAdmin:
1. Click **"isar_db"** in the left sidebar
2. You should see 4 tables:
   - availability
   - prayer_times
   - schedules
   - users
3. Click on **"users"** table
4. Click **"Browse"** - you should see 6 default users

---

## ✅ Option 2: Install MySQL Server Standalone

### Step 1: Download MySQL

1. Go to: https://dev.mysql.com/downloads/installer/
2. Download **MySQL Installer for Windows**
3. Choose "mysql-installer-community" (larger file)

### Step 2: Install MySQL

1. Run the installer
2. Choose **"Server only"** or **"Developer Default"**
3. Set a root password (remember this!)
4. Complete installation

### Step 3: Add MySQL to PATH

1. Open **System Properties** → **Environment Variables**
2. Edit **Path** variable
3. Add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
4. Click OK and restart Command Prompt

### Step 4: Create Database Using Command Line

Open **Command Prompt** and run:

```cmd
cd C:\Users\Lenovo\iSAR
mysql -u root -p < database\schema.sql
```

Enter your root password when prompted.

### Step 5: Update .env File

Edit `C:\Users\Lenovo\iSAR\.env`:

```env
DB_PASSWORD=your_mysql_root_password_here
```

---

## ✅ Option 3: Use Docker (For Advanced Users)

If you have Docker installed:

### Step 1: Create Docker Compose File

File is already created at: `C:\Users\Lenovo\iSAR\docker-compose.yml`

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: isar_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: isar_db
    ports:
      - "3306:3306"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Step 2: Start MySQL Container

```bash
docker-compose up -d
```

### Step 3: Update .env

```env
DB_PASSWORD=root123
```

---

## 📋 After Database Setup

Once MySQL is installed and database is created:

### 1. Verify Database Connection

Test with this command:

**For XAMPP:**
```cmd
C:\xampp\mysql\bin\mysql -u root -p
```

**For MySQL Server:**
```cmd
mysql -u root -p
```

Then in MySQL prompt:
```sql
USE isar_db;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

You should see:
- 4 tables listed
- 6 users in the users table

### 2. Start iSAR Application

```bash
cd C:\Users\Lenovo\iSAR
npm run dev
```

### 3. Access Application

Open browser: **http://localhost:3000**

### 4. Login

Use these credentials:
- **Email:** admin@isar.com
- **Password:** admin123

---

## 🔧 Quick Installation Scripts

I've created helper scripts for you:

### For XAMPP Users: `setup-xampp.bat`

```batch
@echo off
echo Setting up iSAR database with XAMPP...
C:\xampp\mysql\bin\mysql -u root < C:\Users\Lenovo\iSAR\database\schema.sql
echo Database setup complete!
pause
```

### For MySQL Server Users: `setup-mysql.bat`

```batch
@echo off
echo Setting up iSAR database...
set /p password="Enter MySQL root password: "
mysql -u root -p%password% < C:\Users\Lenovo\iSAR\database\schema.sql
echo Database setup complete!
pause
```

---

## ❓ Troubleshooting

### Issue: "Access denied for user 'root'@'localhost'"

**Solution:**
- Check your MySQL root password
- Update `.env` file with correct password
- For XAMPP, default password is usually empty

### Issue: "Can't connect to MySQL server"

**Solution:**
- Make sure MySQL service is running
- For XAMPP: Check XAMPP Control Panel
- For MySQL Server: Check Services (Win + R → services.msc)

### Issue: "Database 'isar_db' already exists"

**Solution:**
- Drop and recreate database:
  ```sql
  DROP DATABASE IF EXISTS isar_db;
  ```
- Then run schema.sql again

### Issue: phpMyAdmin not loading

**Solution:**
- Make sure Apache is also running in XAMPP
- Check: http://localhost (should show XAMPP welcome page)
- Then go to: http://localhost/phpmyadmin

---

## 📞 Need Help?

### Recommended Approach:
1. Install **XAMPP** (easiest for Windows)
2. Start MySQL from XAMPP Control Panel
3. Use **phpMyAdmin** to run schema.sql
4. Start the iSAR app with `npm run dev`

### Alternative:
If you prefer command line, install **MySQL Server** standalone.

---

## 🎯 Quick Steps Summary

### For XAMPP (Recommended):

1. **Download XAMPP:** https://www.apachefriends.org/download.html
2. **Install XAMPP** → Choose MySQL + phpMyAdmin
3. **Start MySQL** in XAMPP Control Panel
4. **Open phpMyAdmin:** http://localhost/phpmyadmin
5. **Run SQL:** Paste contents of `database/schema.sql`
6. **Start iSAR:** `npm run dev`
7. **Login:** http://localhost:3000

---

## 📁 Database Schema Location

The complete database schema is at:
**C:\Users\Lenovo\iSAR\database\schema.sql**

This file contains:
- Database creation
- 4 table definitions
- 5 prayer times
- 6 default users (with hashed passwords)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] MySQL is running
- [ ] Database `isar_db` exists
- [ ] 4 tables created (users, prayer_times, availability, schedules)
- [ ] 6 users in users table
- [ ] 5 prayer times in prayer_times table
- [ ] `.env` has correct DB_PASSWORD
- [ ] `npm run dev` starts without database errors
- [ ] Can access http://localhost:3000
- [ ] Can login with admin@isar.com / admin123

---

**Installation Date:** 2025-01-14
**Status:** MySQL Installation Required
**Next Step:** Choose and install MySQL using one of the options above
