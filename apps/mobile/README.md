# FieldSmartPro Mobile App

A React Native + Expo mobile application for field technicians.

## Features

- 📱 Cross-platform (iOS and Android)
- 🔒 Secure authentication with biometrics support
- 📴 Offline-first architecture
- 📍 GPS and navigation integration
- 📷 Camera for job documentation
- ✍️ Signature capture
- 🔔 Push notifications
- 🎨 Dark mode support

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- For iOS development: Xcode 15+ (macOS only)
- For Android development: Android Studio with SDK 34

## Getting Started

### 1. Install dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_TENANT_ID=local-tenant
```

### 3. Start the development server

```bash
npm start
```

### 4. Run on device/simulator

- Scan QR code with Expo Go app on your device
- Or press `i` for iOS Simulator
- Or press `a` for Android Emulator

## Project Structure

```
apps/mobile/
├── app/                  # Expo Router screens
│   ├── (auth)/          # Authentication screens
│   ├── (tabs)/          # Main tab screens
│   └── job/             # Job workflow screens
├── components/          # Reusable components
│   ├── ui/              # Base UI components
│   ├── common/          # Shared components
│   ├── jobs/            # Job-specific components
│   └── customers/       # Customer-specific components
├── services/            # API and business logic
│   └── api/             # API client and services
├── stores/              # Zustand state stores
├── hooks/               # Custom React hooks
├── constants/           # App configuration
└── assets/              # Static assets
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Development platform and tools |
| Expo Router | File-based navigation |
| NativeWind | Tailwind CSS for React Native |
| TanStack Query | Server state management |
| Zustand | Client state management |
| Expo SecureStore | Secure token storage |

## Available Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web

# Build for production
npx eas build

# Run linting
npm run lint
```

## Building for Production

### Configure EAS Build

```bash
eas login
eas build:configure
```

### Build for iOS (TestFlight)

```bash
eas build --platform ios --profile production
```

### Build for Android (Play Store)

```bash
eas build --platform android --profile production
```

## Offline Mode

The app is designed to work offline. When offline:
- Jobs are stored locally in SQLite
- Changes are queued for sync
- Automatic sync when back online
- Conflict resolution for concurrent edits

## Push Notifications

Push notifications are handled by Expo Notifications with Firebase Cloud Messaging.

To set up:
1. Create a Firebase project
2. Add `google-services.json` (Android) and configure iOS
3. Update `app.json` with Firebase credentials

## Contributing

1. Create a feature branch
2. Make changes
3. Test on both iOS and Android
4. Submit a pull request

## License

Proprietary - FieldSmartPro

