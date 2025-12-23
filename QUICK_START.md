# iSAR System - Quick Deployment Guide

## For Quick Production Deployment

If you already have a server with Node.js and MySQL installed, follow these quick steps:

### 1. Prepare Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to web directory
cd /var/www

# Clone/upload your project
# (Use git clone or upload via SFTP)
```

### 2. Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE isar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'isar_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON isar_db.* TO 'isar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import your database
mysql -u isar_user -p isar_db < your_database_backup.sql
```

### 3. Configure Environment

```bash
cd /var/www/isar

# Create production environment file
nano .env.production
```

Paste and update this:

```env
DB_HOST=localhost
DB_USER=isar_user
DB_PASSWORD=YourSecurePassword123!
DB_NAME=isar_db
DB_PORT=3306

# Generate this: openssl rand -base64 32
NEXTAUTH_SECRET=paste_generated_secret_here
NEXTAUTH_URL=https://yourdomain.com

NODE_ENV=production
```

### 4. Install and Build

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 5. Start with PM2

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start the app
pm2 start npm --name "isar" -- start

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
# (Follow the command it gives you)
```

### 6. Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/isar
```

Paste this configuration (replace `yourdomain.com`):

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

### 7. Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. Done!

Visit: `https://yourdomain.com`

---

## Common Issues

**Port 3000 already in use?**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart isar
```

**Can't connect to database?**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u isar_user -p isar_db
```

**App not starting?**
```bash
# Check logs
pm2 logs isar

# Restart
pm2 restart isar
```

---

## Important Notes

1. **Change default admin password** immediately after first login
2. **Backup your database** regularly
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Monitor logs**: `pm2 logs isar`

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)
