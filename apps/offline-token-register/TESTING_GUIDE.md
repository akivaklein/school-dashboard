# Complete Testing Guide for Offline Token Register

## Device Requirements
- Android tablet (preferably 2018+)
- Android 5.0+ (API 21+)
- Screen size: 7" to 12" recommended
- Touch-screen compatible

## Pre-Launch Checklist

### Installation
- [ ] APK downloaded from Expo build
- [ ] Unknown Sources enabled in tablet security settings
- [ ] APK installed on tablet
- [ ] App appears in app drawer/launcher

### Initial Launch
- [ ] Tap "Token Register" to launch
- [ ] Splash screen displays (if configured)
- [ ] App loads database successfully

---

## Testing Workflow

### PHASE 1: PIN Screen - Authentication

**Test 1.1: Auto-Enter Register Mode**
- [ ] Launch app
- [ ] Wait 5 seconds without pressing anything
- [ ] Should automatically enter Register Mode

**Test 1.2: Enter Register Mode with PIN**
- [ ] Launch app
- [ ] Tap "START REGISTER" button
- [ ] Should navigate to Register Mode screen

**Test 1.3: Enter Admin Mode with PIN**
- [ ] Launch app
- [ ] Tap PIN buttons to enter `0000`
- [ ] Tap "ENTER" button
- [ ] Should navigate to Admin Mode

**Test 1.4: PIN Input Feedback**
- [ ] Verify PIN display shows masked dots (●●●●)
- [ ] Verify backspace (⌫) removes last digit
- [ ] Verify clear (C) removes all digits

---

### PHASE 2: Admin Mode - Quick Points Entry

**Test 2.1: Quick Points Tab Default View**
- [ ] Tap "⚡ Points" tab (should be first tab)
- [ ] Should show "Add Points" heading
- [ ] Should show "START BATCH ENTRY" button
- [ ] Should show list of active students below

**Test 2.2: Single Student Point Modification**
- [ ] In Admin Mode > Points tab
- [ ] Select any student from the list
- [ ] Tap "Modify" button
- [ ] Should show modal with:
  - [ ] Student name displayed
  - [ ] Current balance shown
  - [ ] Three operation tabs: ADD / SET / SUBTRACT
  - [ ] Amount input field
  - [ ] Cancel/Confirm buttons

**Test 2.3: ADD Operation**
- [ ] Select a student (e.g., current balance = 50)
- [ ] Operation should default to "ADD"
- [ ] Enter amount: 37
- [ ] Tap Confirm
- [ ] Should see confirmation dialog showing: "Add 37 points for [Student]?"
- [ ] Tap Confirm in dialog
- [ ] Modal closes
- [ ] Student list refreshes with new balance (87)
- [ ] Verify in History tab the transaction is recorded

**Test 2.4: SET Operation**
- [ ] Select a different student
- [ ] Tap SET tab
- [ ] Enter amount: 100
- [ ] Confirm
- [ ] Student balance should become exactly 100 (regardless of previous balance)
- [ ] Verify in History

**Test 2.5: SUBTRACT Operation**
- [ ] Select a student with balance ≥ 50 (e.g., balance = 100)
- [ ] Tap SUBTRACT tab
- [ ] Enter amount: 30
- [ ] Confirm
- [ ] Student balance should become 70
- [ ] Verify cannot subtract more than available balance
- [ ] Try to subtract 200 from a student with 50 points
- [ ] Should show error: "Insufficient balance"

---

### PHASE 3: Admin Mode - Batch Entry

**Test 3.1: Start Batch Mode**
- [ ] In Admin Mode > Points tab
- [ ] Tap "START BATCH ENTRY" button
- [ ] Should show first student in list
- [ ] Display: "1 of [N]" counter
- [ ] Large student name and barcode display
- [ ] Current balance shown
- [ ] Operation tabs (ADD/SET/SUBTRACT) with ADD selected by default

**Test 3.2: Batch Entry - Single Student**
- [ ] Batch mode active on Student #1
- [ ] Enter amount: 25
- [ ] Tap "✓ NEXT" button (or "✓ DONE" if only 1 student)
- [ ] Should process the addition immediately
- [ ] Move to next student in list
- [ ] Amount input clears
- [ ] Counter updates to "2 of [N]"

**Test 3.3: Batch Entry - Navigate Students**
- [ ] In batch mode with multiple students
- [ ] Verify "← PREV" button appears (except on first student)
- [ ] Tap "← PREV" to go back to previous student
- [ ] Counter updates correctly
- [ ] Tap "→ SKIP" to skip current student without entering points
- [ ] Move to next student

