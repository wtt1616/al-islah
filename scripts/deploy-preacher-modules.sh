#!/bin/bash

# Deployment script for preacher modules
# Run this on the production server

echo "========================================="
echo "Deploying Preacher Modules to Production"
echo "========================================="

# Navigate to app directory
cd ~/isar || { echo "Error: isar directory not found"; exit 1; }

# Pull latest changes
echo ""
echo "1. Pulling latest code from GitHub..."
git pull origin main || { echo "Error: git pull failed"; exit 1; }

# Install dependencies
echo ""
echo "2. Installing dependencies..."
npm install || { echo "Error: npm install failed"; exit 1; }

# Run database migration
echo ""
echo "3. Running database migration..."
echo "Creating preachers and preacher_schedules tables..."

# You'll need to update these credentials
DB_USER="your_db_user"
DB_NAME="isar_db_production"

mysql -u "$DB_USER" -p "$DB_NAME" < database/schema/preachers.sql || { echo "Error: Database migration failed"; exit 1; }

echo "Database tables created successfully!"

# Build production version
echo ""
echo "4. Building production version..."
npm run build || { echo "Error: npm build failed"; exit 1; }

# Restart PM2
echo ""
echo "5. Restarting PM2 process..."
pm2 restart isar || { echo "Error: PM2 restart failed"; exit 1; }

# Verify deployment
echo ""
echo "6. Verifying deployment..."
pm2 logs isar --lines 20 --nostream

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Visit https://isar.myopensoft.net"
echo "2. Login as Admin and go to 'Manage Preachers'"
echo "3. Add some preachers"
echo "4. Login as Head Imam and go to 'Preacher Schedules'"
echo "5. Create monthly schedules"
echo ""
