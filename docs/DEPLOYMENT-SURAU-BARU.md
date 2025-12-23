# Panduan Deployment iSAR untuk Surau Baru

Dokumen ini menerangkan langkah-langkah untuk deploy sistem iSAR ke server baru untuk surau lain.

---

## Langkah 0: Setup GitHub Repository Baru

Setiap surau akan mempunyai repository GitHub sendiri yang terpisah sepenuhnya.

### 0.1 Cipta Repository Baru di GitHub

1. Login ke GitHub dengan akaun surau baru
2. Klik **"New Repository"**
3. Isi maklumat:
   - **Repository name**: `isar` atau `isar-surau-xyz`
   - **Description**: `Sistem Pengurusan Surau XYZ`
   - **Visibility**: Private (disyorkan)
4. **JANGAN** tick "Initialize with README"
5. Klik **"Create repository"**

### 0.2 Copy Kod dari Sistem Asal

**Di komputer lokal anda:**

```bash
# 1. Clone sistem asal (tanpa history git)
git clone --depth 1 https://github.com/wtt1616/isar.git isar-surau-xyz
cd isar-surau-xyz

# 2. Buang git history asal
rm -rf .git

# 3. Initialize git baru
git init
git branch -M main

# 4. Tambah remote repository baru
git remote add origin https://github.com/surau-xyz/isar.git

# 5. Commit pertama
git add .
git commit -m "Initial commit - iSAR untuk Surau XYZ"

# 6. Push ke repository baru
git push -u origin main
```

### 0.3 Struktur Repository Akhir

```
Repository Asal (wtt1616/isar)     → Surau Al-Rahman Presint 14
Repository Baru (surau-xyz/isar)  → Surau XYZ (terpisah sepenuhnya)
Repository Baru (surau-abc/isar)  → Surau ABC (terpisah sepenuhnya)
```

**Nota Penting:**
- Setiap surau mempunyai repository sendiri
- Tiada kaitan dengan repository asal
- Surau boleh customize sepenuhnya tanpa konflik
- Maintenance dilakukan secara berasingan

---

## Keperluan Server

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum
- **CPU**: 1 vCPU minimum (2 vCPU recommended)

### Software Required
- Node.js 18.x atau lebih tinggi
- MySQL 8.0 atau MariaDB 10.5+
- PM2 (Process Manager)
- Nginx (sebagai reverse proxy)
- Git

---

## Langkah 1: Setup Server

### 1.1 Install Node.js (via NVM)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version  # Should show v18.x.x
npm --version
```

### 1.2 Install MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

### 1.3 Install PM2

```bash
npm install -g pm2
```

### 1.4 Install Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Langkah 2: Setup Database

### 2.1 Create Database dan User

```bash
# Login MySQL as root
sudo mysql -u root -p
```

```sql
-- Create database untuk surau baru
CREATE DATABASE isar_surau_xyz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'isar_user'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT_ANDA';

-- Grant privileges
GRANT ALL PRIVILEGES ON isar_surau_xyz.* TO 'isar_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 2.2 Import Database Schema

Dapatkan SQL dump dari server sedia ada:

```bash
# Di server asal (isar.myopensoft.net)
mysqldump -u myopensoft-isar -p isar --no-data > isar_schema.sql

# Copy ke server baru
scp isar_schema.sql user@new-server:/tmp/
```

Import schema di server baru:

```bash
mysql -u isar_user -p isar_surau_xyz < /tmp/isar_schema.sql
```

### 2.3 Insert Data Asas

```sql
-- Insert prayer times (reference data)
INSERT INTO prayer_times (name) VALUES
('Subuh'), ('Zohor'), ('Asar'), ('Maghrib'), ('Isyak');

-- Insert default admin user (tukar password selepas login)
INSERT INTO users (name, email, password, role, is_active) VALUES
('Admin Surau', 'admin@surau-xyz.com', '$2a$10$xxxxx', 'admin', TRUE);
-- Nota: Generate password hash menggunakan bcrypt
```

---

