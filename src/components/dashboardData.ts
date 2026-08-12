type StudentServiceEntry = {
  staffId?: string | null
  type?: string
  hrs?: number
}

type StudentNoteEntry = {
  date?: string
  staff?: string
  notes?: string
  duration?: string
  author?: string
  text?: string
}

type StudentFamilyDetails = {
  fatherName: string
  fatherPhone: string
  fatherEmail: string
  motherName: string
  motherPhone: string
  motherEmail: string
  address: string
  emergencyContact: string
  emergencyPhone: string
}

type StudentMedicalDetails = {
  allergies: Array<{ name: string; severity: string }>
  medications: Array<{ name: string; dosage: string; frequency: string }>
  conditions: string[]
  doctorName: string
  doctorPhone: string
  lastPhysical: string
  notes: string
}

import { getDailyAttendanceStatus } from '../utils/attendancePresence'

type DemoCoverageProfile = {
  expectedLocation: string
  actualCurrentLocation: string
  provider: string
  serviceType: string
  scheduledDeparture: string
  expectedReturn: string
  actualDeparture: string
  actualReturn: string
  scheduledVersusUnexpected: 'scheduled' | 'unexpected'
  approvedVersusUnexplained: 'approved' | 'unexplained'
  statusCode: 'present' | 'late' | 'absent' | 'unresolved' | 'unknown'
}

type StudentRecord = {
  id: number
  name: string
  points: number
  reminders: number
  lastWeekReminders: number
  att: string[]
  breakfast: string[]
  detention: boolean
  status: string
  withStaff: string | null
  services: StudentServiceEntry[]
  parentCalls: StudentNoteEntry[]
  notes: StudentNoteEntry[]
  behaviorLog: unknown[]
  testScores: Array<{
    id: string
    teacher: string
    subject: string
    skill: string
    assessmentName: string
    date: string
    scoreType: string
    score: number | null
    maxScore: number | null
    rating: string | null
    notes: string
  }>
  iep: boolean
  iepDetails: string
  classLog: Array<{ time: string; type: string; note?: string; staffId?: string | null }>
  lateDetails: { timeArrived?: string; reason?: string; note?: string } | null
  family: StudentFamilyDetails
  medical: StudentMedicalDetails
  dailyStatus?: string
  coverageDemo?: DemoCoverageProfile
  [key: string]: unknown
}

export const STORE_ITEMS = [
  // Drinks
  { id: 1, name: 'Water Bottle', cost: 8, emoji: '💧', category: 'drinks', vip: false, stock: 48, lowStockAt: 12, imageUrl: '' },
  { id: 2, name: 'Gatorade Berry', cost: 30, emoji: '🧃', category: 'drinks', vip: false, stock: 16, lowStockAt: 6, imageUrl: '' },
  { id: 3, name: 'Gatorade Lemon Lime', cost: 30, emoji: '🧃', category: 'drinks', vip: false, stock: 14, lowStockAt: 6, imageUrl: '' },
  { id: 4, name: 'Apple Juice Box', cost: 18, emoji: '🧃', category: 'drinks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '' },
  { id: 5, name: 'Orange Juice Box', cost: 18, emoji: '🧃', category: 'drinks', vip: false, stock: 20, lowStockAt: 8, imageUrl: '' },
  { id: 6, name: 'Seltzer Can', cost: 15, emoji: '🥤', category: 'drinks', vip: false, stock: 30, lowStockAt: 10, imageUrl: '' },
  { id: 7, name: 'Snapple Peach', cost: 35, emoji: '🥤', category: 'drinks', vip: false, stock: 12, lowStockAt: 5, imageUrl: '' },

  // Food
  { id: 20, name: 'Pizza Slice', cost: 50, emoji: '🍕', category: 'food', vip: true, stock: 10, lowStockAt: 4, imageUrl: '' },
  { id: 21, name: 'Bagel with Cream Cheese', cost: 35, emoji: '🥯', category: 'food', vip: false, stock: 16, lowStockAt: 5, imageUrl: '' },
  { id: 22, name: 'Plain Bagel', cost: 25, emoji: '🥯', category: 'food', vip: false, stock: 20, lowStockAt: 6, imageUrl: '' },
  { id: 23, name: 'Tuna Sandwich', cost: 55, emoji: '🥪', category: 'food', vip: true, stock: 8, lowStockAt: 3, imageUrl: '' },
  { id: 24, name: 'Egg Salad Sandwich', cost: 50, emoji: '🥪', category: 'food', vip: true, stock: 8, lowStockAt: 3, imageUrl: '' },
  { id: 25, name: 'Hot Pretzel', cost: 28, emoji: '🥨', category: 'food', vip: false, stock: 18, lowStockAt: 6, imageUrl: '' },
  { id: 26, name: 'French Fries Cup', cost: 45, emoji: '🍟', category: 'food', vip: true, stock: 10, lowStockAt: 4, imageUrl: '' },
  { id: 27, name: 'Knish', cost: 40, emoji: '🥟', category: 'food', vip: false, stock: 12, lowStockAt: 4, imageUrl: '' },

  // Nosh
  { id: 40, name: 'Paskesz Sour Belts', cost: 18, emoji: '🍬', category: 'nosh', vip: false, stock: 32, lowStockAt: 10, imageUrl: '' },
  { id: 41, name: 'Paskesz Lollycones', cost: 15, emoji: '🍭', category: 'nosh', vip: false, stock: 28, lowStockAt: 10, imageUrl: '' },
  { id: 42, name: 'Sour Sticks', cost: 15, emoji: '🍬', category: 'nosh', vip: false, stock: 34, lowStockAt: 10, imageUrl: '' },
  { id: 43, name: 'Fruit Slices Candy', cost: 18, emoji: '🍬', category: 'nosh', vip: false, stock: 24, lowStockAt: 8, imageUrl: '' },
  { id: 44, name: 'Chocolate Bar', cost: 22, emoji: '🍫', category: 'nosh', vip: false, stock: 20, lowStockAt: 8, imageUrl: '' },
  { id: 45, name: 'Klik Chocolate Bag', cost: 25, emoji: '🍫', category: 'nosh', vip: false, stock: 16, lowStockAt: 6, imageUrl: '' },
  { id: 46, name: 'Mike and Ike Box', cost: 20, emoji: '🍬', category: 'nosh', vip: false, stock: 22, lowStockAt: 8, imageUrl: '' },
  { id: 47, name: 'Sour Punch Bites', cost: 22, emoji: '🍬', category: 'nosh', vip: false, stock: 18, lowStockAt: 6, imageUrl: '' },

  // Cookies / cakes
  { id: 60, name: "Reisman's Brownie Bar", cost: 20, emoji: '🍫', category: 'cookies', vip: false, stock: 18, lowStockAt: 6, imageUrl: '' },
  { id: 61, name: 'Chocolate Chip Cookie', cost: 20, emoji: '🍪', category: 'cookies', vip: false, stock: 30, lowStockAt: 10, imageUrl: '' },
  { id: 62, name: 'Fresh Cookie', cost: 30, emoji: '🍪', category: 'cookies', vip: true, stock: 22, lowStockAt: 8, imageUrl: '' },
  { id: 63, name: 'Mini Muffin Pack', cost: 25, emoji: '🧁', category: 'cookies', vip: false, stock: 18, lowStockAt: 6, imageUrl: '' },
  { id: 64, name: 'Cupcake', cost: 30, emoji: '🧁', category: 'cookies', vip: false, stock: 14, lowStockAt: 5, imageUrl: '' },
  { id: 65, name: 'Wafer Bar', cost: 18, emoji: '🍫', category: 'cookies', vip: false, stock: 26, lowStockAt: 8, imageUrl: '' },
  { id: 66, name: 'Chocolate Rugelach', cost: 28, emoji: '🥐', category: 'cookies', vip: false, stock: 16, lowStockAt: 6, imageUrl: '' },

  // Snacks
  { id: 80, name: 'Pretzel Bag', cost: 15, emoji: '🥨', category: 'snacks', vip: false, stock: 36, lowStockAt: 10, imageUrl: '' },
  { id: 81, name: 'Popcorn Bag', cost: 15, emoji: '🍿', category: 'snacks', vip: false, stock: 30, lowStockAt: 10, imageUrl: '' },
  { id: 82, name: 'Potato Chips', cost: 18, emoji: '🥔', category: 'snacks', vip: false, stock: 28, lowStockAt: 10, imageUrl: '' },
  { id: 83, name: 'BBQ Chips', cost: 18, emoji: '🥔', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '' },
  { id: 84, name: 'Onion Rings Snack', cost: 18, emoji: '⭕', category: 'snacks', vip: false, stock: 22, lowStockAt: 8, imageUrl: '' },
  { id: 85, name: 'Bamba Bag', cost: 18, emoji: '🥜', category: 'snacks', vip: false, stock: 20, lowStockAt: 8, imageUrl: '' },
  { id: 86, name: 'Corn Chips', cost: 18, emoji: '🌽', category: 'snacks', vip: false, stock: 22, lowStockAt: 8, imageUrl: '' },
  { id: 87, name: 'Granola Bar', cost: 16, emoji: '▰', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '' },

  // Ices / ice cream
  { id: 100, name: "Klein's Ice Cream Cone", cost: 25, emoji: '🍦', category: 'ices', vip: false, stock: 24, lowStockAt: 8, imageUrl: '' },
  { id: 101, name: "Klein's Ice Cream Sandwich", cost: 25, emoji: '🍨', category: 'ices', vip: false, stock: 20, lowStockAt: 8, imageUrl: '' },
  { id: 102, name: 'Ice Cream Bar', cost: 25, emoji: '🍧', category: 'ices', vip: false, stock: 18, lowStockAt: 6, imageUrl: '' },
  { id: 103, name: 'Icy Cup', cost: 12, emoji: '🧊', category: 'ices', vip: false, stock: 40, lowStockAt: 12, imageUrl: '' },
  { id: 104, name: 'Slush Cup', cost: 15, emoji: '🧊', category: 'ices', vip: false, stock: 26, lowStockAt: 8, imageUrl: '' },
  { id: 105, name: 'Freeze Pop', cost: 10, emoji: '🧊', category: 'ices', vip: false, stock: 50, lowStockAt: 15, imageUrl: '' },

  // Uploaded product images
  { id: 120, name: 'Shufra Wafer Rolls Hazelnut Cream', cost: 35, emoji: '🍪', category: 'cookies', vip: true, stock: 14, lowStockAt: 5, imageUrl: '/store-items/store-items/shufra-wafer-rolls-hazelnut.jpeg' },
  { id: 121, name: 'Shufra Filled Twist Bites Strawberry', cost: 35, emoji: '🍬', category: 'nosh', vip: true, stock: 12, lowStockAt: 4, imageUrl: '/store-items/store-items/shufra-filled-twist-bites-strawberry.jpg' },
  { id: 122, name: 'Gross & Co Nut Crunch Mini Chocolate Bars', cost: 35, emoji: '🍫', category: 'nosh', vip: true, stock: 12, lowStockAt: 4, imageUrl: '/store-items/store-items/gross-nut-crunch.jpg' },
  { id: 123, name: 'Gross & Co Chocolate Crema Caramel', cost: 30, emoji: '🍫', category: 'nosh', vip: true, stock: 10, lowStockAt: 4, imageUrl: '/store-items/store-items/gross-chocolate-crema-caramel.png' },
  { id: 124, name: 'Gross & Co Chocolate Leaves Hazelnuts', cost: 30, emoji: '🍫', category: 'nosh', vip: false, stock: 14, lowStockAt: 5, imageUrl: '/store-items/store-items/gross-chocolate-leaves-hazelnut.jpg' },
  { id: 125, name: 'Shufra Snow Flakes Talafel', cost: 18, emoji: '▰', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '/store-items/store-items/shufra-snow-flakes-talafel.jpg' },
  { id: 126, name: 'Shufra Snow Flakes Onion', cost: 18, emoji: '▰', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '/store-items/store-items/shufra-snow-flakes-onion.png' },
  { id: 127, name: 'Shufra Pretzels Shapes', cost: 18, emoji: '🥨', category: 'snacks', vip: false, stock: 30, lowStockAt: 10, imageUrl: '/store-items/store-items/shufra-pretzels-shapes.jpg' },
  { id: 128, name: 'Shufra Pretzels Mini', cost: 18, emoji: '🥨', category: 'snacks', vip: false, stock: 30, lowStockAt: 10, imageUrl: '/store-items/store-items/shufra-pretzels-mini.jpg' },
  { id: 129, name: 'Gesher Snak Pak Ketchup', cost: 18, emoji: '▰', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '/store-items/store-items/gesher-snak-pak-ketchup.png' },
  { id: 130, name: 'Gesher Snak Pak Hot & Spicy', cost: 18, emoji: '▰', category: 'snacks', vip: false, stock: 24, lowStockAt: 8, imageUrl: '/store-items/store-items/gesher-snak-pak-hot-spicy.png' },
  { id: 131, name: 'Beigel Beigel Sesame Sticks', cost: 20, emoji: '🥨', category: 'snacks', vip: false, stock: 22, lowStockAt: 8, imageUrl: '/store-items/store-items/beigel-sesame-sticks.png' },
  { id: 132, name: 'Beigel Beigel Thin Pretzel Sticks', cost: 20, emoji: '🥨', category: 'snacks', vip: false, stock: 22, lowStockAt: 8, imageUrl: '/store-items/store-items/beigel-thin-pretzel-sticks.png' },
]

export const STORE_CATEGORY_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'food', label: 'Food' },
  { key: 'nosh', label: 'Nosh' },
  { key: 'cookies', label: 'Cookies' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'ices', label: 'Ices / Ice Cream' },
]

