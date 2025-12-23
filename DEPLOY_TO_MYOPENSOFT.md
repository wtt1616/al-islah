# Deploy iSAR to isar.myopensoft.net

## Server Information
- **URL:** https://isar.myopensoft.net
- **SSH Host:** isar.myopensoft.net
- **SSH Port:** 8288
- **SSH User:** myopensoft-isar
- **Node.js:** 22 LTS ✅
- **MySQL:** 8.0.43 ✅
- **NPM:** 10.8.2 ✅

---

## Step 1: Export Your Local Database

Open **Command Prompt** on Windows and run:

```cmd
cd C:\Users\Lenovo\iSAR
mysqldump -u root isar_db > isar_db_production.sql
```

**Alternative (if using XAMPP):**
1. Open http://localhost/phpmyadmin
2. Select `isar_db`
3. Click "Export" → "Go"
4. Save as `isar_db_production.sql` in `C:\Users\Lenovo\iSAR`

---

## Step 2: Connect to Your Server

Open **PowerShell** or **Command Prompt** and connect:

```cmd
ssh -p 8288 myopensoft-isar@isar.myopensoft.net
```

Password: `R57aVmtLpj6JvFHREbtt`

Once connected, verify the environment:

```bash
# Check Node.js version
node --version
# Should show: v22.x.x

# Check npm version
npm --version
# Should show: 10.8.2

# Check current directory
pwd
# Note this path - this is your home directory
```

---

## Step 3: Create Application Directory

On the server, run:

```bash
# Create directory for the application
mkdir -p ~/isar
cd ~/isar

# Verify you're in the right place
pwd
# Should show something like: /home/myopensoft-isar/isar
```

---

## Step 4: Upload Files to Server

**Option A - Using WinSCP (Recommended):**

1. Download WinSCP: https://winscp.net/download/WinSCP-6.3.5-Setup.exe
2. Install and open WinSCP
3. Create new connection:
   - **File protocol:** SFTP
   - **Host name:** isar.myopensoft.net
   - **Port number:** 8288
   - **User name:** myopensoft-isar
   - **Password:** R57aVmtLpj6JvFHREbtt
4. Click "Login"
5. Navigate to `/home/myopensoft-isar/isar` on the right (server)
6. Navigate to `C:\Users\Lenovo\iSAR` on the left (your computer)
7. Select and upload these files/folders:
   - ✅ `app/` folder
   - ✅ `components/` folder
   - ✅ `lib/` folder
   - ✅ `public/` folder (if exists)
   - ✅ `types/` folder
   - ✅ `package.json`
   - ✅ `package-lock.json`
   - ✅ `tsconfig.json`
   - ✅ `next.config.js`
   - ✅ `.env.production`
   - ✅ `ecosystem.config.js`
   - ✅ `isar_db_production.sql`
   - ❌ **DO NOT upload:** node_modules, .next, .env, .git

**Option B - Using Git (if you have a repository):**

```bash
# On server
cd ~/isar
git clone https://github.com/yourusername/isar.git .
```

---

## Step 5: Setup MySQL Database

On the server, create the database:

```bash
# Connect to MySQL
mysql -h isar.myopensoft.net -u myopensoft-isar -p
# Password: 8zp5RP4IY6pduMucA2FT
```

In MySQL prompt, run:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

Now import your data:

```bash
# Import the database backup
mysql -h isar.myopensoft.net -u myopensoft-isar -p isar_db < ~/isar/isar_db_production.sql
# Password: 8zp5RP4IY6pduMucA2FT

# Verify import was successful
mysql -h isar.myopensoft.net -u myopensoft-isar -p -e "USE isar_db; SHOW TABLES;"
# Should show: availability, schedules, users
```

---

## Step 6: Generate NEXTAUTH_SECRET

On the server, generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output (something like: `xK9mP2vR8wN5tL7jH4fD3sA6gY1qZ0uE...`)

Now edit the .env.production file:

```bash
cd ~/isar
nano .env.production
```

Replace `CHANGE_THIS_AFTER_DEPLOYMENT_RUN_openssl_rand_base64_32` with the generated secret.

Your file should look like:

