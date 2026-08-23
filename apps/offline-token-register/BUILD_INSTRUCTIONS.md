# How to Build the Offline Token Register APK

This guide shows you how to build the APK **without** installing Android development tools on your Windows computer.

## Prerequisites

### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS version recommended)
- Install with default settings
- Verify: Open Command Prompt and run: `node --version`

### 2. Install Expo CLI
Open Command Prompt and run:
```bash
npm install -g expo-cli
```

Verify with:
```bash
expo --version
```

### 3. Create Free Expo Account
Visit https://expo.dev/ and create a free account. You'll need this to build the APK.

## Building the APK

### Step 1: Navigate to App Directory
Open Command Prompt and navigate to the offline register app:
```bash
cd /path/to/school-dashboard/apps/offline-token-register
```

### Step 2: Install Dependencies
```bash
npm install
```

This downloads all required packages (one-time, takes ~2-3 minutes).

### Step 3: Login to Expo
```bash
expo login
```

Enter your Expo account credentials.

### Step 4: Build APK
```bash
npm run build:android
```

This command:
- Sends build to Expo cloud servers
- Compiles React Native into native Android
- Generates APK (no local tools needed)
- Returns a download link when complete

**Typical build time**: 5-10 minutes

### Step 5: Download APK
When the build completes, you'll see:
```
✓ Build finished
📦 APK Download: https://expo.dev/artifacts/xxxxxxx
```

Copy this link and paste in your browser to download the APK (usually goes to Downloads folder).

## Transferring APK to Tablet

### Via USB Mass Storage (Easiest)
1. Connect tablet to Windows via Micro-USB cable
2. On tablet: Enable USB Storage Mode (swipe down > USB options > Mass Storage)
3. On Windows: Open File Explorer, find your tablet
4. Create folder: `TokenRegister_APK`
5. Drag APK into this folder
6. Safely eject tablet
7. On tablet: Open Files app > Downloads (or your custom folder)
8. Tap APK to install

### Via Android File Transfer
1. Download Android File Transfer: https://www.android.com/filetransfer/
2. Connect tablet via USB
3. Open Android File Transfer on Windows
4. Drag APK to `/sdcard/Download/` folder
5. On tablet: Open Files > Downloads
6. Tap APK to install

## Installing APK on Tablet

1. On tablet, go to Settings > Security
2. Enable "Unknown Sources" (allows installing from files, not just Play Store)
3. Open Files app
4. Navigate to the APK file
5. Tap to install
6. Follow on-screen prompts
7. Once installed, app appears in your app drawer

## First Launch

1. Tap "Token Register" app
2. For **Register Mode**: Tap "START REGISTER" or wait 5 seconds
3. For **Admin Mode**: Tap "PIN" screen and enter `0000`

## Troubleshooting

### Build Fails: "expo-cli not found"
Solution: Run `npm install -g expo-cli` again, then restart Command Prompt.

### Build Fails: "Not logged in"
Solution: Run `expo login` and verify credentials.

### Build Fails: Network error
Solution: Check internet connection, wait a moment, try again.

### APK Won't Download
- Check browser downloads folder
- Try different browser
- Copy download link and paste in incognito/private window

### APK Won't Install
- Ensure "Unknown Sources" is enabled
- Check Android version (app requires 5.0+)
- Try uninstalling old version first
- Ensure enough storage (app ~60MB + data)

## Building Updates

After making code changes:
1. Navigate to app directory
2. Run: `npm run build:android`
3. Download new APK
4. Transfer to tablet
5. Uninstall old version
6. Install new APK

## Using Internal EAS Build Profile

For faster builds during development, use:
```bash
npm run build:android:preview
```

This builds slightly faster but should still work fine on tablets.

## Next Steps

1. Follow [README.md](./README.md) for app features and usage
2. Test in Register Mode (no admin PIN needed)
3. Enter Admin Mode (PIN: `0000`) to add test students and products
4. Create backup before deploying to production

## Support

If you hit issues:
1. Check your Expo account status (https://expo.dev/)
2. Verify Node.js is properly installed: `node --version`
3. Try clearing cache: `npm cache clean --force`
4. Reinstall dependencies: `rm -r node_modules && npm install`

Good luck! 🚀
