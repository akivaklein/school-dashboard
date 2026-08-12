import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SetupCenterPage from '../SetupCenterPage'
import Dashboard from '../Dashboard'

const baseProps = {
  S: {
    card: {},
    btn: () => ({}),
    avatar: () => ({}),
  },
  role: 'admin',
  userName: 'Admin',
  setupTab: 'staff-directory',
  setSetupTab: () => {},
  setupAssignmentError: '',
  setSetupAssignmentError: () => {},
  setupPersonSearch: '',
  setSetupPersonSearch: () => {},
  setupStudentSearch: '',
  setSetupStudentSearch: () => {},
  setupAssignments: [],
  setSetupAssignments: () => {},
  setupPerson: null,
  setSetupPerson: () => {},
  emptyAssignment: {},
  currentPerson: null,
  visiblePeople: [],
  filteredSetupStudents: [],
  togglePeriodStudent: () => {},
  toggleCaseloadStudent: () => {},
  copyPeriodOneToTwo: () => {},
  overlapWarnings: [],
  setupActionDraft: '',
  setSetupActionDraft: () => {},
  setSetupCustomActions: () => {},
  setupCustomActions: [],
  setupVipRules: null,
  setSetupVipRules: () => {},
  setupSaleDraft: {},
  setSetupSaleDraft: () => {},
  setSetupSales: () => {},
  setupSales: [],
  setupAccounts: [],
  setSetupAccounts: () => {},
  setupTherapySchedule: [],
  setSetupTherapySchedule: () => {},
  setupTherapyFilters: [],
  setSetupTherapyFilters: () => {},
  setupTherapyView: 'week',
  setSetupTherapyView: () => {},
  addSetupTherapyFilter: () => {},
  updateSetupTherapyFilter: () => {},
  removeSetupTherapyFilter: () => {},
  createFakeTherapySchedule: () => {},
  THERAPIST_OPTIONS: [],
  CLASSES: [],
  STUDENT_CLASSES: [],
  CLASS_DIVISION: {},
  DIVISIONS: {},
  SUPPORT_STAFF_OPTIONS: [],
  setupNavItems: [{ id: 'staff-directory', label: 'Staff Directory', icon: '👥', group: 'People & Staff' }],
  students: [],
  staffMembers: [],
  initials: () => 'A',
  refreshStaffMembers: async () => {},
  currentAssignment: null,
  setPage: () => {},
  SETUP_PEOPLE: [],
  academicCatalog: { subjects: [], skills: [] },
  setAcademicCatalog: () => {},
  TEACHING_STAFF_OPTIONS: [],
  onPreviewAs: () => {},
  studentClassOverrides: {},
  teacherRebbeAssignments: [],
  onSaveTeacherRebbeAssignment: async () => {},
  onSetTeacherRebbeAssignmentStatus: async () => {},
  onSaveStudentClassAssignment: async () => {},
  onSaveStudentClassAssignmentBatch: async () => {},
}

describe('SetupCenterPage', () => {
  it('renders the staff-directory setup tab without crashing', () => {
    const markup = renderToStaticMarkup(<SetupCenterPage {...baseProps} />)

    expect(markup).toContain('Staff Directory')
  })

  it('renders the setup shell in a full-width layout', () => {
    const markup = renderToStaticMarkup(<SetupCenterPage {...baseProps} />)

    expect(markup).toContain('data-layout="setup-shell"')
  })

  it('renders the dashboard login view without crashing', () => {
    const markup = renderToStaticMarkup(<Dashboard />)

    expect(markup).toContain('Secure authentication required.')
  })
})
