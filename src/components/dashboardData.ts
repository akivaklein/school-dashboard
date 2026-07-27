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
            <td>${escapeHtml(stu.division === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta')}</td>
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
  const demoDays = [
    { key: 'today', label: 'Today', offset: 0 },
    { key: 'yesterday', label: 'Yesterday', offset: 1 },
    { key: 'twoDays', label: '2 Days Ago', offset: 2 },
    { key: 'threeDays', label: '3 Days Ago', offset: 3 },
    { key: 'fourDays', label: '4 Days Ago', offset: 4 },
    { key: 'fiveDays', label: '5 Days Ago', offset: 5 },
    { key: 'sixDays', label: '6 Days Ago', offset: 6 },
  ]

  return students.map((student, index) => {
    const history = demoDays.map((day, dayIndex) => {
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

export function getAdmissionsReport(list) {
  const docKeys = ['applicationForm','birthCertificate','immunization','iepEvaluation','reportCard','schoolRecords','parentQuestionnaire','tuitionPaperwork','emergencyContacts','medicalAllergies']

  const normalized = list.map(x => {
    const decision = x.decision || 'No decision yet'
    const division = x.recommendedDivision || (x.program === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta')
    const missingDocs = docKeys.filter(k => !x.requiredDocsComplete?.[k]).length
    const openFollowUps = (x.followUps || []).filter(t => !t.done).length
    return { ...x, decision, division, missingDocs, openFollowUps }
  })

  const accepted = normalized.filter(x => x.decision === 'Accepted' || x.decision === 'Accepted with supports')
  const acceptedMesivta = accepted.filter(x => x.division === 'Mesivta')
  const acceptedYK = accepted.filter(x => x.division === 'Yeshiva Ketana')
  const waitlist = normalized.filter(x => x.decision === 'Waitlist')
  const needsInfo = normalized.filter(x => x.decision === 'Needs more information')
  const notFit = normalized.filter(x => x.decision === 'Not a fit')
  const noDecision = normalized.filter(x => x.decision === 'No decision yet')

  return {
    accepted,
    acceptedMesivta,
    acceptedYK,
    waitlist,
    needsInfo,
    notFit,
    noDecision,
    missingDocsTotal: normalized.reduce((sum, x) => sum + x.missingDocs, 0),
    openFollowUpsTotal: normalized.reduce((sum, x) => sum + x.openFollowUps, 0)
  }
}

export function enrichIntakeDemoData(list) {
  const demoByIndex = [
    {
      requiredDocsComplete: {
        applicationForm: true,
        birthCertificate: true,
        immunization: true,
        iepEvaluation: false,
        reportCard: true,
        schoolRecords: false,
        parentQuestionnaire: true,
        tuitionPaperwork: false,
        emergencyContacts: true,
        medicalAllergies: true
      },
      followUps: [
        { id: 9101, text: 'Call mother to request IEP/evaluation', due: '2026-06-17', assigned: 'Rabbi Baum', done: false },
        { id: 9102, text: 'Send tuition paperwork reminder', due: '2026-06-20', assigned: 'Office', done: false },
        { id: 9103, text: 'Confirm tour time with father', due: '2026-06-13', assigned: 'Rabbi Fried', done: true }
      ],
      contactLogs: [
        { id: 9201, date: '2026-06-10', method: 'phone', staff: 'Rabbi Baum', summary: 'Spoke with mother. Family is looking for smaller class setting and stronger daily structure. Requested IEP and latest report card.' },
        { id: 9202, date: '2026-06-11', method: 'email', staff: 'Office', summary: 'Sent intake packet and document checklist. Parent said they will send school records after Shabbos.' }
      ],
      decision: 'Needs more information',
      recommendedDivision: 'Yeshiva Ketana',
      recommendedClass: 'Yeshiva Ketana Alef',
      approvedBy: 'Admissions Committee',
      decisionDate: '2026-06-14',
      servicesNeeded: ['Reading support', 'Small group'],
      placementNotes: 'Warm boy. Needs kriah support and a smaller group. Waiting for evaluation before final placement.'
    },
    {
      requiredDocsComplete: {
        applicationForm: true,
        birthCertificate: true,
        immunization: true,
        iepEvaluation: true,
        reportCard: true,
        schoolRecords: true,
        parentQuestionnaire: true,
        tuitionPaperwork: true,
        emergencyContacts: true,
        medicalAllergies: true
      },
      followUps: [
        { id: 9301, text: 'Prepare acceptance packet', due: '2026-06-15', assigned: 'Office', done: true },
        { id: 9302, text: 'Confirm first-day transportation details', due: '2026-06-21', assigned: 'Rabbi Klein', done: false }
      ],
      contactLogs: [
        { id: 9401, date: '2026-06-07', method: 'in person', staff: 'Rabbi Klein', summary: 'Tour completed. Parents were positive and asked about morning rebbe placement.' },
        { id: 9402, date: '2026-06-09', method: 'phone', staff: 'Rabbi Hillel', summary: 'Reviewed assessment. Student appears ready for structured placement with light support.' }
      ],
      decision: 'Accepted with supports',
      recommendedDivision: 'Yeshiva Ketana',
      recommendedClass: 'Yeshiva Ketana Beis',
      approvedBy: 'Rabbi Klein',
      decisionDate: '2026-06-10',
      servicesNeeded: ['Small group', 'Reading support'],
      placementNotes: 'Accepted. Strong middos. Needs calm transition plan and reading check-ins twice weekly.'
    },
    {
      requiredDocsComplete: {
        applicationForm: true,
        birthCertificate: false,
        immunization: false,
        iepEvaluation: false,
        reportCard: true,
        schoolRecords: false,
        parentQuestionnaire: false,
        tuitionPaperwork: false,
        emergencyContacts: true,
        medicalAllergies: false
      },
      followUps: [
        { id: 9501, text: 'Call family after initial inquiry', due: '2026-06-16', assigned: 'Office', done: false },
        { id: 9502, text: 'Ask for immunization and birth certificate', due: '2026-06-18', assigned: 'Office', done: false }
      ],
      contactLogs: [
        { id: 9601, date: '2026-06-12', method: 'phone', staff: 'Office', summary: 'Father called asking about openings. Sent basic information and scheduled callback.' }
      ],
      decision: 'No decision yet',
      recommendedDivision: 'Needs review',
      recommendedClass: 'Needs assessment',
      approvedBy: '',
      decisionDate: '',
      servicesNeeded: ['Transportation review'],
      placementNotes: 'Very early inquiry. Need school history and parent questionnaire before interview.'
    },
    {
      requiredDocsComplete: {
        applicationForm: true,
        birthCertificate: true,
        immunization: true,
        iepEvaluation: true,
        reportCard: true,
        schoolRecords: true,
        parentQuestionnaire: true,
        tuitionPaperwork: false,
        emergencyContacts: true,
        medicalAllergies: true
      },
      followUps: [
        { id: 9701, text: 'Admissions committee review', due: '2026-06-14', assigned: 'Rabbi Baum', done: false },
        { id: 9702, text: 'Send tuition paperwork if accepted', due: '2026-06-17', assigned: 'Office', done: false }
      ],
      contactLogs: [
        { id: 9801, date: '2026-06-04', method: 'email', staff: 'Office', summary: 'Received evaluation, report card, and parent questionnaire.' },
        { id: 9802, date: '2026-06-08', method: 'in person', staff: 'Rabbi Baum', summary: 'Interview completed. Student was respectful but needs review for behavior support plan.' }
      ],
      decision: 'Waitlist',
      recommendedDivision: 'Mesivta',
      recommendedClass: 'Mesivta Shiur Alef',
      approvedBy: 'Admissions Committee',
      decisionDate: '2026-06-12',
      servicesNeeded: ['Behavior plan', 'Counseling', 'Small group'],
      placementNotes: 'Good potential. Placement depends on supports available and final class size.'
    },
    {
      requiredDocsComplete: {
        applicationForm: true,
        birthCertificate: true,
        immunization: true,
        iepEvaluation: false,
        reportCard: true,
        schoolRecords: true,
        parentQuestionnaire: true,
        tuitionPaperwork: true,
        emergencyContacts: true,
        medicalAllergies: true
      },
      followUps: [
        { id: 9901, text: 'Schedule final placement call', due: '2026-06-19', assigned: 'Rabbi Hillel', done: false }
      ],
      contactLogs: [
        { id: 9911, date: '2026-06-06', method: 'phone', staff: 'Rabbi Hillel', summary: 'Mother said current school feels too large. Looking for more individualized rebbe attention.' },
        { id: 9912, date: '2026-06-13', method: 'email', staff: 'Office', summary: 'Received updated report card and tuition paperwork.' }
      ],
      decision: 'Accepted',
      recommendedDivision: 'Mesivta',
      recommendedClass: 'Mesivta Shiur Beis',
      approvedBy: 'Rabbi Hillel',
      decisionDate: '2026-06-13',
      servicesNeeded: ['Small group'],
      placementNotes: 'Accepted for Mesivta. Recommend close monitoring during first month.'
    }
  ]

  return list.map((item, index) => ({
    ...item,
    ...(demoByIndex[index % demoByIndex.length] || {})
  }))
}

export const SKILL_RATINGS = ['Weak', 'Developing', 'Good', 'Great']
export const RATING_SCORE = { Weak: 1, Developing: 2, Good: 3, Great: 4 }
export const ACADEMIC_AREAS = {
  'Rabbi Abowitz': {
    Math: ['2-digit', '3-digit'],
    Reading: ['Decoding', 'Fluency', 'Comprehension'],
    Writing: ['Grammar', 'Writing Project'],
  },
  'Rabbi Abramowitz': {
    Math: ['2-digit', '3-digit'],
    Reading: ['Decoding', 'Fluency', 'Comprehension'],
    Writing: ['Grammar', 'Writing Project'],
  }
}
export const DEFAULT_ACADEMIC_TEACHER = 'Rabbi Abowitz'
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
  return 'Staff'
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
  { id: 's17', name: 'Eli Bloom', role: 'Admin / Office' },
  { id: 's18', name: 'Zev Reisman', role: 'Admin / Office' },
  { id: 's19', name: 'Eli Stern', role: 'Admin / Office' },
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
export const TOUR_STAFF_OPTIONS = getStaffNameOptions(STAFF, role => /admin|menahel|teacher|rebbe/i.test(role))

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
  mesivta: { label: 'Mesivta', shortLabel: 'MS' },
}

export const CLASS_DIVISION = {
  a: 'mesivta',
  b: 'mesivta',
  c: 'mesivta',
  d: 'mesivta',
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
  if (role === 'store') {
    return {
      divisions: ['yeshiva_ketana', 'mesivta'],
      canManageStore: false
    }
  }

  if (role === 'teacher' || role === 'rebbe') {
    return {
      divisions: [teacherDivisionForName(name)],
      canManageStore: false
    }
  }

  const bothDivisions = [
    'Rabbi Baum',
    'Rabbi Fried',
    'Rabbi Lefkowitz',
    'Rabbi Weiss',
    'Eli Bloom',
    'Zev Reisman',
    'Eli Stern'
  ]

  if (bothDivisions.includes(name)) {
    return {
      divisions: ['yeshiva_ketana', 'mesivta'],
      canManageStore: true
    }
  }

  if (name === 'Rabbi Hillel') {
    return {
      divisions: ['mesivta'],
      canManageStore: true
    }
  }

  if (name === 'Rabbi Klein') {
    return {
      divisions: ['yeshiva_ketana'],
      canManageStore: true
    }
  }

  return {
    divisions: ['yeshiva_ketana', 'mesivta'],
    canManageStore: role === 'admin'
  }
}

export function defaultDivisionView(access) {
  return access.divisions.length > 1 ? 'all' : access.divisions[0]
}

export function divisionLabel(key) {
  return key === 'all' ? 'Both Divisions' : DIVISIONS[key]?.label || key
}

export const SCHEDULE_PERIODS = [
  { id: 1, time: '10:10 - 11:10', subject: 'Period 1', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Period 2', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 3, time: '12:15 - 12:45', subject: 'Period 3', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 4, time: '12:45 - 1:45', subject: 'Lunch & Recess', teachers: [], type: 'break' },
  { id: 5, time: '1:45 - 2:25', subject: 'English', teachers: ['Mr. Cohen'], type: 'class' },
  { id: 6, time: '2:30 - 3:10', subject: 'Period 5', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 7, time: '3:15 - 3:45', subject: 'Period 6', teachers: ['Rabbi Schults', 'Rabbi Schimborski', 'Rabbi Ehrnreich'], type: 'class' },
]

export const THERAPY_SCHEDULE = [
  { student: 'Bloom Yair', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
  { student: 'Levitz Avrohom', staffId: 's7', day: 'Wed', time: '10:10', duration: '45 min', type: 'OT' },
  { student: 'Feltman Daniel', staffId: 's9', day: 'Thu', time: '10:10', duration: '45 min', type: 'Therapy' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Fri', time: '11:20', duration: '30 min', type: 'Counseling' },
  { student: 'Goldberger Yossi', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Barber Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
]

export const mkStudent = (id, name, points, reminders, att, status, withStaff = null, services = [], parentCalls = [], notes = [], iep = false, iepDetails = '', detention = false) => ({
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

export function makeDay(daysAgo, inMins, outMins, staffName, staffId) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return { date: d.toISOString().slice(0,10), inMins, outMins, staffName, staffId, pct: Math.round(inMins/(inMins+outMins)*100) }
}

export const HISTORICAL_DATA = {
  6: [
    makeDay(0, 45, 70, 'Yitzi + Ezriel', 's9'),
    makeDay(1, 110, 5, 'Ezriel', 's10'),
    makeDay(2, 85, 30, 'Yitzi Liebowitz', 's9'),
    makeDay(3, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(4, 70, 45, 'Ezriel', 's10'),
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
  1: [
    makeDay(0, 60, 45, 'Mrs. Goldberg', 's6'),
    makeDay(1, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(2, 100, 15, 'Mrs. Goldberg', 's6'),
    makeDay(3, 80, 35, 'Mrs. Goldberg', 's6'),
    makeDay(7, 90, 25, 'Mrs. Goldberg', 's6'),
    makeDay(8, 70, 45, 'Mrs. Goldberg', 's6'),
    makeDay(14, 85, 30, 'Mrs. Goldberg', 's6'),
    makeDay(21, 75, 40, 'Mrs. Goldberg', 's6'),
    makeDay(30, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(60, 80, 35, 'Mrs. Goldberg', 's6'),
    makeDay(90, 90, 25, 'Mrs. Goldberg', 's6'),
  ],
  3: [
    makeDay(0, 30, 85, 'Mrs. Friedman', 's8'),
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
    makeDay(0, 50, 65, 'Ezriel + Dovid', 's10'),
    makeDay(1, 85, 30, 'Dovid', 's11'),
    makeDay(2, 70, 45, 'Ezriel', 's10'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 60, 55, 'Ezriel', 's10'),
    makeDay(14, 75, 40, 'Dovid', 's11'),
    makeDay(21, 80, 35, 'Ezriel', 's10'),
    makeDay(30, 65, 50, 'Dovid', 's11'),
  ],
  14: [
    makeDay(0, 35, 80, 'Yitzi Liebowitz', 's9'),
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
    makeDay(0, 55, 60, 'Dovid', 's11'),
    makeDay(1, 80, 35, 'Dovid', 's11'),
    makeDay(2, 65, 50, 'Dovid', 's11'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 70, 45, 'Dovid', 's11'),
    makeDay(14, 85, 30, 'Dovid', 's11'),
    makeDay(21, 60, 55, 'Dovid', 's11'),
    makeDay(30, 75, 40, 'Dovid', 's11'),
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

export const initialStudents = [
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

initialStudents.find(s => s.id === 6).classLog = LEVITZ_CLASS_LOG

initialStudents.find(s => s.id === 1).testScores = [
  { id:'ts1', teacher:'Rabbi Abowitz', subject:'Math', skill:'2-digit', assessmentName:'Addition Quiz', date:'2026-01-07', scoreType:'points', score:18, maxScore:20, rating:null, notes:'Strong with regrouping.' },
  { id:'ts2', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Decoding', assessmentName:'January Reading Check', date:'2026-01-08', scoreType:'rating', score:null, maxScore:null, rating:'Good', notes:'Reads most words accurately.' },
  { id:'ts3', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Fluency', assessmentName:'Fluency Observation', date:'2026-01-09', scoreType:'rating', score:null, maxScore:null, rating:'Developing', notes:'Needs smoother pacing.' },
]
initialStudents.find(s => s.id === 3).testScores = [
  { id:'ts4', teacher:'Rabbi Abowitz', subject:'Math', skill:'3-digit', assessmentName:'Subtraction Quiz', date:'2026-01-07', scoreType:'points', score:14, maxScore:20, rating:null, notes:'Needs review with borrowing.' },
  { id:'ts5', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Comprehension', assessmentName:'Story Questions', date:'2026-01-08', scoreType:'rating', score:null, maxScore:null, rating:'Weak', notes:'Needs support answering in full sentences.' },
]
initialStudents.find(s => s.id === 6).testScores = [
  { id:'ts6', teacher:'Rabbi Abowitz', subject:'Math', skill:'2-digit', assessmentName:'Addition Quiz', date:'2026-01-07', scoreType:'points', score:16, maxScore:20, rating:null, notes:'Good effort.' },
  { id:'ts7', teacher:'Rabbi Abowitz', subject:'Reading', skill:'Fluency', assessmentName:'Fluency Observation', date:'2026-01-09', scoreType:'rating', score:null, maxScore:null, rating:'Good', notes:'Much more confident.' },
]
initialStudents.find(s => s.id === 7).testScores = [
  { id:'ts8', teacher:'Rabbi Abowitz', subject:'Math', skill:'3-digit', assessmentName:'Subtraction Quiz', date:'2026-01-07', scoreType:'points', score:19, maxScore:20, rating:null, notes:'Excellent accuracy.' },
  { id:'ts9', teacher:'Rabbi Abowitz', subject:'Writing', skill:'Writing Project', assessmentName:'Personal Narrative', date:'2026-01-10', scoreType:'rating', score:null, maxScore:null, rating:'Great', notes:'Clear ideas and structure.' },
]

initialStudents.find(s => s.id === 5).dailyStatus = 'absent'
initialStudents.find(s => s.id === 7).dailyStatus = 'late'
initialStudents.find(s => s.id === 7).lateDetails = { timeArrived: '10:45', reason: 'parent-called', note: 'Father called, said coming after doctor' }
initialStudents.find(s => s.id === 11).dailyStatus = 'absent'
initialStudents.find(s => s.id === 16).dailyStatus = 'absent'
initialStudents.find(s => s.id === 20).dailyStatus = 'late'
initialStudents.find(s => s.id === 20).lateDetails = { timeArrived: '11:10', reason: 'transport', note: '' }

initialStudents.find(s => s.id === 6).family = {
  fatherName: 'Moshe Levitz', fatherPhone: '718-555-0101', fatherEmail: 'mlevitz@email.com',
  motherName: 'Rivka Levitz', motherPhone: '718-555-0102', motherEmail: 'rlevitz@email.com',
  address: '1423 54th St, Brooklyn NY 11219',
  emergencyContact: 'Moshe Levitz (Father)', emergencyPhone: '718-555-0101'
}
initialStudents.find(s => s.id === 6).medical = {
  allergies: [{ name: 'Penicillin', severity: 'severe' }, { name: 'Tree nuts', severity: 'moderate' }],
  medications: [{ name: 'Ritalin', dosage: '10mg', frequency: 'Daily morning' }],
  conditions: ['ADHD', 'Sensory Processing Disorder'],
  doctorName: 'Dr. Shmuel Katz', doctorPhone: '718-555-9876', lastPhysical: '2025-09-15', notes: 'Needs sensory breaks. Has OT IEP.'
}
initialStudents.find(s => s.id === 1).family = {
  fatherName: 'Yisrael Bloom', fatherPhone: '718-555-0201', fatherEmail: 'ybloom@email.com',
  motherName: 'Chana Bloom', motherPhone: '718-555-0202', motherEmail: '',
  address: '1567 48th St, Brooklyn NY 11219',
  emergencyContact: 'Yisrael Bloom (Father)', emergencyPhone: '718-555-0201'
}
initialStudents.find(s => s.id === 1).medical = {
  allergies: [{ name: 'Shellfish', severity: 'mild' }],
  medications: [],
  conditions: ['Speech delay'],
  doctorName: 'Dr. Rachel Stern', doctorPhone: '718-555-8765', lastPhysical: '2025-08-20', notes: 'Speech therapy twice weekly.'
}
initialStudents.find(s => s.id === 3).family = {
  fatherName: 'Yaakov Haddad', fatherPhone: '718-555-0301', fatherEmail: 'yhaddad@email.com',
  motherName: 'Leah Haddad', motherPhone: '718-555-0302', motherEmail: 'lhaddad@email.com',
  address: '892 Ocean Pkwy, Brooklyn NY 11230',
  emergencyContact: 'Yaakov Haddad (Father)', emergencyPhone: '718-555-0301'
}
initialStudents.find(s => s.id === 3).medical = {
  allergies: [{ name: 'Latex', severity: 'moderate' }, { name: 'Bee stings', severity: 'severe' }],
  medications: [{ name: 'EpiPen', dosage: '0.3mg', frequency: 'As needed' }, { name: 'Prozac', dosage: '10mg', frequency: 'Daily' }],
  conditions: ['Anxiety', 'Bee sting allergy - carries EpiPen'],
  doctorName: 'Dr. Avigdor Weiss', doctorPhone: '718-555-7654', lastPhysical: '2025-10-01', notes: 'EpiPen in office at all times. Counseling weekly.'
}

initialStudents.find(s => s.id === 1).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:50', type: 'out', note: 'Left with Mrs. Goldberg (Speech)', staffId: 's6' },
  { time: '11:35', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 3).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:25', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
  { time: '11:25', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:00', type: 'out', note: 'Location unknown', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 8).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '11:20', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
  { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 12).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:30', type: 'out', note: 'Left with Ezriel (BT)', staffId: 's10' },
  { time: '10:55', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:15', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
  { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 14).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:15', type: 'out', note: 'Left with Yitzi Liebowitz (Therapy)', staffId: 's9' },
  { time: '11:00', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 18).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:40', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
  { time: '11:10', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:30', type: 'out', note: 'Location unknown', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]

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

initialStudents.find(s => s.id === 105).dailyStatus = 'absent'
initialStudents.find(s => s.id === 107).dailyStatus = 'late'
initialStudents.find(s => s.id === 107).lateDetails = { timeArrived: '10:45', reason: 'parent-called', note: 'Father called, said coming after doctor' }
initialStudents.find(s => s.id === 108).dailyStatus = 'left-early'
initialStudents.find(s => s.id === 108).status = 'left-early'
initialStudents.find(s => s.id === 111).dailyStatus = 'absent'
initialStudents.find(s => s.id === 115).dailyStatus = 'absent'

initialStudents.find(s => s.id === 26).dailyStatus = 'left-early'
initialStudents.find(s => s.id === 26).status = 'left-early'

export const statusColor = { present: '#475569', absent: '#9f1239', late: '#9a6a2a', 'left-early': '#6b7280', therapy: '#5b5f7a', 'with-bt': '#3f6b76', unknown: '#6b7280', 'not-arrived': '#94a3b8' }
export const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', 'left-early': 'Left Early', therapy: 'In Therapy', 'with-bt': 'With BT', unknown: 'Location Unknown', 'not-arrived': 'Not Arrived' }
export const statusEmoji = { present: '✅', absent: '❌', late: '⏰', 'left-early': '🚪', therapy: '🧠', 'with-bt': '👤', unknown: '❓', 'not-arrived': '🕐' }
