import { useState, type Dispatch, type SetStateAction, type ComponentType, type CSSProperties } from 'react'
import SupportSessions from './support/SupportSessions'
import { resolveActorName } from './dashboardData'

type StudentLike = {
  id: number | string
  name?: string
  [key: string]: unknown
}

type GoalLike = {
  id: string
  studentId: number | string
  title: string
  category: string
  description: string
  target: string
  nextTarget: string
  startingLevel: string
  currentLevel: string
  progressPercent: number
  status: string
  createdBy: string
  createdByRole: string
  assignedTo: string
  createdAt: string
  reviewDate: string
  archived: boolean
}

type StudentSupportProps = {
  students: StudentLike[]
  setStudents: Dispatch<SetStateAction<StudentLike[]>>
  userName: string
  role: string
  alerts: Array<{ id: string | number; [key: string]: unknown }>
  openStudent: (student: StudentLike) => void
  setPage: Dispatch<SetStateAction<string>>
  flags: Array<{ id: string | number; [key: string]: unknown }>
  setFlags: Dispatch<SetStateAction<Array<{ id: string | number; [key: string]: unknown }>>>
  initialSection?: string
  S: {
    btn: (variant: string) => CSSProperties
    card: CSSProperties
    tag: (color: string, bg?: string) => CSSProperties
    statCard: (color: string) => CSSProperties
    [key: string]: unknown
  }
  initials: (name: string) => string
  staff: Array<{ id: string | number; name?: string; [key: string]: unknown }>
  FlagsPanel: ComponentType<{
    students: StudentLike[]
    flags: Array<{ id: string | number; [key: string]: unknown }>
    setFlags: Dispatch<SetStateAction<Array<{ id: string | number; [key: string]: unknown }>>>
    currentStaffName: string
  }>
}

