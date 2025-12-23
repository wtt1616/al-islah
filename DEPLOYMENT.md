# iSAR System - Production Deployment Guide

## Overview
This guide will help you deploy the iSAR (Imam and Bilal Schedule Automation and Rostering) system to your production server.

## Prerequisites
- Domain name (already configured)
- Production server with SSH access
- Node.js 18+ installed on server
- MySQL 8.0+ database on server or remote database
- PM2 or similar process manager (recommended)

---

## Step 1: Server Requirements

### Minimum Server Specifications:
- **CPU:** 1-2 cores
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 10GB minimum
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### Required Software:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL (if not already installed)
sudo apt install -y mysql-server

# Install PM2 process manager
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot for SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 2: Database Setup

### 2.1 Create Production Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'isar_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON isar_db.* TO 'isar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Import Database Schema

Upload your database schema from development:

```bash
# Export from development (run on your local machine)
mysqldump -u root isar_db > isar_db_schema.sql

# Import to production (run on server)
mysql -u isar_user -p isar_db < isar_db_schema.sql
```

---

## Step 3: Upload Application Code

### Option A: Using Git (Recommended)

```bash
# On your server
cd /var/www
sudo git clone https://github.com/yourusername/isar.git
# Or upload via FTP/SFTP if not using Git

cd isar
sudo chown -R $USER:$USER /var/www/isar
```

### Option B: Using SFTP/FTP

1. Connect to your server via SFTP (e.g., FileZilla, WinSCP)
2. Upload the entire project folder to `/var/www/isar`
3. Set proper permissions:

```bash
cd /var/www/isar
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

---

## Step 4: Configure Environment Variables

### 4.1 Create Production Environment File

```bash
cd /var/www/isar
cp .env.production.example .env.production
nano .env.production
```

### 4.2 Update with Production Values

```env
# Database Configuration
DB_HOST=localhost
DB_USER=isar_user
DB_PASSWORD=your_secure_password_here
DB_NAME=isar_db
DB_PORT=3306

# NextAuth Configuration
NEXTAUTH_SECRET=generate_new_secret_with_openssl
NEXTAUTH_URL=https://yourdomain.com

NODE_ENV=production
```

### 4.3 Generate Secure NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```
Copy the output and paste it as your NEXTAUTH_SECRET value.

---

## Step 5: Install Dependencies and Build

```bash
cd /var/www/isar

# Install production dependencies
npm ci --production=false

# Build the Next.js application
npm run build

# Remove development dependencies
npm prune --production
```

---

## Step 6: Configure PM2 Process Manager

### 6.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'isar',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/isar',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 6.2 Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions
```

### 6.3 Monitor Application

```bash
# Check status
pm2 status

# View logs
pm2 logs isar

# Monitor resources
pm2 monit
```

---

## Step 7: Configure Nginx Reverse Proxy

### 7.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/isar
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (will be configured in Step 8)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be generated in Step 8)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
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

    # Client max body size
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

### 7.2 Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/isar /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test is successful, reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: Setup SSL Certificate (HTTPS)

### 8.1 Obtain SSL Certificate

```bash
# Obtain certificate using Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 8.2 Test Auto-Renewal

```bash
# Certbot auto-renewal is configured automatically
# Test the renewal process:
sudo certbot renew --dry-run
```

---

## Step 9: Configure Firewall

```bash
# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 10: Post-Deployment Checklist

### ✅ Security Checklist:
- [ ] Changed default database password to strong password
- [ ] Generated new NEXTAUTH_SECRET for production
- [ ] SSL certificate installed and working
- [ ] Firewall configured properly
- [ ] Database user has minimum required privileges
- [ ] .env files are not publicly accessible
- [ ] Server is updated with latest security patches

### ✅ Functionality Checklist:
- [ ] Login system works
- [ ] Schedule generation works
- [ ] Availability marking works
- [ ] User management works (admin)
- [ ] Schedule printing works
- [ ] All roles have proper access

### ✅ Performance Checklist:
- [ ] Application loads quickly
- [ ] Database queries are optimized
- [ ] PM2 is running and monitoring the app
- [ ] Nginx gzip compression is enabled
- [ ] SSL/TLS is properly configured

---

## Step 11: Backup Strategy

### 11.1 Database Backup Script

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-isar-db.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/isar"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="isar_db"
DB_USER="isar_user"
DB_PASS="your_password_here"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/isar_db_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "isar_db_*.sql.gz" -mtime +30 -delete
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-isar-db.sh
```

### 11.2 Setup Automated Backups

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-isar-db.sh
```

---

## Maintenance Commands

### Update Application

```bash
cd /var/www/isar
git pull origin main  # If using Git
npm ci
npm run build
pm2 restart isar
```

### View Logs

```bash
# PM2 logs
pm2 logs isar

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart application
pm2 restart isar

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs isar --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Check environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Test database connection
mysql -u isar_user -p isar_db

# Check MySQL status
sudo systemctl status mysql

# Check MySQL error logs
sudo tail -f /var/log/mysql/error.log
```

### SSL Certificate Issues

```bash
# Test SSL
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

---

## Support and Additional Resources

- Next.js Documentation: https://nextjs.org/docs
- PM2 Documentation: https://pm2.keymetrics.io/docs
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

## Production URL

Once deployed, your application will be accessible at:
**https://yourdomain.com**

Default admin credentials should be changed immediately after first login.
