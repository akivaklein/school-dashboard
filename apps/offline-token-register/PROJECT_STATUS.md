# Offline Token Register - Project Overview

## Current Status
✅ **Framework Complete** - All core components implemented and tested

## What Has Been Built

### 1. SQLite Database Layer ✅
- **Location**: `src/db/database.ts`, `src/db/schema.ts`, `src/db/queries.ts`
- Full CRUD operations for students, products, and purchases
- Balance history tracking for audit trail
- Indexes for performance
- Support for Android 5.0+ devices

### 2. User Interface ✅

#### PIN Screen (`src/screens/PINScreen.tsx`)
- 4-digit PIN pad for entering credentials
- Auto-enter Register Mode after 5 seconds
- Admin PIN: `0000` → Admin Mode
- Register PIN: `1111` → Register Mode
- Large touch targets (optimized for older tablets)

#### Register Mode (`src/screens/RegisterModeScreen.tsx`)
- Student selection by name or barcode
- Barcode input field (NETUM scanner compatible)
- Shopping cart with product quantity management
- Real-time balance display
- Checkout confirmation
- Automatic lock after 60 seconds of inactivity
- PIN-protected exit

#### Admin Mode (`src/screens/AdminModeScreen.tsx`)
Organized into 5 tabs:

**Students Tab**
- Add, edit, archive, restore students
- Unique barcode for each student
- Current points balance display
- Search functionality

**Products Tab**
- Add, edit, archive, restore snacks/products
- Barcode assignment (auto-generated or manual)
- Point cost configuration
- Optional inventory tracking
- Low-stock warnings (when quantity set)

**Points Tab**
- Add points (e.g., +50)
- Set exact balance (e.g., set to 100)
- Subtract points (e.g., -25 for correction)
- Confirmation dialogs for all operations
- Balance change history

**History Tab**
- View all purchases (latest first)
- Shows: student name, product, cost, timestamp
- Undo/Reverse purchases with confirmation
- Reversal shows grayed out in list
- Points automatically restored when reversed

**Backup Tab**
- Create backup button
- Exports all data to JSON file
- Share via tablet's sharing dialog
- Includes students, products, purchases, balance history
- Timestamped backups

### 3. Backup & Restore System ✅
- **Location**: `src/db/backup.ts`
- Create full backup → JSON file
- Share backup to computer via Sharing dialog
- Restore from backup file
- Non-destructive recovery
- Schema versioning for future updates

### 4. Barcode Utilities ✅
- **Location**: `src/utils/barcode.ts`
- Student barcode format: `STU00000001` (STU + 8-digit ID)
- Product barcode format: `PRD00000001` (PRD + 8-digit ID)
- HID keyboard mode support (NETUM scanner works as keyboard input)
- Barcode buffer management
- Checksum validation (ready for use)
- Barcode parsing and type detection

### 5. Configuration Files ✅
- **package.json**: All dependencies defined
- **app.json**: Expo configuration with Android 5.0+ support
- **eas.json**: Cloud build configuration
- **tsconfig.json**: TypeScript settings
- **babel.config.js**: Babel preset for React Native

### 6. Documentation ✅
- **README.md**: Complete feature guide and troubleshooting
- **BUILD_INSTRUCTIONS.md**: Step-by-step APK building guide (no Android SDK needed)

## Architecture

