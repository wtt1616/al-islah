# iSAR Mobile API Documentation

Complete API reference for mobile app developers building iOS/Android applications for the iSAR system.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Overview

### Base URL

**Production:**
```
https://isar.myopensoft.net
```

**Local Development:**
```
http://localhost:3000
```

### Authentication Method

The API uses **session-based authentication** with JWT tokens via NextAuth.js.

All protected endpoints require:
- Valid session cookie (web) or
- Authorization header with JWT token (mobile)

### Content Type

All requests and responses use `application/json`.

### API Versioning

Current version: **v1** (no version prefix required)

---

## Authentication

### Login

Authenticate a user and receive a session token.

**Endpoint:** `POST /api/auth/signin`

**Request Body:**
```json
{
  "email": "imam1@isar.com",
  "password": "admin123"
}
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "3",
    "name": "Imam 1",
    "email": "imam1@isar.com",
    "role": "imam"
  },
  "expires": "2025-12-19T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid credentials |
| 400 | Missing email or password |
| 500 | Server error |

**Example Error:**
```json
{
  "error": "Invalid credentials"
}
```

---

### Get Current Session

Retrieve current authenticated user's session.

**Endpoint:** `GET /api/auth/session`

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "3",
    "name": "Imam 1",
    "email": "imam1@isar.com",
    "role": "imam"
  },
  "expires": "2025-12-19T00:00:00.000Z"
}
```

**Unauthorized Response (401):**
```json
{}
```

---

### Logout

End user session.

**Endpoint:** `POST /api/auth/signout`

**Success Response (200 OK):**
```json
{
  "url": "/login"
}
```

---

## API Endpoints

### Schedules

#### Get Schedules

Fetch prayer schedules with optional filtering.

**Endpoint:** `GET /api/schedules`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `week_number` | integer | No | Week number (1-53) |
| `year` | integer | No | Year (e.g., 2025) |
| `start_date` | string | No | Start date (YYYY-MM-DD) |
| `end_date` | string | No | End date (YYYY-MM-DD) |

**Note:** Use either (`week_number` + `year`) OR (`start_date` + `end_date`)

**Example Request:**
```
GET /api/schedules?start_date=2025-11-20&end_date=2025-11-26
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2025-11-20T00:00:00.000Z",
    "prayer_time": "Subuh",
    "imam_id": 3,
    "bilal_id": 5,
    "week_number": 47,
    "year": 2025,
    "is_auto_generated": true,
    "created_by": 2,
    "imam_name": "Imam 1",
    "bilal_name": "Bilal 1"
  },
  {
    "id": 2,
    "date": "2025-11-20T00:00:00.000Z",
    "prayer_time": "Zohor",
    "imam_id": 4,
    "bilal_id": 6,
    "week_number": 47,
    "year": 2025,
    "is_auto_generated": true,
    "created_by": 2,
    "imam_name": "Imam 2",
    "bilal_name": "Bilal 2"
  }
]
```

**Authorization:** All authenticated users

---

#### Create Schedule

Create a new schedule entry (Head Imam/Admin only).

**Endpoint:** `POST /api/schedules`

**Request Body:**
```json
{
  "date": "2025-11-20",
  "prayer_time": "Subuh",
  "imam_id": 3,
  "bilal_id": 5,
  "week_number": 47,
  "year": 2025,
  "is_auto_generated": false
}
```

