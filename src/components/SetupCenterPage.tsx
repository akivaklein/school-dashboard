import SetupAssignmentsSection from './SetupAssignmentsSection'
import SetupTherapyScheduleSection from './SetupTherapyScheduleSection'
import SetupTeachingConfigSection from './SetupTeachingConfigSection'
import SetupVipRulesSection from './SetupVipRulesSection'
import SetupStoreSalesSection from './SetupStoreSalesSection'
import SetupAccountsSection from './SetupAccountsSection'
import SetupSchoolStructureSection from './SetupSchoolStructureSection'
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
  return (
    <div style={{ maxWidth: 1260, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 18px 10px', borderBottom: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setPage('dashboard')}
              style={{
                marginBottom: 10,
                border: '1px solid #dbe7f1',
                background: '#f8fbff',
                color: '#31506f',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              ← Back to dashboard
            </button>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196' }}>Setup Center</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#172033', marginTop: 6 }}>Administration & Config</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Tucked-away tools for staff, assignments, rules, and store settings.</div>
          </div>
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['People & Staff', 'Rules & Configuration', 'School Structure'].map(groupName => {
              const groupItems = safeSetupNavItems.filter(item => item.group === groupName)
              if (groupItems.length === 0) return null
              return (
                <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196', padding: '2px 4px' }}>{groupName}</div>
                  {groupItems.map(item => {
                    const isActive = setupTab === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSetupTab(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isActive ? '1px solid #7897bb' : '1px solid #e2e8f0',
                          background: isActive ? '#edf4fb' : '#ffffff',
                          color: isActive ? '#2f4f72' : '#5f6f81',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
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

          <div style={{ ...S.card, marginBottom: 16, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196' }}>
                Home / Setup Center
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#223046', marginTop: 4 }}>
                {safeSetupNavItems.find(item => item.id === setupTab)?.label || 'Setup Center'}
              </div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4, maxWidth: 700 }}>
                Manage teaching rosters, therapist caseloads, behavior actions, VIP rules, canteen sales, and staff access.
              </div>
            </div>
            <button
              onClick={() => setPage('dashboard')}
              style={{
                border: '1px solid #dbe7f1',
                background: '#ffffff',
                color: '#31506f',
                borderRadius: 999,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back to dashboard
            </button>
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
                <div style={{ fontSize: 18, fontWeight: 900, color: '#223046', marginBottom: 6 }}>Schedule Setup</div>
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
