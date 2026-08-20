import { useMemo, useState } from 'react'
import { buildStudentListViewModel } from './studentListUtils'

function defaultStudentForm() {
  return {
    name: '',
    classId: '',
    className: '',
    grade: '8',
    teacherAssignmentsText: '',
    supportAssignmentsText: '',
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    address: '',
    isActive: true,
  }
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export default function StudentsListPage({
  searchedStudents,
  openStudent,
  S,
  STAFF,
  getImprovement,
  isVIP,
  statusColor,
  statusEmoji,
  statusLabel,
  daysSince,
  initials,
  role,
  classes,
  onCreateStudent,
  onUpdateStudent,
  onArchiveStudent,
  onRestoreStudent,
  onDeleteStudent,
  onGetDeletionImpact,
}) {
  const [viewMode, setViewMode] = useState('cards')
  const [tableSearch, setTableSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formError, setFormError] = useState('')
  const [formState, setFormState] = useState(defaultStudentForm)

  const isAdmin = role === 'admin'
  const pageSize = 12

  const activeStudents = useMemo(
    () => (searchedStudents || []).filter(student => student?.is_active !== false),
    [searchedStudents],
  )

  const archivedStudents = useMemo(
    () => (searchedStudents || []).filter(student => student?.is_active === false),
    [searchedStudents],
  )

  const studentsForDisplay = showArchived ? archivedStudents : activeStudents

  const { visibleRows, totalPages, totalCount, safePage } = useMemo(() => buildStudentListViewModel({
    students: studentsForDisplay,
    query: tableSearch,
    sortBy,
    sortDir,
    page,
    pageSize,
  }), [studentsForDisplay, tableSearch, sortBy, sortDir, page, pageSize])

  const isEmptyList = totalCount === 0

  const tableRows = visibleRows

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(column)
    setSortDir('asc')
  }

  function SortHead({ label, column }) {
    const active = sortBy === column
    return (
      <button
        onClick={() => toggleSort(column)}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          fontSize: 12,
          fontWeight: 800,
          color: active ? '#1e293b' : '#64748b',
          cursor: 'pointer',
        }}
      >
        {label}{active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
      </button>
    )
  }

  function openCreateForm() {
    setEditingStudent(null)
    setFormError('')
    setFormState(defaultStudentForm())
    setShowForm(true)
  }

  function openEditForm(student) {
    const classMatch = (classes || []).find(entry => entry.id === (student.classId || student.class_id))
    const family = (student.family && typeof student.family === 'object') ? student.family : {}
    const services = Array.isArray(student.services) ? student.services : []

    const teacherAssignments = services
      .filter(service => String(service.role || '').toLowerCase() === 'teacher')
      .map(service => String(service.staffName || service.name || ''))
      .filter(Boolean)

    const supportAssignments = services
      .filter(service => String(service.role || '').toLowerCase() !== 'teacher')
      .map(service => String(service.staffName || service.name || ''))
      .filter(Boolean)

    setEditingStudent(student)
    setFormError('')
    const inferredGrade = student.grade || (
      /alef/i.test(String(student.className || student.class_name || classMatch?.name || '')) ? '8'
      : /beis|beit/i.test(String(student.className || student.class_name || classMatch?.name || '')) ? '7'
      : '8'
    )

    setFormState({
      name: student.name || '',
      classId: student.classId || student.class_id || classMatch?.id || '',
      className: student.className || student.class_name || classMatch?.name || '',
      grade: String(inferredGrade),
      teacherAssignmentsText: teacherAssignments.join(', '),
      supportAssignmentsText: supportAssignments.join(', '),
      fatherName: String(family.fatherName || ''),
      motherName: String(family.motherName || ''),
      fatherPhone: String(family.fatherPhone || ''),
      motherPhone: String(family.motherPhone || ''),
      address: String(family.address || ''),
      isActive: student.is_active !== false,
    })
    setShowForm(true)
  }

  async function submitForm() {
    setFormError('')

    if (!String(formState.name || '').trim()) {
      setFormError('Student name is required.')
      return
    }

    if (!String(formState.className || '').trim() && !String(formState.classId || '').trim()) {
      setFormError('Class is required.')
      return
    }

    const selectedClass = (classes || []).find(entry => entry.id === formState.classId)
    const className = String(formState.className || selectedClass?.name || '').trim()
    const classId = String(formState.classId || selectedClass?.id || '').trim()

    const normalizedGrade = String(formState.grade || '').trim()
    const safeGrade = normalizedGrade === '7' || normalizedGrade === '8' ? normalizedGrade : (
      /alef/i.test(className) ? '8' : /beis|beit/i.test(className) ? '7' : '8'
    )

    const payload = {
      name: String(formState.name || '').trim(),
      className,
      classId,
      grade: safeGrade,
      status: 'present',
      isActive: formState.isActive !== false,
      teacherAssignments: splitCsv(formState.teacherAssignmentsText),
      supportAssignments: splitCsv(formState.supportAssignmentsText),
      family: {
        fatherName: String(formState.fatherName || '').trim(),
        motherName: String(formState.motherName || '').trim(),
        fatherPhone: String(formState.fatherPhone || '').trim(),
        motherPhone: String(formState.motherPhone || '').trim(),
        address: String(formState.address || '').trim(),
      },
    }

    try {
      if (editingStudent) {
        await onUpdateStudent?.(editingStudent, payload)
      } else {
        await onCreateStudent?.(payload)
      }
      setShowForm(false)
      setEditingStudent(null)
      setFormState(defaultStudentForm())
    } catch (error) {
      setFormError(String(error?.message || 'Unable to save student.'))
    }
  }

  async function handleArchive(student) {
    if (!isAdmin || !student) return
    if (!window.confirm(`Archive ${student.name}? Historical records will remain available.`)) return

    try {
      setBusyId(student.id)
      await onArchiveStudent?.(student)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRestore(student) {
    if (!isAdmin || !student) return

    try {
      setBusyId(student.id)
      await onRestoreStudent?.(student)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#16243a' }}>Students</h1>
          <div style={{ fontSize: 12, color: '#64748b' }}>{totalCount} {showArchived ? 'archived' : 'active'} students</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={tableSearch}
            onChange={event => {
              setTableSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search name, class, id"
            spellCheck
            lang="en"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12, width: 'min(100%, 260px)' }}
          />
          {isAdmin && (
            <button onClick={openCreateForm} style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>Add Student</button>
          )}
          {isAdmin && (
            <button onClick={() => setShowArchived(prev => !prev)} style={{ ...S.btn(showArchived ? 'danger' : 'ghost'), padding: '8px 12px', fontSize: 12 }}>
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
          )}
          <button onClick={() => setViewMode('cards')} style={{ ...S.btn(viewMode === 'cards' ? 'primary' : 'ghost'), padding: '8px 12px', fontSize: 12 }}>Cards</button>
          <button onClick={() => setViewMode('table')} style={{ ...S.btn(viewMode === 'table' ? 'primary' : 'ghost'), padding: '8px 12px', fontSize: 12 }}>Table</button>
        </div>
      </div>

      {viewMode === 'cards' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {studentsForDisplay.map((s, i) => {
          const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
          const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
          const imp = getImprovement(s)
          const vip = isVIP(s)
          return (
            <div key={s.id} onClick={() => openStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px', borderLeft: vip ? '4px solid #ca8a04' : s.status === 'unknown' ? '4px solid #9f1239' : '1px solid #e2e8f0' }}>
              <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.name}
                  {vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>VIP</span>}
                  {s.status === 'unknown' && <span style={{ background: '#fee2e2', color: '#9f1239', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Unknown</span>}
                  {s.is_active === false && <span style={{ background: '#fee2e2', color: '#7f1d1d', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Archived</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                  {withStaffObj && <span style={{ fontSize: 11, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, color: imp.color }}>{imp.icon} {imp.label}</span>
                  {s.iep && <span style={S.tag('#5b5f7a')}>IEP</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                <div><div style={{ fontSize: 17, fontWeight: 700, color: '#9a6a2a' }}>{s.points}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>pts</div></div>
                <div><div style={{ fontSize: 17, fontWeight: 700, color: s.reminders >= 4 ? '#9f1239' : '#334155' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>remind.</div></div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{s.att.filter(d=>d==='P').length}/6</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>days</div>
                  <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 2 }}>
                    <div style={{ width: `${Math.round(s.att.filter(d=>d==='P').length/6*100)}%`, height: '100%', background: s.att.filter(d=>d==='P').length >= 5 ? '#56765f' : s.att.filter(d=>d==='P').length >= 3 ? '#9a6a2a' : '#9f1239', borderRadius: 2 }} />
                  </div>
                </div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d` : 'Never'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>last call</div></div>
                {isAdmin && <button onClick={event => { event.stopPropagation(); openEditForm(s) }} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Edit</button>}
              </div>
            </div>
          )
        })}
      </div>
      )}

      {viewMode === 'table' && (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Student" column="name" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="ID" column="id" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Class" column="className" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Points" column="points" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Reminders" column="reminders" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Attendance" column="attendance" /></th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((student, index) => {
                  const withStaffObj = student.withStaff ? STAFF.find(st => st.id === student.withStaff) : null
                  const presentDays = student.att?.filter(day => day === 'P').length || 0
                  const isBusy = busyId === student.id
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={S.avatar(index, 28)}>{initials(student.name)}</div>
                          <div style={{ fontWeight: 700 }}>{student.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: 10 }}>{student.id}</td>
                      <td style={{ padding: 10 }}>{student.className || student.class_name || '—'}</td>
                      <td style={{ padding: 10 }}>
                        <span style={S.tag(statusColor[student.status])}>{statusEmoji[student.status]} {statusLabel[student.status]}</span>
                        {withStaffObj && <div style={{ fontSize: 10, color: '#3f6b76', marginTop: 3 }}>With {withStaffObj.name}</div>}
                        {student.is_active === false && <div style={{ fontSize: 10, color: '#991b1b', marginTop: 3 }}>Archived</div>}
                      </td>
                      <td style={{ padding: 10, fontWeight: 700, color: '#9a6a2a' }}>{student.points}</td>
                      <td style={{ padding: 10, fontWeight: 700, color: student.reminders >= 4 ? '#9f1239' : '#334155' }}>{student.reminders}</td>
                      <td style={{ padding: 10 }}>{presentDays}/6</td>
                      <td style={{ padding: 10 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => openStudent(student)} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Open</button>
                          {isAdmin && <button onClick={() => openEditForm(student)} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }} disabled={isBusy}>Edit</button>}
                          {isAdmin && student.is_active !== false && <button onClick={() => handleArchive(student)} style={{ ...S.btn('danger'), padding: '6px 10px', fontSize: 11 }} disabled={isBusy}>Archive</button>}
                          {isAdmin && student.is_active === false && <button onClick={() => handleRestore(student)} style={{ ...S.btn('success'), padding: '6px 10px', fontSize: 11 }} disabled={isBusy}>Restore</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                      {isEmptyList
                        ? 'No secure Yeshiva Ketana students are stored yet. Use Add Student to create the first record.'
                        : 'No students match current filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>Page {safePage} of {totalPages}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={safePage === 1} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Previous</button>
              <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 760, borderRadius: 14, background: '#fff', border: '1px solid #dbe8f5', boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{editingStudent ? 'Edit Student' : 'Add Student'}</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: 16 }}>
              {formError && <div style={{ marginBottom: 10, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12, fontWeight: 700, padding: '8px 10px' }}>{formError}</div>}

              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Student Name</span>
                  <input value={formState.name} onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Class</span>
                  <select value={formState.classId} onChange={event => {
                    const classId = event.target.value
                    const selectedClass = (classes || []).find(entry => entry.id === classId)
                    const nextGrade = /alef/i.test(String(selectedClass?.name || '')) ? '8' : /beis|beit/i.test(String(selectedClass?.name || '')) ? '7' : formState.grade
                    setFormState(prev => ({ ...prev, classId, className: selectedClass?.name || '', grade: nextGrade }))
                  }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }}>
                    <option value="">Select class</option>
                    {(classes || []).map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Grade</span>
                  <select value={formState.grade} onChange={event => setFormState(prev => ({ ...prev, grade: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }}>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Teachers/Rebbeim (comma-separated)</span>
                  <input value={formState.teacherAssignmentsText} onChange={event => setFormState(prev => ({ ...prev, teacherAssignmentsText: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} list="teacher-list" />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Support Staff (comma-separated)</span>
                  <input value={formState.supportAssignmentsText} onChange={event => setFormState(prev => ({ ...prev, supportAssignmentsText: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} list="support-list" />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Father Name</span>
                  <input value={formState.fatherName} onChange={event => setFormState(prev => ({ ...prev, fatherName: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Mother Name</span>
                  <input value={formState.motherName} onChange={event => setFormState(prev => ({ ...prev, motherName: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Father Phone</span>
                  <input value={formState.fatherPhone} onChange={event => setFormState(prev => ({ ...prev, fatherPhone: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Mother Phone</span>
                  <input value={formState.motherPhone} onChange={event => setFormState(prev => ({ ...prev, motherPhone: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
                </label>
              </div>

              <label style={{ display: 'grid', gap: 4, marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Home Address</span>
                <input value={formState.address} onChange={event => setFormState(prev => ({ ...prev, address: event.target.value }))} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12 }} />
              </label>

              <label style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', fontWeight: 600 }}>
                <input type="checkbox" checked={formState.isActive} onChange={event => setFormState(prev => ({ ...prev, isActive: event.target.checked }))} />
                Active student
              </label>

              <datalist id="teacher-list">
                {(STAFF || []).filter(person => /teacher|rebbe/i.test(String(person.role || ''))).map(person => (
                  <option key={`teacher-opt-${person.id}`} value={person.name} />
                ))}
              </datalist>
              <datalist id="support-list">
                {(STAFF || []).filter(person => /support|bt|therap|speech|ot|pt|bcba|counsel/i.test(String(person.role || ''))).map(person => (
                  <option key={`support-opt-${person.id}`} value={person.name} />
                ))}
              </datalist>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
              <button onClick={submitForm} style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>
                {editingStudent ? 'Save Changes' : 'Create Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  )
}
