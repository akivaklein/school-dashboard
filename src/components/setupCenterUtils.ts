const SECTION_META_BY_TAB: Record<string, { sectionSubtitle: string; primaryActionLabel: string }> = {
  'staff-directory': {
    sectionSubtitle: 'Edit staffing records and keep teams organized.',
    primaryActionLabel: 'Manage Staff Directory',
  },
  assignments: {
    sectionSubtitle: 'Match staff caseloads and period coverage.',
    primaryActionLabel: 'Review Assignments',
  },
  'therapy-schedule': {
    sectionSubtitle: 'Coordinate therapist schedules and service blocks.',
    primaryActionLabel: 'Review Therapy Schedule',
  },
  teaching: {
    sectionSubtitle: 'Set classroom action options available to staff.',
    primaryActionLabel: 'Review Teaching Actions',
  },
  vip: {
    sectionSubtitle: 'Define VIP rules and eligibility behavior.',
    primaryActionLabel: 'Review VIP Rules',
  },
  store: {
    sectionSubtitle: 'Manage setup-level store sales and policy defaults.',
    primaryActionLabel: 'Review Store & Sales',
  },
  accounts: {
    sectionSubtitle: 'Control account access and identity settings.',
    primaryActionLabel: 'Manage Accounts',
  },
  'classes-divisions': {
    sectionSubtitle: 'Maintain class and division structure settings.',
    primaryActionLabel: 'Review School Structure',
  },
  'schedule-setup': {
    sectionSubtitle: 'Review scheduling snapshots and structure guidance.',
    primaryActionLabel: 'Review Schedule Setup',
  },
  'data-cleanup': {
    sectionSubtitle: 'Admin-only bulk cleanup of test data. Real students are never removed.',
    primaryActionLabel: 'Review Data Cleanup',
  },
}

export function getSetupSectionMeta(setupTab: string, safeSetupNavItems: Array<{ id: string; label: string }> = []) {
  const fallbackMeta = {
    sectionSubtitle: 'Review setup details and keep school operations aligned.',
    primaryActionLabel: 'Review Section',
    activeTabLabel: 'Setup Center',
  }

  const knownMeta = SECTION_META_BY_TAB[setupTab]
  if (!knownMeta) {
    return fallbackMeta
  }

  const activeTabLabel = safeSetupNavItems.find(item => item.id === setupTab)?.label || 'Setup Center'

  return {
    ...knownMeta,
    activeTabLabel,
  }
}
