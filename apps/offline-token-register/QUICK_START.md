# Quick Start Checklist for User

Use this checklist to go from purchasing a tablet to running the app on day 1.

---

## Step 1: Prepare Your Windows Computer (30 minutes)

### Install Required Tools
- [ ] Download and install **Node.js** from https://nodejs.org/ (LTS version)
  - Default installation is fine
  - Includes npm (Node Package Manager)
  
- [ ] Verify Node.js installed:
  ```
  Open Command Prompt
  Type: node --version
  Should show: v18.x.x or higher
  ```

- [ ] Install **Expo CLI**:
  ```
  Open Command Prompt
  Type: npm install -g expo-cli
  Wait for completion
  ```

- [ ] Verify Expo CLI installed:
  ```
  Type: expo --version
  Should show: version number
  ```

### Create Expo Account
- [ ] Go to https://expo.dev/
- [ ] Click "Sign up"
- [ ] Create account (use your email)
- [ ] Verify email if prompted
- [ ] Remember your credentials

---

## Step 2: Prepare Your Tablet (10 minutes)

### Enable Unknown Sources
- [ ] On tablet: Go to **Settings**
- [ ] Find **Security** or **Apps & notifications**
- [ ] Look for **"Unknown Sources"** or **"Install from unknown sources"**
- [ ] Enable it (toggle ON)
- [ ] Confirm any warnings

### Check Tablet Specs
- [ ] Note Android version (Settings > About device)
  - App requires Android 5.0+ (API 21+)
  - Most 2018+ tablets qualify
  
- [ ] Note screen size (approximate)
  - 7" to 12" recommended
  
- [ ] Check Bluetooth capability
  - Settings > Bluetooth
  - Turn on and check if working
  - (Optional - for barcode scanner)

---

## Step 3: Build APK (15-20 minutes)

### In Command Prompt on Windows

1. **Navigate to app folder**:
   ```
   cd C:\path\to\school-dashboard\apps\offline-token-register
   Replace with your actual path!
   ```

2. **Install dependencies**:
   ```
   npm install
   This takes 2-3 minutes
   ```

3. **Login to Expo**:
   ```
   expo login
   Enter your Expo account credentials
   ```

4. **Build APK**:
   ```
   npm run build:android
   
   You'll see:
   "Building APK..."
   "Uploading to Expo cloud..."
   "Waiting for build..."
   
   This takes 5-10 minutes
   ```

5. **Download APK**:
   - When complete, you'll see a download link
   - Click the link or copy/paste in browser
   - APK downloads to your Downloads folder
   - File size: ~60-70 MB

---

## Step 4: Transfer APK to Tablet (5 minutes)

### Option A: USB Mass Storage (Easiest)
1. [ ] Connect tablet to Windows via USB cable
2. [ ] On tablet: Enable USB Storage Mode
   - Swipe down from top
   - Tap "USB options" or "Charge this device"
   - Select "Transfer files" or "Mass storage"
3. [ ] On Windows: File Explorer > Find tablet in devices
4. [ ] Navigate to `/Download/` folder on tablet
5. [ ] Drag APK file into this folder
6. [ ] Eject tablet safely
7. [ ] On tablet: Tap File Manager app
8. [ ] Navigate to Downloads
9. [ ] Tap APK file to install

### Option B: Android File Transfer
1. [ ] Download Android File Transfer from: https://www.android.com/filetransfer/
2. [ ] Install on Windows
3. [ ] Connect tablet via USB
4. [ ] Open Android File Transfer
5. [ ] Drag APK to `/sdcard/Download/`
6. [ ] On tablet: Open Files app
7. [ ] Navigate to Downloads
8. [ ] Tap APK file to install

---

## Step 5: Install App on Tablet (2 minutes)

1. [ ] **APK File Manager**: Tap Files app on tablet
2. [ ] Navigate to Downloads folder
3. [ ] Tap the APK file
4. [ ] Confirm: "Do you want to install this app?"
5. [ ] Tap "Install"
6. [ ] Wait for installation (30 seconds)
7. [ ] Tap "Open" or find app in app drawer
8. [ ] App launches!

---

## Step 6: First Launch (5 minutes)

### Initial Setup
1. [ ] **Launch app**: Tap "Token Register" icon
2. [ ] Wait for database initialization (splash screen shows)
3. [ ] You'll see the **PIN screen**
4. [ ] Tap **"START REGISTER"** button
5. [ ] You'll see **Register Mode** (student list is empty initially)

### Enter Admin Mode to Add Data
1. [ ] Go back to PIN screen
   - Lock icon (🔒) + Tap, or
   - Force close and relaunch, or
   - Wait until next use
2. [ ] On PIN screen, enter PIN: `0000`
3. [ ] Tap "ENTER"
4. [ ] You're in **Admin Mode** (red header)
5. [ ] Tap **"⚡ Points"** tab (or **Students** to add students first)

### Add Your First Student
1. [ ] Tap **Students** tab
2. [ ] Tap **+ Add** button
3. [ ] Enter:
   - Name: "Test Student"
   - Barcode: (auto-filled, e.g., STU00000001)
   - Starting Balance: 100
4. [ ] Tap **Save**
5. [ ] Student appears in list