```env
DB_HOST=isar.myopensoft.net
DB_USER=myopensoft-isar
DB_PASSWORD=8zp5RP4IY6pduMucA2FT
DB_NAME=isar_db
DB_PORT=3306

NEXTAUTH_SECRET=xK9mP2vR8wN5tL7jH4fD3sA6gY1qZ0uE...
NEXTAUTH_URL=https://isar.myopensoft.net

NODE_ENV=production
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Install Dependencies and Build

```bash
cd ~/isar

# Install dependencies
npm install

# This will take a few minutes...
# You should see: "added XXX packages"

# Build the application
npm run build

# This should show:
# ✓ Compiled successfully
# ✓ Generating static pages
# Route (app) ...
```

**If build fails with memory error:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Step 8: Update PM2 Configuration

Edit the ecosystem config file:

```bash
cd ~/isar
nano ecosystem.config.js
```

Update the `cwd` path to match your server path:

```javascript
module.exports = {
  apps: [{
    name: 'isar',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/home/myopensoft-isar/isar',  // Update this path!
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 9: Start Application with PM2

```bash
cd ~/isar

# Create logs directory
mkdir -p logs

# Install PM2 if not already installed
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status
# Should show: isar | online

# View logs
pm2 logs isar --lines 20

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Copy and run the command it shows
```

---

## Step 10: Configure Web Server (Nginx/Apache)

Your server might already have a web server configured. Check with your hosting provider about:

1. **Setting up reverse proxy** from port 80/443 to port 3000
2. **SSL certificate** for https://isar.myopensoft.net
3. **Domain configuration**

**If you have access to Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/isar
```

Add:

```nginx
server {
    listen 80;
    server_name isar.myopensoft.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/isar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**For SSL:**

```bash
sudo certbot --nginx -d isar.myopensoft.net
```

---

## Step 11: Test Your Deployment

1. **Check if app is running:**
   ```bash
   pm2 status
   pm2 logs isar --lines 50
   ```

2. **Test locally on server:**
   ```bash
   curl http://localhost:3000
   # Should return HTML content
   ```

3. **Visit in browser:**
   - http://isar.myopensoft.net (if HTTP configured)
   - https://isar.myopensoft.net (if HTTPS configured)

4. **Test login:**
   - Go to login page
   - Try logging in with your admin credentials
   - Verify dashboard loads

5. **Test all features:**
   - Schedule generation
   - Availability marking
   - User management
   - Printing

---

## Troubleshooting

### App won't start

```bash
# Check PM2 logs
pm2 logs isar --err --lines 100

# Check if port 3000 is in use
lsof -i :3000

# Restart the app
pm2 restart isar
```

### Database connection error

```bash
# Test database connection
mysql -h isar.myopensoft.net -u myopensoft-isar -p isar_db

# Check .env.production file
cat .env.production

# Make sure credentials are correct
```

### Can't access from browser

```bash
# Check if app is running
pm2 status

# Check if server is listening
netstat -tulpn | grep 3000

# Check firewall
sudo ufw status

# Contact your hosting provider about web server configuration
```

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## Useful Commands

```bash
# View logs
pm2 logs isar

# Restart app
pm2 restart isar

# Stop app
pm2 stop isar

# Check status
pm2 status

# Monitor resources
pm2 monit

# View environment
pm2 env 0

# Update code and restart
cd ~/isar
git pull  # if using git
npm install
npm run build
pm2 restart isar
```

---

## Backup Commands

```bash
# Backup database
mysqldump -h isar.myopensoft.net -u myopensoft-isar -p isar_db > backup_$(date +%Y%m%d).sql

# Backup application
tar -czf isar_backup_$(date +%Y%m%d).tar.gz ~/isar
```

---

## Next Steps After Deployment

1. ✅ Test all functionality
2. ✅ Change default admin password
3. ✅ Setup automated database backups
4. ✅ Configure monitoring
5. ✅ Document production credentials (securely)
6. ✅ Train users on the system

---

## Support

If you encounter any issues:
1. Check PM2 logs: `pm2 logs isar`
2. Check this troubleshooting guide
3. Contact your hosting provider for server-specific issues

**Your deployment is ready! Good luck! 🚀**