## Langkah 3: Clone dan Setup Aplikasi

### 3.1 Clone Repository dari GitHub Surau

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone dari repository surau sendiri (BUKAN dari wtt1616/isar)
git clone https://github.com/AKAUN-GITHUB-SURAU/isar.git isar-surau-xyz
cd isar-surau-xyz

# Contoh untuk Surau ABC:
# git clone https://github.com/surau-abc/isar.git isar-surau-abc
```

**Nota:** Gantikan `AKAUN-GITHUB-SURAU` dengan username GitHub surau tersebut.

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Setup Environment Variables

```bash
# Copy sample env file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Kandungan `.env.local`:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=isar_surau_xyz
DB_USER=isar_user
DB_PASSWORD=PASSWORD_KUAT_ANDA

# NextAuth Configuration
NEXTAUTH_URL=https://surau-xyz.domain.com
NEXTAUTH_SECRET=generate-random-secret-key-32-chars

# App Configuration
NEXT_PUBLIC_APP_NAME=iSAR Surau XYZ
NEXT_PUBLIC_SURAU_NAME=Surau Al-Iman Taman XYZ

# Optional: WhatsApp/Email Notifications
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3.4 Build Application

```bash
npm run build
```

---

## Langkah 4: Setup PM2

### 4.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'isar-surau-xyz',
    script: 'npm',
    args: 'start',
    cwd: '/home/user/apps/isar-surau-xyz',
    env: {
      NODE_ENV: 'production',
      PORT: 3001  // Tukar port untuk setiap surau
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### 4.2 Start Application

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4.3 Verify Application Running

```bash
pm2 status
pm2 logs isar-surau-xyz
```

---

## Langkah 5: Setup Nginx Reverse Proxy

### 5.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/isar-surau-xyz
```

```nginx
server {
    listen 80;
    server_name surau-xyz.domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name surau-xyz.domain.com;

    # SSL Configuration (akan di-setup oleh Certbot)
    ssl_certificate /etc/letsencrypt/live/surau-xyz.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/surau-xyz.domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3001;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Upload size limit
    client_max_body_size 10M;
}
```

### 5.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/isar-surau-xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d surau-xyz.domain.com
```

---

## Langkah 6: Customization untuk Surau

### 6.1 Tukar Nama Surau

Edit fail berikut untuk tukar nama surau:

**`app/layout.tsx`** - Tukar metadata

```typescript
export const metadata: Metadata = {
  title: 'iSAR - Surau Al-Iman Taman XYZ',
  description: 'Sistem Pengurusan Surau Al-Iman',
  // ...
};
```

**`app/login/page.tsx`** - Tukar tajuk halaman login

**`components/Navbar.tsx`** - Tukar branding jika perlu

### 6.2 Tukar Logo (Optional)

```bash
# Replace logo files
cp /path/to/new-logo.png public/logo.png
cp /path/to/new-icon.png public/icon.png
```

### 6.3 Tukar Maklumat Bank (Khairat/Infaq)

Edit fail yang berkaitan dengan pembayaran untuk kemaskini nombor akaun bank.

---

## Langkah 7: Create Admin User

### 7.1 Generate Password Hash

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(h => console.log(h));"
```

### 7.2 Insert Admin User

```sql
INSERT INTO users (name, email, password, role, phone, is_active)
VALUES (
  'Admin Surau XYZ',
  'admin@surau-xyz.com',
  '$2a$10$hashedpassword...',
  'admin',
  '0123456789',
  TRUE
);
```

---

## Langkah 8: Deployment Updates

### 8.1 Script untuk Update Aplikasi

Cipta script `deploy.sh`:

```bash
#!/bin/bash
cd ~/apps/isar-surau-xyz

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting PM2..."
pm2 restart isar-surau-xyz

echo "Deployment complete!"
```

```bash
chmod +x deploy.sh
```

### 8.2 Jalankan Update

```bash
./deploy.sh
```

### 8.3 Workflow Development untuk Surau

Setiap surau mempunyai workflow sendiri:

```
Developer Surau XYZ
       │
       ▼
[Edit kod di local]
       │
       ▼
git add . && git commit -m "Perubahan XYZ"
       │
       ▼
git push origin main
       │
       ▼
[SSH ke server]
       │
       ▼
./deploy.sh
       │
       ▼
[Sistem live dengan perubahan baru]
```

**Nota:** Setiap surau maintain kod mereka sendiri. Perubahan di satu surau tidak affect surau lain.

---

## Troubleshooting

### Application tidak start

```bash
# Check PM2 logs
pm2 logs isar-surau-xyz --lines 50

# Check if port is in use
sudo lsof -i :3001
```

### Database connection error

```bash
# Test MySQL connection
mysql -u isar_user -p -h localhost isar_surau_xyz

# Check MySQL status
sudo systemctl status mysql
```

### Nginx error

```bash
# Test config
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/apps/isar-surau-xyz

# Fix uploads directory
mkdir -p ~/apps/isar-surau-xyz/public/uploads
chmod 755 ~/apps/isar-surau-xyz/public/uploads
```

---

## Checklist Deployment

- [ ] Server setup complete (Node.js, MySQL, Nginx, PM2)
- [ ] Database created and schema imported
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured (.env.local)
- [ ] Application built successfully
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Admin user created
- [ ] Application accessible via domain
- [ ] Login tested successfully
- [ ] All modules working (Jadual, Kewangan, Khairat, dll)

---

## Sokongan

Jika menghadapi masalah:

1. Semak PM2 logs: `pm2 logs isar-surau-xyz`
2. Semak Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Semak MySQL connection
4. Pastikan semua environment variables betul

---

## Ringkasan Langkah-langkah (Quick Reference)

### A. Setup Repository Baru (Di Komputer Lokal)

```bash
# 1. Clone tanpa history
git clone --depth 1 https://github.com/wtt1616/isar.git isar-surau-baru
cd isar-surau-baru

# 2. Reset git
rm -rf .git
git init
git branch -M main

# 3. Push ke repo baru
git remote add origin https://github.com/SURAU-BARU/isar.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### B. Setup Server

```bash
# 1. Install prerequisites
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
npm install -g pm2

# 2. Setup MySQL
sudo apt install mysql-server
sudo mysql -e "CREATE DATABASE isar_surau_baru;"
sudo mysql -e "CREATE USER 'isar'@'localhost' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL ON isar_surau_baru.* TO 'isar'@'localhost';"

# 3. Clone dan setup app
cd ~/apps
git clone https://github.com/SURAU-BARU/isar.git
cd isar
npm install
cp .env.example .env.local
nano .env.local  # Edit database credentials
npm run build

# 4. Start dengan PM2
pm2 start npm --name "isar" -- start
pm2 save
pm2 startup
```

### C. Maklumat Yang Perlu Ditukar

| Item | Lokasi | Keterangan |
|------|--------|------------|
| Database credentials | `.env.local` | DB_HOST, DB_NAME, DB_USER, DB_PASSWORD |
| Nama surau | `.env.local` | NEXT_PUBLIC_SURAU_NAME |
| Domain | `.env.local` | NEXTAUTH_URL |
| Secret key | `.env.local` | NEXTAUTH_SECRET (generate baru) |
| No. akaun bank | Kod sumber | Untuk pembayaran khairat/infaq |
| Logo | `public/` | logo.png, icon.png |

---

## Senarai Surau Menggunakan iSAR

| Surau | Repository | Domain | Status |
|-------|------------|--------|--------|
| Surau Al-Rahman Presint 14 | wtt1616/isar | isar.myopensoft.net | Production |
| Surau [Nama Baru] | [repo-baru] | [domain-baru] | Pending |

*Kemaskini senarai ini apabila surau baru menggunakan sistem iSAR.*

---

**Dokumen disediakan oleh:** Claude Code
**Tarikh:** 2025-12-24
**Versi:** 1.1
**Pendekatan:** Single-Tenant (Repository Terpisah)