**Success Response (201 Created):**
```json
{
  "message": "Schedule created successfully",
  "id": 123
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (not head_imam or admin) |
| 400 | Duplicate entry for date/prayer time |
| 500 | Server error |

**Authorization:** `head_imam`, `admin`

---

#### Update Schedule

Update an existing schedule (Head Imam/Admin only).

**Endpoint:** `PUT /api/schedules/:id`

**Request Body:**
```json
{
  "imam_id": 4,
  "bilal_id": 6
}
```

**Success Response (200 OK):**
```json
{
  "message": "Schedule updated successfully"
}
```

**Notes:**
- Updates automatically set `is_auto_generated` to `false`
- Updates `modified_by` to current user's ID

**Authorization:** `head_imam`, `admin`

---

#### Delete Schedule

Delete a schedule entry (Head Imam/Admin only).

**Endpoint:** `DELETE /api/schedules/:id`

**Success Response (200 OK):**
```json
{
  "message": "Schedule deleted successfully"
}
```

**Authorization:** `head_imam`, `admin`

---

#### Generate Weekly Schedule

Auto-generate schedules for an entire week (Head Imam/Admin only).

**Endpoint:** `POST /api/schedules/generate`

**Request Body:**
```json
{
  "start_date": "2025-11-20"
}
```

**Notes:**
- Start date can be any day; system auto-adjusts to Wednesday of that week
- Fails if schedules already exist for that week
- Automatically assigns Imam and Bilal based on availability
- Creates 35 schedule entries (7 days × 5 prayers)

**Success Response (201 Created):**
```json
{
  "message": "Weekly schedule generated successfully",
  "count": 35,
  "start_date": "2025-11-20",
  "end_date": "2025-11-26"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Schedules already exist for this week |
| 400 | Missing start_date |
| 500 | Not enough Imams or Bilals available |

**Authorization:** `head_imam`, `admin`

---

### Availability

#### Get Availability

Fetch availability records with filtering.

**Endpoint:** `GET /api/availability`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | No | Filter by user ID |
| `date` | string | No | Specific date (YYYY-MM-DD) |
| `start_date` | string | No | Date range start |
| `end_date` | string | No | Date range end |
| `is_available` | boolean | No | Filter by availability status |

**Example Request:**
```
GET /api/availability?user_id=3&start_date=2025-11-20&end_date=2025-11-26
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 3,
    "user_name": "Imam 1",
    "date": "2025-11-22",
    "prayer_time": "Subuh",
    "is_available": false,
    "reason": "Out of town",
    "created_at": "2025-11-19T10:00:00.000Z",
    "updated_at": "2025-11-19T10:00:00.000Z"
  }
]
```

**Authorization:** All authenticated users

---

#### Submit Availability

Mark unavailability for a specific date and prayer time.

**Endpoint:** `POST /api/availability`

**Request Body:**
```json
{
  "user_id": 3,
  "date": "2025-11-22",
  "prayer_time": "Subuh",
  "is_available": false,
  "reason": "Out of town"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | Yes | User ID (must match session user for imam/bilal) |
| `date` | string | Yes | Date in YYYY-MM-DD format |
| `prayer_time` | enum | Yes | One of: Subuh, Zohor, Asar, Maghrib, Isyak |
| `is_available` | boolean | Yes | false = unavailable, true = available |
| `reason` | string | No | Optional reason for unavailability |

**Success Response (201 Created):**
```json
{
  "message": "Availability saved successfully",
  "id": 123
}
```

**Notes:**
- Uses `ON DUPLICATE KEY UPDATE` - creates or updates existing record
- Imam/Bilal users can only set their own availability
- Admin/Head Imam can set availability for any user

**Authorization:** All authenticated users (own data only for imam/bilal)

---

#### Delete Availability

Remove an availability record.

**Endpoint:** `DELETE /api/availability/:id`

**Success Response (200 OK):**
```json
{
  "message": "Availability removed successfully"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 404 | Availability record not found |
| 401 | Unauthorized (not your record) |

**Notes:**
- Users can only delete their own availability records
- Verified by checking `user_id` matches session user

**Authorization:** Owner of the record

---

### Profile

#### Get User Profile

Retrieve current user's profile information.

**Endpoint:** `GET /api/profile`

**Success Response (200 OK):**
```json
{
  "id": 3,
  "name": "Imam 1",
  "email": "imam1@isar.com",
  "role": "imam",
  "phone": "0123456781",
  "is_active": true
}
```

**Authorization:** All authenticated users

---

#### Update User Profile

Update current user's profile information.

**Endpoint:** `PUT /api/profile`

**Request Body:**
```json
{
  "name": "Imam Ahmad",
  "email": "imam1@isar.com",
  "phone": "0129876543"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Email already exists |
| 500 | Server error |

**Notes:**
- Email must be unique across all users
- Cannot change role or is_active status

**Authorization:** All authenticated users

---

#### Change Password

Change current user's password.

**Endpoint:** `PUT /api/profile/change-password`

**Request Body:**
```json
{
  "current_password": "admin123",
  "new_password": "newpass123",
  "confirm_password": "newpass123"
}
```

**Validation Rules:**
- Current password must be correct
- New password minimum 6 characters
- New password must match confirm password

**Success Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Current password is incorrect |
| 400 | Passwords do not match |
| 400 | Password too short |

**Authorization:** All authenticated users

---

### Users

#### Get Users

Retrieve list of users (with optional role filter).

**Endpoint:** `GET /api/users`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | No | Filter by role: imam, bilal, head_imam, admin |

**Example Request:**
```
GET /api/users?role=imam
```

**Success Response (200 OK):**
```json
[
  {
    "id": 3,
    "name": "Imam 1",
    "email": "imam1@isar.com",
    "role": "imam",
    "phone": "0123456781",
    "is_active": true
  },
  {
    "id": 4,
    "name": "Imam 2",
    "email": "imam2@isar.com",
    "role": "imam",
    "phone": "0123456782",
    "is_active": true
  }
]
```

**Notes:**
- Only returns active users (`is_active = true`)
- Password field never returned
- Ordered by name

**Authorization:** All authenticated users

---

#### Create User

Create a new user account (Admin only).

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "name": "Imam 3",
  "email": "imam3@isar.com",
  "password": "admin123",
  "role": "imam",
  "phone": "0123456788"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's full name |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Plain text, will be hashed |
| `role` | enum | Yes | admin, head_imam, imam, bilal |
| `phone` | string | No | Phone number |

**Success Response (201 Created):**
```json
{
  "message": "User created successfully",
  "id": 7
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (not admin) |
| 400 | Email already exists |
| 500 | Server error |

**Notes:**
- Password automatically hashed with bcrypt (10 rounds)
- New users automatically set to `is_active = true`

**Authorization:** `admin` only

---

#### Update User

Update user information (Admin only).

**Endpoint:** `PUT /api/users/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@isar.com",
  "role": "imam",
  "phone": "0123456789",
  "is_active": true
}
```

**Success Response (200 OK):**
```json
{
  "message": "User updated successfully"
}
```

**Authorization:** `admin` only

---

#### Delete User

Delete a user account (Admin only).

**Endpoint:** `DELETE /api/users/:id`

**Success Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Notes:**
- Cascade deletes: Also removes user's availability records and schedule assignments
- Be careful: This is permanent!

**Authorization:** `admin` only

---

## Data Models

### User

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;  // Never returned by API
  role: 'admin' | 'head_imam' | 'imam' | 'bilal';
  phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

### Schedule

```typescript
interface Schedule {
  id: number;
  date: string;  // ISO 8601 format: 2025-11-20T00:00:00.000Z
  prayer_time: 'Subuh' | 'Zohor' | 'Asar' | 'Maghrib' | 'Isyak';
  imam_id: number;
  bilal_id: number;
  week_number: number;  // 1-53
  year: number;
  is_auto_generated: boolean;
  created_by?: number;
  modified_by?: number;
  created_at: Date;
  updated_at: Date;
  imam_name?: string;  // Included in GET responses
  bilal_name?: string; // Included in GET responses
}
```

---

### Availability

```typescript
interface Availability {
  id: number;
  user_id: number;
  date: string;  // YYYY-MM-DD format
  prayer_time: 'Subuh' | 'Zohor' | 'Asar' | 'Maghrib' | 'Isyak';
  is_available: boolean;  // false = unavailable
  reason?: string;
  created_at: Date;
  updated_at: Date;
  user_name?: string;  // Included in GET responses
}
```

---

### Prayer Times

Fixed enum values (order matters):

1. **Subuh** - Dawn prayer
2. **Zohor** - Midday prayer
3. **Asar** - Afternoon prayer
4. **Maghrib** - Sunset prayer
5. **Isyak** - Night prayer

---

### User Roles

Role hierarchy and permissions:

| Role | Level | Permissions |
|------|-------|-------------|
| `admin` | 4 | Full access: users, schedules, everything |
| `head_imam` | 3 | Generate/edit schedules, view all data |
| `imam` | 2 | View schedules, manage own availability |
| `bilal` | 1 | View schedules, manage own availability |

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, duplicate entry |
| 401 | Unauthorized | Not logged in or insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, unexpected error |

### Common Error Scenarios

#### 1. Not Authenticated

**Status:** 401
```json
{
  "error": "Unauthorized"
}
```

**Solution:** Check session token is valid and included in request.

---

#### 2. Insufficient Permissions

**Status:** 401
```json
{
  "error": "Unauthorized"
}
```

**Example:** Imam trying to generate schedules (only head_imam can).

**Solution:** Verify user role has required permissions.

---

#### 3. Duplicate Entry

**Status:** 400
```json
{
  "error": "Schedule already exists for this date and prayer time"
}
```

**Solution:** Check for existing records before creating.

---

#### 4. Invalid Input

**Status:** 400
```json
{
  "error": "Email already exists"
}
```

**Solution:** Validate input before submission.

---

#### 5. Resource Not Found

**Status:** 404
```json
{
  "error": "Availability not found"
}
```

**Solution:** Verify resource ID exists.

---

## Code Examples

### React Native / Expo Setup

#### API Client Configuration

```typescript
// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://isar.myopensoft.net';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Important for cookie-based sessions
});

// Add auth token to requests
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

// Handle 401 errors (logout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Authentication Service

```typescript
// src/api/auth.ts
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'head_imam' | 'imam' | 'bilal';
}

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await apiClient.post('/api/auth/signin', credentials);

    // Extract session token from response cookies
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

  /**
   * Get current session
   */
  getSession: async (): Promise<AuthUser | null> => {
    try {
      const response = await apiClient.get('/api/auth/session');
      return response.data.user || null;
    } catch {
      return null;
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/signout');
    await AsyncStorage.removeItem('session_token');
    await AsyncStorage.removeItem('user');
  },

  /**
   * Get cached user from storage
   */
  getCachedUser: async (): Promise<AuthUser | null> => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },
};
```

---

### Schedule Service

```typescript
// src/api/schedules.ts
import apiClient from './client';

export interface Schedule {
  id: number;
  date: string;
  prayer_time: string;
  imam_id: number;
  bilal_id: number;
  imam_name?: string;
  bilal_name?: string;
  week_number: number;
  year: number;
  is_auto_generated: boolean;
}

export const scheduleService = {
  /**
   * Get schedules by date range
   */
  getSchedules: async (startDate: string, endDate: string): Promise<Schedule[]> => {
    const response = await apiClient.get('/api/schedules', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  /**
   * Get schedules by week
   */
  getSchedulesByWeek: async (weekNumber: number, year: number): Promise<Schedule[]> => {
    const response = await apiClient.get('/api/schedules', {
      params: { week_number: weekNumber, year }
    });
    return response.data;
  },

  /**
   * Generate weekly schedule (Head Imam only)
   */
  generateWeeklySchedule: async (startDate: string): Promise<any> => {
    const response = await apiClient.post('/api/schedules/generate', {
      start_date: startDate
    });
    return response.data;
  },

  /**
   * Update schedule (Head Imam only)
   */
  updateSchedule: async (id: number, imamId: number, bilalId: number): Promise<void> => {
    await apiClient.put(`/api/schedules/${id}`, {
      imam_id: imamId,
      bilal_id: bilalId
    });
  },

  /**
   * Delete schedule (Head Imam only)
   */
  deleteSchedule: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/schedules/${id}`);
  },
};
```

---

### Availability Service

```typescript
// src/api/availability.ts
import apiClient from './client';

export interface Availability {
  id: number;
  user_id: number;
  user_name?: string;
  date: string;
  prayer_time: string;
  is_available: boolean;
  reason?: string;
}

export const availabilityService = {
  /**
   * Get user's availability
   */
  getAvailability: async (
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Availability[]> => {
    const response = await apiClient.get('/api/availability', {
      params: {
        user_id: userId,
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  },

  /**
   * Submit unavailability
   */
  submitUnavailability: async (
    userId: number,
    date: string,
    prayerTime: string,
    reason?: string
  ): Promise<any> => {
    const response = await apiClient.post('/api/availability', {
      user_id: userId,
      date,
      prayer_time: prayerTime,
      is_available: false,
      reason
    });
    return response.data;
  },

  /**
   * Delete availability record
   */
  deleteAvailability: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/availability/${id}`);
  },
};
```

---

### Profile Service

```typescript
// src/api/profile.ts
import apiClient from './client';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  is_active: boolean;
}

