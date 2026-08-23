# Visual UI Reference Guide

This document shows the exact layout and appearance of each screen.

---

## PIN Screen

```
┌─────────────────────────────────┐
│  Token Store Register           │
│  Enter PIN or press Start       │
│                                 │
│  ____  (masked PIN input)       │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │  1  │  │  2  │  │  3  │     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │  4  │  │  5  │  │  6  │     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │  7  │  │  8  │  │  9  │     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │  0  │  │  ⌫  │  │  C  │     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌──────────────────────────┐   │
│  │  START REGISTER          │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  ENTER (if 4 digits)     │   │
│  └──────────────────────────┘   │
│                                 │
│  Enter 4-digit PIN to access    │
│  admin settings                 │
└─────────────────────────────────┘

Button Sizes: 80×80px each keypad button
            Full width for action buttons (48px height)
Text: 36pt title, 16pt subtitle
```

---

## Register Mode - Student Selection

```
┌─────────────────────────────────┐
│  REGISTER MODE                  │
│  [← Lock]  [Exit to PIN 🔒]     │
├─────────────────────────────────┤
│                                 │
│  Select Student                 │
│  ┌──────────────────────────┐   │
│  │ [Search by name/barcode] │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Student #1               │   │
│  │ 50 points                │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Student #2               │   │
│  │ 75 points                │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Student #3               │   │
│  │ 100 points               │   │
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘

Card Size: Full width, 80px height
Text: 18pt bold for name, 16pt for balance
```

---

## Register Mode - Checkout Flow

```
┌─────────────────────────────────┐
│  REGISTER MODE                  │
│  [← Change Student] [Exit 🔒]   │
├─────────────────────────────────┤
│ Student: John Smith             │
│ Balance: 150 points ✓           │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  Scan Product Barcode    │   │
│  │  [Input Field]           │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  SHOPPING CART                  │
│  ─────────────────────────────  │
│  Cookie         5 pts  [1] ✕    │
│  Juice         10 pts  [2] ✕    │
│  Chips          7 pts  [1] ✕    │
│  ─────────────────────────────  │
│  TOTAL:              22 points   │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  ✓ CHECKOUT (22 points)  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  × CLEAR CART            │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘

Input field: 48px height, large font
Buttons: Full width, 56px height
Text: 14pt for items, 18pt for total
```

---

## Admin Mode - Tab Bar

```
┌─────────────────────────────────┐
│ ADMIN MODE              [EXIT]  │
├─────────────────────────────────┤
│ ⚡Points │ Students │ Products  │
│ History │ Backup                │
├─────────────────────────────────┤
│ (Content for active tab below)  │
└─────────────────────────────────┘

Tab height: 50px
Active tab: Red border-bottom
Text: 12pt bold
Tabs scroll if needed
```

---

## Admin Mode - ⚡ Quick Points Tab (Single Entry)

```
┌─────────────────────────────────┐
│ ADMIN MODE              [EXIT]  │
├─────────────────────────────────┤
│ ⚡Points │ Students │ Products  │
├─────────────────────────────────┤
│                                 │
│            Add Points           │
│                                 │
│  Select a student to adjust     │
│  points                         │
│                                 │
│  ┌──────────────────────────┐   │
│  │  START BATCH ENTRY       │   │
│  └──────────────────────────┘   │
│                                 │
│  Quickly add points to          │
│  multiple students in sequence  │
│                                 │
│  Or select a single student:    │
│  ─────────────────────────────  │
│  ┌──────────────────────┐       │
│  │ John Smith           │       │
│  │ 150 pts              │       │
│  │        [Modify]      │       │
│  └──────────────────────┘       │
│                                 │
│  ┌──────────────────────┐       │
│  │ Sarah Cohen          │       │
│  │ 75 pts               │       │
│  │        [Modify]      │       │
│  └──────────────────────┘       │
│                                 │
└─────────────────────────────────┘

Buttons: Full width, 48px height
Cards: 80px height, 12px padding
```

