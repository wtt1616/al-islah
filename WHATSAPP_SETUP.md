# WhatsApp Notification Setup Guide

This guide will help you set up WhatsApp notifications for prayer duty reminders using Twilio.

## Overview

The iSAR system can send automatic WhatsApp reminders to Imams and Bilals about their prayer duties. This feature uses Twilio's WhatsApp Business API.

## Prerequisites

1. A Twilio account (free trial available)
2. Phone numbers for all Imams and Bilals in the system
3. WhatsApp installed on their phones

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get **$15 free credit** for testing!

## Step 2: Get Your Twilio Credentials

1. After logging in, go to the Twilio Console
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these values - you'll need them for configuration

## Step 3: Set Up WhatsApp Sandbox (For Testing)

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the WhatsApp Sandbox:
   - Send a WhatsApp message to the number shown (usually +1 415 523 8886)
   - Send the code they provide (e.g., "join <your-code>")
3. Your phone is now connected to the sandbox!

**Important:** For testing, everyone who will receive messages must join the sandbox by sending this WhatsApp message.

## Step 4: Configure iSAR

1. Open your `.env` file (or `.env.local` for local development)

2. Add these lines:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC...your_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

3. Restart your application:

```bash
# Local development
npm run dev

# Production
npm run build
pm2 restart isar
```

## Step 5: Add Phone Numbers to Users

1. Log in as Admin
2. Go to **Manage Users**
3. Edit each Imam/Bilal and add their phone number
4. Use format: `01XXXXXXXX` (Malaysian mobile number)
   - Example: `0123456789`
   - System will automatically convert to +60123456789

## Step 6: Test the System

1. Log in as Head Imam or Admin
2. Go to **Manage Schedule**
3. There will be a "Send Reminders" button
4. Click "Test WhatsApp" and enter a phone number to test
5. Check if the WhatsApp message is received

## How to Use

### Manual Reminders

From the **Manage Schedule** page, you can:

1. **Send reminders for a specific date:**
   - Select a date
   - Click "Send Reminders for [Date]"
   - All Imams/Bilals scheduled for that day will receive reminders

2. **Send reminders for selected schedules:**
   - Select specific prayer slots
   - Click "Send Selected Reminders"
   - Only the selected people will receive reminders

### Automated Reminders (Optional)

You can set up automatic daily reminders:
- Reminders will be sent 24 hours before each person's duty
- This requires setting up a cron job (instructions below)

## Message Format

Recipients will receive a WhatsApp message like this:

```
🕌 iSAR Prayer Duty Reminder

السلام عليكم ورحمة الله وبركاته

Dear Ahmad bin Ali,

This is a reminder that you have been assigned as Imam for:

📅 Date: Saturday, 23 November 2025
🕌 Prayer: Subuh

جزاك الله خيرا
May Allah reward you for your service.

_This is an automated reminder from iSAR System_
```

## Production Setup (After Testing)

### Option 1: Continue with Sandbox (Free, but limited)
- Works fine for small mosque
- Recipients must join the sandbox
- Limited to 50 messages/day

### Option 2: Get Approved WhatsApp Number ($$$)
1. In Twilio Console, request a WhatsApp-enabled phone number
2. Submit your business information to Meta for approval
3. Create and get approval for message templates
4. Update `TWILIO_WHATSAPP_NUMBER` in `.env`

**Cost:** 
- WhatsApp number: ~$2/month
- Messages: $0.005-0.02 per message
- For 100 imams/bilals × 5 prayers/day = ~$7.50-30/month

### Option 3: Use Twilio's Pay-as-You-Go
- No monthly fees
- Only pay for messages sent
- Perfect for mosques with moderate usage

## Troubleshooting

### "WhatsApp not configured" error
- Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in `.env`
- Restart the application after adding credentials

### Messages not being received
1. Check that the recipient joined the sandbox (for testing)
2. Verify the phone number format is correct
3. Check Twilio console logs for delivery status
4. Ensure the recipient has WhatsApp installed

### "Failed to send" error
- Check Twilio account balance (free trial credit)
- Verify the phone number is WhatsApp-enabled
- Check Twilio console for error messages

## Cost Estimation

**Example for medium-sized mosque:**
- 20 Imams + 20 Bilals = 40 people
- 5 prayers per day = 200 potential reminders/day
- If sending reminders 1 day before = ~200 messages/day

**Monthly cost:**
- 200 messages/day × 30 days = 6,000 messages
- At $0.005/message = **$30/month**
- At $0.01/message = **$60/month**

**Recommendation:** Start with the free sandbox for testing, then decide based on your needs.

## Security Notes

1. Never commit `.env` file to git
2. Keep your `TWILIO_AUTH_TOKEN` secret
3. Rotate your auth token periodically in Twilio console
4. Only Head Imam and Admin can send notifications

## Support

For issues with:
- **iSAR System:** Contact your system administrator
- **Twilio Account:** Visit https://support.twilio.com/
- **WhatsApp Business API:** Visit https://www.twilio.com/docs/whatsapp

## Alternative Options

If Twilio doesn't work for you, consider:

1. **WhatsApp Business API (Meta Cloud)** - Free, but requires Meta business verification
2. **MessageBird** - Similar to Twilio
3. **SMS Fallback** - Use regular SMS instead of WhatsApp
4. **Email Notifications** - Simpler but less immediate

---

**Need Help?** Contact your system administrator or refer to Twilio's documentation at https://www.twilio.com/docs/whatsapp
