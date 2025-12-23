# 🚀 START HERE - iSAR System Setup

## ⚠️ IMPORTANT: MySQL Setup Required

The iSAR application is **fully installed** except for the MySQL database.

You need to install MySQL before the application can run.

---

## 🎯 Choose Your Installation Method

### 🟢 Method 1: XAMPP (Easiest - Recommended)

**Best for:** Beginners, Windows users, those who want a simple setup

**Steps:**

1. **Download XAMPP**
   - Go to: https://www.apachefriends.org/download.html
   - Download the Windows version
   - Install it (choose MySQL + phpMyAdmin)

2. **Start MySQL**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Wait until it shows green "Running"

3. **Run Setup Script**
   - Double-click: `setup-xampp.bat`
   - Wait for completion message

4. **Start iSAR**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open: http://localhost:3000
   - Login: admin@isar.com / admin123

---

### 🟡 Method 2: MySQL Server (Standard Installation)

**Best for:** Those familiar with MySQL, production environments

**Steps:**

1. **Download MySQL**
   - Go to: https://dev.mysql.com/downloads/installer/
   - Download MySQL Installer for Windows
   - Install MySQL Server (remember root password!)

2. **Run Setup Script**
   - Double-click: `setup-mysql.bat`
   - Enter your MySQL root password when prompted

3. **Update .env File**
   - Open: `.env`
   - Change: `DB_PASSWORD=your_mysql_password`
   - Save file

4. **Start iSAR**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open: http://localhost:3000
   - Login: admin@isar.com / admin123

---

### 🟣 Method 3: Docker (For Advanced Users)

**Best for:** Developers, those with Docker installed

**Steps:**

1. **Start MySQL Container**
   ```bash
   docker-compose up -d
   ```

2. **Update .env File**
   ```env
   DB_PASSWORD=root123
   ```

3. **Start iSAR**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open: http://localhost:3000
   - Login: admin@isar.com / admin123

---

## 📋 Quick Reference

### After Database Setup

Once MySQL is running and database is created:

```bash
# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@isar.com | admin123 |
| Head Imam | headimam@isar.com | admin123 |
| Imam | imam1@isar.com | admin123 |
| Bilal | bilal1@isar.com | admin123 |

### Important Files

- **Setup Scripts:**
  - `setup-xampp.bat` - For XAMPP users
  - `setup-mysql.bat` - For MySQL Server users
  - `docker-compose.yml` - For Docker users

- **Documentation:**
  - `DATABASE_SETUP_GUIDE.md` - Detailed database setup
  - `INSTALLATION.md` - Complete installation guide
  - `README.md` - User manual
  - `QUICK_START.md` - Quick reference

- **Configuration:**
  - `.env` - Database credentials (edit if needed)
  - `database/schema.sql` - Database schema

---

## ✅ Verification Steps

After setup, verify everything works:

1. **Check MySQL is running**
   - XAMPP: Green status in Control Panel
   - MySQL Server: Check Services (Win+R → services.msc)

2. **Test database connection**
   ```sql
   -- For XAMPP:
   C:\xampp\mysql\bin\mysql -u root

   -- For MySQL Server:
   mysql -u root -p

   -- Then run:
   USE isar_db;
   SHOW TABLES;
   ```

3. **Start application**
   ```bash
   npm run dev
   ```

4. **Check for errors**
   - Should see: "Ready on http://localhost:3000"
   - No database connection errors

5. **Test login**
   - Go to: http://localhost:3000
   - Login with: admin@isar.com / admin123
   - Should see Dashboard

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Solutions:**
- Make sure MySQL is running
- Check `.env` file has correct password
- Verify database `isar_db` exists

### "Port 3000 already in use"

**Solution:**
```bash
npm run dev -- -p 3001
```
Then access: http://localhost:3001

### "Access denied for user 'root'"

**Solutions:**
- Check MySQL password in `.env`
- For XAMPP, try empty password (leave blank)
- For MySQL Server, use the password you set during installation

### Setup script doesn't work

**Solution:**
- Read `DATABASE_SETUP_GUIDE.md` for manual setup
- Use phpMyAdmin (XAMPP) to run `database/schema.sql`
- Or use MySQL command line

---

## 📞 Need More Help?

**Detailed Documentation:**
- [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md) - Step-by-step database setup
- [INSTALLATION.md](INSTALLATION.md) - Complete installation guide
- [README.md](README.md) - Full user documentation

**Quick Help:**
- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [INSTALLATION_STATUS.md](INSTALLATION_STATUS.md) - Current installation status

---

## 🎯 Recommended Path

**For most users, we recommend:**

1. ✅ Install **XAMPP** (https://www.apachefriends.org/)
2. ✅ Start **MySQL** in XAMPP Control Panel
3. ✅ Run **`setup-xampp.bat`**
4. ✅ Run **`npm run dev`**
5. ✅ Open **http://localhost:3000**
6. ✅ Login and use the system!

---

## 🎉 That's It!

Once MySQL is set up, your iSAR system will be fully functional and ready to manage prayer schedules for your mosque or surau!

**Time to complete:** 10-15 minutes (including MySQL installation)

---

**Need immediate help?** Check [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md) for detailed instructions.