export default function StudentSupport({
  students,
  setStudents,
  userName,
  role,
  alerts,
  setPage,
  flags,
  setFlags,
  initialSection = 'overview',
  S,
  initials,
  staff,
  FlagsPanel,
}: StudentSupportProps) {
  const [section, setSection] = useState(initialSection)
  const [studentFilter, setStudentFilter] = useState('all')
  const [goalStudentId, setGoalStudentId] = useState(students[0]?.id || '')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalCategory, setGoalCategory] = useState('Behavior')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalAssignedTo, setGoalAssignedTo] = useState('')
  const [goalReviewDate, setGoalReviewDate] = useState('')

  const [updateStudentId, setUpdateStudentId] = useState(students[0]?.id || '')
  const [updateGoalId, setUpdateGoalId] = useState('')
  const [updateType, setUpdateType] = useState('Positive progress')
  const [updateText, setUpdateText] = useState('')
  const [updateProgress, setUpdateProgress] = useState('Improving')
  const [updateMeasure, setUpdateMeasure] = useState('')
  const [parentFollowUp, setParentFollowUp] = useState(false)

  const currentStaffName = resolveActorName(userName, role)
  const currentStaffRole =
    role === 'admin'
      ? 'Administration'
      : role === 'teacher'
        ? 'Teacher'
        : role === 'therapist'
          ? 'Therapist'
          : 'Staff'

  const todayIso = () => new Date().toISOString().slice(0, 10)
  const timeLabel = () =>
    new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })

  const [goals, setGoals] = useState<GoalLike[]>(() => [
    {
      id: 'goal-davening-1',
      studentId: 22,
      title: 'Daven from Baruch She’amar through Yishtabach',
      category: 'Davening / Independence',
      description:
        'Build endurance and independence during Pesukei D’Zimra.',
      target:
        'Complete Baruch She’amar through Yishtabach with no more than two prompts.',
      nextTarget:
        'Begin adding the next section at the beginning of next week.',
      startingLevel:
        'Participates for about 8 minutes with several reminders.',
      currentLevel:
        'Completing most of the section with two prompts.',
      progressPercent: 68,
      status: 'Improving',
      createdBy: 'Rabbi Schults',
      createdByRole: 'Yeshiva Ketana Rebbe',
      assignedTo: 'Tuli',
      createdAt: '2026-06-12',
      reviewDate: '2026-06-22',
      archived: false
    },
    {
      id: 'goal-safe-hands-1',
      studentId: 7,
      title: 'Safe hands, body, and objects',
      category: 'Behavior / Emotional Regulation',
      description:
        'Reduce physical behavior and unsafe use of classroom objects.',
      target:
        'No throwing, pushing, hitting, or grabbing for five consecutive school days.',
      nextTarget:
        'Use words or request a break during difficult transitions.',
      startingLevel:
        'Physical behavior occurred during several difficult transitions.',
      currentLevel:
        'Needs reminders and staff support during transitions.',
      progressPercent: 35,
      status: 'Needs support',
      createdBy: 'Rabbi Klein',
      createdByRole: 'Teacher',
      assignedTo: 'Avrumi',
      createdAt: '2026-06-13',
      reviewDate: '2026-06-24',
      archived: false
    },
    {
      id: 'goal-classroom-1',
      studentId: 6,
      title: 'Remain in class during instruction',
      category: 'Classroom Participation',
      description:
        'Increase time participating in the classroom before taking a break.',
      target:
        'Remain in class for 45 of 60 instructional minutes.',
      nextTarget:
        'Return from one planned break without argument.',
      startingLevel: '25 minutes in class.',
      currentLevel: '38 minutes in class.',
      progressPercent: 72,
      status: 'Improving',
      createdBy: 'Rabbi Klein',
      createdByRole: 'Teacher',
      assignedTo: 'Ezriel',
      createdAt: '2026-06-10',
      reviewDate: '2026-06-25',
      archived: false
    },
    {
      id: 'goal-transition-1',
      studentId: 1,
      title: 'Smooth morning transition',
      category: 'Independence / Routine',
      description: 'Enter class, unpack, and begin morning work with fewer prompts.',
      target: 'Complete morning routine with no more than two prompts.',
      nextTarget: 'Start work within five minutes of arrival.',
      startingLevel: 'Needed frequent adult reminders.',
      currentLevel: 'Usually begins after two or three prompts.',
      progressPercent: 62,
      status: 'Improving',
      createdBy: 'Rabbi Schults',
      createdByRole: 'Yeshiva Ketana Rebbe',
      assignedTo: 'Ezriel',
      createdAt: '2026-06-12',
      reviewDate: '2026-06-27',
      archived: false
    },
    {
      id: 'goal-self-advocacy-1',
      studentId: 2,
      title: 'Ask for help before frustration builds',
      category: 'Self-Advocacy',
      description: 'Use a help card or ask staff before shutting down.',
      target: 'Ask for help in four of five observed situations.',
      nextTarget: 'Use the help card during independent work.',
      startingLevel: 'Often waited until frustration was high.',
      currentLevel: 'Asked for help twice this week.',
      progressPercent: 48,
      status: 'Steady',
      createdBy: 'Rabbi Klein',
      createdByRole: 'Teacher',
      assignedTo: 'Tuli',
      createdAt: '2026-06-12',
      reviewDate: '2026-06-28',
      archived: false
    },
    {
      id: 'goal-break-1',
      studentId: 4,
      title: 'Use planned break appropriately',
      category: 'Regulation',
      description: 'Take a short planned break and return without delay.',
      target: 'Return from break within seven minutes.',
      nextTarget: 'Return with one staff prompt.',
      startingLevel: 'Returned late from most breaks.',
      currentLevel: 'Returned on time three times this week.',
      progressPercent: 70,
      status: 'Improving',
      createdBy: 'Mrs. Bloom',
      createdByRole: 'BCBA',
      assignedTo: 'Avrumi',
      createdAt: '2026-06-13',
      reviewDate: '2026-06-29',
      archived: false
    },
    {
      id: 'goal-peer-1',
      studentId: 3,
      title: 'Use respectful words during peer disagreements',
      category: 'Social / Communication',
      description:
        'Practice calm language and appropriate responses with peers.',
      target:
        'Use an appropriate response in four of five observed situations.',
      nextTarget:
        'Use one taught phrase without adult prompting.',
      startingLevel:
        'Often needs an adult to redirect peer disagreements.',
      currentLevel:
        'Uses an appropriate phrase in about half of observed situations.',
      progressPercent: 55,
      status: 'Steady',
      createdBy: 'Shelly Wagschal',
      createdByRole: 'Social Counselor',
      assignedTo: 'Yechiel Feyershtien',
      createdAt: '2026-06-11',
      reviewDate: '2026-06-26',
      archived: false
    }
  ])

  const [supportUpdates, setSupportUpdates] = useState(() => [
    {
      id: 'update-physical-1',
      studentId: 7,
      goalId: 'goal-safe-hands-1',
      type: 'Incident',
      text:
        'Saw Yehuda being physical during transition. He threw a tissue box toward Avrumi. No injury. Staff redirected him, reviewed safe hands, and helped him calm down.',
      progress: 'Needs support',
      measure: '1 unsafe-object incident',
      parentFollowUp: false,
      author: 'Rabbi Klein',
      authorRole: 'Teacher',
      date: '2026-06-14',
      time: '11:28 AM'
    },
    {
      id: 'update-davening-1',
      studentId: 22,
      goalId: 'goal-davening-1',
      type: 'Positive progress',
      text:
        'Stayed engaged from Baruch She’amar through most of Yishtabach today. Needed two quiet prompts.',
      progress: 'Improving',
      measure: 'Completed about 85% of the section',
      parentFollowUp: false,
      author: 'Rabbi Schults',
      authorRole: 'Yeshiva Ketana Rebbe',
      date: '2026-06-14',
      time: '9:18 AM'
    },
    {
      id: 'update-davening-2',
      studentId: 22,
      goalId: 'goal-davening-1',
      type: 'Milestone reached',
      text:
        'Completed Baruch She’amar through Yishtabach with two prompts. He appears ready to add the next short section next week.',
      progress: 'Strong progress',
      measure: 'Full target section completed',
      parentFollowUp: false,
      author: 'Tuli',
      authorRole: 'BT',
      date: '2026-06-15',
      time: '9:22 AM'
    },
    {
      id: 'update-class-1',
      studentId: 6,
      goalId: 'goal-classroom-1',
      type: 'Positive progress',
      text:
        'Stayed in class for 41 minutes today and returned from his break without argument.',
      progress: 'Strong progress',
      measure: '41 of 60 minutes',
      parentFollowUp: false,
      author: 'Ezriel',
      authorRole: 'BT',
      date: '2026-06-15',
      time: '11:46 AM'
    },
    {
      id: 'update-transition-1',
      studentId: 1,
      goalId: 'goal-transition-1',
      type: 'Routine progress',
      text: 'Entered calmly, unpacked with one reminder, and began morning work before the second bell.',
      progress: 'Improving',
      measure: '1 prompt needed',
      parentFollowUp: false,
      author: 'Ezriel',
      authorRole: 'BT',
      date: '2026-06-15',
      time: '9:04 AM'
    },
    {
      id: 'update-help-1',
      studentId: 2,
      goalId: 'goal-self-advocacy-1',
      type: 'Skill practice',
      text: 'Used his help card during kriah instead of leaving the table. Staff praised him and helped him restart.',
      progress: 'Steady',
      measure: '1 successful help request',
      parentFollowUp: false,
      author: 'Rabbi Klein',
      authorRole: 'Teacher',
      date: '2026-06-15',
      time: '10:36 AM'
    },
    {
      id: 'update-break-1',
      studentId: 4,
      goalId: 'goal-break-1',
      type: 'Positive progress',
      text: 'Took a planned sensory break with Avrumi and returned to class after six minutes.',
      progress: 'Strong progress',
      measure: 'Returned in 6 minutes',
      parentFollowUp: false,
      author: 'Avrumi',
      authorRole: 'BT',
      date: '2026-06-15',
      time: '11:12 AM'
    },
    {
      id: 'update-peer-1',
      studentId: 3,
      goalId: 'goal-peer-1',
      type: 'General observation',
      text:
        'Used respectful words after becoming frustrated with a classmate. Needed one reminder to lower his voice.',
      progress: 'Improving',
      measure: '1 successful peer interaction',
      parentFollowUp: false,
      author: 'Yechiel Feyershtien',
      authorRole: 'Social Counselor',
      date: '2026-06-15',
      time: '12:08 PM'
    }
  ])

  const selectedStudentId =
    studentFilter === 'all' ? null : Number(studentFilter)

  const visibleGoals = goals.filter(
    goal =>
      !goal.archived &&
      (!selectedStudentId || goal.studentId === selectedStudentId)
  )

  const visibleUpdates = [...supportUpdates]
    .filter(
      update =>
        !selectedStudentId || update.studentId === selectedStudentId
    )
    .sort((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
    )

  const updateStudentGoals = goals.filter(
    goal =>
      !goal.archived &&
      Number(goal.studentId) === Number(updateStudentId)
  )

  const studentName = studentId =>
    students.find(student => student.id === Number(studentId))?.name ||
    'Unknown Student'

  const studentFor = studentId =>
    students.find(student => student.id === Number(studentId))

  const openStudentProgressFile = studentId => {
    setStudentFilter(String(studentId))
    setSection('goals')
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const addGoal = () => {
    if (!goalStudentId || !goalTitle.trim() || !goalTarget.trim()) return

    const newGoal = {
      id: `goal-${Date.now()}`,
      studentId: Number(goalStudentId),
      title: goalTitle.trim(),
      category: goalCategory,
      description: '',
      target: goalTarget.trim(),
      nextTarget: '',
      startingLevel: 'Starting level not yet entered.',
      currentLevel: 'New goal',
      progressPercent: 10,
      status: 'New',
      createdBy: currentStaffName,
      createdByRole: currentStaffRole,
      assignedTo: goalAssignedTo.trim() || currentStaffName,
      createdAt: todayIso(),
      reviewDate: goalReviewDate || '',
      archived: false
    }

    setGoals(previous => [newGoal, ...previous])
    setGoalTitle('')
    setGoalTarget('')
    setGoalAssignedTo('')
    setGoalReviewDate('')
    setStudentFilter(String(goalStudentId))
    setSection('goals')
  }

  const addProgressUpdate = () => {
    if (!updateStudentId || !updateText.trim()) return

    const newUpdate = {
      id: `support-update-${Date.now()}`,
      studentId: Number(updateStudentId),
      goalId: updateGoalId || null,
      type: updateType,
      text: updateText.trim(),
      progress: updateProgress,
      measure: updateMeasure.trim(),
      parentFollowUp,
      author: currentStaffName,
      authorRole: currentStaffRole,
      date: todayIso(),
      time: timeLabel()
    }

    setSupportUpdates(previous => [newUpdate, ...previous])

    if (updateGoalId) {
      setGoals(previous =>
        previous.map(goal => {
          if (goal.id !== updateGoalId) return goal

          const progressChange = {
            'Needs support': -5,
            'Limited progress': 2,
            Steady: 4,
            Improving: 8,
            'Strong progress': 12,
            'Goal met': 25
          }[updateProgress] || 3

          return {
            ...goal,
            status: updateProgress,
            currentLevel:
              updateMeasure.trim() || goal.currentLevel,
            progressPercent: Math.max(
              0,
              Math.min(100, goal.progressPercent + progressChange)
            )
          }
        })
      )
    }

    setUpdateText('')
    setUpdateMeasure('')
    setParentFollowUp(false)
    setStudentFilter(String(updateStudentId))
    setSection('overview')
  }

  const sectionButton = key => ({
    padding: '9px 13px',
    borderRadius: 10,
    border: `1px solid ${
      section === key ? '#7893ad' : '#d8dfe3'
    }`,
    background: section === key ? '#e9eef2' : '#fafaf8',
    color: section === key ? '#344e67' : '#617080',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800
  })

  const cardStyle = {
    background: '#fafaf8',
    border: '1px solid #dfe4e7',
    borderRadius: 15,
    padding: 18,
    boxShadow: '0 4px 13px rgba(41,52,64,0.05)'
  }

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: 16, padding: '21px 23px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{
              fontSize: 23,
              fontWeight: 900,
              color: '#34465a'
            }}>
              Student Support
            </div>

            <div style={{
              fontSize: 12,
              color: '#778493',
              marginTop: 4,
              maxWidth: 680
            }}>
              Student goals, progress, staff observations, behavior,
              alerts, and family follow-up in one place.
            </div>
          </div>

          <select
            value={studentFilter}
            onChange={event => setStudentFilter(event.target.value)}
            style={{
              minWidth: 240,
              padding: '9px 11px',
              borderRadius: 9,
              border: '1px solid #d8dfe3',
              fontSize: 12
            }}
          >
            <option value="all">All students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'flex',
          gap: 7,
          flexWrap: 'wrap',
          marginTop: 16
        }}>
          <button
            onClick={() => setSection('overview')}
            style={sectionButton('overview')}
          >
            Latest Updates
          </button>

          <button
            onClick={() => setSection('students')}
            style={sectionButton('students')}
          >
            Students
          </button>

          <button
            onClick={() => setSection('goals')}
            style={sectionButton('goals')}
          >
            Goals & Progress
          </button>

          <button
            onClick={() => setSection('add-update')}
            style={sectionButton('add-update')}
          >
            Add Observation
          </button>

          <button
            onClick={() => setSection('flags')}
            style={sectionButton('flags')}
          >
            Flags ({flags.filter(flag => !flag.completed && flag.endDate >= todayIso()).length})
          </button>

          <button
            onClick={() => setSection('sessions')}
            style={sectionButton('sessions')}
          >
            Support Sessions ({students.filter(student => ['therapy', 'with-bt'].includes(student.status)).length})
          </button>

          <button
            onClick={() => setPage('behavior')}
            style={sectionButton('behavior')}
          >
            Behavior & Points
          </button>

          <button
            onClick={() => setPage('alerts')}
            style={sectionButton('alerts')}
          >
            Alerts ({alerts.length})
          </button>

          <button
            onClick={() => setPage('calls')}
            style={sectionButton('calls')}
          >
            Parent Calls
          </button>
        </div>
      </div>

      {section === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 0.7fr',
          gap: 16,
          alignItems: 'start'
        }}>
          <div style={cardStyle}>
            <div style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#34465a',
              marginBottom: 13
            }}>
              Latest Student Updates
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {visibleUpdates.map(update => {
                const student = studentFor(update.studentId)
                const goal = goals.find(item => item.id === update.goalId)

                return (
                  <div
                    key={update.id}
                    onClick={() =>
                      student &&
                      openStudentProgressFile(student.id)
                    }
                    style={{
                      border: '1px solid #dfe4e7',
                      background: '#f7f8f8',
                      borderRadius: 12,
                      padding: '12px 13px',
                      cursor: student ? 'pointer' : 'default'
                    }}
                    title={
                      student
                        ? `Open ${student.name}'s progress file`
                        : ''
                    }
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: '#34465a'
                        }}>
                          {studentName(update.studentId)}
                        </div>

                        <div style={{
                          fontSize: 10.5,
                          color: '#778493',
                          marginTop: 3
                        }}>
                          {update.type}
                          {goal ? ` · ${goal.title}` : ''}
                        </div>
                      </div>

                      <div style={{
                        fontSize: 10.5,
                        color: '#778493',
                        textAlign: 'right'
                      }}>
                        <b>{update.author}</b> · {update.authorRole}
                        <br />
                        {update.date} · {update.time}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 12,
                      color: '#46576a',
                      lineHeight: 1.5,
                      marginTop: 9
                    }}>
                      {update.text}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: 7,
                      flexWrap: 'wrap',
                      marginTop: 9
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        background:
                          update.progress === 'Needs support'
                            ? '#f7ecef'
                            : '#edf3ee',
                        color:
                          update.progress === 'Needs support'
                            ? '#965468'
                            : '#587261',
                        fontSize: 10,
                        fontWeight: 800
                      }}>
                        {update.progress}
                      </span>

                      {update.measure && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: '#edf1f4',
                          color: '#617080',
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          {update.measure}
                        </span>
                      )}

                      {update.parentFollowUp && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: '#fff3df',
                          color: '#8a662e',
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          Parent follow-up
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{
                fontSize: 15,
                fontWeight: 900,
                color: '#34465a',
                marginBottom: 10
              }}>
                Support Snapshot
              </div>

              {[
                ['Active goals', visibleGoals.length],
                [
                  'Improving',
                  visibleGoals.filter(goal =>
                    ['Improving', 'Strong progress'].includes(goal.status)
                  ).length
                ],
                [
                  'Needs support',
                  visibleGoals.filter(
                    goal => goal.status === 'Needs support'
                  ).length
                ],
                ['Recent updates', visibleUpdates.length]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: '1px solid #e6e9eb',
                    fontSize: 12
                  }}>
                  <span style={{ color: '#6f7d8c' }}>{label}</span>
                  <b style={{ color: '#34465a' }}>{value}</b>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{
                fontSize: 15,
                fontWeight: 900,
                color: '#34465a',
                marginBottom: 10
              }}>
                Quick Actions
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  onClick={() => setSection('add-update')}
                  style={{ ...S.btn('primary'), width: '100%' }}
                >
                  Add Student Observation
                </button>

                <button
                  onClick={() => setSection('goals')}
                  style={{ ...S.btn('ghost'), width: '100%' }}
                >
                  Create or Review Goals
                </button>

                <button
                  onClick={() => setPage('alerts')}
                  style={{ ...S.btn('ghost'), width: '100%' }}
                >
                  Open Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'students' && (
        <div style={cardStyle}>
          <div style={{
            fontSize: 17,
            fontWeight: 900,
            color: '#34465a',
            marginBottom: 13
          }}>
            Students
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10
          }}>
            {students
              .filter(
                student =>
                  !selectedStudentId ||
                  student.id === selectedStudentId
              )
              .map((student, index) => {
                const studentGoals = goals.filter(
                  goal =>
                    goal.studentId === student.id &&
                    !goal.archived
                )

                const recentUpdate = visibleUpdates.find(
                  update => update.studentId === student.id
                )

                return (
                  <button
                    key={student.id}
                    onClick={() =>
                      openStudentProgressFile(student.id)
                    }
                    style={{
                      textAlign: 'left',
                      border: '1px solid #dfe4e7',
                      background: '#f7f8f8',
                      borderRadius: 12,
                      padding: 13,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={S.avatar(index, 34)}>
                        {initials(student.name)}
                      </div>

                      <div>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: '#34465a'
                        }}>
                          {student.name}
                        </div>

                        <div style={{
                          fontSize: 10.5,
                          color: '#778493',
                          marginTop: 2
                        }}>
                          {studentGoals.length} active goal
                          {studentGoals.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: 10.5,
                      color: '#687789',
                      lineHeight: 1.45,
                      marginTop: 9,
                      minHeight: 30
                    }}>
                      {recentUpdate
                        ? recentUpdate.text
                        : 'No recent support update.'}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {section === 'goals' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.75fr 1.25fr',
          gap: 16,
          alignItems: 'start'
        }}>
          <div style={cardStyle}>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#34465a',
              marginBottom: 12
            }}>
              Create Goal
            </div>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Student
            </label>

            <select
              value={goalStudentId}
              onChange={event => setGoalStudentId(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Goal
            </label>

            <input
              value={goalTitle}
              onChange={event => setGoalTitle(event.target.value)}
              placeholder="Example: Use safe hands during transitions"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
              spellCheck
              lang="en"
            />

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Category
            </label>

            <select
              value={goalCategory}
              onChange={event => setGoalCategory(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              <option>Behavior</option>
              <option>Davening / Independence</option>
              <option>Social / Communication</option>
              <option>Academic</option>
              <option>Attendance</option>
              <option>Classroom Participation</option>
              <option>Emotional Regulation</option>
              <option>Transitions</option>
              <option>Personal Care</option>
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Target
            </label>

            <textarea
              value={goalTarget}
              onChange={event => setGoalTarget(event.target.value)}
              placeholder="What should the student be able to do?"
              rows={3}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10,
                resize: 'vertical'
              }}
              spellCheck
              lang="en"
            />

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Assigned staff
            </label>

            <input
              value={goalAssignedTo}
              onChange={event => setGoalAssignedTo(event.target.value)}
              placeholder="Example: Avrumi"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
              spellCheck
              lang="en"
            />

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Review date
            </label>

            <input
              type="date"
              value={goalReviewDate}
              onChange={event => setGoalReviewDate(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 12
              }}
            />

            <button onClick={addGoal} style={S.btn('primary')}>
              Create Goal
            </button>

            <div style={{
              fontSize: 10.5,
              color: '#778493',
              marginTop: 10
            }}>
              Created by will automatically show {currentStaffName}.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {visibleGoals.map(goal => {
              const goalUpdates = supportUpdates
                .filter(update => update.goalId === goal.id)
                .sort((a, b) =>
                  `${b.date} ${b.time}`.localeCompare(
                    `${a.date} ${a.time}`
                  )
                )

              return (
                <div key={goal.id} style={cardStyle}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 14,
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: '#34465a'
                      }}>
                        {studentName(goal.studentId)}
                      </div>

                      <div style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#46576a',
                        marginTop: 3
                      }}>
                        {goal.title}
                      </div>

                      <div style={{
                        fontSize: 10.5,
                        color: '#778493',
                        marginTop: 4
                      }}>
                        Created by {goal.createdBy} · {goal.createdByRole}
                        {' · '}
                        Assigned to {goal.assignedTo}
                      </div>
                    </div>

                    <span style={{
                      alignSelf: 'flex-start',
                      padding: '5px 9px',
                      borderRadius: 999,
                      background:
                        goal.status === 'Needs support'
                          ? '#f7ecef'
                          : '#edf3ee',
                      color:
                        goal.status === 'Needs support'
                          ? '#965468'
                          : '#587261',
                      fontSize: 10,
                      fontWeight: 900
                    }}>
                      {goal.status}
                    </span>
                  </div>

                  <div style={{
                    height: 7,
                    borderRadius: 999,
                    background: '#e4e8ea',
                    overflow: 'hidden',
                    marginTop: 13
                  }}>
                    <div style={{
                      width: `${goal.progressPercent}%`,
                      height: '100%',
                      borderRadius: 999,
                      background:
                        goal.status === 'Needs support'
                          ? '#ad7080'
                          : '#708d78'
                    }} />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    color: '#778493',
                    marginTop: 5
                  }}>
                    <span>{goal.currentLevel}</span>
                    <b>{goal.progressPercent}%</b>
                  </div>

                  <div style={{
                    marginTop: 12,
                    padding: 11,
                    borderRadius: 10,
                    background: '#f3f5f6',
                    fontSize: 11.5,
                    color: '#526274',
                    lineHeight: 1.5
                  }}>
                    <b>Target:</b> {goal.target}
                    {goal.nextTarget && (
                      <>
                        <br />
                        <b>Next:</b> {goal.nextTarget}
                      </>
                    )}
                  </div>

                  <div style={{
                    marginTop: 12,
                    fontSize: 11,
                    fontWeight: 900,
                    color: '#526274'
                  }}>
                    Progress history
                  </div>

                  {goalUpdates.length === 0 && (
                    <div style={{
                      fontSize: 11,
                      color: '#778493',
                      marginTop: 7
                    }}>
                      No progress entries yet.
                    </div>
                  )}

                  {goalUpdates.slice(0, 5).map(update => (
                    <div
                      key={update.id}
                      style={{
                        padding: '9px 0',
                        borderBottom: '1px solid #e6e9eb'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: 10.5
                      }}>
                        <b style={{ color: '#46576a' }}>
                          {update.author} · {update.authorRole}
                        </b>

                        <span style={{ color: '#778493' }}>
                          {update.date} · {update.time}
                        </span>
                      </div>

                      <div style={{
                        fontSize: 11.5,
                        color: '#526274',
                        lineHeight: 1.45,
                        marginTop: 4
                      }}>
                        {update.text}
                      </div>
                    </div>
                  ))}

                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => {
                        setUpdateStudentId(goal.studentId)
                        setUpdateGoalId(goal.id)
                        setSection('add-update')
                      }}
                      style={S.btn('primary')}
                    >
                      Add Progress
                    </button>

                    <button
                      onClick={() =>
                        setGoals(previous =>
                          previous.map(item =>
                            item.id === goal.id
                              ? {
                                  ...item,
                                  status: 'Goal met',
                                  progressPercent: 100
                                }
                              : item
                          )
                        )
                      }
                      style={S.btn('success')}
                    >
                      Mark Goal Met
                    </button>

                    <button
                      onClick={() =>
                        setGoals(previous =>
                          previous.map(item =>
                            item.id === goal.id
                              ? { ...item, archived: true }
                              : item
                          )
                        )
                      }
                      style={S.btn('ghost')}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {section === 'add-update' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.85fr 1.15fr',
          gap: 16,
          alignItems: 'start'
        }}>
          <div style={cardStyle}>
            <div style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#34465a',
              marginBottom: 5
            }}>
              Add Student Observation
            </div>

            <div style={{
              fontSize: 11,
              color: '#778493',
              marginBottom: 13
            }}>
              Automatically recorded as {currentStaffName} · {currentStaffRole}
            </div>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Student
            </label>

            <select
              value={updateStudentId}
              onChange={event => {
                setUpdateStudentId(event.target.value)
                setUpdateGoalId('')
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Connect to goal
            </label>

            <select
              value={updateGoalId}
              onChange={event => setUpdateGoalId(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              <option value="">General student note</option>
              {updateStudentGoals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Update type
            </label>

            <select
              value={updateType}
              onChange={event => setUpdateType(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              <option>Positive progress</option>
              <option>General observation</option>
              <option>Concern</option>
              <option>Incident</option>
              <option>Milestone reached</option>
              <option>Goal changed</option>
              <option>Goal completed</option>
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              What did you observe?
            </label>

            <textarea
              value={updateText}
              onChange={event => setUpdateText(event.target.value)}
              placeholder="Example: I noticed him doing much better today..."
              rows={5}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10,
                resize: 'vertical'
              }}
              spellCheck
              lang="en"
            />

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Progress
            </label>

            <select
              value={updateProgress}
              onChange={event => setUpdateProgress(event.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            >
              <option>Needs support</option>
              <option>Limited progress</option>
              <option>Steady</option>
              <option>Improving</option>
              <option>Strong progress</option>
              <option>Goal met</option>
            </select>

            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#6f7d8c',
              marginBottom: 5
            }}>
              Measurement or result
            </label>

            <input
              value={updateMeasure}
              onChange={event => setUpdateMeasure(event.target.value)}
              placeholder="Example: 41 of 60 minutes"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 10px',
                borderRadius: 9,
                border: '1px solid #d8dfe3',
                marginBottom: 10
              }}
            />

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 800,
              color: '#526274',
              marginBottom: 13
            }}>
              <input
                type="checkbox"
                checked={parentFollowUp}
                onChange={event =>
                  setParentFollowUp(event.target.checked)
                }
              />
              Parent follow-up is needed
            </label>

            <button
              onClick={addProgressUpdate}
              style={S.btn('primary')}
            >
              Save Observation
            </button>
          </div>

          <div style={cardStyle}>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#34465a',
              marginBottom: 10
            }}>
              Recent Entries for {studentName(updateStudentId)}
            </div>

            {supportUpdates
              .filter(
                update =>
                  update.studentId === Number(updateStudentId)
              )
              .slice(0, 8)
              .map(update => (
                <div
                  key={update.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #e6e9eb'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 10.5
                  }}>
                    <b style={{ color: '#46576a' }}>
                      {update.author} · {update.authorRole}
                    </b>

                    <span style={{ color: '#778493' }}>
                      {update.date} · {update.time}
                    </span>
                  </div>

                  <div style={{
                    fontSize: 11.5,
                    color: '#526274',
                    lineHeight: 1.45,
                    marginTop: 5
                  }}>
                    {update.text}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {section === 'sessions' && (
        <SupportSessions
          students={students}
          setStudents={setStudents}
          staff={staff}
        />
      )}

      {section === 'flags' && (
        <FlagsPanel
          students={students}
          flags={flags}
          setFlags={setFlags}
          currentStaffName={currentStaffName}
        />
      )}

    </div>
  )
}