export const DEMO_STORE_ACTIVITY: Array<Record<string, unknown>> = []

export const DEMO_STUDENT_FLAGS: Array<Record<string, unknown>> = []






export function openAttendanceReportWindow({ rows, view, selectedStudent, filters }) {
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

  const today = new Date().toLocaleDateString()

  const statusLabel = status => ({
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    'left-early': 'Left Early'
  }[status] || status || 'Unknown')

  const title =
    view === 'student' && selectedStudent
      ? `${selectedStudent.name} Attendance History`
      : view === 'last7'
        ? 'Last 7 School Days Attendance Report'
        : 'Daily Attendance Report'

  const present = rows.filter(s => ['present','late','left-early'].includes(s.lastStatus)).length
  const absent = rows.filter(s => s.lastStatus === 'absent').length
  const late = rows.filter(s => s.lastStatus === 'late').length
  const leftEarly = rows.filter(s => s.lastStatus === 'left-early').length

  const studentHistoryHtml = selectedStudent ? `
    <h2>${escapeHtml(selectedStudent.name)} History</h2>
    <div class="summary-grid">
      <div><b>${selectedStudent.cameToYeshivaDays}</b><span>Came to Yeshiva</span></div>
      <div><b>${selectedStudent.absentDays}</b><span>Absent</span></div>
      <div><b>${selectedStudent.lateDays}</b><span>Late</span></div>
      <div><b>${selectedStudent.leftEarlyDays}</b><span>Left Early</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Day</th>
          <th>Status</th>
          <th>Time</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${selectedStudent.history.map(day => `
          <tr>
            <td>${escapeHtml(day.label)}</td>
            <td><b>${escapeHtml(statusLabel(day.status))}</b></td>
            <td>${escapeHtml(day.arrived || day.left || '—')}</td>
            <td>${escapeHtml(day.note)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''

  const tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Division</th>
          <th>Class</th>
          <th>Today</th>
          <th>Came Last 7</th>
          <th>Absent</th>
          <th>Late</th>
          <th>Left Early</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(stu => `
          <tr>
            <td><b>${escapeHtml(stu.name)}</b></td>
            <td>${escapeHtml(stu.division === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Yeshiva Ketana')}</td>
            <td>${escapeHtml(stu.className)}</td>
            <td>${escapeHtml(statusLabel(stu.lastStatus))}</td>
            <td>${escapeHtml(stu.cameToYeshivaDays)}/7</td>
            <td>${escapeHtml(stu.absentDays)}</td>
            <td>${escapeHtml(stu.lateDays)}</td>
            <td>${escapeHtml(stu.leftEarlyDays)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  const html = `
<!doctype html>
<html>
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #172033;
      margin: 36px;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #172033;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    h1 {
      margin: 0;
      font-size: 26px;
    }
    h2 {
      margin-top: 28px;
      font-size: 18px;
    }
    .muted {
      color: #64748b;
      font-size: 13px;
      margin-top: 6px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 18px 0;
    }
    .summary-grid div {
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      padding: 14px;
      background: #f8fafc;
    }
    .summary-grid b {
      display: block;
      font-size: 28px;
      margin-bottom: 4px;
    }
    .summary-grid span {
      font-size: 12px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .filters {
      border: 1px solid #dbe3ee;
      background: #f8fafc;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 18px;
      font-size: 13px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th {
      text-align: left;
      background: #f1f5f9;
      border: 1px solid #dbe3ee;
      padding: 9px;
      font-size: 12px;
      color: #475569;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #dbe3ee;
      padding: 9px;
    }
    .actions {
      margin: 18px 0;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    button {
      padding: 9px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
      font-weight: 700;
    }
    @media print {
      .actions { display: none; }
      body { margin: 18px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="muted">Hadran Academy · Generated ${escapeHtml(today)}</div>
    </div>
    <div class="muted">
      Report View: <b>${escapeHtml(view)}</b><br/>
      Students Shown: <b>${rows.length}</b>
    </div>
  </div>

  <div class="actions">
    <button onclick="window.print()">Print This Report</button>
    <button onclick="window.close()">Close</button>
  </div>

  <div class="summary-grid">
    <div><b>${present}</b><span>Came to Yeshiva</span></div>
    <div><b>${absent}</b><span>Absent</span></div>
    <div><b>${late}</b><span>Late</span></div>
    <div><b>${leftEarly}</b><span>Left Early</span></div>
  </div>

  <div class="filters">
    <b>Filters:</b>
    Division: ${escapeHtml(filters.division)} ·
    Class: ${escapeHtml(filters.className)} ·
    Status: ${escapeHtml(filters.status)} ·
    Search: ${escapeHtml(filters.search || 'None')}
  </div>

  ${view === 'student' && selectedStudent ? studentHistoryHtml : tableHtml}
</body>
</html>
`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow popups to generate the report.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

export function buildAttendanceReportRows(students) {
  const reportDays = [
    { key: 'today', label: 'Today', offset: 0 },
    { key: 'yesterday', label: 'Yesterday', offset: 1 },
    { key: 'twoDays', label: '2 Days Ago', offset: 2 },
    { key: 'threeDays', label: '3 Days Ago', offset: 3 },
    { key: 'fourDays', label: '4 Days Ago', offset: 4 },
    { key: 'fiveDays', label: '5 Days Ago', offset: 5 },
    { key: 'sixDays', label: '6 Days Ago', offset: 6 },
  ]

  return students.map((student, index) => {
    const history = reportDays.map((day, dayIndex) => {
      let status = 'present'
      if ((index + dayIndex) % 11 === 0) status = 'absent'
      if ((index + dayIndex) % 13 === 0) status = 'late'
      if ((index + dayIndex) % 17 === 0) status = 'left-early'
      if (day.key === 'today') status = student.dailyStatus || student.status || 'present'

      return {
        ...day,
        date: day.offset === 0 ? 'Today' : `${day.offset} school day${day.offset === 1 ? '' : 's'} ago`,
        status,
        arrived: status === 'late' ? '9:42 AM' : status === 'absent' ? '' : '8:54 AM',
        left: status === 'left-early' ? '12:35 PM' : '',
        note: status === 'absent' ? 'Parent notified office' : status === 'late' ? 'Arrived late' : status === 'left-early' ? 'Dismissed early' : 'Present'
      }
    })

    const presentDays = history.filter(x => x.status === 'present' || x.status === 'late' || x.status === 'left-early').length
    const absentDays = history.filter(x => x.status === 'absent').length
    const lateDays = history.filter(x => x.status === 'late').length
    const leftEarlyDays = history.filter(x => x.status === 'left-early').length

    return {
      ...student,
      history,
      presentDays,
      absentDays,
      lateDays,
      leftEarlyDays,
      cameToYeshivaDays: presentDays,
      lastStatus: history[0]?.status || 'present'
    }
  })
}

export const SKILL_RATINGS = ['Weak', 'Developing', 'Good', 'Great']
export const RATING_SCORE = { Weak: 1, Developing: 2, Good: 3, Great: 4 }
export const ACADEMIC_AREAS = {
  'Rabbi Klein': {
    Chumash: ['Bereishis', 'Shemos', 'Vayikra', 'Bamidbar', 'Devarim'],
    Gemara: ['Bava Kamma', 'Bava Metzia', 'Sanhedrin'],
  },
  'Rabbi Goldstein': {
    Gemara: ['Berachos', 'Shabbos', 'Eruvin'],
    Mishnah: ['Zraim', 'Moed', 'Nashim', 'Nezikin'],
  },
  'Rabbi Ehrnreich': {
    Chumash: ['Bereishis', 'Shemos'],
    Gemara: ['Gittin', 'Kiddushin'],
  },
  'Rabbi Ambush': {
    Gemara: ['Makkos', "Shevu'os", 'Avoda Zarah'],
    Mishnah: ['Taharos', 'Kodashim'],
  },
  'Rabbi Lefkowitz': {
    Davening: ['Shacharis', 'Mincha', 'Maariv'],
    English: ['Reading Comprehension', 'Grammar', 'Essay Writing', 'Vocabulary'],
  },
  'Rabbi Abowitz': {
    Math: ['Algebra', 'Geometry', 'Statistics', 'Arithmetic'],
    Science: ['Biology', 'Chemistry', 'Physics'],
    Reading: ['Reading Comprehension', 'Fluency', 'Decoding'],
    Writing: ['Essay', 'Grammar', 'Vocabulary'],
  },
  'Rabbi Altshull': {
    English: ['Reading', 'Writing', 'Grammar'],
    Math: ['Arithmetic', 'Word Problems'],
    Reading: ['Fluency', 'Comprehension'],
    Writing: ['Sentences', 'Paragraphs', 'Stories'],
  },
  'Rabbi Schults': {
    Chumash: ['Bereishis', 'Shemos'],
    Gemara: ['Brachos', 'Peah'],
    Kriah: ['Fluency', 'Nikud', 'Trop'],
  },
  'Rabbi Schimborski': {
    Chumash: ['Vayikra', 'Bamidbar'],
    Mishnah: ['Brachos', 'Peah', 'Kilayim'],
    Davening: ['Shacharis', 'Maariv'],
  },
}
export const DEFAULT_ACADEMIC_TEACHER = 'Rabbi Klein'
export function pctToLetterGrade(pct: number | null): string {
  if (pct === null || pct === undefined) return '—'
  if (pct >= 97) return 'A+'
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  return 'F'
}
export function letterGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#16a34a'
  if (grade.startsWith('B')) return '#2563eb'
  if (grade.startsWith('C')) return '#ca8a04'
  if (grade.startsWith('D') || grade === 'F') return '#dc2626'
  return '#64748b'
}
export function academicPct(score) { return score.maxScore ? Math.round((score.score / score.maxScore) * 100) : null }
export function academicDisplay(score) { return score.scoreType === 'rating' ? score.rating : `${score.score}/${score.maxScore} (${academicPct(score)}%)` }
export function academicStatusFromPct(pct) { if (pct === null || pct === undefined) return 'Missing'; if (pct >= 90) return 'Excellent'; if (pct >= 80) return 'Doing Well'; if (pct >= 70) return 'Watch'; return 'Needs Support' }
export function academicStatusFromRating(rating) { return rating === 'Great' ? 'Excellent' : rating === 'Good' ? 'Doing Well' : rating === 'Developing' ? 'Watch' : 'Needs Support' }
export function academicStatus(score) { return score.scoreType === 'rating' ? academicStatusFromRating(score.rating) : academicStatusFromPct(academicPct(score)) }
export function academicStatusColor(status) { return status === 'Excellent' ? '#4b6854' : status === 'Doing Well' ? '#4f6687' : status === 'Watch' ? '#9a6a2a' : status === 'Needs Support' ? '#9f1239' : '#64748b' }

export function resolveActorName(actorName, role = 'admin') {
  const trimmedName = String(actorName || '').trim()
  if (trimmedName) return trimmedName

  if (role === 'teacher') return 'Teacher'
  if (role === 'therapist') return 'Therapist'
  if (role === 'support_staff') return 'Support Staff'
  return 'Staff'
}

export function getDashboardContextInfo(page, role, divisionView) {
  const roleLabel = role === 'teacher' ? 'Teacher' : role === 'rebbe' ? 'Rebbe' : role === 'support_staff' ? 'Support Staff' : 'Admin'
  const pageLabel = page === 'dashboard' ? 'Dashboard' : page === 'attendance' ? 'Attendance' : page === 'behavior' ? 'Behavior' : page === 'academics' ? 'Academics' : page === 'schedule' ? 'Schedule' : page === 'store' ? 'Token Store' : page === 'setup' ? 'Setup Center' : page === 'support' ? 'Student Support' : page === 'staff-directory' ? 'Staff Directory' : page === 'calls' ? 'Calls' : page === 'alerts' ? 'Alerts' : page === 'todos' ? 'Todos' : 'Dashboard'
  const divisionLabel = 'Yeshiva Ketana'
  const contextSummary = `${pageLabel} · ${roleLabel} · ${divisionLabel}`

  return { roleLabel, pageLabel, divisionLabel, contextSummary }
}

export const STAFF = [
  { id: 's1', name: 'Rabbi Baum', role: 'Menahel' },
  { id: 's2', name: 'Rabbi Ehrnreich', role: 'Sgan Menahel' },
  { id: 's3', name: 'Rabbi Hillel', role: 'Mashgiach' },
  { id: 's4', name: 'Rabbi Klein', role: 'Teacher' },
  { id: 's5', name: 'Rabbi Goldstein', role: 'Teacher' },
  { id: 's6', name: 'Mrs. Goldberg', role: 'Speech Therapist' },
  { id: 's7', name: 'Mr. Weinstein', role: 'OT' },
  { id: 's8', name: 'Mrs. Friedman', role: 'Counselor' },
  { id: 's9', name: 'Yitzi Liebowitz', role: 'Speech' },
  { id: 's10', name: 'Ezriel', role: 'BT' },
  { id: 's11', name: 'Tuli', role: 'BT' },
  { id: 's12', name: 'Rabbi Lefkowitz', role: 'Teacher' },
  { id: 's13', name: 'Rabbi Ambush', role: 'Teacher' },
  { id: 's14', name: 'Rabbi Abowitz', role: 'Teacher' },
  { id: 's15', name: 'Rabbi Schults', role: 'Yeshiva Ketana Rebbe' },
  { id: 's16', name: 'Rabbi Schimborski', role: 'Yeshiva Ketana Rebbe' },
  { id: 's17', name: 'Eli Bloom', role: 'Admin' },
  { id: 's18', name: 'Zev Reisman', role: 'Admin' },
  { id: 's19', name: 'Eli Stern', role: 'Admin' },
  { id: 's20', name: 'Avrumi', role: 'BT' },
  { id: 's21', name: 'Eliyahu', role: 'BT' },
  { id: 's22', name: 'Yaakov', role: 'BT' },
  { id: 's23', name: 'Elan', role: 'BT' },
  { id: 's24', name: 'Nussi', role: 'BT' },
  { id: 's25', name: 'Rabbi Altshull', role: 'Teacher' },
]

export function matchesStaffRole(role, matcher) {
  return matcher(String(role || '').toLowerCase())
}

export function getStaffNameOptions(staffList, roleMatcher) {
  return Array.from(new Set(
    (staffList || [])
      .filter(staff => matchesStaffRole(staff.role, roleMatcher))
      .map(staff => staff.name)
  )).sort()
}

export const TEACHING_STAFF_OPTIONS = getStaffNameOptions(STAFF, role => /teacher|rebbe/i.test(role))

export const THERAPIST_OPTIONS = [
  { name: 'Shelly Wagschal', email: 'swagschal@hadranacademy.org', specialty: 'Therapist' },
  { name: 'Aryeh Schechter', email: 'aschechter@hadranacademy.org', specialty: 'Therapist' },
  { name: 'Tzvi Malks', email: 'tmalks@hadranacademy.org', specialty: 'Therapist' },
  { name: 'Yechiel Feyershtien', email: '', specialty: 'Therapist' },
  { name: 'Mrs. Bloom', email: '', specialty: 'BCBA' },
  { name: 'Mrs. Lev', email: '', specialty: 'BCBA' },
  { name: 'Mr. Moshe Gross', email: '', specialty: 'BCBA' },
]

export const SUPPORT_STAFF_OPTIONS = [
  { name: 'Ezriel', staffType: 'BT', service: 'BT Support' },
  { name: 'Tuli', staffType: 'BT', service: 'BT Support' },
  { name: 'Avrumi', staffType: 'BT', service: 'BT Support' },
  { name: 'Eliyahu', staffType: 'BT', service: 'BT Support' },
  { name: 'Yaakov', staffType: 'BT', service: 'BT Support' },
  { name: 'Elan', staffType: 'BT', service: 'BT Support' },
  { name: 'Nussi', staffType: 'BT', service: 'BT Support' },
  { name: 'Shelly Wagschal', staffType: 'Social Counseling', service: 'Social Counseling' },
  { name: 'Yechiel Feyershtien', staffType: 'Social Counseling', service: 'Social Counseling' },
  { name: 'Tzvi Malks', staffType: 'OT', service: 'OT' },
  { name: 'Yitzi Liebowitz', staffType: 'Speech', service: 'Speech' },
  { name: 'Aryeh Schechter', staffType: 'PT', service: 'PT' },
  { name: 'Mrs. Bloom', staffType: 'BCBA', service: 'BCBA Observation' },
  { name: 'Mrs. Lev', staffType: 'BCBA', service: 'BCBA Observation' },
  { name: 'Mr. Moshe Gross', staffType: 'BCBA', service: 'BCBA Observation' },
]

export const SETUP_PEOPLE = [
  ...STAFF
    .filter(person =>
      ['Teacher', 'Yeshiva Ketana Rebbe', 'Menahel', 'Sgan Menahel', 'Mashgiach']
        .includes(person.role)
    )
    .map(person => ({
      id: person.id,
      name: person.name,
      type: 'teacher',
      specialty: person.role
    })),
  ...SUPPORT_STAFF_OPTIONS.map((person, index) => ({
    id: `support-${index + 1}`,
    name: person.name,
    type: 'support',
    specialty: person.staffType,
    service: person.service
  }))
]

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export const TEACHER_CLASS_MAP = {
  'Rabbi Klein': 'a',
  'Rabbi Goldstein': 'b',
  'Rabbi Ehrnreich': 'c',
  'Rabbi Ambush': 'd',
  'Rabbi Lefkowitz': 'a',
  'Rabbi Abowitz': 'a',
  'Rabbi Schults': 'yk-a',
  'Rabbi Schimborski': 'yk-b',
}

export const CLASSES = [
  { id: 'a', name: 'Dargei Alef', grade: '9th Grade', teacher: 'Rabbi Klein' },
  { id: 'b', name: 'Dargei Beis', grade: '10th Grade', teacher: 'Rabbi Goldstein' },
  { id: 'c', name: 'Dargei Gimmel', grade: '11th Grade', teacher: 'Rabbi Ehrnreich' },
  { id: 'd', name: 'Dargei Daled', grade: '12th Grade', teacher: 'Rabbi Ambush' },
  { id: 'yk-a', name: 'Yeshiva Ketana Alef', grade: '7th/8th Grade', teacher: 'Rabbi Schults' },
  { id: 'yk-b', name: 'Yeshiva Ketana Beis', grade: '7th/8th Grade', teacher: 'Rabbi Schimborski' },
]

export const STUDENT_CLASSES = {
  1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'a', 7: 'a',
  8: 'b', 9: 'b', 10: 'b', 11: 'b', 12: 'b', 13: 'b', 14: 'b',
  15: 'c', 16: 'c', 17: 'c', 18: 'c', 19: 'c', 20: 'c', 21: 'c',
  22: 'd', 23: 'd', 24: 'd', 25: 'd', 26: 'd', 27: 'd', 28: 'd',
  101: 'yk-a', 102: 'yk-a', 103: 'yk-a', 104: 'yk-a', 105: 'yk-a', 106: 'yk-a', 107: 'yk-a', 108: 'yk-a',
  109: 'yk-b', 110: 'yk-b', 111: 'yk-b', 112: 'yk-b', 113: 'yk-b', 114: 'yk-b', 115: 'yk-b',
}

export const DIVISIONS = {
  yeshiva_ketana: { label: 'Yeshiva Ketana', shortLabel: 'YK' },
}

export const CLASS_DIVISION = {
  a: 'yeshiva_ketana',
  b: 'yeshiva_ketana',
  c: 'yeshiva_ketana',
  d: 'yeshiva_ketana',
  'yk-a': 'yeshiva_ketana',
  'yk-b': 'yeshiva_ketana',
}

export function studentDivision(student) {
  const mappedClass = STUDENT_CLASSES[Number(student.id)] || STUDENT_CLASSES[student.id]

  if (mappedClass) {
    return CLASS_DIVISION[mappedClass] || 'yeshiva_ketana'
  }

  const explicitClassId = student.classId || student.class_id
  if (explicitClassId && CLASS_DIVISION[explicitClassId]) {
    return CLASS_DIVISION[explicitClassId]
  }

  if (student.className) {
    const classMatch = CLASSES.find(cls => cls.name === student.className)
    if (classMatch) {
      return CLASS_DIVISION[classMatch.id] || 'yeshiva_ketana'
    }
  }

  return 'yeshiva_ketana'
}

export function resolveLiveStudentPoints(tokenBalance) {
  return Number(tokenBalance ?? 0) || 0
}

export function resolveStudentClassId(student) {
  const mappedClass = STUDENT_CLASSES[Number(student.id)] || STUDENT_CLASSES[student.id]
  if (mappedClass) return mappedClass

  const explicitClassId = student.classId || student.class_id
  if (explicitClassId) return explicitClassId

  if (student.className) {
    const classMatch = CLASSES.find(cls => cls.name === student.className)
    return classMatch?.id || null
  }

  return null
}

function collectAssignmentStudentIds(assignment) {
  const studentIds = new Set()

  if (assignment?.periods) {
    ;[1, 2, 3].forEach(period => {
      const periodStudentIds = assignment.periods?.[period] || []
      periodStudentIds.forEach(studentId => {
        const numericId = Number(studentId)
        if (!Number.isNaN(numericId)) {
          studentIds.add(numericId)
        }
      })
    })
  }

  if (assignment?.caseload) {
    assignment.caseload.forEach(studentId => {
      const numericId = Number(studentId)
      if (!Number.isNaN(numericId)) {
        studentIds.add(numericId)
      }
    })
  }

  return Array.from(studentIds)
}

export function getTeacherAssignedClassIds(name, setupAssignments, students) {
  const assignment = setupAssignments?.[name]
  const classIds = new Set()

  collectAssignmentStudentIds(assignment).forEach(studentId => {
    const student = students.find(item => Number(item.id) === Number(studentId))
    if (!student) return

    const classId = resolveStudentClassId(student)
    if (classId) classIds.add(classId)
  })

  const fallbackClass = TEACHER_CLASS_MAP[name]
  if (classIds.size === 0 && fallbackClass) {
    classIds.add(fallbackClass)
  }

  return Array.from(classIds)
}

export function getTeacherAssignedStudentIds(name, setupAssignments) {
  const assignment = setupAssignments?.[name]
  return collectAssignmentStudentIds(assignment)
}

export function teacherDivisionForName(name) {
  const classId = TEACHER_CLASS_MAP[name]
  if (!classId) return 'yeshiva_ketana'
  return CLASS_DIVISION[classId] || 'yeshiva_ketana'
}

export function getUserAccess(name, role) {
  if (role === 'teacher' || role === 'rebbe') {
    return {
      divisions: ['yeshiva_ketana'],
      canManageStore: false
    }
  }

  if (role === 'support_staff') {
    return {
      divisions: ['yeshiva_ketana'],
      canManageStore: false
    }
  }

  return {
    divisions: ['yeshiva_ketana'],
    canManageStore: role === 'admin'
  }
}

export function defaultDivisionView(access) {
  return access.divisions.length > 1 ? 'all' : access.divisions[0]
}

export function divisionLabel(key) {
  return key === 'all' ? 'All Yeshiva Ketana' : DIVISIONS[key]?.label || key
}

export function canAccessDashboardPage(role, page) {
  if (role === 'teacher' || role === 'rebbe') {
    return ['students', 'behavior', 'store'].includes(page)
  }

  if (role === 'support_staff') {
    return ['students', 'behavior', 'store'].includes(page)
  }

  if (role === 'admin') {
    return ['dashboard', 'students', 'academics', 'setup', 'behavior', 'store', 'staff-directory'].includes(page)
  }

  return ['students', 'behavior', 'store'].includes(page)
}

type StudentAccessContext = {
  role?: string
  userName?: string
  setupAssignments?: Record<string, unknown>
  students?: unknown[]
  assignedStudentIds?: Array<string | number>
}

export function canAccessStudentForRole(student, context: StudentAccessContext = {}) {
  const { role, userName = '', setupAssignments = {}, students = [], assignedStudentIds = [] } = context || {}

  if (!student) return false

  if (role === 'teacher' || role === 'rebbe') {
    const targetStudentId = Number(student.id)
    const providedAssignedIds = Array.isArray(assignedStudentIds)
      ? assignedStudentIds.map(id => Number(id)).filter(id => !Number.isNaN(id))
      : []

    if (providedAssignedIds.length > 0) {
      return providedAssignedIds.includes(targetStudentId)
    }

    const directAssignedIds = getTeacherAssignedStudentIds(userName, setupAssignments)

    if (directAssignedIds.length > 0) {
      return directAssignedIds.includes(targetStudentId)
    }

    const assignedClassIds = getTeacherAssignedClassIds(userName, setupAssignments, students)
    const fallbackClassId = TEACHER_CLASS_MAP[userName] || null
    const allowedClassIds = assignedClassIds.length > 0
      ? assignedClassIds
      : (fallbackClassId ? [fallbackClassId] : [])

    if (allowedClassIds.length > 0) {
      const studentClassId = resolveStudentClassId(student)
      return Boolean(studentClassId && allowedClassIds.includes(studentClassId))
    }
  }

  if (role === 'support_staff') {
    const targetStudentId = Number(student.id)
    const providedAssignedIds = Array.isArray(assignedStudentIds)
      ? assignedStudentIds.map(id => Number(id)).filter(id => !Number.isNaN(id))
      : []

    if (providedAssignedIds.length > 0) {
      return providedAssignedIds.includes(targetStudentId)
    }

    const assignedIds = getTeacherAssignedStudentIds(userName, setupAssignments)

    if (assignedIds.length > 0) {
      return assignedIds.includes(targetStudentId)
    }

    return Boolean(Array.isArray(student.services) && student.services.length > 0)
  }

  return true
}

export function buildClassroomCoverageSnapshot(students, classId, period = null) {
  const roster = (students || []).filter(student => resolveStudentClassId(student) === classId)

  const entries = roster.map(student => {
    const attendanceStatus = String(getDailyAttendanceStatus(student))
    const status = String(student?.status || '').trim().toLowerCase() || 'unconfirmed'
    const classLog = Array.isArray(student?.classLog) ? student.classLog : []
    const reverseLog = [...classLog].reverse()
    const latestRelevant = reverseLog.find(entry => entry?.type && entry.type !== 'end') || null
    const latestType = latestRelevant?.type || null
    const hasActiveEntry = latestType === 'in' || latestType === 'return'
    const coverageDemo = (student as StudentRecord | undefined)?.coverageDemo

    let coverageStatus = 'unknown'
    if (attendanceStatus === 'absent' || status === 'absent') {
      coverageStatus = 'absent'
    } else if (attendanceStatus === 'late' || status === 'late' || status === 'left-early') {
      coverageStatus = 'late'
    } else if (attendanceStatus === 'unconfirmed' || attendanceStatus === 'not-arrived' || status === 'unknown' || status === 'not-arrived') {
      coverageStatus = 'unknown'
    } else if (['therapy', 'with-bt'].includes(String(status))) {
      coverageStatus = hasActiveEntry ? 'present' : 'pullout'
    } else if (attendanceStatus === 'present' && status === 'present') {
      coverageStatus = 'present'
    } else if (attendanceStatus === 'present' || attendanceStatus === 'late') {
      coverageStatus = 'present'
    } else {
      coverageStatus = 'unknown'
    }

    const serviceType = String(
      student?.services?.[0]?.type ||
      (status === 'with-bt' ? 'BT Support' : status === 'therapy' ? 'Therapy' : 'Instruction')
    )
    const provider = String(
      coverageDemo?.provider ||
      student?.withStaff ||
      student?.assignedTherapist ||
      student?.services?.[0]?.staffId ||
      'Teacher'
    )

    const actualDeparture = String(coverageDemo?.actualDeparture || classLog.find(entry => entry?.type === 'out')?.time || '—')
    const actualReturn = String(coverageDemo?.actualReturn || classLog.find(entry => entry?.type === 'in' || entry?.type === 'return')?.time || '—')

    const expectedLocation = String(
      coverageDemo?.expectedLocation ||
      (period?.subject ? `Classroom · ${period.subject}` : 'Classroom')
    )
    const actualCurrentLocation = String(
      coverageDemo?.actualCurrentLocation ||
      (coverageStatus === 'absent'
        ? 'Not present'
        : coverageStatus === 'late'
          ? 'Arrived late'
          : coverageStatus === 'unknown'
            ? 'Location unknown'
            : coverageStatus === 'pullout'
              ? `Pullout · ${provider}`
              : latestRelevant?.note || 'In class')
    )

    const scheduledDeparture = String(coverageDemo?.scheduledDeparture || (coverageStatus === 'pullout' ? '10:20' : '—'))
    const expectedReturn = String(coverageDemo?.expectedReturn || (coverageStatus === 'pullout' ? '11:05' : '—'))
    const scheduledVersusUnexpected = coverageDemo?.scheduledVersusUnexpected || (attendanceStatus === 'late' || status === 'late' || status === 'absent' ? 'unexpected' : 'scheduled')
    const approvedVersusUnexplained = coverageDemo?.approvedVersusUnexplained || (student?.lateDetails?.reason ? 'approved' : 'unexplained')
    const statusCode = coverageDemo?.statusCode || (coverageStatus === 'absent' ? 'absent' : coverageStatus === 'late' ? 'late' : coverageStatus === 'unknown' ? 'unknown' : coverageStatus === 'pullout' ? 'unresolved' : 'present')

    let location = actualCurrentLocation
    if (coverageStatus === 'absent') {
      location = 'Absent'
    } else if (coverageStatus === 'late') {
      location = 'Late arrival'
    } else if (coverageStatus === 'unknown') {
      location = 'Location unknown'
    } else if (coverageStatus === 'pullout') {
      location = student?.withStaff ? `Pullout · ${student.withStaff}` : 'Pullout'
    }

    return {
      studentId: student?.id,
      studentName: student?.name || 'Student',
      status: coverageStatus,
      attendanceStatus,
      location,
      note: latestRelevant?.note || '',
      currentStatus: status,
      expectedLocation,
      actualCurrentLocation,
      provider,
      serviceType,
      scheduledDeparture,
      expectedReturn,
      actualDeparture,
      actualReturn,
      scheduledVersusUnexpected,
      approvedVersusUnexplained,
      statusCode,
    }
  })

  const metrics = entries.reduce((acc, entry) => {
    if (entry.status === 'present') acc.present += 1
    else if (entry.status === 'absent') acc.absent += 1
    else if (entry.status === 'late') acc.late += 1
    else if (entry.status === 'pullout') acc.pullout += 1
    else if (entry.status === 'unknown') acc.unknown += 1
    return acc
  }, { present: 0, absent: 0, late: 0, pullout: 0, unknown: 0 })

  return {
    classId,
    period,
    expectedCount: roster.length,
    metrics,
    students: entries,
  }
}

export const SCHEDULE_PERIODS = [
  { id: 1, time: '10:10 - 11:10', subject: 'Gemara / Skills Rotation', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Kriah / Writing Block', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 3, time: '12:15 - 12:45', subject: 'Social Skills / SEL', teachers: ['Mrs. Friedman', 'Yitzi Liebowitz', 'Ezriel'], type: 'class' },
  { id: 4, time: '12:45 - 1:45', subject: 'Lunch & Recess', teachers: [], type: 'break' },
  { id: 5, time: '1:45 - 2:25', subject: 'English Reading', teachers: ['Mr. Cohen', 'Mrs. Goldberg'], type: 'class' },
  { id: 6, time: '2:30 - 3:10', subject: 'Math / Intervention', teachers: ['Rabbi Klein', 'Rabbi Ambush', 'Ezriel'], type: 'class' },
  { id: 7, time: '3:15 - 3:45', subject: 'Review / Check-out', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
]

export const THERAPY_SCHEDULE = [
  { student: 'Bloom Yair', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Goldberger Yossi', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Moskowitz Meir Shulem', staffId: 's6', day: 'Tue', time: '09:30', duration: '30 min', type: 'Speech' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Thu', time: '11:20', duration: '30 min', type: 'Counseling' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
  { student: 'Levitz Avrohom', staffId: 's7', day: 'Wed', time: '10:10', duration: '45 min', type: 'OT' },
  { student: 'Feltman Daniel', staffId: 's9', day: 'Thu', time: '10:10', duration: '45 min', type: 'Therapy' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Thu', time: '11:20', duration: '30 min', type: 'Counseling' },
  { student: 'Goldberger Yossi', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Barber Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
  { student: 'Ettlinger Moshe', staffId: 's10', day: 'Wed', time: '12:15', duration: '35 min', type: 'BT Check-in' },
  { student: 'Klein Yitzchok', staffId: 's9', day: 'Thu', time: '10:55', duration: '30 min', type: 'Therapy' },
  { student: 'Rosenfeld Yehuda', staffId: 's9', day: 'Fri', time: '10:10', duration: '20 min', type: 'OT' },
  { student: 'Reich Nathan', staffId: 's10', day: 'Wed', time: '12:15', duration: '35 min', type: 'BT Check-in' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
]

export const mkStudent = (
  id: number,
  name: string,
  points: number,
  reminders: number,
  att: string[],
  status: string,
  withStaff: string | null = null,
  services: StudentServiceEntry[] = [],
  parentCalls: StudentNoteEntry[] = [],
  notes: StudentNoteEntry[] = [],
  iep = false,
  iepDetails = '',
  detention = false,
): StudentRecord => ({
  id, name, points, reminders, lastWeekReminders: reminders + Math.floor(Math.random() * 3),
  att, breakfast: att.map(() => Math.random() > 0.3 ? 'Y' : 'N'),
  detention, status, withStaff, services, parentCalls, notes, behaviorLog: [], testScores: [], iep, iepDetails,
  classLog: [],
  lateDetails: null,
  family: {
    fatherName: '', fatherPhone: '', fatherEmail: '',
    motherName: '', motherPhone: '', motherEmail: '',
    address: '', emergencyContact: '', emergencyPhone: ''
  },
  medical: {
    allergies: [], medications: [], conditions: [],
    doctorName: '', doctorPhone: '', lastPhysical: '', notes: ''
  }
})

export function makeDay(daysAgo, inMins, outMins, staffName, staffId, segments = []) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return { date: d.toISOString().slice(0,10), inMins, outMins, staffName, staffId, segments, pct: Math.round(inMins/(inMins+outMins)*100) }
}

export const HISTORICAL_DATA = {
  6: [
    makeDay(0, 165, 70, 'Yitzi + Ezriel', 's9', [
      { time: '09:10', status: 'classroom', location: 'Shiur Beis', note: 'Morning seder with class' },
      { time: '10:20', status: 'therapy', location: 'Therapy room', staffName: 'Yitzi Liebowitz', note: 'OT regulation block' },
      { time: '11:05', status: 'return', location: 'Shiur Beis', note: 'Returned to class after therapy' },
      { time: '11:30', status: 'bt-support', location: 'Resource corner', staffName: 'Ezriel', note: 'BT prompting for transitions' },
      { time: '12:05', status: 'hallway', location: 'Hallway', note: 'Transition before lunch' },
      { time: '12:20', status: 'unaccounted', location: 'Hallway', note: 'Unaccounted for 10 minutes' },
      { time: '12:30', status: 'return', location: 'Lunchroom', staffName: 'Ezriel', note: 'Located and rejoined group' },
    ]),
    makeDay(1, 150, 35, 'Ezriel', 's10', [
      { time: '09:05', status: 'classroom', location: 'Shiur Beis', note: 'On-task in class' },
      { time: '10:35', status: 'bt-support', location: 'Class doorway', staffName: 'Ezriel', note: 'Prompting and redirection' },
      { time: '10:50', status: 'return', location: 'Shiur Beis', note: 'Resumed classwork' },
    ]),
    makeDay(2, 125, 50, 'Yitzi Liebowitz', 's9', [
      { time: '09:15', status: 'classroom', location: 'Shiur Beis', note: 'Participating in Gemara' },
      { time: '10:40', status: 'therapy', location: 'Therapy room', staffName: 'Yitzi Liebowitz', note: 'Sensory motor session' },
      { time: '11:25', status: 'return', location: 'Shiur Beis', note: 'Returned and settled quickly' },
    ]),
    makeDay(3, 95, 40, 'Mrs. Goldberg', 's6'),
    makeDay(4, 120, 55, 'Ezriel', 's10'),
    makeDay(7, 100, 15, 'Yitzi Liebowitz', 's9'),
    makeDay(8, 80, 35, 'Dovid', 's11'),
    makeDay(9, 90, 25, 'Ezriel', 's10'),
    makeDay(14, 65, 50, 'Yitzi Liebowitz', 's9'),
    makeDay(15, 105, 10, 'Mrs. Goldberg', 's6'),
    makeDay(20, 75, 40, 'Ezriel', 's10'),
    makeDay(25, 55, 60, 'Yitzi Liebowitz', 's9'),
    makeDay(35, 80, 35, 'Ezriel', 's10'),
    makeDay(45, 90, 25, 'Yitzi Liebowitz', 's9'),
    makeDay(60, 70, 45, 'Mrs. Goldberg', 's6'),
    makeDay(90, 85, 30, 'Ezriel', 's10'),
    makeDay(120, 95, 20, 'Yitzi Liebowitz', 's9'),
  ],
  3: [
    makeDay(0, 70, 95, 'Mrs. Friedman', 's8', [
      { time: '09:20', status: 'classroom', location: 'Class 2A', note: 'Started in class' },
      { time: '10:05', status: 'therapy', location: 'Counseling room', staffName: 'Mrs. Friedman', note: 'Counseling check-in' },
      { time: '10:55', status: 'return', location: 'Class 2A', note: 'Returned to class' },
      { time: '11:50', status: 'hallway', location: 'Hallway', note: 'De-escalation walk' },
      { time: '12:05', status: 'return', location: 'Class 2A', note: 'Calm and ready for learning' },
    ]),
    makeDay(1, 55, 60, 'Mrs. Friedman', 's8'),
    makeDay(2, 80, 35, 'Mrs. Friedman', 's8'),
    makeDay(3, 40, 75, 'Mrs. Friedman', 's8'),
    makeDay(7, 65, 50, 'Mrs. Friedman', 's8'),
    makeDay(14, 45, 70, 'Mrs. Friedman', 's8'),
    makeDay(21, 70, 45, 'Mrs. Friedman', 's8'),
    makeDay(30, 55, 60, 'Mrs. Friedman', 's8'),
    makeDay(60, 60, 55, 'Mrs. Friedman', 's8'),
  ],
  12: [
    makeDay(0, 105, 80, 'Ezriel + Dovid', 's10', [
      { time: '09:10', status: 'classroom', location: 'Shiur Alef', note: 'Morning class block' },
      { time: '10:30', status: 'bt-support', location: 'Resource room', staffName: 'Ezriel', note: 'Reading support' },
      { time: '11:00', status: 'return', location: 'Shiur Alef', note: 'Returned from support' },
      { time: '11:20', status: 'bt-support', location: 'Resource room', staffName: 'Dovid', note: 'Behavior coaching' },
      { time: '11:55', status: 'return', location: 'Shiur Alef', note: 'Back in class before lunch' },
    ]),
    makeDay(1, 85, 30, 'Dovid', 's11'),
    makeDay(2, 70, 45, 'Ezriel', 's10'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 60, 55, 'Ezriel', 's10'),
    makeDay(14, 75, 40, 'Dovid', 's11'),
    makeDay(21, 80, 35, 'Ezriel', 's10'),
    makeDay(30, 65, 50, 'Dovid', 's11'),
  ],
  14: [
    makeDay(0, 90, 85, 'Yitzi Liebowitz', 's9', [
      { time: '09:05', status: 'classroom', location: 'Yeshiva Ketana class', note: 'In class on arrival' },
      { time: '10:15', status: 'therapy', location: 'Therapy room', staffName: 'Yitzi Liebowitz', note: 'Social skills pullout' },
      { time: '11:00', status: 'return', location: 'Yeshiva Ketana class', note: 'Returned and completed assignment' },
      { time: '11:40', status: 'unaccounted', location: 'Hallway', note: 'Out of sight for 8 minutes' },
      { time: '11:48', status: 'return', location: 'Yeshiva Ketana class', note: 'Located and brought back' },
    ]),
    makeDay(1, 50, 65, 'Yitzi Liebowitz', 's9'),
    makeDay(2, 75, 40, 'Yitzi Liebowitz', 's9'),
    makeDay(3, 60, 55, 'Yitzi Liebowitz', 's9'),
    makeDay(7, 80, 35, 'Yitzi Liebowitz', 's9'),
    makeDay(14, 45, 70, 'Yitzi Liebowitz', 's9'),
    makeDay(21, 70, 45, 'Yitzi Liebowitz', 's9'),
    makeDay(30, 55, 60, 'Yitzi Liebowitz', 's9'),
    makeDay(60, 65, 50, 'Yitzi Liebowitz', 's9'),
    makeDay(90, 80, 35, 'Yitzi Liebowitz', 's9'),
  ],
  18: [
    makeDay(0, 115, 60, 'Dovid', 's11', [
      { time: '09:10', status: 'classroom', location: 'Classroom', note: 'Morning attendance complete' },
      { time: '10:40', status: 'bt-support', location: 'Support room', staffName: 'Dovid', note: 'BT focus session' },
      { time: '11:10', status: 'return', location: 'Classroom', note: 'Back in class with worksheet' },
    ]),
    makeDay(1, 80, 35, 'Dovid', 's11'),
    makeDay(2, 65, 50, 'Dovid', 's11'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 70, 45, 'Dovid', 's11'),
    makeDay(14, 85, 30, 'Dovid', 's11'),
    makeDay(21, 60, 55, 'Dovid', 's11'),
    makeDay(30, 75, 40, 'Dovid', 's11'),
  ],
  8: [
    makeDay(0, 130, 45, 'Mrs. Friedman', 's8', [
      { time: '09:15', status: 'classroom', location: 'Classroom', note: 'Started with reading block' },
      { time: '11:20', status: 'therapy', location: 'Counseling room', staffName: 'Mrs. Friedman', note: 'Counseling check-in' },
      { time: '11:50', status: 'return', location: 'Classroom', note: 'Returned after counseling' },
    ]),
    makeDay(1, 120, 50, 'Mrs. Friedman', 's8'),
    makeDay(2, 140, 35, 'Mrs. Friedman', 's8'),
  ],
  21: [
    makeDay(0, 175, 20, 'Rabbi Klein', 's4', [
      { time: '09:00', status: 'classroom', location: 'Yeshiva Ketana shiur', note: 'Consistent classroom attendance' },
      { time: '12:10', status: 'hallway', location: 'Hallway', note: 'Lunch transition' },
      { time: '12:20', status: 'return', location: 'Lunchroom', note: 'Returned with peers' },
    ]),
    makeDay(1, 165, 25, 'Rabbi Klein', 's4'),
    makeDay(2, 170, 22, 'Rabbi Klein', 's4'),
  ],
}

export const LEVITZ_CLASS_LOG = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:35', type: 'out', note: 'Pulled out by Yitzi Liebowitz', staffId: 's9' },
  { time: '11:15', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:20', type: 'out', note: 'Left with Ezriel (BT)', staffId: 's10' },
  { time: '11:55', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]

export const initialStudents: StudentRecord[] = [
  mkStudent(1, 'Bloom Yair', 45, 2, ['P','P','L','LE','L','P'], 'present', null, [{staffId:'s6',type:'Speech Therapy',hrs:1.5}], [{date:'2025-05-28',staff:'Rabbi Klein',notes:'Discussed attendance',duration:'8 min'}], [{date:'2025-05-30',author:'Rabbi Klein',text:'Improving in davening.'}], true, 'Speech IEP - review Aug 2025', true),
  mkStudent(2, 'Friedlander Zev', 80, 0, ['P','P','P','P','P','P'], 'late'),
  mkStudent(3, 'Haddad Moshe Chaim', 60, 3, ['P','L','A','P','P','P'], 'therapy', 's8', [{staffId:'s8',type:'Counseling',hrs:3}], [{date:'2025-06-01',staff:'Rabbi Klein',notes:'Left voicemail',duration:'2 min'}]),
  mkStudent(4, 'Hayon David', 95, 0, ['P','P','P','P','P','P'], 'with-bt', 's10', [], [], [{date:'2025-06-02',author:'Rabbi Klein',text:'Excellent week.'}]),
  mkStudent(5, 'Karman Yitzchok', 20, 5, ['A','A','A','P','P','P'], 'absent'),
  mkStudent(6, 'Levitz Avrohom', 70, 1, ['P','P','P','L','P','P'], 'with-bt', 's10', [{staffId:'s7',type:'OT',hrs:2}], [{date:'2025-05-20',staff:'Rabbi Klein',notes:'General check-in',duration:'5 min'}], [], true, 'OT IEP - sensory processing'),
  mkStudent(7, 'Rosenfeld Yehuda', 55, 6, ['P','P','P','P','A','P'], 'late', null, [], [], [], false, '', true),
  mkStudent(8, 'Schwartz Moishe Michael', 40, 2, ['L','LE','L','L','P','P'], 'present', null, [{staffId:'s8',type:'Counseling',hrs:0.5}]),
  mkStudent(9, 'Simon Eliyahu', 65, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(10, 'Berkowitz Avraham', 55, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(11, 'Dinowitz Shmuel', 70, 0, ['P','P','P','P','P','A'], 'absent'),
  mkStudent(12, 'Ettlinger Moshe', 30, 4, ['LE','P','P','A','P','P'], 'present'),
  mkStudent(13, 'Feldman Shraga', 85, 0, ['P','P','P','P','P','P'], 'therapy', 's6'),
  mkStudent(14, 'Feltman Daniel', 45, 2, ['P','A','P','P','L','P'], 'therapy', 's9', [{staffId:'s9',type:'Therapy',hrs:2}]),
  mkStudent(15, 'Gantz Tzvi', 60, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(16, 'Hickson Shlomo', 25, 5, ['A','A','P','P','P','P'], 'absent'),
  mkStudent(17, 'Mezei Yehuda', 90, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(18, 'Reich Nathan', 50, 3, ['P','L','P','P','A','P'], 'with-bt', 's11'),
  mkStudent(19, 'Teitelbaum Binyamin', 75, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(20, 'Yanni Shimon', 40, 2, ['P','P','A','P','P','P'], 'late'),
  mkStudent(21, 'Moskowitz Meir Shulem', 65, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(22, 'Goldberg Chaim', 50, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(23, 'Lieberman Yehoshua', 60, 1, ['P','P','P','P','L','P'], 'present'),
  mkStudent(24, 'Veksler Aron', 45, 2, ['P','A','P','P','P','P'], 'present'),
  mkStudent(25, 'Shein Dovi', 70, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(26, 'Jakobi Aharon', 35, 3, ['L','P','P','A','P','P'], 'present'),
  mkStudent(27, 'Stern Aaron', 80, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(28, 'Sigman Shmuel', 55, 1, ['P','P','L','P','P','P'], 'present')
]

const levitzStudent = initialStudents.find(s => s.id === 6)
if (levitzStudent) {
  levitzStudent.classLog = LEVITZ_CLASS_LOG
}

const bloomStudent = initialStudents.find(s => s.id === 1)
if (bloomStudent) {
  bloomStudent.testScores = [
    { id:'ts1', teacher:'Rabbi Abowitz', subject:'Math', skill:'2-digit', assessmentName:'Addition Quiz', date:'2026-01-07', scoreType:'points', score:18, maxScore:20, rating:null, notes:'Strong with regrouping.' },
    { id:'ts2', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Decoding', assessmentName:'January Reading Check', date:'2026-01-08', scoreType:'rating', score:null, maxScore:null, rating:'Good', notes:'Reads most words accurately.' },
    { id:'ts3', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Fluency', assessmentName:'Fluency Observation', date:'2026-01-09', scoreType:'rating', score:null, maxScore:null, rating:'Developing', notes:'Needs smoother pacing.' },
  ]
}

const haddadStudent = initialStudents.find(s => s.id === 3)
if (haddadStudent) {
  haddadStudent.testScores = [
    { id:'ts4', teacher:'Rabbi Abowitz', subject:'Math', skill:'3-digit', assessmentName:'Subtraction Quiz', date:'2026-01-07', scoreType:'points', score:14, maxScore:20, rating:null, notes:'Needs review with borrowing.' },
    { id:'ts5', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Comprehension', assessmentName:'Story Questions', date:'2026-01-08', scoreType:'rating', score:null, maxScore:null, rating:'Weak', notes:'Needs support answering in full sentences.' },
  ]
}

if (levitzStudent) {
  levitzStudent.testScores = [
    { id:'ts6', teacher:'Rabbi Abowitz', subject:'Math', skill:'2-digit', assessmentName:'Addition Quiz', date:'2026-01-07', scoreType:'points', score:16, maxScore:20, rating:null, notes:'Good effort.' },
    { id:'ts7', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Fluency', assessmentName:'Fluency Observation', date:'2026-01-09', scoreType:'rating', score:null, maxScore:null, rating:'Good', notes:'Much more confident.' },
  ]
}

const rosenfeldStudent = initialStudents.find(s => s.id === 7)
if (rosenfeldStudent) {
  rosenfeldStudent.testScores = [
    { id:'ts8', teacher:'Rabbi Abowitz', subject:'Math', skill:'3-digit', assessmentName:'Subtraction Quiz', date:'2026-01-07', scoreType:'points', score:19, maxScore:20, rating:null, notes:'Excellent accuracy.' },
    { id:'ts9', teacher:'Rabbi Abowitz', subject:'Writing', skill:'Writing Project', assessmentName:'Personal Narrative', date:'2026-01-10', scoreType:'rating', score:null, maxScore:null, rating:'Great', notes:'Clear ideas and structure.' },
  ]
}

const student5 = initialStudents.find(s => s.id === 5)
if (student5) student5.dailyStatus = 'absent'
const student7 = initialStudents.find(s => s.id === 7)
if (student7) {
  student7.dailyStatus = 'late'
  student7.lateDetails = { timeArrived: '10:45', reason: 'parent-called', note: 'Father called, said coming after doctor' }
}
const student11 = initialStudents.find(s => s.id === 11)
if (student11) student11.dailyStatus = 'absent'
const student16 = initialStudents.find(s => s.id === 16)
if (student16) student16.dailyStatus = 'absent'
const student20 = initialStudents.find(s => s.id === 20)
if (student20) {
  student20.dailyStatus = 'late'
  student20.lateDetails = { timeArrived: '11:10', reason: 'transport', note: '' }
}

const levitzFamilyStudent = initialStudents.find(s => s.id === 6)
if (levitzFamilyStudent) {
  levitzFamilyStudent.family = {
    fatherName: 'Moshe Levitz', fatherPhone: '718-555-0101', fatherEmail: 'mlevitz@email.com',
    motherName: 'Rivka Levitz', motherPhone: '718-555-0102', motherEmail: 'rlevitz@email.com',
    address: '1423 54th St, Brooklyn NY 11219',
    emergencyContact: 'Moshe Levitz (Father)', emergencyPhone: '718-555-0101'
  }
}

if (levitzFamilyStudent) {
  levitzFamilyStudent.medical = {
    allergies: [{ name: 'Penicillin', severity: 'severe' }, { name: 'Tree nuts', severity: 'moderate' }],
    medications: [{ name: 'Ritalin', dosage: '10mg', frequency: 'Daily morning' }],
    conditions: ['ADHD', 'Sensory Processing Disorder'],
    doctorName: 'Dr. Shmuel Katz', doctorPhone: '718-555-9876', lastPhysical: '2025-09-15', notes: 'Needs sensory breaks. Has OT IEP.'
  }
}

if (bloomStudent) {
  bloomStudent.family = {
    fatherName: 'Yisrael Bloom', fatherPhone: '718-555-0201', fatherEmail: 'ybloom@email.com',
    motherName: 'Chana Bloom', motherPhone: '718-555-0202', motherEmail: '',
    address: '1567 48th St, Brooklyn NY 11219',
    emergencyContact: 'Yisrael Bloom (Father)', emergencyPhone: '718-555-0201'
  }
}

if (bloomStudent) {
  bloomStudent.medical = {
    allergies: [{ name: 'Shellfish', severity: 'mild' }],
    medications: [],
    conditions: ['Speech delay'],
    doctorName: 'Dr. Rachel Stern', doctorPhone: '718-555-8765', lastPhysical: '2025-08-20', notes: 'Speech therapy twice weekly.'
  }
}

if (haddadStudent) {
  haddadStudent.family = {
    fatherName: 'Yaakov Haddad', fatherPhone: '718-555-0301', fatherEmail: 'yhaddad@email.com',
    motherName: 'Leah Haddad', motherPhone: '718-555-0302', motherEmail: 'lhaddad@email.com',
    address: '892 Ocean Pkwy, Brooklyn NY 11230',
    emergencyContact: 'Yaakov Haddad (Father)', emergencyPhone: '718-555-0301'
  }
}

if (haddadStudent) {
  haddadStudent.medical = {
    allergies: [{ name: 'Latex', severity: 'moderate' }, { name: 'Bee stings', severity: 'severe' }],
    medications: [{ name: 'EpiPen', dosage: '0.3mg', frequency: 'As needed' }, { name: 'Prozac', dosage: '10mg', frequency: 'Daily' }],
    conditions: ['Anxiety', 'Bee sting allergy - carries EpiPen'],
    doctorName: 'Dr. Avigdor Weiss', doctorPhone: '718-555-7654', lastPhysical: '2025-10-01', notes: 'EpiPen in office at all times. Counseling weekly.'
  }
}

if (bloomStudent) {
  bloomStudent.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '10:50', type: 'out', note: 'Left with Mrs. Goldberg (Speech)', staffId: 's6' },
    { time: '11:35', type: 'in', note: 'Returned to class', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

if (haddadStudent) {
  haddadStudent.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '10:25', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
    { time: '11:25', type: 'in', note: 'Returned to class', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:00', type: 'out', note: 'Location unknown', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

const student8 = initialStudents.find(s => s.id === 8)
if (student8) {
  student8.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '11:20', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
    { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

const student12 = initialStudents.find(s => s.id === 12)
if (student12) {
  student12.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '10:30', type: 'out', note: 'Left with Ezriel (BT)', staffId: 's10' },
    { time: '10:55', type: 'in', note: 'Returned to class', staffId: null },
    { time: '11:15', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
    { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

const student14 = initialStudents.find(s => s.id === 14)
if (student14) {
  student14.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '10:15', type: 'out', note: 'Left with Yitzi Liebowitz (Therapy)', staffId: 's9' },
    { time: '11:00', type: 'in', note: 'Returned to class', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

const student18 = initialStudents.find(s => s.id === 18)
if (student18) {
  student18.classLog = [
    { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
    { time: '10:40', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
    { time: '11:10', type: 'in', note: 'Returned to class', staffId: null },
    { time: '11:30', type: 'out', note: 'Location unknown', staffId: null },
    { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
    { time: '13:45', type: 'in', note: 'English class started', staffId: null },
    { time: '14:25', type: 'end', note: 'End of English', staffId: null },
  ]
}

if (levitzStudent) {
  levitzStudent.behaviorLog = [
    { label: 'Returned to class after BT support', points: 2, date: '2026-07-28' },
    { label: 'Used break pass appropriately', points: 1, date: '2026-07-29' },
    { label: 'Left area without check-in', points: -1, date: '2026-07-30' },
  ]
  levitzStudent.parentCalls = [
    ...(levitzStudent.parentCalls || []),
    { date: '2026-07-12', staff: 'Rabbi Klein', notes: 'Reviewed therapy consistency and class transitions.', duration: '9 min' },
    { date: '2026-07-25', staff: 'Rabbi Baum', notes: 'Shared positive week update and goals.', duration: '6 min' },
  ]
  levitzStudent.notes = [
    ...(levitzStudent.notes || []),
    { date: '2026-07-11', author: 'Rabbi Klein', text: 'Responds well to pre-correct before hallway transitions.' },
    { date: '2026-07-27', author: 'Ezriel', text: 'Needed one prompt to rejoin group after lunch.' },
  ]
}

if (haddadStudent) {
  haddadStudent.behaviorLog = [
    { label: 'Completed counseling reflection form', points: 2, date: '2026-07-25' },
    { label: 'Escalated during transition', points: -2, date: '2026-07-29' },
  ]
  haddadStudent.coverageDemo = {
    expectedLocation: 'Classroom · Gemara / Skills Rotation',
    actualCurrentLocation: 'In counseling room',
    provider: 'Mrs. Friedman',
    serviceType: 'Counseling',
    scheduledDeparture: '10:20',
    expectedReturn: '10:55',
    actualDeparture: '10:20',
    actualReturn: '10:58',
    scheduledVersusUnexpected: 'scheduled',
    approvedVersusUnexplained: 'approved',
    statusCode: 'unresolved',
  }
  haddadStudent.parentCalls = [
    ...(haddadStudent.parentCalls || []),
    { date: '2026-07-09', staff: 'Mrs. Friedman', notes: 'Discussed coping tools for transitions.', duration: '11 min' },
  ]
  haddadStudent.notes = [
    ...(haddadStudent.notes || []),
    { date: '2026-07-29', author: 'Mrs. Friedman', text: 'Used breathing routine after redirection and returned to task.' },
  ]
}

if (student12) {
  student12.behaviorLog = [
    { label: 'Followed BT schedule independently', points: 2, date: '2026-07-26' },
    { label: 'Called out during shiur', points: -1, date: '2026-07-30' },
  ]
  student12.coverageDemo = {
    expectedLocation: 'Classroom · Math / Intervention',
    actualCurrentLocation: 'BT support room',
    provider: 'Dovid',
    serviceType: 'BT Check-in',
    scheduledDeparture: '10:30',
    expectedReturn: '10:55',
    actualDeparture: '10:30',
    actualReturn: '10:52',
    scheduledVersusUnexpected: 'scheduled',
    approvedVersusUnexplained: 'approved',
    statusCode: 'unresolved',
  }
  student12.testScores = [
    { id:'ts12a', teacher:'Rabbi Abowitz', subject:'Math', skill:'3-digit', assessmentName:'Word Problem Check', date:'2026-02-05', scoreType:'points', score:15, maxScore:20, rating:null, notes:'Can solve single-step word problems with cues.' },
    { id:'ts12b', teacher:'Rabbi Abowitz', subject:'Writing', skill:'Grammar', assessmentName:'Editing Sentences', date:'2026-02-09', scoreType:'rating', score:null, maxScore:null, rating:'Developing', notes:'Improving punctuation consistency.' },
  ]
}

if (student14) {
  student14.notes = [
    ...(student14.notes || []),
    { date: '2026-07-24', author: 'Yitzi Liebowitz', text: 'Good carryover from therapy to class discussion.' },
    { date: '2026-07-30', author: 'Rabbi Schults', text: 'Needed support after returning from pullout but finished classwork.' },
  ]
  student14.coverageDemo = {
    expectedLocation: 'Classroom · English Reading',
    actualCurrentLocation: 'Returned from therapy',
    provider: 'Yitzi Liebowitz',
    serviceType: 'Therapy',
    scheduledDeparture: '10:15',
    expectedReturn: '11:00',
    actualDeparture: '10:15',
    actualReturn: '11:02',
    scheduledVersusUnexpected: 'scheduled',
    approvedVersusUnexplained: 'approved',
    statusCode: 'present',
  }
}

if (rosenfeldStudent) {
  rosenfeldStudent.parentCalls = [
    ...(rosenfeldStudent.parentCalls || []),
    { date: '2026-07-15', staff: 'Rabbi Klein', notes: 'Planned morning routine to reduce late arrivals.', duration: '7 min' },
    { date: '2026-07-29', staff: 'Rabbi Baum', notes: 'Shared attendance progress and reinforcement plan.', duration: '5 min' },
  ]
  rosenfeldStudent.coverageDemo = {
    expectedLocation: 'Classroom · Gemara / Skills Rotation',
    actualCurrentLocation: 'Arrived late',
    provider: 'Teacher',
    serviceType: 'Instruction',
    scheduledDeparture: '—',
    expectedReturn: '—',
    actualDeparture: '10:42',
    actualReturn: '10:42',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'unexplained',
    statusCode: 'late',
  }
}

export const yeshivaKetanaStudents = [
  mkStudent(101, 'Goldberger Yossi', 45, 2, ['P','P','L','LE','L','P'], 'present', null, [{staffId:'s6',type:'Speech Therapy',hrs:1.5}], [{date:'2025-05-28',staff:'Rabbi Schults',notes:'Discussed attendance',duration:'8 min'}], [{date:'2025-05-30',author:'Rabbi Schults',text:'Improving in davening.'}], true, 'Speech IEP - review Aug 2025', true),
  mkStudent(102, 'Goldberger Shmuel', 80, 0, ['P','P','P','P','P','P'], 'late'),
  mkStudent(103, 'Barber Chaim', 60, 3, ['P','L','A','P','P','P'], 'therapy', 's8', [{staffId:'s8',type:'Counseling',hrs:3}], [{date:'2025-06-01',staff:'Rabbi Schimborski',notes:'Left voicemail',duration:'2 min'}]),
  mkStudent(104, 'Erani Meir', 95, 0, ['P','P','P','P','P','P'], 'with-bt', 's10', [], [], [{date:'2025-06-02',author:'Rabbi Schults',text:'Excellent week.'}]),
  mkStudent(105, 'Bornstein Dovid', 20, 5, ['A','A','A','P','P','P'], 'absent'),
  mkStudent(106, 'Weingarten Moshe', 70, 1, ['P','P','P','L','P','P'], 'with-bt', 's10', [{staffId:'s7',type:'OT',hrs:2}], [{date:'2025-05-20',staff:'Rabbi Schults',notes:'General check-in',duration:'5 min'}], [], true, 'OT IEP - sensory processing'),
  mkStudent(107, 'Friedman Aryeh', 55, 6, ['P','P','P','P','A','P'], 'late', null, [], [], [], false, '', true),
  mkStudent(108, 'Klein Yitzchok', 40, 2, ['L','LE','L','L','P','P'], 'left-early', null, [{staffId:'s8',type:'Counseling',hrs:0.5}]),
  mkStudent(109, 'Rosenberg Yaakov', 65, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(110, 'Stein Avrohom', 55, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(111, 'Levy Menachem', 70, 0, ['P','P','P','P','P','A'], 'absent'),
  mkStudent(112, 'Schwartz Eliyahu', 30, 4, ['LE','P','P','A','P','P'], 'present'),
  mkStudent(113, 'Katz Mordechai', 85, 0, ['P','P','P','P','P','P'], 'therapy', 's6'),
  mkStudent(114, 'Weiss Bentzion', 45, 2, ['P','A','P','P','L','P'], 'therapy', 's9', [{staffId:'s9',type:'Therapy',hrs:2}]),
  mkStudent(115, 'Berger Shloime', 50, 2, ['A','P','P','P','P','P'], 'absent'),
]
initialStudents.push(...yeshivaKetanaStudents)

export const DEMO_TRACKING_HISTORY_KEYS_BY_NAME = Object.keys(HISTORICAL_DATA).reduce<Record<string, string>>((acc, key) => {
  const student = initialStudents.find(item => String(item.id) === String(key))
  if (!student?.name) return acc
  acc[String(student.name).trim().toLowerCase()] = String(key)
  return acc
}, {})

const student105 = initialStudents.find(s => s.id === 105)
if (student105) student105.dailyStatus = 'absent'
const student107 = initialStudents.find(s => s.id === 107)
if (student107) {
  student107.dailyStatus = 'late'
  student107.lateDetails = { timeArrived: '10:45', reason: 'parent-called', note: 'Father called, said coming after doctor' }
  student107.coverageDemo = {
    expectedLocation: 'Classroom · Kriah / Writing Block',
    actualCurrentLocation: 'Arrived late',
    provider: 'Teacher',
    serviceType: 'Instruction',
    scheduledDeparture: '—',
    expectedReturn: '—',
    actualDeparture: '10:45',
    actualReturn: '10:45',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'approved',
    statusCode: 'late',
  }
}
const student108 = initialStudents.find(s => s.id === 108)
if (student108) {
  student108.dailyStatus = 'left-early'
  student108.status = 'left-early'
  student108.coverageDemo = {
    expectedLocation: 'Classroom · Social Skills / SEL',
    actualCurrentLocation: 'Left early',
    provider: 'Mrs. Friedman',
    serviceType: 'Counseling',
    scheduledDeparture: '12:15',
    expectedReturn: '—',
    actualDeparture: '12:10',
    actualReturn: '—',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'approved',
    statusCode: 'unresolved',
  }
}
const student111 = initialStudents.find(s => s.id === 111)
if (student111) {
  student111.dailyStatus = 'absent'
  student111.coverageDemo = {
    expectedLocation: 'Classroom · Gemara / Skills Rotation',
    actualCurrentLocation: 'Absent',
    provider: 'Teacher',
    serviceType: 'Instruction',
    scheduledDeparture: '—',
    expectedReturn: '—',
    actualDeparture: '—',
    actualReturn: '—',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'unexplained',
    statusCode: 'absent',
  }
}
const student115 = initialStudents.find(s => s.id === 115)
if (student115) {
  student115.dailyStatus = 'absent'
  student115.coverageDemo = {
    expectedLocation: 'Classroom · English Reading',
    actualCurrentLocation: 'Absent',
    provider: 'Teacher',
    serviceType: 'Instruction',
    scheduledDeparture: '—',
    expectedReturn: '—',
    actualDeparture: '—',
    actualReturn: '—',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'unexplained',
    statusCode: 'absent',
  }
}

const student26 = initialStudents.find(s => s.id === 26)
if (student26) {
  student26.dailyStatus = 'left-early'
  student26.status = 'left-early'
  student26.coverageDemo = {
    expectedLocation: 'Classroom · Math / Intervention',
    actualCurrentLocation: 'Left early with note',
    provider: 'Rabbi Klein',
    serviceType: 'Support',
    scheduledDeparture: '14:10',
    expectedReturn: '—',
    actualDeparture: '14:05',
    actualReturn: '—',
    scheduledVersusUnexpected: 'unexpected',
    approvedVersusUnexplained: 'approved',
    statusCode: 'unresolved',
  }
}

export const statusColor = { present: '#475569', absent: '#9f1239', late: '#9a6a2a', 'left-early': '#6b7280', therapy: '#5b5f7a', 'with-bt': '#3f6b76', unknown: '#6b7280', 'not-arrived': '#94a3b8' }
export const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', 'left-early': 'Left Early', therapy: 'In Therapy', 'with-bt': 'With BT', unknown: 'Location Unknown', 'not-arrived': 'Not Arrived' }
export const statusEmoji = { present: '✅', absent: '❌', late: '⏰', 'left-early': '🚪', therapy: '🧠', 'with-bt': '👤', unknown: '❓', 'not-arrived': '🕐' }

// Seed grade fixtures — added 2026-07-31
// Class a (Dargei Alef): students 1-7, teacher Rabbi Klein
;(function addDemoGrades() {
  const Q = (id, teacher, subject, skill, name, date, score, max, notes, type = 'Quiz', enteredBy = teacher) => ({
    id: `seed-${id}`, teacher, subject, skill, assessmentName: name, date, scoreType: 'points',
    score, maxScore: max, rating: null, notes, assessmentType: type, enteredBy, enteredAt: `${date}T09:00:00Z`, sourceContext: 'seeded',
  })
  const M = (id, teacher, subject, skill, name, date, notes = '', enteredBy = teacher) => ({
    id: `seed-${id}`, teacher, subject, skill, assessmentName: name, date, scoreType: 'status',
    score: null, maxScore: null, rating: null, notes, attemptStatus: 'missed', assessmentType: 'Quiz', enteredBy, enteredAt: `${date}T09:00:00Z`, sourceContext: 'seeded',
  })

  const sId = (id) => initialStudents.find(s => s.id === id)

  // Dargei Alef (class a) – Rabbi Klein – Chumash & Gemara
  const s1 = sId(1)
  if (s1 && !s1.testScores?.length) s1.testScores = [
    Q('a1a','Rabbi Klein','Chumash','Bereishis','Parshas Quiz',  '2026-07-21', 76,100,'Good understanding of narrative flow.'),
    Q('a1b','Rabbi Klein','Gemara','Bava Kamma','Sugya Review',  '2026-07-14',88,100,'Grasps basic halachic logic.'),
    Q('a1c','Rabbi Lefkowitz','English','Grammar','Grammar Test', '2026-07-07',72,100,'Needs review of comma rules.'),
  ]
  const s2 = sId(2)
  if (s2 && !s2.testScores?.length) s2.testScores = [
    Q('a2a','Rabbi Klein','Chumash','Bereishis','Parshas Quiz',  '2026-07-21',101,100,'Outstanding memorization!', 'Quiz', 'Rabbi Klein'),
    Q('a2b','Rabbi Klein','Gemara','Bava Kamma','Sugya Review',  '2026-07-14', 95,100,'Excellent havanah.'),
    Q('a2c','Rabbi Lefkowitz','English','Vocabulary','Vocab Test','2026-07-07',88,100,''),
  ]
  const s3 = sId(3)
  if (s3 && !s3.testScores?.length) s3.testScores = [
    Q('a3a','Rabbi Klein','Chumash','Shemos','Parshas Quiz',     '2026-07-21', 90,100,'Solid grasp of the pesukim.'),
    Q('a3b','Rabbi Klein','Gemara','Bava Kamma','Sugya Review',  '2026-07-14',100,100,'Perfect score!'),
    Q('a3c','Rabbi Lefkowitz','Davening','Shacharis','Davening Check','2026-07-07',85,100,''),
  ]
  const s4 = sId(4)
  if (s4 && !s4.testScores?.length) s4.testScores = [
    Q('a4a','Rabbi Klein','Chumash','Bereishis','Parshas Quiz',  '2026-07-21',100,100,'Exceptional review.'),
    M('a4b','Rabbi Klein','Gemara','Bava Kamma','Sugya Review',  '2026-07-14', 'Was absent'),
    Q('a4c','Rabbi Lefkowitz','English','Reading Comprehension','Reading Quiz','2026-07-07',80,100,''),
  ]
  const s5 = sId(5)
  if (s5 && !s5.testScores?.length) s5.testScores = [
    M('a5a','Rabbi Klein','Chumash','Bereishis','Parshas Quiz',  '2026-07-21', 'Absent'),
    Q('a5b','Rabbi Klein','Gemara','Bava Metzia','Gemara Quiz',  '2026-06-30', 70,100,''),
    Q('a5c','Rabbi Lefkowitz','English','Grammar','Grammar Test', '2026-06-23', 65,100,'Needs support'),
  ]

  // Dargei Beis (class b) – Rabbi Goldstein – Gemara & Mishnah
  const s8 = sId(8)
  if (s8 && !s8.testScores?.length) s8.testScores = [
    Q('b8a','Rabbi Goldstein','Gemara','Berachos','Mishna Baal Peh','2026-07-21',85,100,''),
    Q('b8b','Rabbi Goldstein','Mishnah','Zraim','Mishnah Quiz',  '2026-07-14', 90,100,'Good retention.'),
    Q('b8c','Rabbi Lefkowitz','Davening','Shacharis','Birchas Hashachar Test','2026-07-07',95,100,''),
  ]
  const s9 = sId(9)
  if (s9 && !s9.testScores?.length) s9.testScores = [
    Q('b9a','Rabbi Goldstein','Gemara','Berachos','Mishna Baal Peh','2026-07-21',70,100,''),
    Q('b9b','Rabbi Goldstein','Mishnah','Moed','Mishnah Quiz',   '2026-07-14', 75,100,''),
    M('b9c','Rabbi Lefkowitz','English','Grammar','Grammar Test', '2026-07-07','Not submitted'),
  ]
  const s10 = sId(10)
  if (s10 && !s10.testScores?.length) s10.testScores = [
    Q('b10a','Rabbi Goldstein','Gemara','Shabbos','Weekly Chazara','2026-07-21',100,100,'Perfect!'),
    Q('b10b','Rabbi Goldstein','Mishnah','Moed','Mishnah Quiz',   '2026-07-14',88,100,''),
    Q('b10c','Rabbi Lefkowitz','Davening','Mincha','Mincha Baal Peh','2026-07-07',92,100,''),
  ]

  // Dargei Gimmel (class c) – Rabbi Ehrnreich
  const s15 = sId(15)
  if (s15 && !s15.testScores?.length) s15.testScores = [
    Q('c15a','Rabbi Ehrnreich','Chumash','Bereishis','Parshas Review','2026-07-21',82,100,''),
    Q('c15b','Rabbi Ehrnreich','Gemara','Gittin','Daf Yomi Quiz', '2026-07-14', 78,100,''),
    Q('c15c','Rabbi Lefkowitz','English','Essay Writing','Essay Draft','2026-07-07',88,100,'Good thesis.'),
  ]
  const s16 = sId(16)
  if (s16 && !s16.testScores?.length) s16.testScores = [
    M('c16a','Rabbi Ehrnreich','Chumash','Bereishis','Parshas Review','2026-07-21','Absent from school'),
    Q('c16b','Rabbi Ehrnreich','Gemara','Kiddushin','Daf Quiz',  '2026-07-14', 65,100,'Needs support with Rashi.'),
    Q('c16c','Rabbi Lefkowitz','English','Grammar','Grammar Test', '2026-07-07', 71,100,''),
  ]
  const s17 = sId(17)
  if (s17 && !s17.testScores?.length) s17.testScores = [
    Q('c17a','Rabbi Ehrnreich','Chumash','Shemos','Parsha Test',  '2026-07-21',95,100,'Excellent havanah on the sugyos.'),
    Q('c17b','Rabbi Ehrnreich','Gemara','Gittin','Daf Yomi Quiz', '2026-07-14',90,100,''),
    Q('c17c','Rabbi Abowitz','Math','Algebra','Mid-Unit Test',   '2026-07-07',87,100,''),
  ]

  // Dargei Daled (class d) – Rabbi Ambush
  const s22 = sId(22)
  if (s22 && !s22.testScores?.length) s22.testScores = [
    Q('d22a',"Rabbi Ambush",'Gemara','Makkos','Mesechta Quiz',   '2026-07-21',93,100,'Strong bekius.'),
    Q('d22b',"Rabbi Ambush",'Mishnah','Taharos','Mishnah Test',  '2026-07-14',88,100,''),
    Q('d22c','Rabbi Lefkowitz','Davening','Maariv','Maariv Baal Peh','2026-07-07',100,100,'Perfect!'),
  ]
  const s23 = sId(23)
  if (s23 && !s23.testScores?.length) s23.testScores = [
    Q('d23a',"Rabbi Ambush",'Gemara','Makkos','Mesechta Quiz',   '2026-07-21',68,100,'Needs chazara.'),
    Q('d23b',"Rabbi Ambush",'Mishnah','Kodashim','Mishnah Test', '2026-07-14',72,100,''),
    M('d23c','Rabbi Lefkowitz','English','Vocabulary','Vocab Test','2026-07-07','Missed—was in therapy'),
  ]
  const s24 = sId(24)
  if (s24 && !s24.testScores?.length) s24.testScores = [
    Q('d24a',"Rabbi Ambush",'Gemara',"Shevu'os",'Weekly Quiz',   '2026-07-21',80,100,''),
    Q('d24b',"Rabbi Ambush",'Mishnah','Taharos','Mishnah Test',  '2026-07-14',85,100,''),
    Q('d24c','Rabbi Abowitz','Math','Statistics','Stats Problem Set','2026-07-07',91,100,''),
  ]

  // YK Alef (yk-a) – Rabbi Schults
  const s101 = sId(101)
  if (s101 && !s101.testScores?.length) s101.testScores = [
    Q('yk101a','Rabbi Schults','Chumash','Bereishis','Chumash Test','2026-07-21',100,100,'A+', 'Test'),
    Q('yk101b','Rabbi Schults','Gemara','Brachos','Gemara Quiz',  '2026-07-14',90,100,''),
    Q('yk101c','Rabbi Schults','Kriah','Fluency','Fluency Check', '2026-07-07',85,100,'Good pace.'),
  ]
  const s102 = sId(102)
  if (s102 && !s102.testScores?.length) s102.testScores = [
    Q('yk102a','Rabbi Schults','Chumash','Bereishis','Chumash Test','2026-07-21',76,100,'Some errors in translation.','Test'),
    Q('yk102b','Rabbi Schults','Gemara','Brachos','Gemara Quiz',  '2026-07-14',83,100,''),
    M('yk102c','Rabbi Schults','Kriah','Nikud','Dikduk Quiz',     '2026-07-07','Was absent'),
  ]
  const s103 = sId(103)
  if (s103 && !s103.testScores?.length) s103.testScores = [
    Q('yk103a','Rabbi Schults','Chumash','Shemos','Chumash Test', '2026-07-21',88,100,''),
    Q('yk103b','Rabbi Schults','Kriah','Fluency','Fluency Check', '2026-07-07',92,100,'Great improvement!'),
  ]

  // YK Beis (yk-b) – Rabbi Schimborski
  const s109 = sId(109)
  if (s109 && !s109.testScores?.length) s109.testScores = [
    Q('yk109a','Rabbi Schimborski','Chumash','Vayikra','Parsha Quiz','2026-07-21',95,100,''),
    Q('yk109b','Rabbi Schimborski','Mishnah','Brachos','Mishnah Test','2026-07-14',100,100,'Perfect score!'),
    Q('yk109c','Rabbi Schimborski','Davening','Shacharis','Birchas Test','2026-07-07',88,100,''),
  ]
  const s110 = sId(110)
  if (s110 && !s110.testScores?.length) s110.testScores = [
    Q('yk110a','Rabbi Schimborski','Chumash','Bamidbar','Parsha Quiz','2026-07-21',72,100,''),
    Q('yk110b','Rabbi Schimborski','Mishnah','Peah','Mishnah Test','2026-07-14',68,100,'Needs review'),
    Q('yk110c','Rabbi Lefkowitz','English','Reading','Reading Quiz','2026-07-07',75,100,''),
  ]
  const s111 = sId(111)
  if (s111 && !s111.testScores?.length) s111.testScores = [
    Q('yk111a','Rabbi Schimborski','Chumash','Vayikra','Parsha Quiz','2026-07-21',15,15,'Perfect!','Quiz','Rabbi Lefkowitz'),
    Q('yk111b','Rabbi Schimborski','Mishnah','Brachos','Mishnah Test','2026-07-14',14,15,''),
    Q('yk111c','Rabbi Schimborski','Davening','Maariv','Maariv Test','2026-07-07',80,100,''),
  ]
})()
