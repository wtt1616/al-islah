# iSAR Mobile App - Quick Start Guide

Step-by-step guide to get started building the iSAR mobile application.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Expo CLI** (will install if needed)
- **iOS Simulator** (Mac only) or **Android Emulator**
- **Physical device** with Expo Go app (optional but recommended)

---

## Step 1: Install Expo CLI

```bash
npm install -g expo-cli
```

**Verify installation:**
```bash
expo --version
```

---

## Step 2: Create New Expo Project

### Option A: Using Expo's TypeScript Template (Recommended)

```bash
npx create-expo-app isar-mobile --template
```

When prompted, select: **Blank (TypeScript)**

### Option B: Manual Creation

```bash
npx create-expo-app isar-mobile
cd isar-mobile
```

---

## Step 3: Install Required Dependencies

```bash
cd isar-mobile

# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# API & State Management
npm install axios
npm install @react-native-async-storage/async-storage
npm install @reduxjs/toolkit react-redux

# UI Components
npm install react-native-paper
npm install react-native-vector-icons

# Date Handling
npm install date-fns

# Form Handling
npm install react-hook-form

# Utilities
npm install @react-native-community/netinfo
npm install @react-native-community/datetimepicker
npm install @react-native-picker/picker
```

---

## Step 4: Project Structure Setup

Create the following folder structure:

```
isar-mobile/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── schedules.ts
│   │   ├── availability.ts
│   │   ├── profile.ts
│   │   └── users.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── schedule/
│   │   │   ├── ScheduleCard.tsx
│   │   │   └── ScheduleList.tsx
│   │   └── availability/
│   │       └── AvailabilityForm.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── imam/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ScheduleScreen.tsx
│   │   │   ├── AvailabilityScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── headimam/
│   │       ├── ManageScheduleScreen.tsx
│   │       └── GenerateScheduleScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── ImamNavigator.tsx
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── scheduleSlice.ts
│   │   │   └── availabilitySlice.ts
│   │   └── store.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── validators.ts
│   └── constants/
│       ├── colors.ts
│       ├── config.ts
│       └── prayerTimes.ts
├── assets/
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

**Create folders:**
```bash
mkdir -p src/{api,components/{common,schedule,availability},screens/{auth,imam,headimam},navigation,store/slices,types,utils,constants}
```

---

## Step 5: Configuration Files

### 5.1 Update `app.json`

```json
{
  "expo": {
    "name": "iSAR Mobile",
    "slug": "isar-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.isar.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.isar.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-async-storage/async-storage"
    ]
  }
}
```

### 5.2 Update `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 5.3 Create `babel.config.js`

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
```

**Install babel plugin:**
```bash
npm install --save-dev babel-plugin-module-resolver
```

---

## Step 6: Core Files Setup

### 6.1 API Client (`src/api/client.ts`)

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000'  // Change to your local IP
  : 'https://isar.myopensoft.net';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('session_token');
    if (token) {
      config.headers.Cookie = `next-auth.session-token=${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 6.2 Types (`src/types/index.ts`)

```typescript
export type UserRole = 'admin' | 'head_imam' | 'imam' | 'bilal';
export type PrayerTime = 'Subuh' | 'Zohor' | 'Asar' | 'Maghrib' | 'Isyak';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Schedule {
  id: number;
  date: string;
  prayer_time: PrayerTime;
  imam_id: number;
  bilal_id: number;
  imam_name?: string;
  bilal_name?: string;
  week_number: number;
  year: number;
  is_auto_generated: boolean;
}

export interface Availability {
  id: number;
  user_id: number;
  user_name?: string;
  date: string;
  prayer_time: PrayerTime;
  is_available: boolean;
  reason?: string;
}
```

### 6.3 Constants (`src/constants/prayerTimes.ts`)

```typescript
export const PRAYER_TIMES = [
  { label: 'Subuh', value: 'Subuh' },
  { label: 'Zohor', value: 'Zohor' },
  { label: 'Asar', value: 'Asar' },
  { label: 'Maghrib', value: 'Maghrib' },
  { label: 'Isyak', value: 'Isyak' },
] as const;

export const PRAYER_TIME_LABELS: Record<string, string> = {
  Subuh: 'Subuh (Dawn)',
  Zohor: 'Zohor (Midday)',
  Asar: 'Asar (Afternoon)',
  Maghrib: 'Maghrib (Sunset)',
  Isyak: 'Isyak (Night)',
};
```

### 6.4 Colors (`src/constants/colors.ts`)

```typescript
export const colors = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  accent: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
};
```

### 6.5 Redux Store (`src/store/store.ts`)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import scheduleReducer from './slices/scheduleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 6.6 Auth Slice (`src/store/slices/authSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
```

### 6.7 Main App (`App.tsx`)

```typescript
import React from 'react';
import { Provider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
}
```

---

## Step 7: Auth Service (`src/api/auth.ts`)

```typescript
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post('/api/auth/signin', credentials);

    const sessionToken = response.headers['set-cookie']
      ?.find(cookie => cookie.startsWith('next-auth.session-token'))
      ?.split(';')[0]
      ?.split('=')[1];

    if (sessionToken) {
      await AsyncStorage.setItem('session_token', sessionToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/signout');
    await AsyncStorage.removeItem('session_token');
    await AsyncStorage.removeItem('user');
  },

  getCachedUser: async (): Promise<User | null> => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },
};
```

---

## Step 8: Login Screen (`src/screens/auth/LoginScreen.tsx`)

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { authService } from '../../api/auth';
import { setUser } from '../../store/slices/authSlice';
import { colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login({ email, password });
      dispatch(setUser(user));
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        iSAR Mobile
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Prayer Schedule Management
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: colors.textSecondary,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
```

