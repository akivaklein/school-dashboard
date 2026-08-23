# Offline Token Store Register

A standalone offline Android app for tablet-based token store checkout and administration.

## Features

### Register Mode
- Simple, large-button checkout interface
- Student selection by name or barcode
- Barcode scanning for products (NETUM NT-1228BC in HID keyboard mode)
- Real-time balance display
- Purchase cart with quantity management
- Automatic screen lock after inactivity (60 seconds)
- PIN protection to exit register mode

### Admin Mode
- Manage students (add, edit, archive, restore)
- Manage products/snacks (add, edit, archive, restore)
- Point management (add, set balance, subtract with confirmation)
- View purchase history and undo purchases
- Backup/restore functionality via JSON files

### Storage & Data
- SQLite local database (no internet required)
- Persistent data across app restarts
- Automatic backups with USB file transfer
- Complete purchase history with reversal tracking
- Balance history for audit trail

## Installation Requirements

### On Your Windows Computer
1. **Node.js** (v18+) - Download from https://nodejs.org/
2. **Expo CLI** - Install via: `npm install -g expo-cli`

No Android SDK or emulator required. Building happens in the cloud via EAS.

### On Your Android Tablet
- Android 5.0+ (works with most 2018+ tablets)
- USB connectivity to Windows for APK transfer

## Building the APK

### One-Time Setup
1. Install Node.js and Expo CLI (see above)
2. Navigate to the app directory:
   ```bash
   cd apps/offline-token-register
   npm install
   ```

3. Create an Expo account (free):
   ```bash
   expo login
   ```

### Build APK
```bash
npm run build:android
```

This will build in the cloud and show you a download link. The APK will be saved to your Downloads folder.

## Transferring APK to Tablet

### Option 1: USB Mass Storage (Recommended)
1. Connect tablet to Windows via Micro-USB
2. Enable USB Mass Storage Mode on tablet (varies by device)
3. Drag the APK file to the Downloads folder on the tablet
4. Disconnect and open Files app on tablet
5. Navigate to Downloads and tap the APK to install

### Option 2: Android File Transfer
1. Download Android File Transfer from Google (for Windows)
2. Connect tablet via Micro-USB
3. Open Android File Transfer
4. Drag APK to `/sdcard/Downloads/`
5. Install from tablet's Files app

## First Use

1. Tap the app icon to launch
2. **Register Mode**: Tap "START REGISTER" or wait 5 seconds
3. **Admin Mode**: Enter PIN `0000`

### Default PIN
- **Admin Mode**: `0000`
- **Register Mode**: `1111` (or auto-start after 5 seconds)

## Features in Detail

### Register Mode
- **Select Student**: Search by name or scan student barcode
- **Scan Products**: Scan product barcodes or select from list
- **Checkout**: Confirm purchase when cart is ready
- **Lock**: Tap lock icon and enter admin PIN to access admin mode

### Admin Mode

#### Students Tab
- **Add**: Create new student with initial balance
- **Edit**: Modify student name, barcode, or balance
- **Archive**: Soft-delete student (keeps history)
- **Restore**: Re-activate archived student

#### Products Tab
- **Add**: Create snack with barcode and point cost
- **Edit**: Modify product info
- **Quantity**: Optional inventory tracking
- **Low Stock**: Optional low-stock warning threshold
- **Archive**: Remove product from register

#### Points Tab
- **Add Points**: Increase student balance (e.g., +50)
- **Set Balance**: Set balance to exact amount
- **Subtract**: Decrease balance (e.g., -10 for correction)
- All changes logged in history

#### History Tab
- View all purchases chronologically
- See reversed purchases grayed out
- **Undo**: Reverse a purchase and restore points
- Search by student or product

#### Backup Tab
- **Create Backup**: Export all data to JSON file
- Share via Sharing dialog
- Save to computer for safekeeping
- Restore later if needed

## Bluetooth Barcode Scanner Setup

### NETUM NT-1228BC
The app supports HID/keyboard mode (no special driver needed):

1. On tablet: Bluetooth Settings → Pair new device
2. Power on scanner
3. Scanner shows in Bluetooth scan
4. Tap to pair
5. When paired, scanner emulates keyboard input
6. Scan in Register Mode or Admin Mode as needed

## Database Structure

All data stored in SQLite on tablet:
- `students` - Student records with barcode and balance
- `products` - Snack/product catalog
- `purchases` - Transaction history
- `balance_history` - Point change audit log
- `admin_config` - App configuration

## Troubleshooting

### APK Won't Install
- Ensure tablet allows "Unknown Sources" (Settings > Security)
- Check Android version is 5.0+
- Verify APK is not corrupted

### Barcode Scanner Not Working
- Confirm scanner is paired in Bluetooth settings
- Check scanner is in HID/keyboard mode
- Try scanning with Focus on barcode input field

### Lost Data
- Use Backup feature to save data regularly
- Restore from backup file if needed
- Keep backups on computer via USB transfer

### Slow Performance
- Close other apps on tablet
- Clear app cache (Settings > Apps > TokenRegister > Clear Cache)
- Restart tablet if very slow

## Support

For issues:
1. Check backup file is available
2. Review Admin Mode > History for transaction details
3. Uninstall and reinstall if app crashes
4. Restore from backup to recover data

## Building for Specific Android Version

If your tablet has Android 5.x (uncommon for 2018 models), modify `eas.json`:

```json
"android": {
  "minSdkVersion": 21  // Change to 21 for Android 5.0+
}
```

Then rebuild.

## Source Code

- `src/db/` - SQLite database layer and queries
- `src/screens/` - UI screens (PIN, Register, Admin)
- `src/utils/` - Barcode parsing and utilities
- `src/db/backup.ts` - Backup/restore functions

All code is TypeScript with full type safety.
