# WhatsApp Business Number Setup Guide for Production

This guide walks you through setting up a production-ready WhatsApp Business number with Twilio for the iSAR system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Twilio Account Setup](#step-1-twilio-account-setup)
- [Step 2: WhatsApp Business Profile Setup](#step-2-whatsapp-business-profile-setup)
- [Step 3: Get a WhatsApp-Enabled Number](#step-3-get-a-whatsapp-enabled-number)
- [Step 4: Submit for WhatsApp Business Verification](#step-4-submit-for-whatsapp-business-verification)
- [Step 5: Configure Production Environment](#step-5-configure-production-environment)
- [Step 6: Testing](#step-6-testing)
- [Pricing & Costs](#pricing--costs)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ Twilio account (you already have this)
- ✅ Credit card for Twilio billing
- ✅ Business information (mosque/masjid details)
- ✅ Website or Facebook page for verification (optional but helpful)
- ✅ $20-50 USD budget for initial setup and testing

---

## Step 1: Twilio Account Setup

### 1.1 Upgrade to Paid Account

1. **Login to Twilio Console**: https://console.twilio.com
2. **Go to Billing**:
   - Click your account name (top right)
   - Select "Billing"
3. **Add Payment Method**:
   - Click "Add Payment Method"
   - Enter credit card details
   - Save
4. **Add Initial Balance**:
   - Recommended: $20-50 USD
   - This covers phone number purchase + initial messages

### 1.2 Verify Your Account

1. **Go to Console Home**: https://console.twilio.com
2. **Complete Phone Verification** (if not done):
   - Add your business phone number
   - Verify via SMS/call
3. **Complete Business Profile**:
   - Business name: "iSAR Prayer Management System" or your mosque name
   - Business address
   - Business type: Religious Organization

---

## Step 2: WhatsApp Business Profile Setup

### 2.1 Create WhatsApp Business Profile

1. **Navigate to WhatsApp**:
   - Go to: https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders
   - Or: Console → Messaging → Senders → WhatsApp senders

2. **Click "Create new WhatsApp sender"**

3. **Fill in Business Profile Information**:
   ```
   Display Name: iSAR Prayer Management
   Business Category: Religious Organization
   Business Description: Automated prayer duty management and reminder system for mosque operations
   Business Address: [Your mosque address]
   Business Website: https://isar.myopensoft.net (or your mosque website)
   Business Email: [Your mosque email]
   ```

4. **Upload Business Profile Photo** (optional):
   - Mosque logo or Islamic symbol
   - Size: 640x640px minimum
   - Format: JPG or PNG

5. **About Text** (shown to users):
   ```
   iSAR Prayer Duty Management System
   Automated reminders for Imam and Bilal prayer schedules.
   ```

---

## Step 3: Get a WhatsApp-Enabled Number

You have **TWO options** for getting a WhatsApp number:

### Option A: Buy a New Twilio Number (Recommended)

**Pros**: Fresh number, full control, easy setup
**Cons**: Costs ~$1-2/month

**Steps**:

1. **Go to Phone Numbers**:
   - https://console.twilio.com/us1/develop/phone-numbers/manage/search
   - Or: Console → Phone Numbers → Buy a number

2. **Search for Number**:
   - **Country**: Malaysia (or United States if Malaysia unavailable)
   - **Capabilities**: Check ✅ "SMS" and ✅ "MMS"
   - **Contains**: Leave blank or enter preferred digits
   - Click "Search"

3. **Select a Number**:
   - Choose a number from results
   - Click "Buy" (costs ~$1-2/month)
   - Confirm purchase

4. **Enable WhatsApp for This Number**:
   - After purchase, go to: Console → Messaging → Senders → WhatsApp senders
   - Click "New WhatsApp sender"
   - Select "Use an existing Twilio number"
   - Choose your newly purchased number
   - Click "Continue"

### Option B: Use Your Own Business WhatsApp Number

**Pros**: Use existing business number
**Cons**: More complex setup, need WhatsApp Business App access

**Steps**:

1. **Requirements**:
   - Must be a business phone number
   - Cannot be currently used on WhatsApp or WhatsApp Business app
   - You need access to receive verification code

2. **In Twilio Console**:
   - Go to WhatsApp Senders
   - Click "Request to enable WhatsApp on a Twilio number"
   - Enter your existing business number
   - Follow verification steps

---

## Step 4: Submit for WhatsApp Business Verification

### 4.1 Enable WhatsApp Messaging

1. **After selecting your number** in Step 3:
   - You'll see "WhatsApp sender" configuration page

2. **Link to Business Profile**:
   - Select the business profile you created in Step 2
   - Click "Continue"

3. **Configure Message Templates** (Important!):
   WhatsApp requires pre-approved templates for the first message sent to users.

### 4.2 Create Message Templates

**Why?** WhatsApp requires approved templates for business-initiated conversations.

1. **Go to Content Template Builder**:
   - Console → Messaging → Content Template Builder
   - Or: https://console.twilio.com/us1/develop/sms/content-template-builder

2. **Create Template #1: Duty Reminder**

   ```
   Template Name: prayer_duty_reminder
   Template Language: English
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

   Variables:
   - {{1}} = Name
   - {{2}} = Role (Imam/Bilal)
   - {{3}} = Date
   - {{4}} = Prayer Time

3. **Create Template #2: Test Message** (optional)

   ```
   Template Name: test_notification
   Template Language: English
   Category: UTILITY

   Body:
   السلام عليكم / Assalamualaikum {{1}},

   This is a test message from iSAR Prayer Duty Management System.

   If you received this message, WhatsApp notifications are working correctly!

   ---
   iSAR System - Prayer Duty Management
   ```

4. **Submit Templates for Approval**:
   - Click "Submit for Approval"
   - **Review time**: Usually 24-48 hours
   - You'll receive email when approved

### 4.3 Wait for Approval

- **Expected time**: 1-3 business days
- **Check status**: Console → Messaging → Content Template Builder
- **Email notification**: You'll receive approval confirmation

---

## Step 5: Configure Production Environment

Once your WhatsApp number and templates are approved:

### 5.1 Get Your Credentials

1. **Account SID**:
   - Go to: https://console.twilio.com
   - Find "Account SID" on dashboard
   - Copy it

2. **Auth Token**:
   - On same page, find "Auth Token"
   - Click "Show" to reveal
   - Copy it

3. **WhatsApp Number**:
   - Go to: Console → Phone Numbers → Manage → Active Numbers
   - Click your WhatsApp-enabled number
   - Copy the phone number (e.g., +60123456789)
   - Format it as: `whatsapp:+60123456789`

### 5.2 Update Production .env

**On Production Server** (via SSH):

```bash
# SSH into production
ssh myopensoft-isar@isar.myopensoft.net -p 8288

# Navigate to app directory
cd ~/isar

# Edit .env file
nano .env
```

**Update these lines**:
```bash
# Replace with your PRODUCTION credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+60123456789  # Your approved number
```

**Save and exit**:
- Press `Ctrl+O` to save
- Press `Enter` to confirm
- Press `Ctrl+X` to exit

### 5.3 Update Code to Use Templates

You need to modify the WhatsApp sending code to use approved templates.

**Edit** `lib/whatsapp.ts`:

The current code sends freeform messages, but WhatsApp Business requires approved templates for the first message.

**Important**: After the initial template message, you can send freeform messages within a 24-hour window.

### 5.4 Restart Production Server

```bash
# Restart PM2 to load new environment variables
pm2 restart isar

# Verify it's running
pm2 logs isar --lines 20
```

---

## Step 6: Testing

### 6.1 Test via WhatsApp Test Page

1. **Navigate to**: https://isar.myopensoft.net/dashboard/whatsapp-test
2. **Enter test phone number** (your own WhatsApp number)
3. **Enter name**
4. **Click "Send Test Message"**
5. **Check WhatsApp** - you should receive the message!

### 6.2 Test Schedule Reminders

1. **Go to**: Manage Schedules
2. **Create test schedule** for tomorrow with your number
3. **Click "Send Reminders"**
4. **Verify message received**

### 6.3 Verify No "Join" Required

✅ Users should receive messages **without** needing to send "join" first
✅ This confirms you're using production WhatsApp, not sandbox

---

## Pricing & Costs

### One-Time Costs
- **Phone Number Purchase**: $1-2 USD (one time)

### Monthly Costs
- **Phone Number Rental**: $1-2 USD/month
- **WhatsApp Messages**:
  - **Malaysia**: ~$0.01-0.02 per message
  - **Business-initiated**: First message free, then $0.005-0.04 per message
  - **User-initiated**: Free for 24 hours after user messages you

### Example Cost Calculation

**Scenario**: 20 Imams/Bilals, send reminders 5 times per week

- Messages per month: 20 users × 5 reminders/week × 4 weeks = 400 messages
- Cost: 400 × $0.015 (average) = **$6 USD/month**
- Plus phone rental: **$1.50/month**
- **Total: ~$7.50 USD/month**

### Setting Budget Alerts

1. **Go to Billing**: https://console.twilio.com/billing
2. **Set up alerts**:
   - Alert at $10 USD
   - Alert at $25 USD
   - Alert at $50 USD
3. **Monitor usage**: Check monthly in Twilio Console

---

## Troubleshooting

### Issue 1: Templates Not Approved

**Problem**: Template rejected by WhatsApp
**Solution**:
- Remove promotional language
- Keep messages transactional/utility-focused
- Don't include marketing content
- Resubmit with simpler wording

### Issue 2: Messages Not Sending

**Problem**: API returns error "Template not found"
**Solution**:
- Verify template is approved (check Console)
- Use exact template name in code
- Check template language matches

### Issue 3: Number Not WhatsApp-Enabled

**Problem**: "The number is not a WhatsApp number"
**Solution**:
- Go to Console → Phone Numbers → Active Numbers
- Click the number
- Verify "WhatsApp Enabled" is checked
- If not, go to WhatsApp Senders and enable it

### Issue 4: High Costs

**Problem**: Unexpected high bills
**Solution**:
- Check message logs: Console → Monitor → Logs → Messaging
- Verify you're not sending duplicate messages
- Check for infinite loops in code
- Set up rate limiting

### Issue 5: Users Not Receiving Messages

**Problem**: Messages sent but users don't receive
**Solution**:
- Verify phone numbers have WhatsApp installed
- Check phone number format (+60 for Malaysia)
- Verify template is approved
- Check Twilio logs for delivery status

---

## Next Steps After Setup

1. ✅ **Update CLAUDE.md** with production setup details
2. ✅ **Train staff** on WhatsApp Test page usage
3. ✅ **Add all user phone numbers** to the system
4. ✅ **Send test reminders** to small group first
5. ✅ **Monitor costs** in Twilio Console weekly
6. ✅ **Collect feedback** from Imams/Bilals

---

## Support & Resources

### Twilio Documentation
- WhatsApp Business Guide: https://www.twilio.com/docs/whatsapp
- Message Templates: https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
- API Reference: https://www.twilio.com/docs/whatsapp/api

### Twilio Support
- **Support**: https://support.twilio.com
- **Community**: https://www.twilio.com/community
- **Phone**: Available in Console → Help → Contact Support

### iSAR System Support
- Test Page: https://isar.myopensoft.net/dashboard/whatsapp-test
- Documentation: See WHATSAPP_SETUP.md and CLAUDE.md

---

## Security Notes

🔒 **Keep Credentials Secret**:
- Never commit Auth Token to Git
- Keep .env file secure
- Rotate Auth Token if compromised (Twilio Console → Settings → API Keys)

🔒 **Monitor Access**:
- Only Head Imam and Admin can send messages
- Check logs regularly for unauthorized access
- Review Twilio logs weekly

🔒 **Data Privacy**:
- Phone numbers stored securely in database
- Messages contain only duty information
- Comply with Malaysian data protection laws

---

**Last Updated**: 2025-11-22
**Created By**: Claude Code
**Version**: iSAR v1.3 - Production WhatsApp Setup
