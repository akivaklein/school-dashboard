import { useEffect, useMemo, useState } from 'react'
import { getPrintableRoster, getPrintableTeacherClassOptions, getPrintableTeacherNames, movePrintColumn } from './printRosterUtils'

type Student = { id: string | number; name?: string; is_active?: boolean }
type SchoolClass = { id: string | number; name: string; teacher?: string }

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function PrintClassList({ students, classes, onClose, S, primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships }: { students: Student[]; classes: SchoolClass[]; onClose: () => void; S: any; primaryClassIdsByStudent: Record<string | number, string>; additionalClassIdsByStudent: Record<string | number, string[]>; instructionalGroups: Array<{ id: string; status?: string }>; instructionalGroupMemberships: Array<{ group_id: string; student_id: number }> }) {
  const [scope, setScope] = useState('school')
  const [classId, setClassId] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherClassId, setTeacherClassId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('Class List')
  const [columns, setColumns] = useState(['On Time', 'Leaving', 'Notes'])
  const [showNumbering, setShowNumbering] = useState(true)

  const activeStudents = useMemo(
    () => students.filter(student => student.is_active !== false).sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))),
    [students],
  )
  const teacherNames = useMemo(() => getPrintableTeacherNames(classes), [classes])
  const teacherClassOptions = useMemo(() => getPrintableTeacherClassOptions(classes, teacherName), [classes, teacherName])
  const matchingStudents = useMemo(() => getPrintableRoster({ students: activeStudents, classes, scope, classId, teacherName, teacherClassId, primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships }), [activeStudents, additionalClassIdsByStudent, classId, classes, instructionalGroupMemberships, instructionalGroups, primaryClassIdsByStudent, scope, teacherClassId, teacherName])
  const selectedStudents = matchingStudents.filter(student => selectedIds.has(String(student.id)))
  const selectionLabel = scope === 'class'
    ? classes.find(entry => String(entry.id) === classId)?.name || 'Selected Class'
    : scope === 'teacher'
      ? `Teacher: ${teacherName || 'Selected Teacher'}`
      : 'Entire School'

  useEffect(() => {
    setSelectedIds(new Set(matchingStudents.map(student => String(student.id))))
  }, [scope, classId, teacherName, teacherClassId])

  function toggleStudent(studentId: string | number) {
    const key = String(studentId)
    setSelectedIds(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function printList() {
    const today = new Date().toLocaleDateString()
    const cleanColumns = columns.map(column => column.trim()).filter(Boolean)
    const headerCells = cleanColumns.map(column => `<th>${escapeHtml(column)}</th>`).join('')
    const rows = selectedStudents.map((student, index) => `
      <tr>${showNumbering ? `<td class="number">${index + 1}</td>` : ''}<td class="name">${escapeHtml(student.name)}</td>${cleanColumns.map(() => '<td class="blank"></td>').join('')}</tr>
    `).join('')
    const win = window.open('', '_blank')
    if (!win) {
      alert('Please allow popups to print the class list.')
      return
    }
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
      @page { margin: 0.45in; }
      body { font-family: Arial, sans-serif; color: #111827; }
      h1 { margin: 0; font-size: 22px; } .meta { margin: 7px 0 18px; color: #475569; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; } th, td { border: 1px solid #64748b; padding: 8px; }
      th { background: #e2e8f0; font-size: 12px; text-align: left; } .number { width: 22px; padding-left: 4px; padding-right: 4px; text-align: center; } .name { width: 30%; font-weight: 700; } .without-numbering .name { width: calc(30% + 30px); }
      .blank { height: 38px; } @media print { button { display: none; } }
    </style></head><body><h1>${escapeHtml(title || 'Class List')}</h1><div class="meta">${escapeHtml(selectionLabel)} | ${escapeHtml(today)} | ${selectedStudents.length} students</div><table class="${showNumbering ? '' : 'without-numbering'}"><thead><tr>${showNumbering ? '<th class="number">#</th>' : ''}<th>Student</th>${headerCells}</tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <section role="dialog" aria-modal="true" aria-label="Print class list" style={{ width: 'min(94vw, 820px)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 24px 70px rgba(15,23,42,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ margin: 0, fontSize: 18, color: '#16243a' }}>Print Class List</h2><div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Choose students and columns for a handwritten sheet.</div></div>
          <button onClick={onClose} aria-label="Close print class list" style={S.btn('ghost')}>Close</button>
        </div>
        <div style={{ padding: 22, display: 'grid', gap: 18 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Title
            <input value={title} onChange={event => setTitle(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer' }}><input type="checkbox" checked={showNumbering} onChange={event => setShowNumbering(event.target.checked)} />Number students</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[['school', 'Entire School'], ['class', 'Specific Class'], ['teacher', 'Specific Teacher']].map(([value, label]) => <button key={value} onClick={() => setScope(value)} style={{ ...S.btn(scope === value ? 'primary' : 'ghost'), padding: '9px 8px', fontSize: 12 }}>{label}</button>)}
          </div>
          {scope === 'class' && <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Class<select value={classId} onChange={event => setClassId(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}><option value="">Choose a class</option>{classes.map(entry => <option key={entry.id} value={entry.id}>{entry.name}{entry.teacher ? ` - ${entry.teacher}` : ''}</option>)}</select></label>}
          {scope === 'teacher' && <><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Teacher<select value={teacherName} onChange={event => { setTeacherName(event.target.value); setTeacherClassId('') }} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}><option value="">Choose a teacher</option>{teacherNames.map(name => <option key={name} value={name}>{name}</option>)}</select></label>{teacherName && <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Class / Group<select value={teacherClassId} onChange={event => setTeacherClassId(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}><option value="">Choose a class or group</option><option value="all">All classes for this teacher</option>{teacherClassOptions.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>}</>}
          <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>Custom columns</div><button onClick={() => setColumns(previous => [...previous, `Column ${previous.length + 1}`])} style={{ ...S.btn('ghost'), padding: '5px 9px', fontSize: 11 }}>Add Column</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>{columns.map((column, index) => <div key={index} style={{ display: 'flex', gap: 4 }}><input aria-label={`Column ${index + 1} name`} value={column} onChange={event => setColumns(previous => previous.map((entry, columnIndex) => columnIndex === index ? event.target.value : entry))} style={{ minWidth: 0, flex: 1, padding: '8px 9px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} /><button title="Move column left" onClick={() => setColumns(previous => movePrintColumn(previous, index, index - 1))} disabled={index === 0} aria-label={`Move ${column || 'column'} left`} style={{ ...S.btn('ghost'), padding: '5px 8px', opacity: index === 0 ? 0.4 : 1 }}>&lt;</button><button title="Move column right" onClick={() => setColumns(previous => movePrintColumn(previous, index, index + 1))} disabled={index === columns.length - 1} aria-label={`Move ${column || 'column'} right`} style={{ ...S.btn('ghost'), padding: '5px 8px', opacity: index === columns.length - 1 ? 0.4 : 1 }}>&gt;</button><button onClick={() => setColumns(previous => previous.filter((_, columnIndex) => columnIndex !== index))} aria-label={`Remove ${column || 'column'}`} style={{ ...S.btn('ghost'), padding: '5px 8px', color: '#9f1239' }}>x</button></div>)}</div></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>Students ({selectedStudents.length} of {matchingStudents.length} selected)</div><button onClick={() => setSelectedIds(new Set(matchingStudents.map(student => String(student.id))))} style={{ ...S.btn('ghost'), padding: '5px 9px', fontSize: 11 }}>Select All</button></div><div style={{ maxHeight: 210, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 7 }}>{matchingStudents.map(student => <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={selectedIds.has(String(student.id))} onChange={() => toggleStudent(student.id)} />{student.name}</label>)}{matchingStudents.length === 0 && <div style={{ padding: 12, color: '#64748b', fontSize: 13 }}>No active students match this selection.</div>}</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button onClick={onClose} style={S.btn('ghost')}>Cancel</button><button disabled={selectedStudents.length === 0} onClick={printList} style={{ ...S.btn('primary'), opacity: selectedStudents.length === 0 ? 0.55 : 1 }}>Print List</button></div>
        </div>
      </section>
    </div>
  )
}