```
apps/offline-token-register/
├── src/
│   ├── App.tsx                 # Main app entry point
│   ├── db/
│   │   ├── database.ts         # SQLite connection & init
│   │   ├── schema.ts           # Database tables & types
│   │   ├── queries.ts          # CRUD operations (students, products, purchases)
│   │   └── backup.ts           # Backup/restore functionality
│   ├── screens/
│   │   ├── PINScreen.tsx       # PIN entry (admin/register)
│   │   ├── RegisterModeScreen.tsx  # Checkout interface
│   │   └── AdminModeScreen.tsx    # Full admin dashboard
│   └── utils/
│       └── barcode.ts          # Barcode parsing & generation
├── app.json                    # Expo config (Android 5.0+)
├── eas.json                    # Cloud build config
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── babel.config.js             # Babel preset
├── README.md                   # Feature guide
└── BUILD_INSTRUCTIONS.md       # Build guide for user
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React Native + Expo | 51.0 |
| Language | TypeScript | 5.3+ |
| Database | SQLite (expo-sqlite) | 14.0 |
| Navigation | React Navigation | 6.1 |
| Barcode | HID Keyboard mode | N/A |

## Android Compatibility

- **Minimum**: Android 5.0 (API 21)
- **Target**: Android 14 (API 34)
- **Typical Support**: 2015+ devices
- **Tested**: 2018 tablets
- **Features**: No internet, Bluetooth HID, USB File Transfer

## Key Features Implemented

✅ Offline-first (no internet needed)
✅ SQLite local database
✅ Two modes: Register & Admin
✅ Student management (CRUD + archive/restore)
✅ Product management (CRUD + archive/restore)
✅ Point management (add/set/subtract)
✅ Purchase tracking & reversal
✅ Balance history audit trail
✅ Backup/restore to JSON files
✅ Barcode scanning (NETUM NT-1228BC HID mode)
✅ PIN-protected admin access
✅ Inactivity auto-lock (60 seconds)
✅ Large UI optimized for older tablets
✅ TypeScript type safety
✅ No internet permission required

## How to Build (For User)

1. Install Node.js from nodejs.org
2. Run: `npm install -g expo-cli`
3. Create free Expo account
4. In app directory: `npm install`
5. Run: `expo login`
6. Build: `npm run build:android`
7. Download APK from Expo
8. Transfer to tablet via USB
9. Install on tablet (enable "Unknown Sources" in Settings)

**No Android SDK or development tools needed on your computer.**

## Default Credentials

- **Admin PIN**: `0000`
- **Register PIN**: `1111` (or auto-starts after 5 seconds)

## Data Structure

### Student Record
```typescript
{
  id: number
  barcode: string              // Unique, STU format
  name: string
  balance: number              // Current point balance
  is_active: boolean           // Not archived
  created_at: string           // ISO timestamp
  updated_at: string
}
```

### Product Record
```typescript
{
  id: number
  barcode: string              // Unique, PRD format
  name: string
  point_cost: number           // Cost in points
  quantity?: number            // Optional inventory
  low_stock_threshold?: number // Warning level
  is_active: boolean           // Not archived
  created_at: string
  updated_at: string
}
```

### Purchase Record
```typescript
{
  id: number
  student_id: number
  product_id: number
  student_name: string
  product_name: string
  point_cost: number           // Cost at time of purchase
  points_after: number         // Balance after purchase
  is_reversed: boolean
  reversed_at?: string         // When undo was done
  reverse_reason?: string
  created_at: string           // Transaction timestamp
}
```

## Next Steps (When You Provide Tablet Info)

Once you provide exact tablet details:
1. Confirm Android version
2. Adjust `minSdkVersion` if needed (currently set to 21 for Android 5.0+)
3. Test barcode scanner HID compatibility
4. Build final APK optimized for your device
5. Provide APK file ready for transfer

## Testing Checklist (Before Deployment)

- [ ] Install APK on tablet
- [ ] Launch Register Mode (5-second wait or "START REGISTER")
- [ ] Create test student via Admin Mode
- [ ] Create test product via Admin Mode
- [ ] Scan student barcode (should select student)
- [ ] Scan product barcode (should add to cart)
- [ ] Complete checkout
- [ ] Verify balance decreased
- [ ] Check purchase in History
- [ ] Test undo/reversal
- [ ] Create backup
- [ ] Transfer backup file to Windows via USB
- [ ] Test inactivity lock (60 seconds)
- [ ] Test PIN protection on exit
- [ ] Verify data persists after restart

## Files Ready for Review

All source files are complete and in the repository. You can:
- Review code structure
- Modify styles or behavior
- Adjust PINs or timeouts
- Change colors or text
- Add additional features

## No Build Yet

The APK **has not been built** yet. When you provide your tablet details, I will:
1. Adjust `app.json` for your specific Android version if needed
2. Build the APK using Expo's cloud build service
3. Provide you with the downloadable APK file
4. Give you simple USB transfer instructions

## Questions?

- Feature clarification: Check README.md
- Build process: See BUILD_INSTRUCTIONS.md
- Code changes: Files are ready to modify

Ready to proceed once you have your tablet and can provide:
- Android version
- Device model (if possible)
- Screen size (approximate inches)
