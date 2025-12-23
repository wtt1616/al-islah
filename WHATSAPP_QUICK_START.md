# WhatsApp Production Setup - Quick Start Guide

This is a condensed version of the full setup guide. For detailed instructions, see `WHATSAPP_PRODUCTION_SETUP.md`.

## 🚀 Quick Setup (5 Steps)

### Step 1: Upgrade Twilio Account (5 minutes)

1. Login to https://console.twilio.com
2. Go to Billing → Add payment method
3. Add $20-50 USD credit
4. Complete business profile verification

### Step 2: Buy WhatsApp-Enabled Number (10 minutes)

1. Go to: Console → Phone Numbers → Buy a number
2. Select **Malaysia** or **United States**
3. Filter by: ✅ SMS capability
4. Buy number (~$1-2/month)
5. Enable WhatsApp on this number:
   - Go to: Messaging → WhatsApp Senders
   - Click "New WhatsApp sender"
   - Select your purchased number

### Step 3: Create Business Profile (10 minutes)

1. In WhatsApp Senders setup, fill in:
   ```
   Display Name: iSAR Prayer Management
   Category: Religious Organization
   Description: Automated prayer duty reminders
   Address: [Your mosque address]
   Website: https://isar.myopensoft.net
   ```

2. Click "Submit"

### Step 4: Create & Submit Message Templates (15 minutes)

Go to: Console → Messaging → Content Template Builder

**Template 1: Prayer Duty Reminder**
```
Name: prayer_duty_reminder
Language: English
Category: UTILITY

Body:
السلام عليكم / Assalamualaikum {{1}},

This is a reminder for your upcoming prayer duty:

Role: {{2}}
Date: {{3}}
Prayer Time: {{4}}

Please confirm your availability. JazakAllah Khair.

---
iSAR System - Prayer Duty Management
```

**Template 2: Test Message** (optional)
```
Name: test_notification
Language: English
Category: UTILITY

Body:
السلام عليكم / Assalamualaikum {{1}},

This is a test message from iSAR Prayer Duty Management System.

If you received this message, WhatsApp notifications are working correctly!

---
iSAR System - Prayer Duty Management
```

Click "Submit for Approval" → Wait 24-48 hours

### Step 5: Configure Production Server (10 minutes)

**After templates are approved:**

1. SSH to production:
   ```bash
   ssh myopensoft-isar@isar.myopensoft.net -p 8288
   cd ~/isar
   ```

2. Edit `.env`:
   ```bash
   nano .env
   ```

3. Update these values:
   ```bash
   # Your Twilio credentials from Console
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+60123456789  # Your approved number

   # Optional: Add template SIDs after approval (found in Content Template Builder)
   TWILIO_PRAYER_REMINDER_TEMPLATE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_TEST_MESSAGE_TEMPLATE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. Restart server:
   ```bash
   pm2 restart isar
   ```

5. Test at: https://isar.myopensoft.net/dashboard/whatsapp-test

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Twilio account upgraded (payment method added)
- [ ] WhatsApp number purchased and enabled
- [ ] Business profile created
- [ ] Message templates submitted and **APPROVED** (check email)
- [ ] Production `.env` updated with credentials
- [ ] Server restarted
- [ ] Test message sent successfully via WhatsApp Test page
- [ ] Users receive messages WITHOUT "join sandbox" requirement

---

## 💰 Cost Estimate

**Monthly costs for 20 users, 5 reminders/week:**

- Phone number rental: $1.50/month
- WhatsApp messages: ~400 messages × $0.015 = $6/month
- **Total: ~$7.50 USD/month**

Set billing alerts at $10, $25, $50 in Twilio Console.

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Templates not approved | Remove promotional language, keep transactional only |
| Messages not sending | Verify template is approved, check template name matches code |
| "Join sandbox" still required | Not using production number - check `.env` has correct number |
| High costs | Check for message loops, verify not sending duplicates |
| Users not receiving | Verify phone numbers have WhatsApp, check number format (+60) |

---

## 📱 Current Setup Status

**Development (Sandbox):**
- ✅ Currently working
- Uses: `whatsapp:+14155238886`
- Requires: Users join sandbox first
- Cost: Free

**Production (Business):**
- ⏳ Needs setup (follow steps above)
- Uses: Your approved number
- Requires: No user action needed
- Cost: ~$7.50/month

---

## 📞 Support

- **Full Guide**: See `WHATSAPP_PRODUCTION_SETUP.md`
- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Twilio Support**: https://support.twilio.com
- **Test Interface**: https://isar.myopensoft.net/dashboard/whatsapp-test

---

## 🔄 Migration Path

**Current (Sandbox) → Production:**

1. Complete Steps 1-4 above
2. Wait for template approval (24-48 hours)
3. Update production `.env` (Step 5)
4. Test with 2-3 users first
5. Roll out to all users

**No code changes needed** - the system automatically uses templates if configured, otherwise falls back to sandbox messages.

---

**Last Updated**: 2025-11-22
**Setup Time**: ~1 hour + approval wait time
**Difficulty**: Medium