---

## Step 9: Navigation Setup (`src/navigation/AppNavigator.tsx`)

```typescript
import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setUser, clearUser, setLoading } from '../store/slices/authSlice';
import { authService } from '../api/auth';

import LoginScreen from '../screens/auth/LoginScreen';
import ImamNavigator from './ImamNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for cached user on app start
    const checkAuth = async () => {
      const cachedUser = await authService.getCachedUser();
      if (cachedUser) {
        dispatch(setUser(cachedUser));
      } else {
        dispatch(setLoading(false));
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return null; // Or show splash screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={ImamNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

---

## Step 10: Run the App

### For iOS (Mac only)

```bash
npm start
# Press 'i' for iOS simulator
```

### For Android

```bash
npm start
# Press 'a' for Android emulator
```

### For Physical Device

1. Install **Expo Go** app from App Store or Google Play
2. Run: `npm start`
3. Scan QR code with Expo Go app

---

## Step 11: Test Login

Use these credentials to test:

| Email | Password | Role |
|-------|----------|------|
| imam1@isar.com | admin123 | Imam |
| bilal1@isar.com | admin123 | Bilal |
| headimam@isar.com | admin123 | Head Imam |

---

## Next Steps

Now that you have the basic setup:

1. ✅ Create Schedule screens
2. ✅ Create Availability screens
3. ✅ Create Profile screens
4. ✅ Add bottom tab navigation
5. ✅ Implement remaining API services
6. ✅ Add pull-to-refresh
7. ✅ Add offline support
8. ✅ Style components

---

## Troubleshooting

### Cannot connect to API

**Problem:** API requests fail with network error

**Solutions:**
1. Check `src/api/client.ts` has correct IP address
2. Make sure your phone and computer are on same WiFi
3. Find your computer's IP:
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
4. Update `API_BASE_URL` in `client.ts`

### Expo Go shows error

**Problem:** App crashes on Expo Go

**Solutions:**
1. Make sure all dependencies are installed: `npm install`
2. Clear cache: `expo start -c`
3. Restart Metro bundler

### TypeScript errors

**Problem:** Import path errors

**Solutions:**
1. Restart TypeScript server in your editor
2. Run: `npm install --save-dev @types/node @types/react`

---

## Useful Commands

```bash
# Start development server
npm start

# Clear cache and restart
expo start -c

# Run on specific platform
npm run ios
npm run android
npm run web

# Check for issues
npx expo-doctor

# Update dependencies
npx expo install --fix
```

---

## Resources

- **Expo Documentation:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org
- **React Native Paper:** https://callstack.github.io/react-native-paper
- **iSAR API Docs:** See `docs/API_DOCUMENTATION_MOBILE.md`

---

**Next:** Check `docs/MOBILE_APP_PLAN.md` for full feature roadmap and timeline.