**Test 3.4: Batch Entry - New Balance Preview**
- [ ] In batch mode, select ADD operation
- [ ] Student has 50 points
- [ ] Enter amount: 37
- [ ] Preview section should show: "New balance after adding: 87"
- [ ] Change to SET operation
- [ ] Preview should show: "New balance if set to: 37"
- [ ] Change to SUBTRACT
- [ ] Preview should show: "New balance after subtracting: 13"

**Test 3.5: Batch Entry - Sequence Multiple Students**
- [ ] Complete entry for Student #1 (Add 25) → Next
- [ ] Complete entry for Student #2 (Add 40) → Next
- [ ] Complete entry for Student #3 (Add 15) → Done
- [ ] After last student, should show "BATCH COMPLETE" button
- [ ] Tap to exit batch mode
- [ ] Return to single student selection view
- [ ] Verify all three students have updated balances in list

**Test 3.6: Batch Entry - Insufficient Balance Handling**
- [ ] Start batch mode
- [ ] Select SUBTRACT operation
- [ ] Try to subtract more points than student has
- [ ] Should show error alert
- [ ] Should NOT proceed to next student
- [ ] Can correct and try again

---

### PHASE 4: Admin Mode - Other Tabs

**Test 4.1: Students Tab**
- [ ] Click Students tab
- [ ] Should show list of active students
- [ ] Each student card shows: name, barcode, points
- [ ] "Add" button (green, +Add) to create new student
- [ ] "Edit" button to modify student details
- [ ] "Archive" button to soft-delete (grayed if archived)
- [ ] "Restore" button to reactivate (if viewing archived)

**Test 4.2: Products Tab**
- [ ] Click Products tab
- [ ] Should show list of active products
- [ ] Each product shows: name, barcode, point cost, stock (if set)
- [ ] "Add" button to create new product
- [ ] Similar Edit/Archive/Restore functions as students

**Test 4.3: History Tab**
- [ ] Click History tab
- [ ] Should show last 50 purchases in reverse chronological order
- [ ] Each entry shows: student name, product name, points, timestamp
- [ ] Reversed purchases are grayed out
- [ ] "Undo" button (red) on un-reversed purchases
- [ ] Tapping Undo reverses the purchase and restores points

**Test 4.4: Backup Tab**
- [ ] Click Backup tab
- [ ] Tap "Create Backup" button
- [ ] Sharing dialog should appear
- [ ] Select "Save to Files" or similar
- [ ] File should be named: TokenRegister_Backup_[TIMESTAMP].json
- [ ] Verify file can be transferred to Windows via USB

---

### PHASE 5: Register Mode - Checkout Flow

**Test 5.1: Student Selection Screen**
- [ ] In Register Mode, should see student list
- [ ] Large student cards with name and balance
- [ ] Search bar at top
- [ ] Can type student name to search/filter
- [ ] Can tap student card to select

**Test 5.2: Barcode Scanning - Student**
- [ ] Student selected (or search shows student list)
- [ ] Barcode input field focused
- [ ] Scan student barcode using NETUM scanner
- [ ] Barcode format: STU00000001
- [ ] Student should be selected automatically
- [ ] Focus should move to product barcode field

**Test 5.3: Barcode Scanning - Products**
- [ ] Student selected
- [ ] Barcode input focused
- [ ] Scan product barcodes (PRD format)
- [ ] Product added to cart
- [ ] Quantity automatically increments if same product scanned twice
- [ ] Cart displays: product name, point cost, quantity
- [ ] Total cost calculated in real-time

**Test 5.4: Manual Product Selection**
- [ ] If barcode scanner not available
- [ ] Should be able to select products from dropdown or list
- [ ] Tapping product adds to cart

**Test 5.5: Checkout Flow**
- [ ] Student selected with sufficient balance
- [ ] Products in cart
- [ ] Tap "CHECKOUT" button
- [ ] Confirmation dialog should show:
  - [ ] Student name
  - [ ] Items in cart with quantities
  - [ ] Total points cost
  - [ ] "Confirm" and "Cancel" buttons
- [ ] Tap Confirm
- [ ] Purchase recorded
- [ ] Student balance updated
- [ ] Cart cleared
- [ ] Return to student selection after 60 seconds or manual clear

**Test 5.6: Insufficient Balance**
- [ ] Student has 50 points
- [ ] Try to checkout with items totaling 75 points
- [ ] Should show error: "Insufficient balance"
- [ ] Purchase should NOT be recorded
- [ ] Can select different products or student

---

### PHASE 6: Inactivity & Screen Lock

**Test 6.1: Auto-Lock Register Mode**
- [ ] In Register Mode, no activity for 60 seconds
- [ ] Screen should return to student selection
- [ ] Student selection should be cleared
- [ ] Ready for next student

**Test 6.2: Manual Lock (Exit to PIN)**
- [ ] In Register Mode
- [ ] Tap lock icon (🔒) if present
- [ ] Should require PIN confirmation to exit
- [ ] Should return to PIN screen
- [ ] Can re-enter Register or Admin mode

