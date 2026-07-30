import { useMemo } from 'react'
import SetupAssignmentsSection from './SetupAssignmentsSection'
import SetupTherapyScheduleSection from './SetupTherapyScheduleSection'
import SetupTeachingConfigSection from './SetupTeachingConfigSection'
import SetupVipRulesSection from './SetupVipRulesSection'
import SetupStoreSalesSection from './SetupStoreSalesSection'
import SetupAccountsSection from './SetupAccountsSection'
import SetupSchoolStructureSection from './SetupSchoolStructureSection'
import StaffDirectoryPage from './StaffDirectoryPage'
import { getSetupSectionMeta } from './setupCenterUtils'

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
  academicCatalog,
  setAcademicCatalog,
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
  TEACHING_STAFF_OPTIONS,
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
  const { sectionSubtitle, activeTabLabel } = getSetupSectionMeta(setupTab, safeSetupNavItems)
  const activeGroupLabel = safeSetupNavItems.find(item => item.id === setupTab)?.group || 'Setup'
  const primarySetupActionLabel = setupTab === 'assignments' ? 'Open Staff Directory' : 'Open Staff Assignments'
  const primarySetupActionTarget = setupTab === 'assignments' ? 'staff-directory' : 'assignments'

  const groupedSetupNavItems = useMemo(
    () => safeSetupNavItems.reduce<Record<string, Array<{ id: string; label: string; icon?: string; group?: string }>>>((acc, item) => {
      const groupName = item.group || 'Setup'
      if (!acc[groupName]) {
        acc[groupName] = []
      }
      acc[groupName].push(item)
      return acc
    }, {}),
    [safeSetupNavItems],
  )

  const currentSectionSubtitle = sectionSubtitle || 'Review setup details and keep school operations aligned.'
  return (
    <div data-layout="setup-shell" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
      <div style={{ ...S.card, marginBottom: 12, padding: '14px 16px', border: '1px solid #d3deea', borderLeft: '4px solid #5f83aa', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 800, margin: 0, color: '#0f2942' }}>Setup Center</h1>
            <div style={{ fontSize: 13, color: '#425b76', marginTop: 6 }}>{currentSectionSubtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSetupTab(primarySetupActionTarget)}
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
              {primarySetupActionLabel}
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

      <div style={{ ...S.card, marginBottom: 12, padding: '10px', border: '1px solid #dbe5f0', borderRadius: 10 }}>
        {Object.entries(groupedSetupNavItems).map(([groupName, items]) => (
          <div key={groupName} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px' }}>
              {groupName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {items.map(item => {
                const isActive = setupTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setSetupTab(item.id)}
                    style={{
                      border: `1px solid ${isActive ? '#7fa1c5' : '#dbe5f0'}`,
                      background: isActive ? '#dbe8f5' : '#ffffff',
                      color: isActive ? '#123251' : '#334155',
                      borderRadius: 8,
                      padding: '7px 11px',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 700,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
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

          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2942', margin: 0 }}>{activeTabLabel}</h2>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{currentSectionSubtitle}</div>
            </div>
            <span style={{ padding: '6px 9px', borderRadius: 8, background: '#f2f6fb', color: '#415a77', fontSize: 11, fontWeight: 700 }}>
              {activeGroupLabel}
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
              academicCatalog={academicCatalog}
              setAcademicCatalog={setAcademicCatalog}
              CLASSES={CLASSES}
              DIVISIONS={safeDivisions}
              TEACHING_STAFF_OPTIONS={TEACHING_STAFF_OPTIONS}
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
  )
}