---

## Admin Mode - ⚡ Quick Points Tab (Batch Entry)

```
┌─────────────────────────────────┐
│ ADMIN MODE              [EXIT]  │
├─────────────────────────────────┤
│ ⚡Points │ Students │ Products  │
├─────────────────────────────────┤
│                                 │
│     Fast Batch Entry            │
│     ─────────────────────       │
│     3 of 15                     │
│                                 │
│  ┌──────────────────────────┐   │
│  │   John Smith             │   │
│  │   STU00000003            │   │
│  │                          │   │
│  │ Current Balance: 50      │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ [ADD] [SET] [SUBTRACT]   │   │
│  └──────────────────────────┘   │
│  (ADD is highlighted)           │
│                                 │
│  ┌──────────────────────────┐   │
│  │         37               │   │
│  │    [Input field]         │   │
│  └──────────────────────────┘   │
│                                 │
│  New balance after adding:      │
│              87                 │
│                                 │
│  ┌──────────────────────────┐   │
│  │  ✓ NEXT                  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  ← PREV                  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  → SKIP                  │   │
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘

Student name: 32pt bold, blue
Counter: 14pt gray
Current balance: 24pt bold
Preview section: Green background, 28pt bold
Input field: 28pt bold, 80px height
Buttons: Full width, 56px height each
```

---

## Admin Mode - ⚡ Quick Points Tab (Points Modal)

```
┌─────────────────────────────────┐
│ (Semi-transparent overlay)      │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Manage Points           │   │
│   │ John Smith              │   │
│   │ Current: 50 points      │   │
│   │                         │   │
│   │ ┌─────┬─────┬─────┐     │   │
│   │ │ ADD │ SET │ SUB │     │   │
│   │ └─────┴─────┴─────┘     │   │
│   │ (ADD active, others gray)   │
│   │                         │   │
│   │ ┌─────────────────────┐ │   │
│   │ │       37            │ │   │
│   │ │  [Amount input]     │ │   │
│   │ └─────────────────────┘ │   │
│   │                         │   │
│   │ ┌─────────┬──────────┐  │   │
│   │ │ Cancel  │ Confirm  │  │   │
│   │ └─────────┴──────────┘  │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘

Modal: 80% width, white background
Title: 18pt bold
Subtitle: 16pt gray
Buttons: 3 equal columns, 44px height
Input: Full width, 56px height
Action buttons: 56px height, full width
```

---

## Admin Mode - Students Tab

```
┌─────────────────────────────────┐
│ ADMIN MODE              [EXIT]  │
├─────────────────────────────────┤
│ Points │ ⚡Students │ Products  │
├─────────────────────────────────┤
│ Students        [+ Add]         │
│                                 │
│ [Show Archived] [Toggle]        │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ John Smith                   │ │
│ │ STU00000001  │  150 points    │ │
│ │ [Edit] [Archive]             │ │
│ └──────────────────────────────┘ │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ Sarah Cohen                  │ │
│ │ STU00000002  │  75 points     │ │
│ │ [Edit] [Archive]             │ │
│ └──────────────────────────────┘ │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ David Miller                 │ │
│ │ STU00000003  │  200 points    │ │
│ │ [Edit] [Archive]             │ │
│ └──────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

Card height: 100px
Text: 16pt for name, 12pt for barcode/balance
Buttons: 48px height, 8px spacing
```

---

## Admin Mode - History Tab

