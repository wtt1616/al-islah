# iSAR Deployment Assistant - Interactive Guide

I'll help you deploy iSAR step by step. Let's work through this together!

---

## What I Need From You

Please provide the following information:

### 1. Server Details
- **Server IP Address:** ________________
- **Server SSH Username:** ________________
- **Server SSH Password/Key:** ________________
- **Hosting Provider:** ________________

### 2. Domain Information
- **Domain Name:** ________________
- **Is domain already pointing to server IP?** Yes / No

### 3. Database Information (from your hosting provider)
- **Database Host:** ________________ (usually `localhost`)
- **Database Username:** ________________
- **Database Password:** ________________
- **Can you create databases?** Yes / No

---

## Deployment Methods - Choose One

### Method A: Full Server Access (VPS/Cloud) - RECOMMENDED
**Requirements:** SSH access, root/sudo access
**Time:** 1-2 hours
**Best for:** VPS, Cloud servers, Dedicated servers

### Method B: Shared Hosting (cPanel/Plesk)
**Requirements:** File manager, MySQL database access, Node.js support
**Time:** 30-60 minutes
**Best for:** Shared hosting with Node.js support

### Method C: I'll Deploy to a Free/Paid Platform
**Options:** Vercel, Netlify, Railway, Render
**Time:** 15-30 minutes
**Best for:** Quick deployment, no server management

---

## Method A: VPS/Cloud Server Deployment

### Step 1: Connect to Your Server

```bash
# Open Command Prompt or PowerShell on your Windows machine
ssh username@your-server-ip

# Example:
# ssh root@123.45.67.89
```

### Step 2: Install Required Software

Once connected to your server, run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Setup MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# In MySQL prompt, run:
CREATE DATABASE isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'isar_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON isar_db.* TO 'isar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Upload Your Application

**Option A - Using Git (if your code is on GitHub):**
```bash
cd /var/www
sudo git clone https://github.com/yourusername/isar.git
cd isar
```

**Option B - Using SFTP (Upload from your computer):**

1. Use WinSCP or FileZilla to connect to your server
2. Upload the entire `iSAR` folder to `/var/www/isar`
3. **DO NOT upload:** node_modules, .next, .env

### Step 5: Upload Database

From your Windows computer, upload `isar_db_production.sql` to server using SFTP.

Then on server:
```bash
cd /var/www/isar
mysql -u isar_user -p isar_db < isar_db_production.sql
```

### Step 6: Configure Environment Variables

```bash
cd /var/www/isar
nano .env.production
```

Paste this and fill in your values:
```env
DB_HOST=localhost
DB_USER=isar_user
DB_PASSWORD=YourSecurePassword123!
DB_NAME=isar_db
DB_PORT=3306

NEXTAUTH_SECRET=paste_your_generated_secret_here
NEXTAUTH_URL=https://yourdomain.com

NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Save: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 7: Install Dependencies and Build

```bash
cd /var/www/isar

# Install dependencies
npm install

# Build the application
npm run build

# Test if it works
npm start

# If it starts successfully, press Ctrl+C to stop it
```

### Step 8: Start with PM2

```bash
cd /var/www/isar

# Start the application
pm2 start npm --name "isar" -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on server reboot
pm2 startup
# Copy and run the command it shows

# Check status
pm2 status
```

### Step 9: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/isar
```

Paste this (replace `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

    client_max_body_size 10M;
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/isar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Setup SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

### Step 11: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Step 12: Test Your Deployment

Visit: `https://yourdomain.com`

✅ Login page should appear
✅ HTTPS should be working
✅ All features should work

---

## Method B: Shared Hosting Deployment

### Requirements Check:
- [ ] Node.js support (version 18+)
- [ ] MySQL database available
- [ ] SSH or File Manager access
- [ ] Can run Node.js applications

**Note:** Not all shared hosting supports Node.js. Check with your provider first.

### Step 1: Create MySQL Database
1. Login to cPanel/Plesk
2. Go to MySQL Databases
3. Create database: `isar_db`
4. Create user: `isar_user` with secure password
5. Add user to database with ALL PRIVILEGES

### Step 2: Import Database
1. Go to phpMyAdmin
2. Select `isar_db`
3. Click Import
4. Choose `isar_db_production.sql`
5. Click Go

### Step 3: Upload Files
Using File Manager or FTP:
1. Upload all files to `public_html/isar/` or your domain folder
2. **DO NOT upload:** node_modules, .next, .env

### Step 4: Create .env.production
Create file in your isar folder with:
```env
DB_HOST=localhost
DB_USER=your_cpanel_user_dbuser
DB_PASSWORD=your_database_password
DB_NAME=your_cpanel_user_isar_db
DB_PORT=3306

NEXTAUTH_SECRET=generate_this_secret
NEXTAUTH_URL=https://yourdomain.com

NODE_ENV=production
```

### Step 5: Install and Build
Via SSH (if available):
```bash
cd public_html/isar
npm install
npm run build
```

### Step 6: Setup Node.js Application
In cPanel:
1. Go to "Setup Node.js App"
2. Create application:
   - Node.js version: 18.x
   - Application mode: Production
   - Application root: /home/username/public_html/isar
   - Application URL: yourdomain.com
   - Application startup file: node_modules/next/dist/bin/next
3. Set environment variables from .env.production
4. Start the application

---

## Method C: Deploy to Platform (Easiest)

### Option 1: Vercel (Free, Best for Next.js)

**Limitations:**
- ❌ Cannot use MySQL directly (need separate database hosting)
- ✅ Free SSL
- ✅ Automatic deployments

**Not recommended for iSAR** because it requires MySQL connection.

### Option 2: Railway.app (Recommended Platform)

**Benefits:**
- ✅ Supports MySQL
- ✅ Easy deployment
- ✅ Free tier available
- ✅ Automatic SSL

**Steps:**
1. Create account at railway.app
2. Create new project
3. Add MySQL service
4. Add your iSAR repository
5. Configure environment variables
6. Deploy

---

## I Can Help You With Any Method!

**Tell me:**
1. Which method do you want to use? (A, B, or C)
2. What's your current server/hosting situation?
3. Do you have SSH access?

**And I'll provide:**
- Specific commands for your setup
- Help troubleshoot any errors
- Walk through each step with you

**What would you like to do?**