**Test 6.3: Exit Admin Mode**
- [ ] In Admin Mode
- [ ] Tap "EXIT" button (red, top right)
- [ ] Should show confirmation dialog
- [ ] Tap "Exit" to confirm
- [ ] Return to PIN screen

---

### PHASE 7: Data Persistence

**Test 7.1: Data Survives App Restart**
- [ ] Create students and products in Admin Mode
- [ ] Record purchases in Register Mode
- [ ] Force close app (swipe from recent apps)
- [ ] Relaunch app
- [ ] All data should be present
- [ ] Balances should be updated
- [ ] History should show past purchases

**Test 7.2: Large Dataset**
- [ ] Add 50+ students
- [ ] Add 20+ products
- [ ] Record 100+ purchases
- [ ] App should still perform well
- [ ] No lag in switching tabs or scrolling

**Test 7.3: Backup & Restore**
- [ ] Create backup from Admin > Backup tab
- [ ] Share/save backup to Windows computer
- [ ] Verify backup is JSON format
- [ ] Contains all students, products, purchases, history
- [ ] Delete some data or edit balances
- [ ] Restore from backup file
- [ ] Data should return to backed-up state

---

### PHASE 8: UI & Usability (Tablet-Specific)

**Test 8.1: Button Sizes & Touch Targets**
- [ ] All buttons should be at least 48x48 dp
- [ ] Buttons should be easily tappable without precision
- [ ] No accidental button presses
- [ ] Sufficient spacing between buttons (8-12 dp)

**Test 8.2: Text Readability**
- [ ] All text should be readable from 2-3 feet away
- [ ] Large headings (24-32pt)
- [ ] Regular text (14-16pt)
- [ ] No text smaller than 12pt except non-critical info

**Test 8.3: Portrait vs Landscape**
- [ ] Rotate tablet to landscape
- [ ] UI should adapt (if implemented)
- [ ] Register Mode should optimize for landscape checkout
- [ ] No cut-off text or buttons

**Test 8.4: Color Contrast**
- [ ] All text readable against background
- [ ] Status/action colors clear:
  - [ ] Green for success (checkout, save)
  - [ ] Red for danger/admin/exit
  - [ ] Blue for primary actions
  - [ ] Orange/Yellow for warnings

**Test 8.5: No Hover/Context Menu Needed**
- [ ] All functions accessible via tap only
- [ ] No right-click required
- [ ] No hover states that require pointer
- [ ] Works entirely with touch input

---

### PHASE 9: Edge Cases & Error Handling

**Test 9.1: Empty Database**
- [ ] First launch with no students
- [ ] Should show "No active students" message
- [ ] Can still add students in Admin Mode
- [ ] Can still add products

**Test 9.2: Invalid Input**
- [ ] Try to add student with blank name
- [ ] Should show error: "Student name is required"
- [ ] Try to set negative point amount
- [ ] Should show error or validation message
- [ ] Try to set point cost to 0
- [ ] Should show error: "Point cost must be greater than 0"

**Test 9.3: Duplicate Barcodes**
- [ ] Try to create student with duplicate barcode
- [ ] Should prevent or show warning
- [ ] Each barcode should be unique

**Test 9.4: Network Interference**
- [ ] App should work completely offline
- [ ] No internet required
- [ ] All functions should be available without network

---

## Performance Benchmarks

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| App Launch | < 3 seconds | Database init + UI render |
| Load 100 students | < 1 second | Tab switch |
| Checkout (5 items) | < 2 seconds | Database write + UI update |
| Search 50 students | < 500ms | Real-time filter |
| Batch entry (10 students) | < 15 seconds | Continuous rapid entries |
| Backup creation | < 5 seconds | JSON export |
| Restore from backup | < 10 seconds | Full database reload |

---

## Sign-Off Checklist

- [ ] All Phase 1-9 tests passed
- [ ] No crashes or error messages
- [ ] Data persists across restarts
- [ ] Performance acceptable for 2018+ tablets
- [ ] All tablet-optimized features working
- [ ] Ready for production deployment

---

## Known Limitations & Workarounds

1. **Barcode Scanner Not Working**
   - Verify Bluetooth pairing
   - Ensure scanner is in HID/keyboard mode
   - Try manual product selection

2. **Slow Performance on Older Tablets**
   - Close background apps
   - Clear app cache
   - Restart tablet
   - Consider archiving old records (only keeps recent in active lists)

3. **Data Not Syncing to Another Device**
   - App is offline-only (by design)
   - Use Backup/Restore for manual sync via USB

---

## Support & Issue Reporting

If issues occur:
1. Note the exact screen where issue occurs
2. Note steps to reproduce
3. Check Admin > History for any recorded errors
4. Create backup before troubleshooting
5. Try uninstall/reinstall as last resort