### Add Your First Product
1. [ ] Tap **Products** tab
2. [ ] Tap **+ Add** button
3. [ ] Enter:
   - Name: "Cookie"
   - Barcode: (auto-filled, e.g., PRD00000001)
   - Point Cost: 5
4. [ ] Tap **Save**
5. [ ] Product appears in list

### Test Quick Points
1. [ ] Tap **⚡ Points** tab
2. [ ] Tap **START BATCH ENTRY**
3. [ ] You'll see "Test Student" (1 of 1)
4. [ ] Current Balance: 100
5. [ ] Enter amount: 25
6. [ ] Tap **✓ DONE**
7. [ ] Student balance should now be 125
8. [ ] See "BATCH COMPLETE" button
9. [ ] Tap to exit batch mode
10. [ ] List shows new balance: 125

### Test Register Mode
1. [ ] Tap **EXIT** button (top right)
2. [ ] Confirm: "Return to PIN screen?"
3. [ ] On PIN screen, tap **"START REGISTER"**
4. [ ] You'll see "Test Student" in list
5. [ ] Tap the student card
6. [ ] You'll see barcode input field
7. [ ] If you have barcode scanner, scan product barcode
8. [ ] Otherwise, manually enter or look for product selection
9. [ ] Verify app works

---

## Step 7: Create Backup (2 minutes)

### Always Backup Before Production Use
1. [ ] Enter Admin Mode (PIN: `0000`)
2. [ ] Tap **Backup** tab
3. [ ] Tap **"Create Backup"** button
4. [ ] Sharing dialog appears
5. [ ] Tap **"Save to Files"**
6. [ ] Choose save location
7. [ ] File saved as `TokenRegister_Backup_[TIMESTAMP].json`

### Transfer Backup to Computer
1. [ ] Connect tablet to Windows
2. [ ] Enable USB Storage Mode
3. [ ] Copy backup file from Downloads
4. [ ] Paste to Windows computer (C:\Users\YourName\Documents\)
5. [ ] Keep in safe location

---

## Step 8: Production Setup (30-60 minutes)

### Add All Your Students
1. [ ] Enter Admin Mode
2. [ ] Go to **Students** tab
3. [ ] For each student:
   - Tap **+ Add**
   - Enter name and starting balance
   - Tap **Save**
4. [ ] Verify all students appear in list

### Add All Your Products
1. [ ] Go to **Products** tab
2. [ ] For each snack/item:
   - Tap **+ Add**
   - Enter name, cost in points, optional quantity
   - Tap **Save**
3. [ ] Verify all products in list

### Create Initial Backup
1. [ ] Tap **Backup** tab
2. [ ] Create backup
3. [ ] Transfer to Windows computer
4. [ ] Keep safe copy

### Train Staff
- [ ] **Register Mode**: Tap student → Scan products → Checkout
- [ ] **Admin Mode**: Quick Points tab for adjusting balances
- [ ] Show barcode scanner setup (if applicable)
- [ ] Explain backup process

---

## Step 9: Ongoing Maintenance

### Daily
- [ ] Check if data looks correct
- [ ] Verify purchases recorded in history

### Weekly
- [ ] Add weekly allowance points via Quick Points batch entry
- [ ] Review history for anomalies
- [ ] Create backup

### Monthly
- [ ] Transfer backups to Windows computer
- [ ] Archive old completed records (optional)
- [ ] Update student/product lists as needed

---

## Default Credentials

Keep these handy:
```
ADMIN PIN: 0000
REGISTER PIN: 1111 (or wait 5 seconds)
```

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| APK won't download | Check internet, try different browser |
| APK won't install | Enable "Unknown Sources", ensure Android 5.0+ |
| Barcode scanner not working | Check Bluetooth pairing in tablet settings |
| App crashes on launch | Restart tablet, check storage space (need ~100MB) |
| Lost data | Restore from backup file |
| Can't find students list | Make sure you're in Register Mode, not Admin Mode |
| Forgot admin PIN | See "Default Credentials" above |

---

## Support Resources

📖 **Read These Files on Your Tablet**:
- `README.md` - Complete feature guide
- `ADMIN_GUIDE.md` - Quick reference for operations
- `TESTING_GUIDE.md` - Detailed test scenarios (if you want to validate)

📖 **Windows Computer**:
- `BUILD_INSTRUCTIONS.md` - How to rebuild APK if needed
- `IMPLEMENTATION_SUMMARY.md` - Complete technical overview

---

## Summary Timeline

| Step | Time | What's Done |
|------|------|-----------|
| Install Node.js & Expo | 30 min | Computer ready |
| Enable Unknown Sources | 5 min | Tablet ready |
| Build APK | 20 min | APK downloaded |
| Transfer to tablet | 5 min | APK on tablet |
| Install app | 2 min | App running |
| First launch & setup | 5 min | Admin mode tested |
| Add test student/product | 10 min | Register mode tested |
| Create backup | 5 min | Safe copy ready |
| **TOTAL** | **~85 min** | **App ready to use** |

---

## You're Ready! 🎉

Once you complete this checklist:
✅ Offline Token Register is installed and working  
✅ You've tested both Register and Admin modes  
✅ You have a backup  
✅ You can start using it immediately  

**Next**: Follow ADMIN_GUIDE.md for daily operation.

Questions? Check README.md or ADMIN_GUIDE.md first!
