# iSAR System - Pre-Deployment Checklist

## Before Deploying to Production

### ✅ Code Preparation

- [ ] All features are tested and working
- [ ] No console.log() statements in production code (removed debug logs)
- [ ] Error handling is implemented for all API routes
- [ ] Code is committed to version control (Git)
- [ ] .env file is NOT committed (check .gitignore)

### ✅ Database

- [ ] Database schema is finalized
- [ ] All tables have proper indexes
- [ ] Sample/test data is removed or cleaned
- [ ] Admin user credentials are set
- [ ] Database backup is created (run export-database.bat)
- [ ] Database backup file is ready to upload

### ✅ Security

- [ ] Generated new NEXTAUTH_SECRET for production (different from development)
- [ ] Strong database password is set
- [ ] .env.production file contains production values only
- [ ] Default admin password will be changed after first login
- [ ] SQL injection prevention is implemented (using parameterized queries ✓)
- [ ] XSS protection is in place (Next.js handles this ✓)

### ✅ Environment Configuration

- [ ] .env.production.example file is created ✓
- [ ] Production database credentials are ready
- [ ] Production domain name is configured
- [ ] NEXTAUTH_URL is set to production domain
- [ ] NODE_ENV is set to 'production'

### ✅ Server Requirements

- [ ] Server has Node.js 18+ installed
- [ ] Server has MySQL 8+ installed or accessible
- [ ] Server has PM2 installed (or will install)
- [ ] Server has Nginx installed (or will install)
- [ ] Server has at least 2GB RAM
- [ ] Server has at least 10GB free disk space
- [ ] SSH access to server is configured
- [ ] Domain DNS is pointing to server IP

### ✅ Documentation

- [ ] DEPLOYMENT.md guide is reviewed ✓
- [ ] QUICK_START.md guide is reviewed ✓
- [ ] Server admin has access to documentation
- [ ] Backup strategy is documented ✓

### ✅ Testing Plan

- [ ] Plan to test login after deployment
- [ ] Plan to test schedule generation
- [ ] Plan to test availability marking
- [ ] Plan to test user management
- [ ] Plan to test printing functionality
- [ ] Plan to test on mobile devices

### ✅ Backup Plan

- [ ] Database backup script is prepared
- [ ] Backup storage location is identified
- [ ] Recovery procedure is documented
- [ ] Automated backup schedule is planned

### ✅ Monitoring

- [ ] Plan to monitor PM2 logs
- [ ] Plan to monitor Nginx logs
- [ ] Plan to monitor database performance
- [ ] Plan to check disk space regularly

---

## Deployment Day Checklist

### Phase 1: Server Setup (30-60 minutes)

- [ ] SSH into server
- [ ] Install Node.js, MySQL, PM2, Nginx
- [ ] Configure firewall
- [ ] Create database and user
- [ ] Import database schema

### Phase 2: Application Deployment (30-45 minutes)

- [ ] Upload application code
- [ ] Create .env.production file
- [ ] Install dependencies
- [ ] Build application
- [ ] Start with PM2
- [ ] Configure PM2 startup

### Phase 3: Web Server Configuration (15-30 minutes)

- [ ] Configure Nginx reverse proxy
- [ ] Test Nginx configuration
- [ ] Setup SSL certificate with Certbot
- [ ] Test HTTPS access

### Phase 4: Testing (30 minutes)

- [ ] Test login functionality
- [ ] Test all user roles (admin, head_imam, imam, bilal)
- [ ] Test schedule generation
- [ ] Test availability marking and removal
- [ ] Test user management
- [ ] Test printing
- [ ] Test on mobile device

### Phase 5: Post-Deployment (15 minutes)

- [ ] Change default admin password
- [ ] Setup automated database backups
- [ ] Document production credentials (securely)
- [ ] Provide access to stakeholders
- [ ] Monitor logs for any errors

---

## Emergency Rollback Plan

If deployment fails:

1. **Stop the application:**
   ```bash
   pm2 stop isar
   ```

2. **Restore database backup:**
   ```bash
   mysql -u isar_user -p isar_db < backup_file.sql
   ```

3. **Revert code changes:**
   ```bash
   git checkout previous_version
   npm install
   npm run build
   pm2 restart isar
   ```

---

## Contact Information

Keep this information handy during deployment:

- **Server Provider Support:** _______________
- **Domain Registrar:** _______________
- **Database Admin:** _______________
- **System Administrator:** _______________

---

## Post-Deployment Maintenance Schedule

### Daily:
- Check application is running: `pm2 status`
- Monitor error logs: `pm2 logs isar --lines 50`

### Weekly:
- Check disk space: `df -h`
- Review Nginx logs for errors
- Test backup restoration

### Monthly:
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review database performance
- Clean up old log files
- Test SSL certificate renewal

---

## Success Criteria

Deployment is successful when:

✅ Application is accessible via HTTPS
✅ All features work as expected
✅ No errors in PM2 logs
✅ Database connections are stable
✅ SSL certificate is valid
✅ Users can login and perform tasks
✅ Backups are configured and working
✅ Monitoring is in place

---

**Ready to deploy? Follow [QUICK_START.md](QUICK_START.md) for step-by-step instructions!**
