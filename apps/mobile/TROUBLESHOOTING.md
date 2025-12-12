# Mobile App Troubleshooting Guide

## Common Issues & Solutions

### 1. App Not Loading / White Screen

**Symptoms:**
- Expo Go shows white screen
- App freezes on splash screen
- Metro bundler errors

**Solutions:**

```bash
# Clear Metro bundler cache
npx expo start --clear

# If that doesn't work, reset node_modules
rm -rf node_modules
npm install
npx expo start --clear

# On Windows:
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

---

### 2. "Unable to resolve module" Errors

**Symptoms:**
- Error: Unable to resolve module `X` from `Y`

**Solutions:**

```bash
# Clear watchman (macOS)
watchman watch-del-all

# Reset Metro cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

### 3. NativeWind / Tailwind Styles Not Applying

**Symptoms:**
- Components appear unstyled
- `className` props not working

**Solutions:**

1. Ensure `global.css` is imported in `app/_layout.tsx`:
```typescript
import "../global.css";
```

2. Verify `babel.config.js` has NativeWind plugin:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

3. Clear cache and restart:
```bash
npx expo start --clear
```

---

### 4. Device Not Connecting / QR Code Issues

**Symptoms:**
- Expo Go can't connect to dev server
- QR code doesn't work

**Solutions:**

1. **Same Network**: Ensure phone and computer are on the same WiFi network

2. **Use Tunnel Mode** (if behind firewall):
```bash
npx expo start --tunnel
```

3. **Check Firewall**: Allow connections on port 8081

4. **Try IP directly**: In Expo Go, enter URL manually:
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Enter: `exp://192.168.X.X:8081`

---

### 5. Camera / Photo Permissions Not Working

**Symptoms:**
- Camera doesn't open
- Permission denied errors

**Solutions:**

1. **iOS Simulator**: Camera is not available, use gallery or physical device

2. **Physical Device**: Check permissions in device settings

3. **Request permissions programmatically**:
```typescript
import * as ImagePicker from 'expo-image-picker';

const { status } = await ImagePicker.requestCameraPermissionsAsync();
if (status !== 'granted') {
  alert('Camera permission required');
}
```

---

### 6. WatermelonDB / SQLite Errors

**Symptoms:**
- Database initialization errors
- "Table not found" errors

**Solutions:**

1. **Reset database**:
```typescript
import { database } from './db';

await database.write(async () => {
  await database.unsafeResetDatabase();
});
```

2. **Check schema version**: If you changed schema, increment version number

3. **For dev builds**: Sometimes need to clear app data:
   - iOS: Delete app and reinstall
   - Android: Clear app data in settings

---

### 7. Signature Canvas Not Rendering

**Symptoms:**
- Signature pad shows blank
- Touch not registering

**Solutions:**

1. **Check WebView**: Signature canvas uses WebView internally

2. **Add explicit dimensions**:
```typescript
<View style={{ height: 300, width: '100%' }}>
  <SignatureScreen ... />
</View>
```

3. **On Android Emulator**: Try physical device (WebView issues)

---

### 8. API Connection Refused

**Symptoms:**
- Network request failed
- Connection refused errors

**Solutions:**

1. **Check API is running**:
```bash
cd apps/api && npm run dev
```

2. **Use correct URL for device**:
   - Simulator: `http://localhost:4000`
   - Physical device: `http://YOUR_COMPUTER_IP:4000`

3. **Update config**:
```typescript
// constants/config.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.X:4000'  // Your computer's IP
    : 'https://api.yourapp.com',
};
```

4. **Android cleartext traffic**: Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true
    }
  }
}
```

---

### 9. React Native Reanimated Errors

**Symptoms:**
- "Reanimated 2 failed to create a worklet"
- Gesture handler not working

**Solutions:**

1. **Ensure babel plugin is last**:
```javascript
// babel.config.js
plugins: [
  // ... other plugins
  "react-native-reanimated/plugin", // MUST be last
],
```

2. **Clear cache after changing babel**:
```bash
npx expo start --clear
```

---

### 10. iOS Build Failures

**Symptoms:**
- Pod install fails
- Build errors on iOS

**Solutions:**

```bash
# Navigate to ios folder
cd ios

# Clean pods
rm -rf Pods Podfile.lock

# Reinstall
pod install

# If issues persist
pod deintegrate
pod install
```

---

### 11. Android Build Failures

**Symptoms:**
- Gradle build errors
- Missing SDK errors

**Solutions:**

1. **Check Android SDK**: Ensure SDK 34 is installed in Android Studio

2. **Set ANDROID_HOME**:
```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

3. **Clean Gradle**:
```bash
cd android
./gradlew clean
```

---

### 12. Hot Reload Not Working

**Symptoms:**
- Changes don't appear
- Need to restart app

**Solutions:**

1. **Shake device** and select "Reload"

2. **Enable Fast Refresh** in Dev Menu

3. **Full restart**:
   - Press `r` in terminal
   - Or restart Expo: `npx expo start --clear`

---

## Development Tips

### Using iOS Simulator
```bash
# Open iOS simulator
npx expo start --ios
```

### Using Android Emulator
```bash
# Start Android emulator first from Android Studio
# Then run:
npx expo start --android
```

### Building for Production
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

### Debugging
- **React DevTools**: Press `j` in terminal
- **Network Inspector**: In Dev Menu → "Toggle Network Inspector"
- **Console Logs**: Check Metro bundler terminal output

---

## Getting Help

1. Check [Expo Documentation](https://docs.expo.dev)
2. Search [Expo Forums](https://forums.expo.dev)
3. Review [React Native GitHub Issues](https://github.com/facebook/react-native/issues)
4. Ask in project Slack/Discord channel