export const profileService = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/profile');
    return response.data;
  },

  /**
   * Update profile
   */
  updateProfile: async (data: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<void> => {
    await apiClient.put('/api/profile', data);
  },

  /**
   * Change password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    await apiClient.put('/api/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
  },
};
```

---

### User Service

```typescript
// src/api/users.ts
import apiClient from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'head_imam' | 'imam' | 'bilal';
  phone?: string;
  is_active: boolean;
}

export const userService = {
  /**
   * Get all users or filter by role
   */
  getUsers: async (role?: string): Promise<User[]> => {
    const response = await apiClient.get('/api/users', {
      params: role ? { role } : undefined
    });
    return response.data;
  },

  /**
   * Get all Imams
   */
  getImams: async (): Promise<User[]> => {
    return userService.getUsers('imam');
  },

  /**
   * Get all Bilals
   */
  getBilals: async (): Promise<User[]> => {
    return userService.getUsers('bilal');
  },
};
```

---

### React Component Examples

#### Login Screen

```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authService } from '../../api/auth';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login({ email, password });
      // Navigate based on role
      if (user.role === 'imam' || user.role === 'bilal') {
        navigation.replace('ImamDashboard');
      } else {
        navigation.replace('HeadImamDashboard');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};
```

---

#### Schedule List Screen

```typescript
// src/screens/ScheduleScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { scheduleService } from '../../api/schedules';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const ScheduleScreen = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const today = new Date();
      const start = format(startOfWeek(today), 'yyyy-MM-dd');
      const end = format(endOfWeek(today), 'yyyy-MM-dd');

      const data = await scheduleService.getSchedules(start, end);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{format(new Date(item.date), 'EEE, MMM dd')}</Text>
            <Text>{item.prayer_time}</Text>
            <Text>Imam: {item.imam_name}</Text>
            <Text>Bilal: {item.bilal_name}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={loadSchedules}
      />
    </View>
  );
};
```

---

#### Availability Submission Screen

```typescript
// src/screens/AvailabilityScreen.tsx
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { availabilityService } from '../../api/availability';
import { format } from 'date-fns';

