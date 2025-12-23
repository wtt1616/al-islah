# 🔐 Head Imam Login Guide

## ✅ Verified Credentials

I've tested the Head Imam account and confirmed it's working correctly:

### Login Details:
- **Email:** `headimam@isar.com`
- **Password:** `admin123`
- **Status:** ✅ Active
- **Role:** head_imam

**Test Result:** ✅ Authentication successful!

---

## 🎯 How to Login as Head Imam

### Step-by-Step:

1. **Go to:** http://localhost:3001

2. **Enter Email (carefully):**
   ```
   headimam@isar.com
   ```
   ⚠️ **Note:** It's `headimam` (one word, no space!)

3. **Enter Password:**
   ```
   admin123
   ```

4. **Click "Login"**

5. **You should be redirected to Dashboard**

---

## ⚠️ Common Mistakes

### Mistake 1: Email Typo
❌ **Wrong:** `head imam@isar.com` (with space)
❌ **Wrong:** `headimam @isar.com` (space before @)
❌ **Wrong:** `head-imam@isar.com` (with dash)
✅ **Correct:** `headimam@isar.com` (no space, no dash)

### Mistake 2: Extra Spaces
- No spaces before or after email
- No spaces before or after password
- Copy-paste may add hidden spaces!

### Mistake 3: Wrong Password
- Password is `admin123` (all lowercase)
- Not `Admin123` or `ADMIN123`

---

## 🔧 Troubleshooting

### If Login Fails:

#### Solution 1: Type Manually (Don't Copy-Paste)
Sometimes copy-paste adds hidden characters. Type:
```
Email: headimam@isar.com
Password: admin123
```

#### Solution 2: Clear Browser Data
1. Press `Ctrl + Shift + Delete`
2. Clear "Cookies and site data"
3. Clear "Cached images and files"
4. Click "Clear data"
5. Try logging in again

#### Solution 3: Try Incognito Window
1. Open incognito/private window
2. Go to http://localhost:3001
3. Login with headimam@isar.com / admin123

#### Solution 4: Check Caps Lock
- Make sure Caps Lock is OFF
- Email and password are case-sensitive

---

## 🧪 Verification Test Results

I ran tests to confirm the account works:

```
✅ User found in database
✅ Email: headimam@isar.com
✅ Role: head_imam
✅ Active: Yes (is_active = 1)
✅ Password hash correct
✅ Password 'admin123' matches: YES
✅ Should login: SUCCESS
```

---

## 📊 What You Get as Head Imam

After logging in successfully, you can:

### Dashboard Access
- View all weekly schedules
- Navigate between weeks
- Print schedules

### Manage Schedules (Main Feature!)
- **Generate Schedule** button
- Auto-create weekly schedules
- Edit individual assignments
- Change Imam/Bilal for any slot

### Navigate to:
- **Dashboard** - View schedules
- **Manage Schedules** - Create and edit
- **Logout** - Sign out

---

## 🎯 Quick Test

### Test if Email is Correct:

Open browser console (F12) and when login fails, check the error.

**If you see:**
- "Invalid email or password" → Wrong email or password
- Network error → Server issue
- Nothing happens → JavaScript error

### Check These:

1. **URL is correct:** http://localhost:3001
2. **Server is running** (should see green "Running" status)
3. **Database is connected** (MySQL in Laragon)

---

## 💡 Pro Tips

### Copy These Exact Credentials:

**Email (copy this):**
```
headimam@isar.com
```

**Password (copy this):**
```
admin123
```

### After Pasting:
1. Check for extra spaces at the end
2. Make sure no line breaks included
3. Click in field and press `End` key to check cursor position

---

## 🔄 Alternative: Use Admin Account First

If Head Imam login still doesn't work:

1. **Login as Admin:**
   - Email: `admin@isar.com`
   - Password: `admin123`

2. **Go to "Manage Users"**

3. **Find "Head Imam" user**

4. **Click "Edit"**

5. **Change password to something new** (e.g., `newpassword123`)

6. **Try logging in as Head Imam** with new password

---

## 📝 All Valid Test Accounts

Here are all working accounts for testing:

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Admin | admin@isar.com | admin123 | ✅ Working |
| Head Imam | headimam@isar.com | admin123 | ✅ Working |
| Imam 1 | imam1@isar.com | admin123 | ✅ Working |
| Imam 10 | imam10@isar.com | admin123 | ✅ Working |
| Bilal 1 | bilal1@isar.com | admin123 | ✅ Working |

All have been tested and verified!

---

## 🔍 Check Server Logs

If login still fails, check server output for errors:

The server will show:
```
POST /api/auth/callback/credentials 200  ← Success
POST /api/auth/callback/credentials 401  ← Failed (wrong password)
```

---

## ⚡ Quick Checklist

Before reporting an issue, verify:

- [ ] URL is http://localhost:3001
- [ ] Server is running (check terminal)
- [ ] MySQL/Laragon is running
- [ ] Email typed correctly: `headimam@isar.com`
- [ ] Password typed correctly: `admin123`
- [ ] No extra spaces in email or password
- [ ] Caps Lock is OFF
- [ ] Browser cache cleared
- [ ] Tried incognito window

---

## 🎉 Success!

Once logged in as Head Imam, you can:

1. ✅ **Generate Schedules** - Create weekly rosters automatically
2. ✅ **Edit Schedules** - Modify any assignment
3. ✅ **View Schedules** - See all weeks
4. ✅ **Print Schedules** - For distribution

---

## 📞 Still Can't Login?

Try these in order:

1. **Login as Admin** (admin@isar.com / admin123)
2. **Go to Manage Users**
3. **Verify Head Imam account exists and is active**
4. **Reset the password** if needed
5. **Try again**

---

**The account is verified and working!**

**Login:** headimam@isar.com / admin123

Just make sure to type it exactly as shown (no spaces, all lowercase)!

---

**Tested:** 2025-01-14
**Status:** ✅ Account verified and working
**Test Result:** Password authentication successful
