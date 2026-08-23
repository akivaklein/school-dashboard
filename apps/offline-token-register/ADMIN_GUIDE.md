# Quick Admin Reference Guide

## Access Credentials
| Mode | PIN | Access |
|------|-----|--------|
| Register Mode | `1111` or wait 5 sec | Student checkout interface |
| Admin Mode | `0000` | Full management dashboard |

---

## Quick Points Tab (⚡ Points)

### Single Student Entry
1. Tap **Quick Points** tab (lightning bolt icon)
2. See list of students with current balances
3. Select student → Tap "Modify"
4. Choose operation: ADD / SET / SUBTRACT
5. Enter amount
6. Tap "Confirm"
7. Select next student

### Batch Entry (Recommended for Multiple Students)
1. Tap **Quick Points** tab
2. Tap **START BATCH ENTRY**
3. Current student displayed prominently (e.g., "1 of 15")
4. Enter points amount
5. Choose operation (ADD, SET, or SUBTRACT)
6. Preview shows new balance in real-time
7. Tap **✓ NEXT** to save and move to next student
8. Use **← PREV** or **→ SKIP** if needed
9. Last student shows **✓ DONE** button
10. Tap **BATCH COMPLETE** when finished

### History
- Every balance change is saved with timestamp
- View in Admin Mode → History tab
- Undo purchases by tapping "Undo" button

---

## Students Tab

### Add Student
1. Tap **Students** tab
2. Tap **+ Add**
3. Enter: Name, Barcode (auto-generated), Starting Balance
4. Tap **Save**

### Edit Student
1. Find student in list
2. Tap **Edit**
3. Modify fields
4. Tap **Save**

### Archive Student (Soft-Delete)
1. Tap student's **Archive** button
2. Confirm deletion
3. Student hidden from active list
4. Toggle "Show Archived" to see archived students
5. Can restore if needed

---

## Products Tab

### Add Product/Snack
1. Tap **Products** tab
2. Tap **+ Add**
3. Enter:
   - Name (e.g., "Cookie")
   - Barcode (auto-generated, e.g., PRD00000001)
   - Point Cost (e.g., 5)
   - Quantity (optional, e.g., 10)
   - Low Stock Threshold (optional, e.g., 3)
4. Tap **Save**

### Manage Inventory
- Leave Quantity blank if no inventory tracking needed
- Set Quantity to track stock (e.g., 10 cookies available)
- Low Stock Threshold alerts when quantity drops below this level

---

## History Tab

### View Purchase History
1. Tap **History** tab
2. See all purchases in reverse chronological order
3. Grayed-out entries = already reversed

### Undo a Purchase (Refund)
1. Find purchase in history
2. Tap **Undo** button
3. Confirm reversal
4. Points automatically restored to student
5. History shows reversal marker

---

## Backup Tab

### Create Backup
1. Tap **Backup** tab
2. Tap **Create Backup**
3. Sharing dialog appears
4. Choose "Save to Files" or similar option
5. File saved to tablet

### Transfer Backup to Computer
1. Connect tablet to Windows via USB
2. Enable USB Storage Mode
3. File location: `/sdcard/Download/TokenRegister_Backup_[timestamp].json`
4. Drag file to Windows computer
5. Save in safe location

### Restore from Backup
1. Transfer backup file to tablet via USB
2. Open file from Files app
3. App detects backup format
4. Confirms restoration (will overwrite current data)
5. Data restored, app restarts

---

## Typical Workflow

### First Setup
1. Enter Admin Mode (PIN: `0000`)
2. Go to **Students** tab
3. Add all students with starting balances
4. Go to **Products** tab
5. Add all snacks with point costs
6. Test in Register Mode
7. Create backup

### Regular Operation
1. Students enter Register Mode to make purchases
2. Periodically enter Admin Mode to:
   - Check History for sales trends
   - Restore low inventory (adjust Quantity)
   - Correct any balance errors

### Weekly Adjustment
1. **Quick Points** tab
2. Start Batch Entry
3. Add weekly allowance to each student
4. Review any reversals in History

---

## Common Scenarios

### "I Added 100 Points But It Only Shows 50"
- Check History tab for details
- Verify you completed the operation (tapped Confirm)
- If error occurred, try operation again

### "Student Has Negative Balance"
- This shouldn't happen (app validates)
- If it occurs, SET balance to correct amount

### "I Can't Find a Student"
- Check if student is archived
- Toggle "Show Archived" in Students tab
- Can restore if needed

### "Barcode Scanner Not Working"
- Verify Bluetooth pairing in tablet settings
- Ensure scanner in HID/Keyboard mode
- Can manually select students/products from lists

### "I Lost Data"
- Restore from backup file if available
- Otherwise, recreate students and products
- Always backup regularly

---

## Keyboard Shortcuts (on PIN Screen)

| Action | Button |
|--------|--------|
| Enter digit | Tap number (1-9, 0) |
| Delete last digit | Tap ⌫ (backspace) |
| Clear entire PIN | Tap C (clear) |
| Enter Register Mode | Tap "START REGISTER" |
| Submit PIN | Tap "ENTER" when 4 digits entered |

---

## Tips for Best Performance

1. **Batch Entry is Faster** - For adding points to multiple students, use Batch Mode
2. **Create Regular Backups** - Before major changes or weekly
3. **Archive Old Records** - Keep active lists manageable
4. **Close Other Apps** - More memory for Token Register
5. **Landscape Mode for Checkout** - If tablet supports, maximizes checkout screen
6. **Use Barcode Scanner** - Faster than typing/searching

---

## Emergency Procedures

### App Crashes
1. Force close: Swipe from Recent Apps
2. Restart app
3. If data lost, restore from backup

### Wrong PIN Entered
1. Tap "C" to clear
2. Re-enter correct PIN
3. If locked out, restart app

### Balance Error
1. Check History for transaction details
2. Use SET operation to correct balance to actual amount
3. Create note in History with reason

### Can't Exit Admin Mode
1. Tap "EXIT" at top right
2. Confirm in dialog
3. If stuck, restart tablet

---

## Support Contact
For issues, technical questions, or feature requests, refer to README.md and BUILD_INSTRUCTIONS.md files included with the app.