```
┌─────────────────────────────────┐
│ ADMIN MODE              [EXIT]  │
├─────────────────────────────────┤
│ Points │ Students │ Products    │
│ ⚡History │ Backup            │
├─────────────────────────────────┤
│ Purchase History                │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ John Smith > Cookie   5 pts   │ │
│ │ 2024-08-23 14:32:15          │ │
│ │                 [Undo]        │ │
│ └──────────────────────────────┘ │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ Sarah Cohen > Juice  10 pts   │ │
│ │ 2024-08-23 14:30:42          │ │
│ │                 [Undo]        │ │
│ └──────────────────────────────┘ │
│                                 │
│ ┌──────────────────────────────┐ │
│ │ David > Chips       7 pts     │ │
│ │ (REVERSED)                    │ │
│ │ 2024-08-23 14:28:10          │ │
│ │ (Grayed out - already undone) │ │
│ └──────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

Card height: 90px
Reversed purchases: 60% opacity
Undo button: Red, 48px height
Text: 14pt for main, 12pt for timestamp
```

---

## Color Scheme

| Element | Color | Hex | Use |
|---------|-------|-----|-----|
| Primary | Blue | #2196F3 | Action buttons, links |
| Success | Green | #4CAF50 | Confirm, checkout, save |
| Danger/Admin | Red | #d32f2f | Exit, archive, admin header |
| Warning | Orange | #FF9800 | Skip, secondary action |
| Background | Light Gray | #f5f5f5 | Main background |
| Card | White | #ffffff | Content cards, modals |
| Text | Dark Gray | #333333 | Primary text |
| Subtext | Medium Gray | #666666 | Secondary text |
| Disabled | Light Gray | #cccccc | Disabled state |

---

## Font Sizes

| Element | Size | Weight | Use |
|---------|------|--------|-----|
| Page Title | 28-36pt | Bold | "ADMIN MODE", "Token Store Register" |
| Section Title | 18-24pt | Bold | Tab labels, screen titles |
| Card Title | 16pt | Bold | Student/Product names |
| Body Text | 14-16pt | Regular | Main content, buttons |
| Small Text | 12-13pt | Regular | Subtitles, timestamps |
| Very Small | 11-12pt | Regular | Hints, non-critical info |

All sizes follow Android Material Design (dp) but scale for tablet.
Minimum readable size on tablet from 2-3 feet: 12pt.

---

## Touch Target Sizes

| Element | Size | Standard |
|---------|------|----------|
| Large Buttons | 56-64px height | Checkout, Save, Exit |
| Normal Buttons | 48-52px height | Edit, Archive, Modify |
| Small Buttons | 40-44px height | Tab buttons, small actions |
| Minimum | 40px | Never smaller (accessibility) |
| Spacing | 8-12px | Between elements |

---

## Responsive Layout

### Portrait (Default)
- Full-width content with 12px padding
- Buttons stack vertically if needed
- Tab bar scrolls horizontally if 5+ tabs
- All text readable at arm's length (2-3 feet)

### Landscape (Future Support)
- Register Mode: Side-by-side student + cart view
- Admin Mode: Wider cards, horizontal layout
- Tab bar: Potentially vertical sidebar
- Input fields: Wider for easier typing

---

## Animation & Feedback

| Action | Feedback | Duration |
|--------|----------|----------|
| Button press | Highlight, ripple effect | 200ms |
| Tab switch | Fade transition | 300ms |
| Modal open | Scale + fade in | 200ms |
| Modal close | Fade out | 150ms |
| Confirmation | Alert dialog | User-dependent |
| Success | Brief highlight | 500ms |
| Error | Red text + shake | 300ms + visible |

---

## Accessibility Notes

✅ **Large Touch Targets**: No button smaller than 40px  
✅ **High Contrast**: Text 16pt+ readable against background  
✅ **Color Not Only**: Icons and text used together  
✅ **No Hover Required**: All functions work via tap  
✅ **Readable Fonts**: Sans-serif, clear letterforms  
✅ **Adequate Spacing**: 8-12px minimum between interactive elements  
✅ **Confirmations**: All destructive actions require dialog  
✅ **Error Messages**: Clear and actionable text  

---

## Dark Mode (Not Implemented, but Compatible)

The app uses standard Material Design colors that work well with dark mode.
Current implementation uses light theme throughout.
Dark mode can be added by inverting color scheme if needed in future.

---

This visual guide should help you understand the exact layout and appearance of every screen in the app!