export const AvailabilityScreen = ({ userId }) => {
  const [date, setDate] = useState(new Date());
  const [prayerTime, setPrayerTime] = useState('Subuh');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    try {
      await availabilityService.submitUnavailability(
        userId,
        format(date, 'yyyy-MM-dd'),
        prayerTime,
        reason
      );
      Alert.alert('Success', 'Unavailability submitted');
      // Reset form
      setDate(new Date());
      setReason('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit unavailability');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <DateTimePicker
        value={date}
        mode="date"
        onChange={(event, selectedDate) => {
          if (selectedDate) setDate(selectedDate);
        }}
      />

      <Picker
        selectedValue={prayerTime}
        onValueChange={setPrayerTime}
      >
        <Picker.Item label="Subuh" value="Subuh" />
        <Picker.Item label="Zohor" value="Zohor" />
        <Picker.Item label="Asar" value="Asar" />
        <Picker.Item label="Maghrib" value="Maghrib" />
        <Picker.Item label="Isyak" value="Isyak" />
      </Picker>

      <Button title="Mark as Unavailable" onPress={handleSubmit} />
    </View>
  );
};
```

---

## Testing the API

### Using Postman

1. **Import Collection:**
   Create a new Postman collection with base URL: `https://isar.myopensoft.net`

2. **Login First:**
   ```
   POST /api/auth/signin
   Body: {"email": "imam1@isar.com", "password": "admin123"}
   ```

