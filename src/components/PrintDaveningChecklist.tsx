import { useEffect, useMemo, useState } from 'react'
import { getPrintableRoster, getPrintableTeacherNames } from './printRosterUtils'

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

export default function PrintDaveningChecklist({ students, classes, onClose, S, setupAssignments, additionalClassIdsByStudent, teacherAssignedStudentIdsByName }: { students: Student[]; classes: SchoolClass[]; onClose: () => void; S: any; setupAssignments: Record<string, unknown>; additionalClassIdsByStudent: Record<string | number, string[]>; teacherAssignedStudentIdsByName: Map<string, Set<number>> }) {
  const [scope, setScope] = useState('class')
  const [classId, setClassId] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('Davening Checklist')
  const [sections, setSections] = useState(['Baruch Sheamar', 'Ashrei', 'Shema', 'Shemoneh Esrei'])

  const activeStudents = useMemo(() => students
    .filter(student => student.is_active !== false)
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))), [students])
  const teacherNames = useMemo(() => getPrintableTeacherNames(classes, setupAssignments, teacherAssignedStudentIdsByName), [classes, setupAssignments, teacherAssignedStudentIdsByName])
  const matchingStudents = useMemo(() => getPrintableRoster({ students: activeStudents, classes, scope, classId, teacherName, setupAssignments, additionalClassIdsByStudent, teacherAssignedStudentIdsByName }), [activeStudents, additionalClassIdsByStudent, classId, classes, scope, setupAssignments, teacherAssignedStudentIdsByName, teacherName])
  const selectedStudents = matchingStudents.filter(student => selectedIds.has(String(student.id)))
  const selectionLabel = scope === 'class'
    ? classes.find(entry => String(entry.id) === classId)?.name || 'Selected Class'
    : `Teacher: ${teacherName || 'Selected Teacher'}`

  useEffect(() => {
    setSelectedIds(new Set(matchingStudents.map(student => String(student.id))))
  }, [scope, classId, teacherName])

  function toggleStudent(studentId: string | number) {
    const key = String(studentId)
    setSelectedIds(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function printChecklist() {
    const cleanSections = sections.map(section => section.trim()).filter(Boolean)
    const today = new Date().toLocaleDateString()
    const headers = cleanSections.map(section => `<th>${escapeHtml(section)}</th>`).join('')
    const rows = selectedStudents.map((student, index) => `<tr><td class="number">${index + 1}</td><td class="name">${escapeHtml(student.name)}</td>${cleanSections.map(() => '<td class="mark-space"></td>').join('')}</tr>`).join('')
    const win = window.open('', '_blank')
    if (!win) {
      alert('Please allow popups to print the davening checklist.')
      return
    }
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
      @page { margin: 0.4in; } body { font-family: Arial, sans-serif; color: #111827; } h1 { margin: 0; font-size: 22px; }
      .meta { margin: 7px 0 10px; color: #475569; font-size: 13px; } .legend { border: 1px solid #64748b; padding: 7px 9px; margin-bottom: 16px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; } th, td { border: 1px solid #475569; padding: 7px; } th { background: #e2e8f0; font-size: 11px; text-align: left; vertical-align: bottom; } .number { width: 28px; text-align: center; } .name { width: 25%; font-size: 12px; font-weight: 700; } .mark-space { height: 38px; } @media print { button { display: none; } }
    </style></head><body><h1>${escapeHtml(title || 'Davening Checklist')}</h1><div class="meta">${escapeHtml(selectionLabel)} | ${escapeHtml(today)} | ${selectedStudents.length} students</div><div class="legend"><b>Marking key:</b> DG = Doing Great | G = Good | NI = Needs Improvement | M = Missed (student was present but did not daven this section) | A = Absent (student was not there)</div><table><thead><tr><th>#</th><th>Student</th>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <section role="dialog" aria-modal="true" aria-label="Print davening checklist" style={{ width: 'min(94vw, 820px)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 24px 70px rgba(15,23,42,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h2 style={{ margin: 0, fontSize: 18, color: '#16243a' }}>Davening Checklist</h2><div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>A separate handwritten checklist for a class or rebbe.</div></div><button onClick={onClose} aria-label="Close davening checklist" style={S.btn('ghost')}>Close</button></div>
        <div style={{ padding: 22, display: 'grid', gap: 18 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Title<input value={title} onChange={event => setTitle(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{[['class', 'Specific Class'], ['teacher', 'Specific Teacher']].map(([value, label]) => <button key={value} onClick={() => setScope(value)} style={{ ...S.btn(scope === value ? 'primary' : 'ghost'), padding: '9px 8px', fontSize: 12 }}>{label}</button>)}</div>
          {scope === 'class' && <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Class<select value={classId} onChange={event => setClassId(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}><option value="">Choose a class</option>{classes.map(entry => <option key={entry.id} value={entry.id}>{entry.name}{entry.teacher ? ` - ${entry.teacher}` : ''}</option>)}</select></label>}
          {scope === 'teacher' && <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>Teacher<select value={teacherName} onChange={event => setTeacherName(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}><option value="">Choose a teacher</option>{teacherNames.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
          <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>Davening sections</div><button onClick={() => setSections(previous => [...previous, `Section ${previous.length + 1}`])} style={{ ...S.btn('ghost'), padding: '5px 9px', fontSize: 11 }}>Add Section</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>{sections.map((section, index) => <div key={index} style={{ display: 'flex', gap: 4 }}><input aria-label={`Davening section ${index + 1}`} value={section} onChange={event => setSections(previous => previous.map((entry, sectionIndex) => sectionIndex === index ? event.target.value : entry))} style={{ minWidth: 0, flex: 1, padding: '8px 9px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} /><button onClick={() => setSections(previous => previous.filter((_, sectionIndex) => sectionIndex !== index))} aria-label={`Remove ${section || 'section'}`} style={{ ...S.btn('ghost'), padding: '5px 8px', color: '#9f1239' }}>x</button></div>)}</div></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>Students ({selectedStudents.length} of {matchingStudents.length} selected)</div><button onClick={() => setSelectedIds(new Set(matchingStudents.map(student => String(student.id))))} style={{ ...S.btn('ghost'), padding: '5px 9px', fontSize: 11 }}>Select All</button></div><div style={{ maxHeight: 210, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 7 }}>{matchingStudents.map(student => <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={selectedIds.has(String(student.id))} onChange={() => toggleStudent(student.id)} />{student.name}</label>)}{matchingStudents.length === 0 && <div style={{ padding: 12, color: '#64748b', fontSize: 13 }}>No active students match this selection.</div>}</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button onClick={onClose} style={S.btn('ghost')}>Cancel</button><button disabled={selectedStudents.length === 0} onClick={printChecklist} style={{ ...S.btn('primary'), opacity: selectedStudents.length === 0 ? 0.55 : 1 }}>Print Checklist</button></div>
        </div>
      </section>
    </div>
  )
}