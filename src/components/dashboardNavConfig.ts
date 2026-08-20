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
    { id: 'students', label: 'Students', defaultPage: 'students', pages: ['students'] },
    { id: 'classes', label: 'Classes / Assignments', defaultPage: 'academics', pages: ['academics', 'setup'] },
    { id: 'points', label: 'Points', defaultPage: 'behavior', pages: ['behavior'] },
    { id: 'store', label: 'Token Store', defaultPage: 'store', pages: ['store'] },
    { id: 'staff', label: 'Staff / Roles', defaultPage: 'staff-directory', pages: ['staff-directory'] },
    { id: 'settings', label: 'Basic Settings', defaultPage: 'setup', pages: ['setup'] },
  ],
  submenuByArea: {
    dashboard: [{ id: 'dashboard', label: 'Dashboard' }],
    students: [{ id: 'students', label: 'My Students' }],
    classes: [
      { id: 'academics', label: 'Classes' },
      { id: 'setup', label: 'Assignments' },
    ],
    points: [{ id: 'behavior', label: 'Points' }],
    store: [{ id: 'store', label: 'Token Store' }],
    staff: [{ id: 'staff-directory', label: 'Staff Directory' }],
    settings: [{ id: 'setup', label: 'Basic Settings' }],
  },
}

const TEACHER_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'students', label: 'My Students', defaultPage: 'students', pages: ['students'] },
    { id: 'points', label: 'Points', defaultPage: 'behavior', pages: ['behavior'] },
    { id: 'store', label: 'Token Store', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    students: [{ id: 'students', label: 'My Students' }],
    points: [{ id: 'behavior', label: 'Points' }],
    store: [{ id: 'store', label: 'Token Store' }],
  },
}

const THERAPIST_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'students', label: 'My Students', defaultPage: 'students', pages: ['students'] },
    { id: 'store', label: 'Token Store', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    students: [{ id: 'students', label: 'My Students' }],
    store: [{ id: 'store', label: 'Token Store' }],
  },
}

const STORE_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'school-day', label: 'School Day', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    'school-day': [{ id: 'store', label: 'Token Store' }],
  },
}

const REGISTER_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'school-day', label: 'Register', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    'school-day': [{ id: 'store', label: 'Token Store' }],
  },
}

const SUPPORT_STAFF_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'students', label: 'My Students', defaultPage: 'students', pages: ['students'] },
    { id: 'points', label: 'Points', defaultPage: 'behavior', pages: ['behavior'] },
    { id: 'store', label: 'Token Store', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    students: [{ id: 'students', label: 'My Students' }],
    points: [{ id: 'behavior', label: 'Points' }],
    store: [{ id: 'store', label: 'Token Store' }],
  },
}

const DEFAULT_NAV_CONFIG: RoleNavConfig = {
  topAreas: [
    { id: 'students', label: 'My Students', defaultPage: 'students', pages: ['students'] },
    { id: 'points', label: 'Points', defaultPage: 'behavior', pages: ['behavior'] },
    { id: 'store', label: 'Token Store', defaultPage: 'store', pages: ['store'] },
  ],
  submenuByArea: {
    students: [{ id: 'students', label: 'My Students' }],
    points: [{ id: 'behavior', label: 'Points' }],
    store: [{ id: 'store', label: 'Token Store' }],
  },
}

export function getRoleNavConfig(role: string): RoleNavConfig {
  if (role === 'admin') return ADMIN_NAV_CONFIG
  if (role === 'teacher' || role === 'rebbe') return TEACHER_NAV_CONFIG
  if (role === 'therapist') return THERAPIST_NAV_CONFIG
  if (role === 'store' || role === 'canteen') return STORE_NAV_CONFIG
  if (role === 'register') return REGISTER_NAV_CONFIG
  if (role === 'support_staff') return SUPPORT_STAFF_NAV_CONFIG
  return DEFAULT_NAV_CONFIG
}
