# iSAR Mobile App Development Plan

## Executive Summary

This document outlines the comprehensive plan for developing a mobile application for the iSAR system to enable Imams and Bilals to manage their availability and view schedules, and allow Head Imams to manage schedules via mobile devices.

---

## Table of Contents

1. [Current System Analysis](#current-system-analysis)
2. [Mobile App Requirements](#mobile-app-requirements)
3. [Technology Recommendations](#technology-recommendations)
4. [API Readiness Assessment](#api-readiness-assessment)
5. [Mobile App Architecture](#mobile-app-architecture)
6. [Feature Breakdown](#feature-breakdown)
7. [Development Roadmap](#development-roadmap)
8. [Security Considerations](#security-considerations)
9. [Deployment Strategy](#deployment-strategy)

---

## Current System Analysis

### Existing Backend Infrastructure

The iSAR system currently has a **well-structured REST API** built with Next.js API routes that can support mobile apps with minimal modifications.

#### Available API Endpoints

| Endpoint | Method | Purpose | Mobile Ready |
|----------|--------|---------|--------------|
| `/api/auth/[...nextauth]` | POST | Login authentication | ✅ Yes |
| `/api/availability` | GET, POST | Fetch/Submit availability | ✅ Yes |
| `/api/availability/[id]` | PUT, DELETE | Update/Delete availability | ✅ Yes |
| `/api/schedules` | GET, POST | Fetch/Create schedules | ✅ Yes |
| `/api/schedules/[id]` | PUT, DELETE | Update/Delete schedules | ✅ Yes |
| `/api/schedules/generate` | POST | Auto-generate weekly schedule | ✅ Yes |
| `/api/profile` | GET, PUT | User profile management | ✅ Yes |
| `/api/profile/change-password` | PUT | Change password | ✅ Yes |
| `/api/users` | GET, POST | User management (admin) | ✅ Yes |
| `/api/users/[id]` | PUT, DELETE | Update/Delete users | ✅ Yes |

### Database Schema

**Existing tables support all mobile features:**
- `users` - User accounts with roles
- `prayer_times` - 5 daily prayers (Subuh, Zohor, Asar, Maghrib, Isyak)
- `availability` - Unavailability tracking
- `schedules` - Prayer schedule assignments

---

## Mobile App Requirements

### User Roles & Features

#### 1. **Imam/Bilal Users**
- ✅ Login with email/password
- ✅ View their assigned schedules (daily/weekly)
- ✅ Submit unavailability for specific dates/prayer times
- ✅ View/edit/delete their unavailability records
- ✅ View profile and change password
- 📱 Push notifications for schedule assignments (new feature)
- 📱 Calendar view of schedules (new feature)

#### 2. **Head Imam**
- ✅ All Imam/Bilal features
- ✅ View all schedules
- ✅ Generate weekly schedules automatically
- ✅ Manually edit schedule assignments
- ✅ View all users' availability
- 📱 Dashboard with schedule distribution statistics (new feature)

#### 3. **Admin**
- ✅ All Head Imam features
- ✅ User management (add/edit/delete users)
- 📱 System analytics (new feature)

---

## Technology Recommendations

### Option 1: React Native + Expo (RECOMMENDED)

**Pros:**
- ✅ Single codebase for iOS & Android
- ✅ Fast development with Expo Go for testing
- ✅ Large community & extensive libraries
- ✅ Easy integration with existing Next.js API
- ✅ Hot reload & quick iterations
- ✅ Can use existing React/TypeScript knowledge
- ✅ Good performance for this use case

**Cons:**
- ❌ Slightly larger app size than native
- ❌ Some native modules require custom development

**Best For:** Fast development, cross-platform deployment, team familiar with React

---

### Option 2: Flutter

**Pros:**
- ✅ Excellent performance
- ✅ Beautiful native-looking UI
- ✅ Single codebase
- ✅ Strong typing with Dart

**Cons:**
- ❌ New language to learn (Dart)
- ❌ Longer learning curve

**Best For:** Team wants to learn new technology, prioritize performance

---

### Option 3: Native Apps (Swift/Kotlin)

**Pros:**
- ✅ Best performance
- ✅ Full access to platform features

**Cons:**
- ❌ Need to maintain 2 separate codebases
- ❌ 2x development time
- ❌ 2x maintenance cost

**Best For:** Large budget, dedicated mobile teams

---

### **RECOMMENDATION: React Native + Expo**

**Reasons:**
1. Your team already uses React & TypeScript
2. Fastest time to market
3. Single codebase = easier maintenance
4. Existing API is ready to use
5. Cost-effective solution

---

## API Readiness Assessment

### ✅ **APIs Ready for Mobile (No Changes Needed)**

1. **Authentication** - `app/api/auth/[...nextauth]/route.ts`
   - JWT-based session management
   - Works perfectly with mobile apps

2. **Availability Management** - `app/api/availability/route.ts`
   - GET: Fetch availability (supports filtering by user, date range)
   - POST: Submit new unavailability
   - Proper authorization checks

3. **Schedule Management** - `app/api/schedules/route.ts`
   - GET: Fetch schedules (supports week/date filtering)
   - POST: Create schedules (Head Imam only)
   - Returns all needed data (Imam/Bilal names, dates, prayer times)

4. **Schedule Generation** - `app/api/schedules/generate/route.ts`
   - POST: Auto-generate weekly schedules
   - Smart algorithm with availability checking

5. **Profile Management** - `app/api/profile/route.ts`
   - GET/PUT: View and update user profile
   - Password change functionality

---

### 🔧 **Recommended API Enhancements (Optional)**

These would improve mobile UX but are not critical:

1. **Add Mobile-Optimized Endpoints**

   ```typescript
   // /api/mobile/dashboard - Get user's summary
   GET /api/mobile/dashboard
   {
     "upcoming_schedules": [...],  // Next 7 days
     "pending_availability": [...], // Dates needing input
     "stats": {
       "this_week_count": 3,
       "this_month_count": 12
     }
   }
   ```

2. **Add Push Notification Endpoints**

   ```typescript
   // /api/notifications/register - Register device token
   POST /api/notifications/register
   {
     "device_token": "...",
     "platform": "ios|android"
   }

   // /api/notifications/send - Send notifications
   POST /api/notifications/send
   ```

3. **Add Bulk Availability Submission**

   ```typescript
   // /api/availability/bulk - Submit multiple dates at once
   POST /api/availability/bulk
   {
     "dates": ["2025-11-20", "2025-11-21"],
     "prayer_times": ["Subuh", "Zohor"],
     "is_available": false,
     "reason": "Out of town"
   }
   ```

---

## Mobile App Architecture

### Technology Stack (React Native + Expo)

```
Mobile App Stack:
├── Frontend Framework: React Native 0.74+ with Expo SDK 51+
├── Language: TypeScript
├── State Management: Redux Toolkit or Zustand
├── Navigation: React Navigation 6
├── API Client: Axios or Fetch API
├── Authentication: AsyncStorage for JWT tokens
├── UI Components: React Native Paper or NativeBase
├── Date Handling: date-fns (already used in backend)
├── Push Notifications: Expo Notifications
└── Build Tool: EAS Build
```

### Project Structure

```
isar-mobile/
├── src/
│   ├── api/                  # API client & endpoints
│   │   ├── auth.ts
│   │   ├── schedules.ts
│   │   ├── availability.ts
│   │   └── client.ts        # Axios config
│   ├── components/          # Reusable components
│   │   ├── ScheduleCard.tsx
│   │   ├── PrayerTimeSelector.tsx
│   │   ├── DatePicker.tsx
│   │   └── LoadingSpinner.tsx
│   ├── screens/             # App screens
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── imam-bilal/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ScheduleScreen.tsx
│   │   │   ├── AvailabilityScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── head-imam/
│   │       ├── ManageScheduleScreen.tsx
│   │       ├── GenerateScheduleScreen.tsx
│   │       └── OverviewScreen.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── store/              # State management
│   │   ├── authSlice.ts
│   │   ├── scheduleSlice.ts
│   │   └── store.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── utils/              # Helper functions
│   │   ├── dateUtils.ts
│   │   └── validators.ts
│   └── constants/          # App constants
│       ├── colors.ts
│       └── config.ts
├── assets/                 # Images, fonts
├── app.json               # Expo config
├── package.json
└── tsconfig.json
```

---

## Feature Breakdown

### Phase 1: Core Features (MVP - 4-6 weeks)

#### Week 1-2: Foundation
- [ ] Project setup with Expo
- [ ] API client configuration
- [ ] Authentication flow (login/logout)
- [ ] Navigation structure
- [ ] Basic UI components

#### Week 3-4: Imam/Bilal Features
- [ ] Dashboard with upcoming schedules
- [ ] Schedule viewing (weekly/daily)
- [ ] Availability submission form
- [ ] View/edit/delete availability
- [ ] Profile view & password change

#### Week 5-6: Head Imam Features
- [ ] Schedule management view
- [ ] Generate weekly schedule
- [ ] Edit schedule assignments
- [ ] View all users' availability

**Deliverable:** Functional mobile app with all core features

---

### Phase 2: Enhanced UX (2-3 weeks)

- [ ] Calendar view for schedules
- [ ] Filter schedules by prayer time
- [ ] Search functionality
- [ ] Pull-to-refresh
- [ ] Offline mode (cache data)
- [ ] Better error handling & loading states
- [ ] Improved UI/UX polish

**Deliverable:** Production-ready app with enhanced user experience

---

### Phase 3: Advanced Features (3-4 weeks)

- [ ] Push notifications
  - Schedule assignments
  - Schedule changes
  - Availability reminders
- [ ] Dashboard statistics
- [ ] Bulk availability submission
- [ ] Export schedules (PDF/Share)
- [ ] Dark mode
- [ ] Multi-language support (Malay/English)

**Deliverable:** Full-featured mobile app

---

## Security Considerations

### Authentication & Authorization

1. **JWT Token Storage**
   ```typescript
   // Store in AsyncStorage (encrypted on iOS)
   import AsyncStorage from '@react-native-async-storage/async-storage';

   await AsyncStorage.setItem('auth_token', token);
   ```

2. **API Security**
   - All API calls include Authorization header
   - Token refresh mechanism
   - Automatic logout on 401 errors

3. **Data Encryption**
   - Use HTTPS for all API calls
   - Encrypt sensitive data in AsyncStorage
   - Implement certificate pinning (optional)

4. **Input Validation**
   - Validate all user inputs on client
   - Server-side validation remains primary defense

---

## Deployment Strategy

### Development Setup

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new Expo project
npx create-expo-app isar-mobile --template

# Install dependencies
cd isar-mobile
npm install @react-navigation/native @react-navigation/stack
npm install axios react-native-paper date-fns
npm install @react-native-async-storage/async-storage
npm install redux @reduxjs/toolkit react-redux
```

### Testing

1. **Local Testing**
   - Expo Go app on physical devices
   - iOS Simulator / Android Emulator

2. **Beta Testing**
   - TestFlight (iOS)
   - Internal Testing (Android)

### Production Deployment

1. **iOS App Store**
   - EAS Build for iOS
   - App Store Connect submission
   - Apple Developer Account required ($99/year)

2. **Google Play Store**
   - EAS Build for Android
   - Google Play Console submission
   - Google Play Developer Account ($25 one-time)

### CI/CD Pipeline

```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile App Deploy

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
      - run: npm install
      - run: eas build --platform all
```

---

## API Integration Example

### Authentication Service

```typescript
// src/api/auth.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://isar.myopensoft.net';

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/api/auth/callback/credentials`, {
    email,
    password,
  });

  const { token, user } = response.data;

  // Store token
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));

  return { token, user };
};

export const logout = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user');
};
```

### Schedule Service

```typescript
// src/api/schedules.ts
import { apiClient } from './client';

export const getSchedules = async (startDate: string, endDate: string) => {
  const response = await apiClient.get('/api/schedules', {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
};

export const generateSchedule = async (startDate: string) => {
  const response = await apiClient.post('/api/schedules/generate', {
    start_date: startDate
  });
  return response.data;
};
```

---

## Cost Estimation

### Development Costs

| Item | Time | Cost (if outsourced) |
|------|------|---------------------|
| Phase 1 (MVP) | 4-6 weeks | $8,000 - $15,000 |
| Phase 2 (Enhanced) | 2-3 weeks | $4,000 - $7,500 |
| Phase 3 (Advanced) | 3-4 weeks | $6,000 - $10,000 |
| **Total** | **9-13 weeks** | **$18,000 - $32,500** |

### Operational Costs (Annual)

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer | $25 (one-time) |
| Push Notification Service (Firebase) | Free (up to 10k users) |
| **Total Year 1** | **~$124** |
| **Total Year 2+** | **~$99/year** |

---

## Next Steps

### Immediate Actions

1. **Decide on Technology Stack**
   - Recommended: React Native + Expo
   - Alternative: Flutter

2. **Set Up Development Environment**
   - Install Expo CLI
   - Create new mobile project
   - Configure API connection

3. **Create Mobile Project Structure**
   - Initialize Git repository
   - Set up folder structure
   - Configure TypeScript

4. **Start Phase 1 Development**
   - Authentication flow
   - Basic UI components
   - API integration

### Questions to Consider

1. **Do you want both iOS and Android?**
   - Yes → React Native or Flutter
   - iOS only → Can use React Native or native Swift

2. **What's your timeline?**
   - 3 months → MVP (Phase 1)
   - 4-5 months → MVP + Enhanced UX (Phase 1+2)
   - 6+ months → Full featured (All phases)

3. **Who will develop it?**
   - In-house team → Need React/React Native training?
   - Outsource → Need to hire developers
   - Hybrid → Provide detailed specifications

4. **Budget constraints?**
   - Limited → Start with MVP only
   - Moderate → MVP + Phase 2
   - Flexible → All phases

---

## Alternative: Progressive Web App (PWA)

### If you want faster/cheaper option:

**Convert existing Next.js web app to PWA:**

**Pros:**
- ✅ Much faster development (1-2 weeks)
- ✅ Works on all devices
- ✅ No app store approval needed
- ✅ Instant updates
- ✅ Lower cost (~$2,000-$5,000)

**Cons:**
- ❌ No push notifications on iOS
- ❌ Limited offline functionality
- ❌ Less "native" feel
- ❌ Not in app stores (install via browser)

**Implementation:**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // existing config
})
```

---

## Conclusion

The iSAR system's **backend is mobile-ready** with minimal changes required. The existing API endpoints support all core mobile features.

**Recommended Path:**
1. Start with **React Native + Expo** for cross-platform mobile app
2. Develop **Phase 1 (MVP)** first - 4-6 weeks
3. Test with real users
4. Add **Phase 2 & 3** features based on feedback

**Alternative Quick Win:**
- Convert to **PWA** in 1-2 weeks for immediate mobile access
- Develop native app later if needed

---

**Document Version:** 1.0
**Created:** 2025-11-19
**Author:** Claude Code
**Next Review:** After technology stack decision
