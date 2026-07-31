type NavPage = {
  id: string
  label: string
  defaultPage: string
  pages: string[]
}

type NavSubItem = {
  id: string
  label: string
}

type RoleNavConfig = {
  topAreas: NavPage[]
  submenuByArea: Record<string, NavSubItem[]>
}

const ADMIN_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'dashboard', label: 'Dashboard', defaultPage: 'dashboard', pages: ['dashboard'] },
    { id: 'students', label: 'Students', defaultPage: 'students', pages: ['students', 'academics'] },
    { id: 'school-day', label: 'School Day', defaultPage: 'attendance', pages: ['attendance', 'schedule', 'store', 'calls', 'intake', 'teaching-mode'] },
    { id: 'support', label: 'Student Support', defaultPage: 'support', pages: ['support', 'behavior', 'alerts'] },
    { id: 'reports', label: 'Reports', defaultPage: 'todo', pages: ['todo', 'grade-reports', 'attendance-reports'] },
    { id: 'messages', label: 'Messages', defaultPage: 'messages', pages: ['messages'] },
    { id: 'setup', label: 'Setup', defaultPage: 'setup', pages: ['setup', 'staff-directory', 'therapists'] },
  ],
  submenuByArea: {
    dashboard: [{ id: 'dashboard', label: 'Dashboard' }],
    students: [
      { id: 'students', label: 'Students List' },
      { id: 'academics', label: 'Grades & Test Scores' },
    ],
    'school-day': [
      { id: 'attendance', label: 'Attendance' },
      { id: 'schedule', label: 'Schedule' },
      { id: 'teaching-mode', label: 'Teaching Mode' },
      { id: 'store', label: 'Token Store' },
      { id: 'calls', label: 'Parent Calls' },
      { id: 'intake', label: 'Intake' },
    ],
    support: [
      { id: 'support', label: 'Support Overview' },
      { id: 'behavior', label: 'Behavior' },
      { id: 'alerts', label: 'Alerts' },
    ],
    reports: [{ id: 'todo', label: 'To-Do Queue' }, { id: 'grade-reports', label: 'Grade & Test Reports' }, { id: 'attendance-reports', label: 'Attendance Reports' }],
    messages: [{ id: 'messages', label: 'Messages' }],
    setup: [
      { id: 'setup', label: 'Setup Center' },
      { id: 'staff-directory', label: 'Staff Directory' },
      { id: 'therapists', label: 'Therapist Assignments' },
    ],
  },
}

const TEACHER_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'dashboard', label: 'Dashboard', defaultPage: 'dashboard', pages: ['dashboard'] },
    { id: 'students', label: 'Students', defaultPage: 'academics', pages: ['academics'] },
    { id: 'school-day', label: 'School Day', defaultPage: 'attendance', pages: ['attendance', 'schedule', 'teaching-mode'] },
    { id: 'support', label: 'Student Support', defaultPage: 'support', pages: ['support'] },
  ],
  submenuByArea: {
    dashboard: [{ id: 'dashboard', label: 'My Class' }],
    students: [{ id: 'academics', label: 'Grades & Test Scores' }],
    'school-day': [
      { id: 'attendance', label: 'Attendance' },
      { id: 'schedule', label: 'Schedule' },
      { id: 'teaching-mode', label: 'Teaching Mode' },
    ],
    support: [{ id: 'support', label: 'Support Overview' }],
  },
}

const STORE_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'school-day', label: 'School Day', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    'school-day': [
      { id: 'store', label: 'Token Store' },
    ],
  },
}

const DEFAULT_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'dashboard', label: 'Dashboard', defaultPage: 'dashboard', pages: ['dashboard'] },
    { id: 'school-day', label: 'School Day', defaultPage: 'schedule', pages: ['schedule', 'teaching-mode'] },
    { id: 'support', label: 'Student Support', defaultPage: 'support', pages: ['support'] },
  ],
  submenuByArea: {
    dashboard: [{ id: 'dashboard', label: 'My Students' }],
    'school-day': [
      { id: 'schedule', label: 'Schedule' },
      { id: 'teaching-mode', label: 'Teaching Mode' },
    ],
    support: [{ id: 'support', label: 'Support Overview' }],
  },
}

export function getRoleNavConfig(role: string): RoleNavConfig {
  if (role === 'admin') return ADMIN_NAV_CONFIG
  if (role === 'teacher' || role === 'rebbe') return TEACHER_NAV_CONFIG
  if (role === 'store') return STORE_NAV_CONFIG
  return DEFAULT_NAV_CONFIG
}
