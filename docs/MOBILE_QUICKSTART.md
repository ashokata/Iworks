# FieldSmartPro Mobile - Quick Start Guide

## Pre-requisites

Before starting mobile development, ensure you have:

```bash
# Node.js 18+ (already have)
node --version  # Should be 18.x or higher

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# For iOS development (macOS only)
# - Xcode 15+ from App Store
# - Xcode Command Line Tools: xcode-select --install
# - CocoaPods: sudo gem install cocoapods

# For Android development
# - Android Studio with SDK 34
# - ANDROID_HOME environment variable set
# - Java 17 JDK
```

---

## Project Initialization Steps

### Step 1: Create the Expo App

```bash
# Navigate to apps directory
cd fieldsmartpro-monorepo/apps

# Create new Expo project with TypeScript template
npx create-expo-app@latest mobile --template expo-template-blank-typescript

cd mobile
```

### Step 2: Install Core Dependencies

```bash
# Navigation (Expo Router - file-based like Next.js)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# UI & Styling
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# State Management (same as web)
npm install zustand @tanstack/react-query

# Forms (same as web)
npm install react-hook-form @hookform/resolvers zod

# Offline Database
npm install @nozbe/watermelondb
npm install --save-dev @babel/plugin-proposal-decorators

# Native Features
npx expo install expo-camera expo-image-picker expo-location
npx expo install expo-notifications expo-secure-store expo-haptics
npx expo install expo-local-authentication expo-file-system expo-media-library

# Maps
npx expo install react-native-maps

# HTTP Client (same as web)
npm install axios

# Signature Capture
npm install react-native-signature-canvas

# Date handling (same as web)
npm install date-fns

# Icons
npm install lucide-react-native react-native-svg
npx expo install react-native-svg
```

### Step 3: Configure Expo Router

Update `package.json`:
```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest"
  }
}
```

Update `app.json`:
```json
{
  "expo": {
    "name": "FieldSmartPro",
    "slug": "fieldsmartpro",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "scheme": "fieldsmartpro",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E40AF"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.fieldsmartpro.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Take photos of job sites and equipment",
        "NSPhotoLibraryUsageDescription": "Select photos from your library",
        "NSLocationWhenInUseUsageDescription": "Show your location for navigation",
        "NSLocationAlwaysUsageDescription": "Track location for time entries",
        "NSMicrophoneUsageDescription": "Record voice notes"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E40AF"
      },
      "package": "com.fieldsmartpro.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECORD_AUDIO"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-location",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow FieldSmartPro to access your photos for job documentation.",
          "cameraPermission": "Allow FieldSmartPro to take photos for job documentation."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1E40AF"
        }
      ]
    ]
  }
}
```

### Step 4: Create Folder Structure

```bash
mkdir -p app/(auth) app/(tabs) app/job
mkdir -p components/ui components/jobs components/customers components/common components/forms
mkdir -p services/api services/offline services/native
mkdir -p stores hooks utils constants
mkdir -p db/models
mkdir -p assets/fonts assets/images assets/icons
```

### Step 5: Create Tailwind Config

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
```

Create `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
};
```

---

## Initial App Structure

### Create Root Layout (`app/_layout.tsx`)

```typescript
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
```

### Create Tab Navigator (`app/(tabs)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';
import { Home, Briefcase, Users, Calendar, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const activeColor = '#2563eb';
  const inactiveColor = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#1f2937' : '#ffffff';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: bgColor,
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customers/index"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

### Create Dashboard Screen (`app/(tabs)/index.tsx`)

```typescript
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, User } from 'lucide-react-native';

// This will use the shared types from packages/shared
interface Job {
  id: string;
  title: string;
  status: string;
  scheduledStart: string;
  customer: {
    displayName: string;
  };
  address?: {
    street: string;
    city: string;
  };
}

export default function TodayScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: jobs, refetch, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs', 'today', today],
    queryFn: async () => {
      // Replace with actual API call
      const response = await fetch(`${API_BASE_URL}/technician/today`);
      return response.json();
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500">Loading today's jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="px-4 py-6 bg-primary-600">
        <Text className="text-white text-2xl font-bold">
          {format(new Date(), 'EEEE, MMMM d')}
        </Text>
        <Text className="text-primary-100 mt-1">
          {jobs?.length || 0} jobs scheduled today
        </Text>
      </View>

      {/* Job List */}
      <View className="p-4">
        {jobs?.map((job) => (
          <TouchableOpacity
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm"
          >
            {/* Job Header */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  {job.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <User size={14} color="#6b7280" />
                  <Text className="text-gray-600 dark:text-gray-400 ml-1">
                    {job.customer.displayName}
                  </Text>
                </View>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                job.status === 'SCHEDULED' ? 'bg-blue-100' :
                job.status === 'IN_PROGRESS' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  job.status === 'SCHEDULED' ? 'text-blue-700' :
                  job.status === 'IN_PROGRESS' ? 'text-green-700' :
                  'text-gray-700'
                }`}>
                  {job.status}
                </Text>
              </View>
            </View>

            {/* Time */}
            <View className="flex-row items-center mt-2">
              <Clock size={14} color="#6b7280" />
              <Text className="text-gray-600 dark:text-gray-400 ml-1">
                {format(new Date(job.scheduledStart), 'h:mm a')}
              </Text>
            </View>

            {/* Address */}
            {job.address && (
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#6b7280" />
                <Text className="text-gray-600 dark:text-gray-400 ml-1">
                  {job.address.street}, {job.address.city}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {(!jobs || jobs.length === 0) && (
          <View className="items-center py-12">
            <Text className="text-gray-500 text-lg">No jobs scheduled for today</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

---

## Shared Code Setup

### Create Shared Package

```bash
# From monorepo root
cd packages
mkdir shared
cd shared
npm init -y
```

Create `packages/shared/package.json`:
```json
{
  "name": "@fieldsmartpro/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

Move shared types:
```bash
# Copy types from web to shared
cp ../apps/web/src/types/database.types.ts src/types/
```

Update workspace references:
```json
// apps/mobile/package.json
{
  "dependencies": {
    "@fieldsmartpro/shared": "*"
  }
}

// apps/web/package.json  
{
  "dependencies": {
    "@fieldsmartpro/shared": "*"
  }
}
```

---

## Running the App

### Development Mode

```bash
# From apps/mobile directory
npm start

# Scan QR code with Expo Go app on your device
# Or press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
```

### Build for Testing

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Build for iOS (TestFlight)
eas build --platform ios --profile preview

# Build for Android (Internal Testing)
eas build --platform android --profile preview
```

---

## Next Steps After Setup

1. **API Service Layer** - Create service files that mirror the web app
2. **Authentication** - Implement login flow with SecureStore
3. **Offline Database** - Set up WatermelonDB schema
4. **Job Workflow** - Build the job detail and update screens
5. **Camera Integration** - Add photo capture functionality
6. **Sync Manager** - Implement background sync

---

## Common Issues & Solutions

### Issue: Metro bundler cache
```bash
npx expo start --clear
```

### Issue: iOS build fails
```bash
cd ios && pod install && cd ..
```

### Issue: Android emulator not detected
```bash
# Ensure ANDROID_HOME is set
echo $ANDROID_HOME

# Start emulator from Android Studio, then:
npx expo start --android
```

### Issue: NativeWind styles not applying
```bash
# Ensure babel.config.js has nativewind/babel plugin
# Then clear cache:
npx expo start --clear
```

---

*This quickstart guide will be updated as the project evolves.*

