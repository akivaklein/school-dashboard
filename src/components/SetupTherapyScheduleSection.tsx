export default function SetupTherapyScheduleSection({
  setupTherapySchedule,
  setSetupTherapySchedule,
  students,
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
  S,
}) {
  return (
                    <div>
                      {(() => {
                        const scheduleRows = setupTherapySchedule
                          .map(row => ({
                            ...row,
                            student: students.find(
                              student => student.id === row.studentId
                            )
                          }))
                          .filter(row => row.student)

                        const getTimeOfDay = time => {
                          const match = normalized.match(/(\d+):(\d+)\s*(AM|PM)/)
                          if (!match) return 'Other'

                          let hour = Number(match[1])
                          const meridiem = match[3]

                          if (meridiem === 'PM' && hour !== 12) hour += 12
                          if (meridiem === 'AM' && hour === 12) hour = 0

                          if (hour < 10) return 'Early Morning'
                          if (hour < 12) return 'Late Morning'
                          if (hour < 14) return 'Midday'
                          return 'Afternoon'
                        }

                        const rowHasConflict = row =>
                          scheduleRows.some(other =>
                            other.id !== row.id &&
                            other.day === row.day &&
                            other.time === row.time &&
                            (
                              other.studentId === row.studentId ||
                              other.therapistName === row.therapistName
                            )
                          )

                        const filteredRows = scheduleRows.filter(row =>
                          setupTherapyFilters.every(filter => {
                            const wanted = String(filter.value)

                            if (filter.field === 'day') {
                              return row.day === wanted
                            }

                            if (filter.field === 'time') {
                              return row.time === wanted
                            }

                            if (filter.field === 'timeOfDay') {
                              return getTimeOfDay(row.time) === wanted
                            }

                            if (filter.field === 'student') {
                              return String(row.studentId) === wanted
                            }

                            if (filter.field === 'staff') {
                              return row.therapistName === wanted
                            }

                            if (filter.field === 'staffType') {
                              return row.staffType === wanted
                            }

                            if (filter.field === 'service') {
                              return row.service === wanted
                            }

                            if (filter.field === 'teacher') {
                              return row.teacherName === wanted
                            }

                            if (filter.field === 'class') {
                              return row.classId === wanted
                            }

                            if (filter.field === 'division') {
                              return row.division === wanted
                            }

                            if (filter.field === 'duration') {
                              return String(row.duration) === wanted
                            }

                            if (filter.field === 'conflict') {
                              return wanted === 'yes'
                                ? rowHasConflict(row)
                                : !rowHasConflict(row)
                            }

                            return true
                          })
                        )

                        const therapyTimeToMinutes = value => {
                          const match = String(value || '')
                            .trim()
                            .match(/^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i)

                          if (!match) return 9999

                          let hour = Number(match[1])
                          const minute = Number(match[2])
                          const period = match[3].toUpperCase()

                          if (period === 'PM' && hour !== 12) hour += 12
                          if (period === 'AM' && hour === 12) hour = 0

                          return hour * 60 + minute
                        }

                        const therapyEndMinutes = row =>
                          therapyTimeToMinutes(row.time) +
                          Number(row.duration || 30)

                        const therapyEndLabel = row => {
                          const total = therapyEndMinutes(row)

                          if (!Number.isFinite(total) || total >= 9999) {
                            return ''
                          }

                          let hour = Math.floor(total / 60)
                          const minute = total % 60
                          const period = hour >= 12 ? 'PM' : 'AM'

                          hour %= 12
                          if (hour === 0) hour = 12

                          return `${hour}:${String(minute).padStart(2, '0')} ${period}`
                        }

                        const dayOrder = {
                          Monday: 1,
                          Tuesday: 2,
                          Wednesday: 3,
                          Thursday: 4
                        }

                        const conflictWarnings = []
                        const conflictKeys = new Set()

                        const addConflict = (key, warning) => {
                          if (conflictKeys.has(key)) return
                          conflictKeys.add(key)
                          conflictWarnings.push(warning)
                        }

                        scheduleRows.forEach((row, index) => {
                          scheduleRows.slice(index + 1).forEach(other => {
                            if (row.day !== other.day) return

                            const rowStart = therapyTimeToMinutes(row.time)
                            const rowEnd = therapyEndMinutes(row)
                            const otherStart =
                              therapyTimeToMinutes(other.time)
                            const otherEnd = therapyEndMinutes(other)

                            const overlaps =
                              rowStart < otherEnd &&
                              otherStart < rowEnd

                            if (overlaps) {
                              if (
                                row.studentId === other.studentId
                              ) {
                                const key = [
                                  'student-overlap',
                                  row.day,
                                  row.studentId,
                                  Math.min(rowStart, otherStart),
                                  Math.max(rowEnd, otherEnd)
                                ].join('|')

                                addConflict(key, {
                                  type: 'student',
                                  text:
                                    `${row.student.name} is with ` +
                                    `${row.therapistName} from ${row.time}–${therapyEndLabel(row)}, ` +
                                    `but also has ${other.service} with ` +
                                    `${other.therapistName} from ${other.time}–${therapyEndLabel(other)}.`
                                })
                              }

                              if (
                                row.therapistName ===
                                other.therapistName &&
                                row.studentId !== other.studentId
                              ) {
                                const key = [
                                  'staff-overlap',
                                  row.day,
                                  row.therapistName,
                                  Math.min(rowStart, otherStart),
                                  Math.max(rowEnd, otherEnd)
                                ].join('|')

                                addConflict(key, {
                                  type: 'therapist',
                                  text:
                                    `${row.therapistName} is double-booked with ` +
                                    `${row.student.name} and ${other.student.name} ` +
                                    `on ${row.day} between ` +
                                    `${rowStart <= otherStart ? row.time : other.time} and ` +
                                    `${rowEnd >= otherEnd ? therapyEndLabel(row) : therapyEndLabel(other)}.`
                                })
                              }
                            }

                            if (
                              row.studentId === other.studentId &&
                              (
                                Math.abs(rowEnd - otherStart) <= 5 ||
                                Math.abs(otherEnd - rowStart) <= 5
                              )
                            ) {
                              const first =
                                rowStart <= otherStart ? row : other
                              const second =
                                rowStart <= otherStart ? other : row
                              const totalAway =
                                therapyEndMinutes(second) -
                                therapyTimeToMinutes(first.time)

                              const key = [
                                'back-to-back',
                                row.day,
                                row.studentId,
                                therapyTimeToMinutes(first.time)
                              ].join('|')

                              addConflict(key, {
                                type: 'back-to-back',
                                text:
                                  `${row.student.name} has back-to-back sessions: ` +
                                  `${first.service} with ${first.therapistName}, then ` +
                                  `${second.service} with ${second.therapistName}. ` +
                                  `He may be out of class for about ${totalAway} minutes ` +
                                  `and miss ${first.missedSubject || first.className} and ` +
                                  `${second.missedSubject || second.className}.`
                              })
                            }
                          })
                        })

                        const sortedRows = [...filteredRows].sort((a, b) => {
                          const dayDifference =
                            (dayOrder[a.day] || 99) -
                            (dayOrder[b.day] || 99)

                          if (dayDifference !== 0) return dayDifference

                          const timeDifference =
                            therapyTimeToMinutes(a.time) -
                            therapyTimeToMinutes(b.time)

                          if (timeDifference !== 0) return timeDifference

                          return String(a.student?.name || '')
                            .localeCompare(
                              String(b.student?.name || '')
                            )
                        })

                        const updateScheduleRow = (id, changes) => {
                          setSetupTherapySchedule(previous =>
                            previous.map(row =>
                              row.id === id
                                ? { ...row, ...changes }
                                : row
                            )
                          )
                        }

                        const addTherapyAppointment = () => {
                          const firstStudent = students[0]
                          const firstTherapist = THERAPIST_OPTIONS[0]

                          if (!firstStudent || !firstTherapist) return

                          setSetupTherapySchedule(previous => [
                            ...previous,
                            {
                              id: `therapy-slot-${Date.now()}`,
                              studentId: firstStudent.id,
                              therapistName: firstTherapist.name,
                              staffType: firstTherapist.specialty || 'Therapist',
                              day: 'Monday',
                              time: '9:15 AM',
                              duration: 30,
                              service: 'Weekly Check-In',
                              frequency: 'Weekly',
                              location: 'Therapy Room A',
                              teacherName:
                                CLASSES.find(
                                  cls =>
                                    cls.id ===
                                    STUDENT_CLASSES[firstStudent.id]
                                )?.teacher || 'Unassigned Teacher',
                              classId:
                                STUDENT_CLASSES[firstStudent.id] || '',
                              className:
                                CLASSES.find(
                                  cls =>
                                    cls.id ===
                                    STUDENT_CLASSES[firstStudent.id]
                                )?.name || 'Unassigned Class',
                              division:
                                CLASS_DIVISION[
                                  STUDENT_CLASSES[firstStudent.id]
                                ] || 'mesivta',
                              note: ''
                            }
                          ])
                        }

                        const uniqueValues = values =>
                          [...new Set(values.filter(Boolean))].sort()

                        const therapyFilterFields = [
                          { value: 'day', label: 'Day' },
                          { value: 'timeOfDay', label: 'Time of Day' },
                          { value: 'time', label: 'Exact Time' },
                          { value: 'student', label: 'Student' },
                          { value: 'staff', label: 'Staff Member' },
                          { value: 'staffType', label: 'Staff Type' },
                          { value: 'service', label: 'Service' },
                          { value: 'teacher', label: 'Teacher' },
                          { value: 'class', label: 'Class' },
                          { value: 'division', label: 'Division' },
                          { value: 'duration', label: 'Duration' },
                          { value: 'conflict', label: 'Conflict Status' }
                        ]

                        const valuesForFilter = field => {
                          if (field === 'day') {
                            return [
                              ['Monday', 'Monday'],
                              ['Tuesday', 'Tuesday'],
                              ['Wednesday', 'Wednesday'],
                              ['Thursday', 'Thursday'],
                              ['Friday', 'Friday']
                            ]
                          }

                          if (field === 'timeOfDay') {
                            return [
                              ['Early Morning', 'Early Morning'],
                              ['Late Morning', 'Late Morning'],
                              ['Midday', 'Midday'],
                              ['Afternoon', 'Afternoon']
                            ]
                          }

                          if (field === 'time') {
                            return uniqueValues(
                              scheduleRows.map(row => row.time)
                            ).map(value => [value, value])
                          }

                          if (field === 'student') {
                            return students.map(student => [
                              String(student.id),
                              student.name
                            ])
                          }

                          if (field === 'staff') {
                            return uniqueValues(
                              scheduleRows.map(row => row.therapistName)
                            ).map(value => [value, value])
                          }

                          if (field === 'staffType') {
                            return uniqueValues(
                              scheduleRows.map(row => row.staffType)
                            ).map(value => [value, value])
                          }

                          if (field === 'service') {
                            return uniqueValues(
                              scheduleRows.map(row => row.service)
                            ).map(value => [value, value])
                          }

                          if (field === 'teacher') {
                            return uniqueValues(
                              scheduleRows.map(row => row.teacherName)
                            ).map(value => [value, value])
                          }

                          if (field === 'class') {
                            return CLASSES.map(cls => [
                              cls.id,
                              cls.name
                            ])
                          }

                          if (field === 'division') {
                            return [
                              ['mesivta', 'Mesivta'],
                              ['yeshiva_ketana', 'Yeshiva Ketana']
                            ]
                          }

                          if (field === 'duration') {
                            return [
                              ['30', '30 minutes'],
                              ['45', '45 minutes'],
                              ['60', '60 minutes']
                            ]
                          }

                          if (field === 'conflict') {
                            return [
                              ['yes', 'Conflicts only'],
                              ['no', 'No conflicts']
                            ]
                          }

                          return []
                        }

                        const staffChoicesForRow = row => {
                          const staffType =
                            String(row.staffType || '').toLowerCase()
                          const service =
                            String(row.service || '').toLowerCase()

                          if (
                            staffType.includes('speech') ||
                            service.includes('speech')
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person => person.name === 'Yitzi Liebowitz'
                            )
                          }

                          if (
                            staffType === 'ot' ||
                            service === 'ot'
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person => person.name === 'Tzvi Malks'
                            )
                          }

                          if (
                            staffType === 'pt' ||
                            service === 'pt'
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person => person.name === 'Aryeh Schechter'
                            )
                          }

                          if (
                            staffType.includes('social') ||
                            service.includes('social')
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person =>
                                person.staffType === 'Social Counseling'
                            )
                          }

                          if (
                            staffType === 'bcba' ||
                            service.includes('bcba')
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person => person.staffType === 'BCBA'
                            )
                          }

                          if (
                            staffType === 'bt' ||
                            service.includes('bt')
                          ) {
                            return SUPPORT_STAFF_OPTIONS.filter(
                              person => person.staffType === 'BT'
                            )
                          }

                          return SUPPORT_STAFF_OPTIONS
                        }

                        const tomorrowDay = 'Wednesday'

                        const schoolDayBlocks = [
                          {
                            key: 'breakfast',
                            label: 'Breakfast / Before First Period',
                            timeLabel: 'Before 10:10 AM',
                            start: 0,
                            end: 610,
                            instructional: false,
                            teacher: 'Breakfast Staff'
                          },
                          {
                            key: 'period-1',
                            label: 'Morning Period 1',
                            timeLabel: '10:10–11:10 AM',
                            start: 610,
                            end: 670,
                            instructional: true,
                            teacher: 'class-teacher'
                          },
                          {
                            key: 'break-1',
                            label: 'Morning Break',
                            timeLabel: '11:10–11:20 AM',
                            start: 670,
                            end: 680,
                            instructional: false,
                            teacher: 'Break Staff'
                          },
                          {
                            key: 'period-2',
                            label: 'Morning Period 2',
                            timeLabel: '11:20 AM–12:05 PM',
                            start: 680,
                            end: 725,
                            instructional: true,
                            teacher: 'class-teacher'
                          },
                          {
                            key: 'break-2',
                            label: 'Morning Break',
                            timeLabel: '12:05–12:15 PM',
                            start: 725,
                            end: 735,
                            instructional: false,
                            teacher: 'Break Staff'
                          },
                          {
                            key: 'period-3',
                            label: 'Morning Period 3',
                            timeLabel: '12:15–12:45 PM',
                            start: 735,
                            end: 765,
                            instructional: true,
                            teacher: 'class-teacher'
                          },
                          {
                            key: 'lunch',
                            label: 'Lunch & Recess',
                            timeLabel: '12:45–1:45 PM',
                            start: 765,
                            end: 825,
                            instructional: false,
                            teacher: 'Lunch / Recess Staff'
                          },
                          {
                            key: 'english-math',
                            label: 'English / Math',
                            timeLabel: '1:45–2:25 PM',
                            start: 825,
                            end: 865,
                            instructional: true,
                            teacher: 'Rabbi Altshull'
                          },
                          {
                            key: 'break-3',
                            label: 'Afternoon Break',
                            timeLabel: '2:25–2:30 PM',
                            start: 865,
                            end: 870,
                            instructional: false,
                            teacher: 'Break Staff'
                          },
                          {
                            key: 'reading',
                            label: 'Reading',
                            timeLabel: '2:30–3:10 PM',
                            start: 870,
                            end: 910,
                            instructional: true,
                            teacher: 'Reading Teacher'
                          },
                          {
                            key: 'break-4',
                            label: 'Afternoon Break',
                            timeLabel: '3:10–3:15 PM',
                            start: 910,
                            end: 915,
                            instructional: false,
                            teacher: 'Break Staff'
                          },
                          {
                            key: 'writing-science',
                            label: 'Writing / Science',
                            timeLabel: '3:15–3:45 PM',
                            start: 915,
                            end: 945,
                            instructional: true,
                            teacher: 'Writing / Science Teacher'
                          }
                        ]

                        const tomorrowRows = sortedRows
                          .filter(row => row.day === tomorrowDay)
                          .sort(
                            (a, b) =>
                              therapyTimeToMinutes(a.time) -
                              therapyTimeToMinutes(b.time)
                          )

                        const tomorrowCoverage = []

                        schoolDayBlocks.forEach(block => {
                          const rowsInBlock = tomorrowRows.filter(row => {
                            const start =
                              therapyTimeToMinutes(row.time)
                            const end = therapyEndMinutes(row)

                            return start < block.end && end > block.start
                          })

                          if (rowsInBlock.length === 0) return

                          if (!block.instructional) {
                            const uniqueStudents =
                              new Set(
                                rowsInBlock.map(row => row.studentId)
                              )

                            tomorrowCoverage.push({
                              key: block.key,
                              block,
                              classId: '',
                              className: 'School-Wide',
                              teacher: block.teacher,
                              classSize: students.length,
                              outCount: uniqueStudents.size,
                              rows: rowsInBlock
                            })

                            return
                          }

                          const rowsByClass = rowsInBlock.reduce(
                            (groups, row) => {
                              const classId =
                                row.classId ||
                                STUDENT_CLASSES[row.studentId] ||
                                'unassigned'

                              if (!groups[classId]) {
                                groups[classId] = []
                              }

                              groups[classId].push(row)
                              return groups
                            },
                            {}
                          )

                          Object.entries(rowsByClass).forEach(
                            ([classId, classRows]) => {
                              const classInfo =
                                CLASSES.find(
                                  cls => cls.id === classId
                                )

                              const classStudents =
                                students.filter(
                                  student =>
                                    STUDENT_CLASSES[student.id] ===
                                    classId
                                )

                              const uniqueStudents =
                                new Set(
                                  classRows.map(row => row.studentId)
                                )

                              tomorrowCoverage.push({
                                key:
                                  `${block.key}-${classId}`,
                                block,
                                classId,
                                className:
                                  classInfo?.name ||
                                  classRows[0]?.className ||
                                  'Unassigned Class',
                                teacher:
                                  block.teacher === 'class-teacher'
                                    ? (
                                        classInfo?.teacher ||
                                        classRows[0]?.teacherName ||
                                        'Assigned Teacher'
                                      )
                                    : block.teacher,
                                classSize: classStudents.length,
                                outCount: uniqueStudents.size,
                                rows: [...classRows].sort(
                                  (a, b) =>
                                    therapyTimeToMinutes(a.time) -
                                    therapyTimeToMinutes(b.time)
                                )
                              })
                            }
                          )
                        })

                        const therapistGroups = SUPPORT_STAFF_OPTIONS.map(
                          therapist => ({
                            therapist,
                            rows: sortedRows
                              .filter(
                                row =>
                                  row.therapistName === therapist.name
                              )
                              .sort((a, b) => {
                                const dayDifference =
                                  (dayOrder[a.day] || 99) -
                                  (dayOrder[b.day] || 99)

                                if (dayDifference !== 0) {
                                  return dayDifference
                                }

                                return (
                                  therapyTimeToMinutes(a.time) -
                                  therapyTimeToMinutes(b.time)
                                )
                              })
                          })
                        ).filter(group => group.rows.length > 0)

                        const studentGroups = students
                          .map(student => ({
                            student,
                            rows: sortedRows.filter(
                              row => row.studentId === student.id
                            )
                          }))
                          .filter(group => group.rows.length > 0)

                        const timeGroups = Object.entries(
                          sortedRows.reduce((groups, row) => {
                            const key = `${row.day}|${row.time}`

                            if (!groups[key]) {
                              groups[key] = {
                                day: row.day,
                                time: row.time,
                                rows: []
                              }
                            }

                            groups[key].rows.push(row)
                            return groups
                          }, {})
                        )
                          .map(([, group]) => group)
                          .sort((a, b) => {
                            const dayDifference =
                              (dayOrder[a.day] || 99) -
                              (dayOrder[b.day] || 99)

                            if (dayDifference !== 0) return dayDifference
                            return a.time.localeCompare(b.time)
                          })

                        return (
                          <>
                            <div style={{
                              ...S.card,
                              marginBottom: 16,
                              padding: '18px 20px'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                                flexWrap: 'wrap'
                              }}>
                                <div>
                                  <div style={{
                                    fontSize: 18,
                                    fontWeight: 900,
                                    color: '#223046'
                                  }}>
                                    Therapy & BCBA Schedule
                                  </div>

                                  <div style={{
                                    fontSize: 12,
                                    color: '#718096',
                                    marginTop: 4
                                  }}>
                                    See when each boy leaves class and each
                                    therapist’s weekly schedule.
                                  </div>
                                </div>

                                <div style={{
                                  display: 'flex',
                                  gap: 7,
                                  flexWrap: 'wrap'
                                }}>
                                  <button
                                    onClick={() =>
                                      setSetupTherapyView('therapist')
                                    }
                                    style={
                                      setupTherapyView === 'therapist'
                                        ? S.btn('primary')
                                        : S.btn('ghost')
                                    }
                                  >
                                    By Therapist
                                  </button>

                                  <button
                                    onClick={() =>
                                      setSetupTherapyView('student')
                                    }
                                    style={
                                      setupTherapyView === 'student'
                                        ? S.btn('primary')
                                        : S.btn('ghost')
                                    }
                                  >
                                    By Student
                                  </button>

                                  <button
                                    onClick={() =>
                                      setSetupTherapyView('time')
                                    }
                                    style={
                                      setupTherapyView === 'time'
                                        ? S.btn('primary')
                                        : S.btn('ghost')
                                    }
                                  >
                                    By Time of Day
                                  </button>

                                  <button
                                    onClick={addTherapyAppointment}
                                    style={S.btn('ghost')}
                                  >
                                    + Appointment
                                  </button>

                                  <button
                                    onClick={() =>
                                      setSetupTherapySchedule(
                                        createFakeTherapySchedule()
                                      )
                                    }
                                    style={S.btn('primary')}
                                  >
                                    Generate Demo Schedule
                                  </button>
                                </div>
                              </div>

                              <div style={{
                                marginTop: 15,
                                paddingTop: 14,
                                borderTop: '1px solid #e3e7e9'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                  marginBottom:
                                    setupTherapyFilters.length > 0
                                      ? 10
                                      : 0
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flexWrap: 'wrap'
                                  }}>
                                    <button
                                      onClick={addSetupTherapyFilter}
                                      style={S.btn('ghost')}
                                    >
                                      + Add Filter
                                    </button>

                                    {setupTherapyFilters.length > 0 && (
                                      <button
                                        onClick={() =>
                                          setSetupTherapyFilters([])
                                        }
                                        style={{
                                          ...S.btn('ghost'),
                                          color: '#8a5160'
                                        }}
                                      >
                                        Clear All
                                      </button>
                                    )}

                                    <div style={{
                                      padding: '8px 11px',
                                      borderRadius: 9,
                                      background: '#f1f3f4',
                                      border: '1px solid #d8dfe3',
                                      color: '#5d6e82',
                                      fontSize: 11,
                                      fontWeight: 800
                                    }}>
                                      {filteredRows.length} of{' '}
                                      {scheduleRows.length} appointments
                                    </div>
                                  </div>

                                  <div style={{
                                    fontSize: 10.5,
                                    color: '#778493'
                                  }}>
                                    All filters are combined
                                  </div>
                                </div>

                                {setupTherapyFilters.length > 0 && (
                                  <div style={{
                                    display: 'grid',
                                    gap: 8
                                  }}>
                                    {setupTherapyFilters.map(
                                      (filter, index) => {
                                        const options =
                                          valuesForFilter(filter.field)

                                        return (
                                          <div
                                            key={filter.id}
                                            style={{
                                              display: 'grid',
                                              gridTemplateColumns:
                                                '46px minmax(150px, 0.7fr) minmax(190px, 1fr) auto',
                                              alignItems: 'center',
                                              gap: 8,
                                              padding: '8px 9px',
                                              borderRadius: 10,
                                              border: '1px solid #dfe4e7',
                                              background: '#f7f8f8'
                                            }}
                                          >
                                            <div style={{
                                              fontSize: 10,
                                              color: '#778493',
                                              fontWeight: 900,
                                              textAlign: 'center'
                                            }}>
                                              {index === 0 ? 'WHERE' : 'AND'}
                                            </div>

                                            <select
                                              value={filter.field}
                                              onChange={event => {
                                                const field =
                                                  event.target.value
                                                const firstValue =
                                                  valuesForFilter(field)[0]?.[0] ||
                                                  ''

                                                updateSetupTherapyFilter(
                                                  filter.id,
                                                  {
                                                    field,
                                                    value: firstValue
                                                  }
                                                )
                                              }}
                                              style={{
                                                padding: '8px 9px',
                                                borderRadius: 8,
                                                border:
                                                  '1px solid #d8dfe3',
                                                fontSize: 11
                                              }}
                                            >
                                              {therapyFilterFields.map(
                                                field => (
                                                  <option
                                                    key={field.value}
                                                    value={field.value}
                                                  >
                                                    {field.label}
                                                  </option>
                                                )
                                              )}
                                            </select>

                                            <select
                                              value={filter.value}
                                              onChange={event =>
                                                updateSetupTherapyFilter(
                                                  filter.id,
                                                  {
                                                    value:
                                                      event.target.value
                                                  }
                                                )
                                              }
                                              style={{
                                                padding: '8px 9px',
                                                borderRadius: 8,
                                                border:
                                                  '1px solid #d8dfe3',
                                                fontSize: 11
                                              }}
                                            >
                                              {options.map(
                                                ([value, label]) => (
                                                  <option
                                                    key={`${filter.field}-${value}`}
                                                    value={value}
                                                  >
                                                    {label}
                                                  </option>
                                                )
                                              )}
                                            </select>

                                            <button
                                              onClick={() =>
                                                removeSetupTherapyFilter(
                                                  filter.id
                                                )
                                              }
                                              style={{
                                                border: '1px solid #e1d5d9',
                                                background: '#faf7f8',
                                                color: '#95576a',
                                                borderRadius: 8,
                                                padding: '7px 9px',
                                                cursor: 'pointer',
                                                fontSize: 11,
                                                fontWeight: 800
                                              }}
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        )
                                      }
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{
                              ...S.card,
                              marginBottom: 14,
                              padding: 14
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom:
                                  tomorrowCoverage.length > 0 ? 12 : 0
                              }}>
                                <div>
                                  <div style={{
                                    fontSize: 14,
                                    fontWeight: 900,
                                    color: '#25374e'
                                  }}>
                                    Tomorrow’s Class Coverage
                                  </div>

                                  <div style={{
                                    fontSize: 10.5,
                                    color: '#758398',
                                    marginTop: 2
                                  }}>
                                    Each session appears under the actual
                                    class, break, breakfast, or lunch block.
                                  </div>
                                </div>

                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  color: '#52647b',
                                  background: '#eef2f6',
                                  padding: '5px 8px',
                                  borderRadius: 999
                                }}>
                                  {tomorrowDay}
                                </span>
                              </div>

                              {tomorrowCoverage.length === 0 ? (
                                <div style={{
                                  fontSize: 11,
                                  color: '#758398'
                                }}>
                                  No pull-out sessions scheduled.
                                </div>
                              ) : (
                                <div style={{
                                  display: 'grid',
                                  gap: 12
                                }}>
                                  {schoolDayBlocks.map(block => {
                                    const groups =
                                      tomorrowCoverage.filter(
                                        group =>
                                          group.block.key === block.key
                                      )

                                    if (groups.length === 0) return null

                                    return (
                                      <div
                                        key={block.key}
                                        style={{
                                          border:
                                            '1px solid #dfe6ee',
                                          borderRadius: 12,
                                          background: '#f9fbfc',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <div style={{
                                          padding: '9px 11px',
                                          background: '#f1f5f8',
                                          borderBottom:
                                            '1px solid #dfe6ee',
                                          display: 'flex',
                                          justifyContent:
                                            'space-between',
                                          alignItems: 'center',
                                          gap: 8
                                        }}>
                                          <div style={{
                                            fontSize: 11.5,
                                            fontWeight: 900,
                                            color: '#2a3b52'
                                          }}>
                                            {block.label}
                                          </div>

                                          <div style={{
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            color: '#708096'
                                          }}>
                                            {block.timeLabel}
                                          </div>
                                        </div>

                                        <div style={{
                                          padding: 9,
                                          display: 'grid',
                                          gridTemplateColumns:
                                            'repeat(auto-fit, minmax(235px, 1fr))',
                                          gap: 8
                                        }}>
                                          {groups.map(group => {
                                            const percent =
                                              group.classSize
                                                ? Math.round(
                                                    group.outCount /
                                                    group.classSize *
                                                    100
                                                  )
                                                : 0

                                            return (
                                              <div
                                                key={group.key}
                                                style={{
                                                  border:
                                                    '1px solid #e2e8ef',
                                                  borderRadius: 9,
                                                  background: '#ffffff',
                                                  padding: 9
                                                }}
                                              >
                                                <div style={{
                                                  fontSize: 11,
                                                  fontWeight: 900,
                                                  color: '#30445d'
                                                }}>
                                                  {group.className}
                                                </div>

                                                <div style={{
                                                  fontSize: 9.7,
                                                  color: '#718096',
                                                  marginTop: 2
                                                }}>
                                                  {group.teacher}
                                                </div>

                                                <div style={{
                                                  fontSize: 9.7,
                                                  color: '#60738a',
                                                  marginTop: 4,
                                                  fontWeight: 800
                                                }}>
                                                  {group.outCount} student
                                                  {group.outCount === 1
                                                    ? ''
                                                    : 's'} out
                                                  {group.classSize
                                                    ? ` of ${group.classSize}`
                                                    : ''}
                                                  {' '}({percent}%)
                                                </div>

                                                <div style={{
                                                  marginTop: 7,
                                                  display: 'grid',
                                                  gap: 5
                                                }}>
                                                  {group.rows.map(row => (
                                                    <div
                                                      key={
                                                        `${group.key}-${row.id}`
                                                      }
                                                      style={{
                                                        fontSize: 9.8,
                                                        color: '#40536b',
                                                        lineHeight: 1.4
                                                      }}
                                                    >
                                                      <strong>
                                                        {row.time}–
                                                        {therapyEndLabel(row)}
                                                      </strong>
                                                      {' · '}
                                                      {row.student.name}
                                                      {' → '}
                                                      {row.service} with{' '}
                                                      {row.therapistName}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {conflictWarnings.length > 0 && (
                              <details style={{

                                border: '1px solid #e7c7ac',
                                background: '#fff8f1',
                                borderRadius: 13,
                                padding: 14,
                                marginBottom: 16
                              }}>
                                <summary style={{
                                  cursor: 'pointer',
                                  fontSize: 12.5,
                                  fontWeight: 900,
                                  color: '#8a5b2b',
                                  listStyle: 'none'
                                }}>
                                  Schedule Conflicts ·{' '}
                                  {conflictWarnings.length}
                                  <span style={{
                                    marginLeft: 8,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#a2764e'
                                  }}>
                                    Click to expand
                                  </span>
                                </summary>

                                <div style={{
                                  marginTop: 8,
                                  display: 'grid',
                                  gap: 4
                                }}>
                                {conflictWarnings
                                  .slice(0, 12)
                                  .map((warning, index) => (
                                    <div
                                      key={`${warning.text}-${index}`}
                                      style={{
                                        fontSize: 11.5,
                                        color: '#775538',
                                        padding: '5px 0'
                                      }}
                                    >
                                      ⚠ {warning.text}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}

                            {setupTherapyView === 'therapist' && (
                              <div style={{
                                display: 'grid',
                                gap: 14
                              }}>
                                {therapistGroups.map(group => (
                                  <div
                                    key={group.therapist.name}
                                    style={{
                                      ...S.card,
                                      padding: 14
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: 10,
                                      gap: 10
                                    }}>
                                      <div>
                                        <div style={{
                                          fontSize: 15,
                                          fontWeight: 900,
                                          color: '#25374e'
                                        }}>
                                          {group.therapist.name}
                                        </div>

                                        <div style={{
                                          fontSize: 10.5,
                                          color: '#758398',
                                          marginTop: 2
                                        }}>
                                          {group.therapist.staffType} ·{' '}
                                          {group.rows.length} appointments ·{' '}
                                          chronological order
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns:
                                        'repeat(auto-fit, minmax(240px, 1fr))',
                                      gap: 8
                                    }}>
                                      {group.rows.map(row => (
                                        <details
                                          key={row.id}
                                          style={{
                                            border:
                                              '1px solid #dfe6ee',
                                            borderRadius: 10,
                                            padding: 10,
                                            background: '#f9fbfc'
                                          }}
                                        >
                                          <summary style={{
                                            cursor: 'pointer',
                                            listStyle: 'none'
                                          }}>
                                            <div style={{
                                              display: 'flex',
                                              justifyContent:
                                                'space-between',
                                              alignItems: 'flex-start',
                                              gap: 8
                                            }}>
                                              <div>
                                                <div style={{
                                                  fontSize: 12,
                                                  fontWeight: 900,
                                                  color: '#2a3b52'
                                                }}>
                                                  {row.time}–
                                                  {therapyEndLabel(row)}
                                                </div>

                                                <div style={{
                                                  fontSize: 11.5,
                                                  fontWeight: 800,
                                                  color: '#354a64',
                                                  marginTop: 3
                                                }}>
                                                  {row.student.name}
                                                </div>
                                              </div>

                                              <span style={{
                                                fontSize: 9.5,
                                                fontWeight: 900,
                                                color: '#52647b',
                                                background: '#edf2f6',
                                                padding: '4px 7px',
                                                borderRadius: 999
                                              }}>
                                                {row.day}
                                              </span>
                                            </div>

                                            <div style={{
                                              marginTop: 7,
                                              display: 'flex',
                                              gap: 5,
                                              flexWrap: 'wrap'
                                            }}>
                                              <span style={{
                                                fontSize: 9.5,
                                                fontWeight: 800,
                                                color: '#49627d',
                                                background: '#edf4fa',
                                                padding: '4px 6px',
                                                borderRadius: 7
                                              }}>
                                                {row.service}
                                              </span>

                                              <span style={{
                                                fontSize: 9.5,
                                                color: '#6f7e91',
                                                background: '#f1f3f5',
                                                padding: '4px 6px',
                                                borderRadius: 7
                                              }}>
                                                {row.duration} min
                                              </span>
                                            </div>

                                            <div style={{
                                              fontSize: 9.8,
                                              color: '#758398',
                                              marginTop: 7,
                                              lineHeight: 1.4
                                            }}>
                                              Missing{' '}
                                              {row.missedSubject ||
                                                row.className ||
                                                'class'}
                                              {' '}with{' '}
                                              {row.teacherName ||
                                                'assigned teacher'}
                                            </div>

                                            <div style={{
                                              fontSize: 9.5,
                                              color: '#8a6b49',
                                              marginTop: 5,
                                              fontWeight: 700
                                            }}>
                                              Click to edit
                                            </div>
                                          </summary>

                                          <div style={{
                                            borderTop:
                                              '1px solid #e1e7ef',
                                            marginTop: 9,
                                            paddingTop: 9,
                                            display: 'grid',
                                            gap: 7
                                          }}>
                                            <div style={{
                                              display: 'grid',
                                              gridTemplateColumns:
                                                '1fr 1fr',
                                              gap: 6
                                            }}>
                                              <select
                                                value={row.day}
                                                onChange={event =>
                                                  updateScheduleRow(
                                                    row.id,
                                                    {
                                                      day:
                                                        event.target.value
                                                    }
                                                  )
                                                }
                                                style={{
                                                  padding: '7px',
                                                  borderRadius: 7,
                                                  border:
                                                    '1px solid #dce4ed',
                                                  fontSize: 10.5
                                                }}
                                              >
                                                {[
                                                  'Monday',
                                                  'Tuesday',
                                                  'Wednesday',
                                                  'Thursday'
                                                ].map(day => (
                                                  <option
                                                    key={day}
                                                    value={day}
                                                  >
                                                    {day}
                                                  </option>
                                                ))}
                                              </select>

                                              <input
                                                value={row.time}
                                                onChange={event =>
                                                  updateScheduleRow(
                                                    row.id,
                                                    {
                                                      time:
                                                        event.target.value
                                                    }
                                                  )
                                                }
                                                style={{
                                                  padding: '7px',
                                                  borderRadius: 7,
                                                  border:
                                                    '1px solid #dce4ed',
                                                  fontSize: 10.5
                                                }}
                                              />
                                            </div>

                                            <div style={{
                                              display: 'grid',
                                              gridTemplateColumns:
                                                '1fr 1fr',
                                              gap: 6
                                            }}>
                                              <select
                                                value={row.studentId}
                                                onChange={event =>
                                                  updateScheduleRow(
                                                    row.id,
                                                    {
                                                      studentId:
                                                        Number(
                                                          event.target.value
                                                        )
                                                    }
                                                  )
                                                }
                                                style={{
                                                  padding: '7px',
                                                  borderRadius: 7,
                                                  border:
                                                    '1px solid #dce4ed',
                                                  fontSize: 10.5
                                                }}
                                              >
                                                {students.map(student => (
                                                  <option
                                                    key={student.id}
                                                    value={student.id}
                                                  >
                                                    {student.name}
                                                  </option>
                                                ))}
                                              </select>

                                              <select
                                                value={row.therapistName}
                                                onChange={event => {
                                                  const selected =
                                                    SUPPORT_STAFF_OPTIONS.find(
                                                      person =>
                                                        person.name ===
                                                        event.target.value
                                                    )

                                                  updateScheduleRow(
                                                    row.id,
                                                    {
                                                      therapistName:
                                                        event.target.value,
                                                      staffType:
                                                        selected?.staffType ||
                                                        row.staffType,
                                                      service:
                                                        selected?.service ||
                                                        row.service
                                                    }
                                                  )
                                                }}
                                                style={{
                                                  padding: '7px',
                                                  borderRadius: 7,
                                                  border:
                                                    '1px solid #dce4ed',
                                                  fontSize: 10.5
                                                }}
                                              >
                                                {staffChoicesForRow(row)
                                                  .map(person => (
                                                    <option
                                                      key={person.name}
                                                      value={person.name}
                                                    >
                                                      {person.name}
                                                    </option>
                                                  ))}
                                              </select>
                                            </div>

                                            <div style={{
                                              display: 'flex',
                                              justifyContent:
                                                'space-between',
                                              alignItems: 'center',
                                              gap: 8
                                            }}>
                                              <select
                                                value={row.duration}
                                                onChange={event =>
                                                  updateScheduleRow(
                                                    row.id,
                                                    {
                                                      duration:
                                                        Number(
                                                          event.target.value
                                                        )
                                                    }
                                                  )
                                                }
                                                style={{
                                                  padding: '7px',
                                                  borderRadius: 7,
                                                  border:
                                                    '1px solid #dce4ed',
                                                  fontSize: 10.5
                                                }}
                                              >
                                                <option value={30}>
                                                  30 minutes
                                                </option>
                                                <option value={45}>
                                                  45 minutes
                                                </option>
                                                <option value={60}>
                                                  60 minutes
                                                </option>
                                              </select>

                                              <button
                                                onClick={() =>
                                                  setSetupTherapySchedule(
                                                    previous =>
                                                      previous.filter(
                                                        item =>
                                                          item.id !== row.id
                                                      )
                                                  )
                                                }
                                                style={{
                                                  border:
                                                    '1px solid #ead9de',
                                                  background: '#faf7f8',
                                                  color: '#985064',
                                                  borderRadius: 7,
                                                  padding: '7px 9px',
                                                  cursor: 'pointer',
                                                  fontSize: 10,
                                                  fontWeight: 800
                                                }}
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        </details>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {setupTherapyView === 'student' && (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: 14
                              }}>
                                {studentGroups.map(group => (
                                  <div
                                    key={group.student.id}
                                    style={S.card}
                                  >
                                    <div style={{
                                      fontSize: 14,
                                      fontWeight: 900,
                                      color: '#26384e',
                                      marginBottom: 9
                                    }}>
                                      {group.student.name}
                                    </div>

                                    {group.rows.map(row => (
                                      <div
                                        key={row.id}
                                        style={{
                                          padding: '9px 0',
                                          borderBottom:
                                            '1px solid #edf1f5'
                                        }}
                                      >
                                        <div style={{
                                          display: 'flex',
                                          justifyContent:
                                            'space-between',
                                          gap: 8
                                        }}>
                                          <div style={{
                                            fontSize: 11.5,
                                            fontWeight: 800,
                                            color: '#344860'
                                          }}>
                                            {row.therapistName}
                                          </div>

                                          <div style={{
                                            fontSize: 10.5,
                                            color: '#708095'
                                          }}>
                                            {row.duration} min
                                          </div>
                                        </div>

                                        <div style={{
                                          fontSize: 10.5,
                                          color: '#708095',
                                          marginTop: 3
                                        }}>
                                          {row.day} · {row.time}
                                          {row.endTime
                                            ? `–${row.endTime}`
                                            : ''}{' '}
                                          · {row.service}
                                        </div>

                                        <div style={{
                                          fontSize: 10,
                                          color: '#8a96a6',
                                          marginTop: 3
                                        }}>
                                          {row.location}
                                        </div>

                                        <div style={{
                                          fontSize: 10,
                                          color: '#8894a0',
                                          marginTop: 3
                                        }}>
                                          Missing {row.missedSubject || 'Class'} ·{' '}
                                          {row.teacherName} · {row.className}
                                          {row.supervisingBcba
                                            ? ` · BCBA: ${row.supervisingBcba}`
                                            : ''}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
  )
}
