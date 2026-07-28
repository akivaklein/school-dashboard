import { useEffect, useMemo, useState } from 'react'
import SetupAssignmentsSection from './SetupAssignmentsSection'
import SetupTherapyScheduleSection from './SetupTherapyScheduleSection'
import SetupTeachingConfigSection from './SetupTeachingConfigSection'
import SetupVipRulesSection from './SetupVipRulesSection'
import SetupStoreSalesSection from './SetupStoreSalesSection'
import SetupAccountsSection from './SetupAccountsSection'
import SetupSchoolStructureSection from './SetupSchoolStructureSection'
import StaffDirectoryPage from './StaffDirectoryPage'
import {
  loadSetupAssignments,
  saveSetupAssignment,
  loadTherapySchedule,
  saveTherapySchedule,
} from '../services/setupCenterService'

export default function SetupCenterPage({
  S,
  role,
  userName,
  setupTab,
  setSetupTab,
  setupAssignmentError,
  setSetupAssignmentError,
  setupPersonSearch,
  setSetupPersonSearch,
  setupStudentSearch,
  setSetupStudentSearch,
  setupAssignments,
  setSetupAssignments,
  setupPerson,
  setSetupPerson,
  emptyAssignment,
  currentPerson,
  visiblePeople,
  filteredSetupStudents,
  togglePeriodStudent,
  toggleCaseloadStudent,
  copyPeriodOneToTwo,
  overlapWarnings,
  setupActionDraft,
  setSetupActionDraft,
  setSetupCustomActions,
  setupCustomActions,
  setupVipRules,
  setSetupVipRules,
  setupSaleDraft,
  setSetupSaleDraft,
  setSetupSales,
  setupSales,
  setupAccounts,
  setSetupAccounts,
  setupTherapySchedule,
  setSetupTherapySchedule,
  setupTherapyFilters,
  setSetupTherapyFilters,
  setupTherapyView,
  setSetupTherapyView,
  addSetupTherapyFilter,
  updateSetupTherapyFilter,
  removeSetupTherapyFilter,
  createFakeTherapySchedule,
  THERAPIST_OPTIONS,
  CLASSES,
  STUDENT_CLASSES,
  CLASS_DIVISION,
  DIVISIONS,
  SUPPORT_STAFF_OPTIONS,
  setupNavItems,
  students,
  staffMembers,
  initials,
  refreshStaffMembers,
  currentAssignment,
  setPage,
  SETUP_PEOPLE,
}) {
  const safeSetupNavItems = Array.isArray(setupNavItems) ? setupNavItems : []
  const safeDivisions = DIVISIONS || {}
  const topLevelTabs = useMemo(
    () => [
      {
        id: 'staff',
        label: 'Staff',
        subtitle: 'Manage staff records and assignment ownership.',
        itemIds: ['staff-directory', 'assignments'],
      },
      {
        id: 'assignments',
        label: 'Configuration',
        subtitle: 'Configure teaching actions, VIP policies, and store settings.',
        itemIds: ['teaching', 'vip', 'store'],
      },
      {
        id: 'scheduling',
        label: 'Scheduling',
        subtitle: 'Plan therapy and scheduling configuration.',
        itemIds: ['therapy-schedule', 'schedule-setup'],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        subtitle: 'Manage staff accounts and access settings.',
        itemIds: ['accounts'],
      },
      {
        id: 'school-structure',
        label: 'School Structure',
        subtitle: 'Maintain classes, divisions, and structure settings.',
        itemIds: ['classes-divisions'],
      },
    ],
    [],
  )

  const topTabByItemId = useMemo(
    () => topLevelTabs.reduce<Record<string, string>>((acc, tab) => {
      tab.itemIds.forEach(itemId => {
        acc[itemId] = tab.id
      })
      return acc
    }, {}),
    [topLevelTabs],
  )

  const activeTopTabId = topTabByItemId[setupTab] || topLevelTabs[0].id
  const activeTopTab = topLevelTabs.find(tab => tab.id === activeTopTabId) || topLevelTabs[0]

  const visibleSubmenuItems = useMemo(
    () => activeTopTab.itemIds
      .map(itemId => safeSetupNavItems.find(item => item.id === itemId))
      .filter(Boolean),
    [activeTopTab, safeSetupNavItems],
  )

  const schedulingSubmenuGroups = useMemo(
    () => visibleSubmenuItems.reduce<Array<{ groupName: string; items: Array<any> }>>((groups, item) => {
      const groupName = item.group || 'Scheduling'
      const existing = groups.find(group => group.groupName === groupName)
      if (existing) {
        existing.items.push(item)
      } else {
        groups.push({ groupName, items: [item] })
      }
      return groups
    }, []),
    [visibleSubmenuItems],
  )

  const activeSchedulingGroupName = safeSetupNavItems.find(item => item.id === setupTab)?.group || null
  const [openSchedulingGroups, setOpenSchedulingGroups] = useState<string[]>(activeSchedulingGroupName ? [activeSchedulingGroupName] : [])

  useEffect(() => {
    if (activeTopTabId !== 'scheduling' || !activeSchedulingGroupName) return
    setOpenSchedulingGroups(prev => (prev.includes(activeSchedulingGroupName) ? prev : [...prev, activeSchedulingGroupName]))
  }, [activeSchedulingGroupName, activeTopTabId])

  const sectionSubtitleByTab: Record<string, string> = {
    'staff-directory': 'Edit staffing records and keep teams organized.',
    'assignments': 'Match staff caseloads and period coverage.',
    'therapy-schedule': 'Coordinate therapist schedules and service blocks.',
    teaching: 'Set classroom action options available to staff.',
    vip: 'Define VIP rules and eligibility behavior.',
    store: 'Manage setup-level store sales and policy defaults.',
    accounts: 'Control account access and identity settings.',
    'classes-divisions': 'Maintain class and division structure settings.',
    'schedule-setup': 'Review scheduling snapshots and structure guidance.',
  }

  const primaryActionLabelByTab: Record<string, string> = {
    'staff-directory': 'Manage Staff Directory',
    assignments: 'Review Assignments',
    'therapy-schedule': 'Review Therapy Schedule',
    teaching: 'Review Teaching Actions',
    vip: 'Review VIP Rules',
    store: 'Review Store & Sales',
    accounts: 'Manage Accounts',
    'classes-divisions': 'Review School Structure',
    'schedule-setup': 'Review Schedule Setup',
  }

  const currentSectionSubtitle = sectionSubtitleByTab[setupTab] || activeTopTab.subtitle
  const activeTabLabel = safeSetupNavItems.find(item => item.id === setupTab)?.label || 'Setup Center'
  return (
    <div data-layout="setup-shell" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
      <div style={{ ...S.card, marginBottom: 12, padding: '14px 16px', border: '1px solid #d3deea', borderLeft: '4px solid #5f83aa', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 800, margin: 0, color: '#0f2942' }}>Setup Center</h1>
            <div style={{ fontSize: 13, color: '#425b76', marginTop: 6 }}>{currentSectionSubtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSetupTab(setupTab)}
              style={{
                border: '1px solid #2f5f8f',
                background: '#3f6f9f',
                color: '#ffffff',
                borderRadius: 7,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {primaryActionLabelByTab[setupTab] || 'Review Section'}
            </button>
            <button
              onClick={() => setPage('dashboard')}
              style={{
                border: '1px solid #d3deea',
                background: '#ffffff',
                color: '#334155',
                borderRadius: 7,
                padding: '8px 11px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 12, padding: '8px', border: '1px solid #dbe5f0', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {topLevelTabs.map(tab => {
            const isActive = tab.id === activeTopTabId
            return (
              <button
                key={tab.id}
                onClick={() => setSetupTab(tab.itemIds[0])}
                style={{
                  border: 'none',
                  background: isActive ? '#dbe8f5' : '#ffffff',
                  color: isActive ? '#123251' : '#334155',
                  borderRadius: 7,
                  padding: '7px 11px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, alignItems: 'start', width: '100%' }}>
        <div style={{ ...S.card, padding: '8px', overflow: 'hidden', border: '1px solid #dbe5f0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', position: 'sticky', top: 14, borderRadius: 8 }}>
          {activeTopTabId === 'scheduling' && schedulingSubmenuGroups.length > 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {schedulingSubmenuGroups.map(group => {
                const isOpen = openSchedulingGroups.includes(group.groupName)
                const hasActive = group.items.some(item => item.id === setupTab)
                return (
                  <div key={group.groupName}>
                    <button
                      onClick={() => setOpenSchedulingGroups(prev => (prev.includes(group.groupName) ? prev.filter(name => name !== group.groupName) : [...prev, group.groupName]))}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: hasActive ? '#edf3fa' : '#f8fafc',
                        color: '#334155',
                        borderRadius: 6,
                        padding: '7px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{group.groupName}</span>
                      <span>{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {group.items.map(item => {
                          const isActive = setupTab === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSetupTab(item.id)}
                              style={{
                                width: '100%',
                                border: 'none',
                                background: isActive ? '#dbe8f5' : 'transparent',
                                color: isActive ? '#123251' : '#334155',
                                borderRadius: 6,
                                padding: '8px 9px',
                                fontSize: 12,
                                fontWeight: isActive ? 800 : 600,
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {visibleSubmenuItems.map(item => {
                const isActive = setupTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setSetupTab(item.id)}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #5f83aa' : '3px solid transparent',
                      background: isActive ? '#dbe8f5' : '#ffffff',
                      color: isActive ? '#123251' : '#334155',
                      borderRadius: 6,
                      padding: '8px 9px',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          {setupAssignmentError && (
            <div style={{
              ...S.card,
              marginBottom: 16,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#991b1b',
              fontSize: 13,
              fontWeight: 700,
            }}>
              {setupAssignmentError}
            </div>
          )}

          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2942', margin: 0 }}>{activeTabLabel}</h2>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{currentSectionSubtitle}</div>
            </div>
            <span style={{ padding: '6px 9px', borderRadius: 8, background: '#f2f6fb', color: '#415a77', fontSize: 11, fontWeight: 700 }}>
              {activeTopTab.label}
            </span>
          </div>

          {setupTab === 'staff-directory' && (
            <StaffDirectoryPage
              S={S}
              staffMembers={staffMembers}
              initials={initials}
              onStaffChanged={refreshStaffMembers}
            />
          )}

          {setupTab === 'assignments' && (
            <SetupAssignmentsSection
              overlapWarnings={overlapWarnings}
              S={S}
              setupPersonSearch={setupPersonSearch}
              setSetupPersonSearch={setSetupPersonSearch}
              visiblePeople={visiblePeople}
              currentPerson={currentPerson}
              setupAssignments={setupAssignments}
              emptyAssignment={emptyAssignment}
              setSetupPerson={setSetupPerson}
              setupStudentSearch={setupStudentSearch}
              setSetupStudentSearch={setSetupStudentSearch}
              currentAssignment={currentAssignment}
              copyPeriodOneToTwo={copyPeriodOneToTwo}
              filteredSetupStudents={filteredSetupStudents}
              togglePeriodStudent={togglePeriodStudent}
              toggleCaseloadStudent={toggleCaseloadStudent}
            />
          )}

          {setupTab === 'therapy-schedule' && (
            <SetupTherapyScheduleSection
              setupTherapySchedule={setupTherapySchedule}
              setSetupTherapySchedule={setSetupTherapySchedule}
              students={students}
              setupTherapyFilters={setupTherapyFilters}
              setSetupTherapyFilters={setSetupTherapyFilters}
              setupTherapyView={setupTherapyView}
              setSetupTherapyView={setSetupTherapyView}
              addSetupTherapyFilter={addSetupTherapyFilter}
              updateSetupTherapyFilter={updateSetupTherapyFilter}
              removeSetupTherapyFilter={removeSetupTherapyFilter}
              createFakeTherapySchedule={createFakeTherapySchedule}
              THERAPIST_OPTIONS={THERAPIST_OPTIONS}
              CLASSES={CLASSES}
              STUDENT_CLASSES={STUDENT_CLASSES}
              CLASS_DIVISION={CLASS_DIVISION}
              DIVISIONS={safeDivisions}
              SUPPORT_STAFF_OPTIONS={SUPPORT_STAFF_OPTIONS}
              S={S}
            />
          )}

          {setupTab === 'teaching' && (
            <SetupTeachingConfigSection
              setupActionDraft={setupActionDraft}
              setSetupActionDraft={setSetupActionDraft}
              setSetupCustomActions={setSetupCustomActions}
              setupCustomActions={setupCustomActions}
              S={S}
            />
          )}

          {setupTab === 'classes-divisions' && (
            <SetupSchoolStructureSection S={S} />
          )}

          {setupTab === 'schedule-setup' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={S.card}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#223046', marginBottom: 6 }}>Schedule Setup</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Use these school-structure settings to keep daily schedules aligned with classes, divisions, and support staff.</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#f8fafc' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#223046', marginBottom: 4 }}>Daily Scheduling Snapshot</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Active class templates: {CLASSES.length} · Active divisions: {Object.keys(safeDivisions).length}</div>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#223046', marginBottom: 4 }}>Suggested next steps</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: '#64748b', fontSize: 12, display: 'grid', gap: 4 }}>
                      <li>Confirm class rosters and division assignments before publishing schedule changes.</li>
                      <li>Review therapy and support coverage from the People & Staff group.</li>
                      <li>Keep school-wide schedule updates in one place for easy review.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {setupTab === 'vip' && (
            <SetupVipRulesSection
              setupVipRules={setupVipRules}
              setSetupVipRules={setSetupVipRules}
              S={S}
            />
          )}

          {setupTab === 'store' && (
            <SetupStoreSalesSection
              setupSaleDraft={setupSaleDraft}
              setSetupSaleDraft={setSetupSaleDraft}
              setSetupSales={setSetupSales}
              setupSales={setupSales}
              S={S}
            />
          )}

          {setupTab === 'accounts' && (
            <SetupAccountsSection
              SETUP_PEOPLE={SETUP_PEOPLE}
              setupAccounts={setupAccounts}
              setSetupAccounts={setSetupAccounts}
              S={S}
              DIVISIONS={safeDivisions}
            />
          )}
        </div>
      </div>
    </div>
  )
}