3. **Save Cookies:**
   Postman automatically saves session cookies

4. **Test Other Endpoints:**
   All subsequent requests will include the session cookie

---

### Using cURL

```bash
# Login
curl -X POST https://isar.myopensoft.net/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"imam1@isar.com","password":"admin123"}' \
  -c cookies.txt

# Get schedules (using saved cookies)
curl https://isar.myopensoft.net/api/schedules?start_date=2025-11-20&end_date=2025-11-26 \
  -b cookies.txt

# Submit unavailability
curl -X POST https://isar.myopensoft.net/api/availability \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "user_id": 3,
    "date": "2025-11-22",
    "prayer_time": "Subuh",
    "is_available": false,
    "reason": "Out of town"
  }'
```

---

## Mobile App Best Practices

### 1. Error Handling

```typescript
try {
  const schedules = await scheduleService.getSchedules(start, end);
  setSchedules(schedules);
} catch (error) {
  if (error.response?.status === 401) {
    // Session expired - redirect to login
    navigation.replace('Login');
  } else if (error.response?.status === 400) {
    // Show validation error
    Alert.alert('Error', error.response.data.error);
  } else {
    // Generic error
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
}
```

---

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    // API call
  } finally {
    setLoading(false);
  }
};

return loading ? <LoadingSpinner /> : <DataView />;
```

---

### 3. Pull to Refresh

```typescript
<FlatList
  data={schedules}
  renderItem={renderItem}
  refreshing={loading}
  onRefresh={loadData}
/>
```

---

### 4. Offline Support

```typescript
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
  });
  return unsubscribe;
}, []);

// Cache data in AsyncStorage
await AsyncStorage.setItem('schedules_cache', JSON.stringify(schedules));

// Load from cache when offline
if (!isOnline) {
  const cached = await AsyncStorage.getItem('schedules_cache');
  if (cached) setSchedules(JSON.parse(cached));
}
```

---

### 5. Date Formatting

```typescript
import { format, parseISO } from 'date-fns';

// API returns: "2025-11-20T00:00:00.000Z"
const displayDate = format(parseISO(schedule.date), 'EEE, MMM dd, yyyy');
// Output: "Wed, Nov 20, 2025"

const displayTime = format(parseISO(schedule.date), 'dd/MM/yyyy');
// Output: "20/11/2025"
```

---

## Support & Questions

For API questions or issues:

1. Check this documentation first
2. Review error messages carefully
3. Test with Postman/cURL to isolate issues
4. Check browser network tab for web debugging
5. Verify authentication is working

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-19 | Initial API documentation for mobile |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Maintained By:** iSAR Development Team
