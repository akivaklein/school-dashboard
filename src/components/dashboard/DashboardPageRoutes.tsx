import { lazy, Suspense } from 'react'
import { describeSupportSourceError } from '../../services/studentSupportLoader'
import { isLeadershipRole } from '../../utils/permissions'
import AcademicsPage from '../AcademicsPage'
import StaffDirectoryPage from '../StaffDirectoryPage'
import { PageLoadingFallback } from './DashboardSharedComponents'
import { TeacherDashboard } from './TeacherDashboard'
import { TherapistDashboard } from './TherapistDashboard'
import { FlagDashboardWidget } from './StudentFlagsPanel'

const AdminMainDashboard = lazy(() => import('../AdminMainDashboard'))
const AttendancePage = lazy(() => import('../AttendancePage'))
const BehaviorPage = lazy(() => import('../BehaviorPage'))
const SchedulePage = lazy(() => import('../SchedulePage'))
const StudentSupport = lazy(() => import('../StudentSupport'))
const StudentsListPage = lazy(() => import('../StudentsListPage'))
const TokenStorePage = lazy(() => import('../TokenStorePage'))

export default function DashboardPageRoutes({
  ACADEMIC_AREAS,
  CLASS_DIVISION,
  DAYS,
  DIVISIONS,
  RATING_SCORE,
  S,
  SCHEDULE_PERIODS,
  SKILL_RATINGS,
  STAFF,
  STORE_CATEGORY_OPTIONS,
  THERAPY_SCHEDULE_STATE,
  academicCatalog,
  academicDisplay,
  academicPct,
  academicStatus,
  academicStatusColor,
  activeStudents,
  additionalClassIdsByStudent,
  absentTodayStudents,
  addStoreItem,
  adjustStoreStock,
  alerts,
  assignedTeacherClassIds,
  assignedTeacherStudentIds,
  attFilter,
  authoritativeStudents,
  buyItem,
  callsDueStudents,
  cameToday,
  cameTodayRate,
  checkIsVIP,
  configuredClasses,
  createStudentFromAdmin,
  daysSince,
  deleteStudentFromAdmin,
  divisionLabel,
  divisionSummaries,
  divisionView,
  effectiveRole,
  effectiveUserName,
  filteredStudents,
  getDeletionImpactForStudent,
  getGreeting,
  getImprovement,
  inClassrooms,
  inClassroomsStudents,
  inTherapy,
  initials,
  instructionalGroupMemberships,
  instructionalGroups,
  instructionalPeriods,
  isStoreItemRestrictedForStudent,
  late,
  lateStudents,
  leftEarlyStudents,
  LiveClock,
  newStoreItem,
  openStudent,
  page,
  physicalRooms,
  persistStudentFields,
  persistStudentFieldsBulk,
  purchaseLog,
  recordGradeEntries,
  recordGradeEntry,
  recordStudentPointsAction,
  refreshStaffMembers,
  refreshStoreData,
  removeStoreItem,
  restoreStarterStoreCatalog,
  restoreStudentFromAdmin,
  reverseStoreRedemptionFromStore,
  saveStoreItemEdits,
  searchedStudents,
  setAttFilter,
  setDrillDown,
  setNewStoreItem,
  setPage,
  setShowStoreManager,
  setShowUnknownPopup,
  setSupportInitialSection,
  setStoreCategoryFilter,
  setStoreItemSearch,
  setStoreStudent,
  setStudentFlags,
  setStudentTasks,
  setStudents,
  setTeachingMode,
  showStoreManager,
  staffMembers,
  statusColor,
  statusEmoji,
  statusLabel,
  stillInYeshiva,
  storeCategoryFilter,
  storeItemSearch,
  storeItems,
  storeLastLoadError,
  storePersistenceReady,
  storeStudent,
  storeSyncDiagnostics,
  storeSyncState,
  studentClassOverrides,
  studentFlags,
  studentFlagsLoadError,
  studentLoadError,
  studentTasks,
  studentsForStudentsPage,
  supportInitialSection,
  setupAssignments,
  teacherClassIds,
  TEACHING_STAFF_OPTIONS,
  todoLoadError,
  todos,
  total,
  unknown,
  updateStoreItem,
  updateStudentFromAdmin,
  archiveStudentFromAdmin,
  urgentStudents,
  userAccess,
  vipStudents,
  visibleStudents,
  withBT,
  improved,
  needsAttention,
  setTodos,
}) {
  return (
    <>
      {page === 'support' && effectiveRole !== 'store' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <StudentSupport
            students={visibleStudents}
            setStudents={setStudents}
            userName={effectiveUserName}
            role={effectiveRole}
            alerts={alerts}
            openStudent={openStudent}
            setPage={setPage}
            flags={studentFlags}
            setFlags={setStudentFlags}
            initialSection={supportInitialSection}
            staff={STAFF}
            S={S}
            initials={initials}
            todos={todos}
            setTodos={setTodos}
            flagsLoadError={studentFlagsLoadError}
            todosLoadError={todoLoadError}
            parentCallsLoadError={studentLoadError ? describeSupportSourceError('Parent Calls', 'students.parent_calls', new Error(studentLoadError)) : null}
          />
        </Suspense>
      )}

      {page === 'dashboard' && (effectiveRole === 'teacher' || effectiveRole === 'rebbe') && (
        <TeacherDashboard
          students={visibleStudents}
          allStudents={activeStudents}
          setStudents={setStudents}
          userName={effectiveUserName}
          setSelectedStudent={student => openStudent(student)}
          setTeachingMode={setTeachingMode}
          setPage={setPage}
          initialClass={teacherClassIds.length === 1 ? teacherClassIds[0] : null}
          setDrillDown={setDrillDown}
          recordStudentPointsAction={recordStudentPointsAction}
          isVIP={checkIsVIP}
          staffMembers={staffMembers}
          instructionalPeriods={instructionalPeriods}
          physicalRooms={physicalRooms}
          instructionalGroups={instructionalGroups}
          instructionalGroupMemberships={instructionalGroupMemberships}
        />
      )}
      {page === 'dashboard' && effectiveRole === 'support_staff' && (
        <TherapistDashboard
          students={visibleStudents}
          userName={effectiveUserName}
          setSelectedStudent={student => openStudent(student, 'therapy')}
          staffMembers={staffMembers}
          therapySchedule={THERAPY_SCHEDULE_STATE}
        />
      )}

      {page === 'dashboard' && effectiveRole !== 'register' && effectiveRole !== 'teacher' && effectiveRole !== 'rebbe' && effectiveRole !== 'support_staff' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <AdminMainDashboard
            S={S}
            getGreeting={getGreeting}
            userName={effectiveUserName}
            total={total}
            divisionLabel={divisionLabel}
            divisionView={divisionView}
            LiveClock={LiveClock}
            cameToday={cameToday}
            stillInYeshiva={stillInYeshiva}
            unknown={unknown}
            urgentStudents={urgentStudents}
            setShowUnknownPopup={setShowUnknownPopup}
            userAccess={userAccess}
            divisionSummaries={divisionSummaries}
            DIVISIONS={DIVISIONS}
            inClassrooms={inClassrooms}
            inClassroomsStudents={inClassroomsStudents}
            late={late}
            lateStudents={lateStudents}
            inTherapy={inTherapy}
            withBT={withBT}
            students={authoritativeStudents}
            leftEarlyStudents={leftEarlyStudents}
            absentTodayStudents={absentTodayStudents}
            setDrillDown={setDrillDown}
            cameTodayRate={cameTodayRate}
            setPage={setPage}
            callsDueStudents={callsDueStudents}
            alerts={alerts}
            openStudent={openStudent}
            studentFlags={studentFlags}
            setSupportInitialSection={setSupportInitialSection}
            CLASSES={configuredClasses}
            improved={improved}
            needsAttention={needsAttention}
            vipStudents={vipStudents}
            getImprovement={getImprovement}
            initials={initials}
            todos={todos}
            setTodos={setTodos}
            studentTasks={studentTasks}
            setStudentTasks={setStudentTasks}
            FlagDashboardWidget={FlagDashboardWidget}
            instructionalPeriods={instructionalPeriods}
            physicalRooms={physicalRooms}
            instructionalGroups={instructionalGroups}
            instructionalGroupMemberships={instructionalGroupMemberships}
          />
        </Suspense>
      )}

      {page === 'students' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <StudentsListPage
            searchedStudents={studentsForStudentsPage}
            openStudent={openStudent}
            S={S}
            STAFF={STAFF}
            getImprovement={getImprovement}
            isVIP={checkIsVIP}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            daysSince={daysSince}
            initials={initials}
            role={effectiveRole}
            classes={configuredClasses}
            onCreateStudent={createStudentFromAdmin}
            onUpdateStudent={updateStudentFromAdmin}
            onArchiveStudent={archiveStudentFromAdmin}
            onRestoreStudent={restoreStudentFromAdmin}
            onDeleteStudent={deleteStudentFromAdmin}
            onGetDeletionImpact={getDeletionImpactForStudent}
            instructionalPeriods={instructionalPeriods}
            instructionalGroups={instructionalGroups}
            instructionalGroupMemberships={instructionalGroupMemberships}
          />
        </Suspense>
      )}

      {page === 'staff-directory' && effectiveRole !== 'register' && (
        <StaffDirectoryPage
          S={S}
          staffMembers={staffMembers}
          initials={initials}
          onStaffChanged={refreshStaffMembers}
          canManageStaff={isLeadershipRole(effectiveRole)}
        />
      )}

      {page === 'attendance' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <AttendancePage
            students={visibleStudents}
            setStudents={setStudents}
            role={effectiveRole}
            userName={effectiveUserName}
            attFilter={attFilter}
            setAttFilter={setAttFilter}
            filteredStudents={filteredStudents}
            openStudent={openStudent}
            persistStudentFields={persistStudentFields}
            persistStudentFieldsBulk={persistStudentFieldsBulk}
            STAFF={STAFF}
            S={S}
            initials={initials}
            isVIP={checkIsVIP}
            DAYS={DAYS}
            CLASSES={configuredClasses}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            instructionalPeriods={instructionalPeriods}
            instructionalGroups={instructionalGroups}
            instructionalGroupMemberships={instructionalGroupMemberships}
            primaryClassIdsByStudent={Object.fromEntries(Object.entries(studentClassOverrides as Record<string, { classId: string }>).map(([studentId, assignment]) => [studentId, assignment.classId]))}
            additionalClassIdsByStudent={additionalClassIdsByStudent}
          />
        </Suspense>
      )}

      {page === 'academics' && (
        <AcademicsPage
          students={visibleStudents}
          setStudents={setStudents}
          role={effectiveRole}
          userName={effectiveUserName}
          teacherClass={teacherClassIds.length === 1 ? teacherClassIds[0] : null}
          teacherAssignedStudentIds={assignedTeacherStudentIds}
          teacherAssignedClassIds={assignedTeacherClassIds}
          academicTeacherOptions={Array.from(new Set([
            ...Object.keys(ACADEMIC_AREAS),
            ...TEACHING_STAFF_OPTIONS,
          ])).sort()}
          openStudent={openStudent}
          S={S}
          CLASSES={configuredClasses}
          CLASS_DIVISION={CLASS_DIVISION}
          ACADEMIC_AREAS={ACADEMIC_AREAS}
          academicCatalog={academicCatalog}
          SKILL_RATINGS={SKILL_RATINGS}
          RATING_SCORE={RATING_SCORE}
          academicPct={academicPct}
          academicDisplay={academicDisplay}
          academicStatus={academicStatus}
          academicStatusColor={academicStatusColor}
          persistStudentFields={persistStudentFields}
          setupAssignments={setupAssignments}
          onSaveGradeEntry={recordGradeEntry}
          onSaveGradeEntries={recordGradeEntries}
          additionalClassIdsByStudent={additionalClassIdsByStudent}
          instructionalPeriods={instructionalPeriods}
          physicalRooms={physicalRooms}
          instructionalGroups={instructionalGroups}
          instructionalGroupMemberships={instructionalGroupMemberships}
        />
      )}

      {page === 'schedule' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <SchedulePage
            S={S}
            students={visibleStudents}
            STAFF={STAFF}
            SCHEDULE_PERIODS={SCHEDULE_PERIODS}
            THERAPY_SCHEDULE={THERAPY_SCHEDULE_STATE}
            openStudent={openStudent}
            initials={initials}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            CLASSES={configuredClasses}
            instructionalPeriods={instructionalPeriods}
            physicalRooms={physicalRooms}
            instructionalGroups={instructionalGroups}
            instructionalGroupMemberships={instructionalGroupMemberships}
          />
        </Suspense>
      )}

      {page === 'behavior' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <BehaviorPage
            students={visibleStudents}
            searchedStudents={searchedStudents}
            openStudent={openStudent}
            initials={initials}
            isVIP={checkIsVIP}
            S={S}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            onAdjustPoints={recordStudentPointsAction}
            CLASSES={configuredClasses}
            additionalClassIdsByStudent={additionalClassIdsByStudent}
          />
        </Suspense>
      )}

      {page === 'store' && (
        <Suspense fallback={<PageLoadingFallback />}>
          <TokenStorePage
            S={S}
            userAccess={userAccess}
            showStoreManager={showStoreManager}
            setShowStoreManager={setShowStoreManager}
            storeItems={storeItems}
            updateStoreItem={updateStoreItem}
            saveStoreItemEdits={saveStoreItemEdits}
            adjustStoreStock={adjustStoreStock}
            removeStoreItem={removeStoreItem}
            newStoreItem={newStoreItem}
            setNewStoreItem={setNewStoreItem}
            addStoreItem={addStoreItem}
            storeStudent={storeStudent}
            setStoreStudent={setStoreStudent}
            visibleStudents={visibleStudents}
            isVIP={checkIsVIP}
            students={visibleStudents}
            storeCategoryFilter={storeCategoryFilter}
            setStoreCategoryFilter={setStoreCategoryFilter}
            storeItemSearch={storeItemSearch}
            setStoreItemSearch={setStoreItemSearch}
            buyItem={buyItem}
            purchaseLog={purchaseLog}
            isStoreItemRestrictedForStudent={isStoreItemRestrictedForStudent}
            STORE_CATEGORY_OPTIONS={STORE_CATEGORY_OPTIONS}
            storePersistenceReady={storePersistenceReady}
            storeSyncState={storeSyncState}
            storeLastLoadError={storeLastLoadError}
            storeSyncDiagnostics={storeSyncDiagnostics}
            refreshStoreData={refreshStoreData}
            restoreStarterStoreCatalog={restoreStarterStoreCatalog}
            onReverseStoreRedemption={reverseStoreRedemptionFromStore}
          />
        </Suspense>
      )}
    </>
  )
}