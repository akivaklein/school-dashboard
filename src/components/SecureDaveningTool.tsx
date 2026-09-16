import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  deleteDaveningTemplate,
  loadDaveningTemplates,
  loadStudentDaveningHistory,
  openDaveningChecklist,
  renameDaveningTemplate,
  saveDaveningMarks,
  saveDaveningTemplate,
  type DaveningChecklist,
  type DaveningHistoryRow,
  type DaveningMark,
  type DaveningRating,
  type DaveningSection,
  type DaveningTemplate,
} from '../services/daveningProgressService'
import { getPrintableRoster, getPrintableTeacherClassOptions, getPrintableTeacherNames, movePrintColumn } from './printRosterUtils'

type Student = { id: string | number; name?: string; is_active?: boolean }
type SchoolClass = { id: string | number; name: string; teacher?: string }
type InstructionalGroup = { id: string; name?: string; status?: string }

type Props = {
  students: Student[]
  classes: SchoolClass[]
  onClose: () => void
  S: { btn: (variant?: string) => CSSProperties }
  actorName?: string
  primaryClassIdsByStudent: Record<string | number, string>
  additionalClassIdsByStudent: Record<string | number, string[]>
  instructionalGroups: InstructionalGroup[]
  instructionalGroupMemberships: Array<{ group_id: string; student_id: number }>
}

const defaultSections: DaveningSection[] = ['Baruch Sheamar', 'Ashrei', 'Shema', 'Shemoneh Esrei'].map((label, index) => ({ id: `section-${index + 1}`, label }))
const defaultRatings: DaveningRating[] = [
  { id: 'vg', code: 'VG', label: 'Very Good' },
  { id: 'g', code: 'G', label: 'Good' },
  { id: 'ni', code: 'NI', label: 'Needs Improvement' },
  { id: 'm', code: 'M', label: 'Missed' },
  { id: 'a', code: 'A', label: 'Absent' },
]

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

export default function SecureDaveningTool({ students, classes, onClose, S, actorName = 'Staff', primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships }: Props) {
  const [view, setView] = useState<'setup' | 'digital' | 'history'>('setup')
  const [scope, setScope] = useState<'class' | 'teacher'>('class')
  const [classId, setClassId] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherClassId, setTeacherClassId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null)
  const [title, setTitle] = useState('Davening Checklist')
  const [sections, setSections] = useState<DaveningSection[]>(defaultSections)
  const [ratings, setRatings] = useState<DaveningRating[]>(defaultRatings)
  const [showNumbering, setShowNumbering] = useState(true)
  const [templates, setTemplates] = useState<DaveningTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [draggedItem, setDraggedItem] = useState<{ type: 'section' | 'rating'; index: number } | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [checklist, setChecklist] = useState<DaveningChecklist | null>(null)
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [history, setHistory] = useState<DaveningHistoryRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeStudents = useMemo(() => students.filter(student => student.is_active !== false).sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))), [students])
  const teacherNames = useMemo(() => getPrintableTeacherNames(classes), [classes])
  const teacherClassOptions = useMemo(() => getPrintableTeacherClassOptions(classes, teacherName), [classes, teacherName])
  const classAndGroupOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string; type: 'class' | 'group' }>()
    classes.forEach(entry => options.set(String(entry.id), { id: String(entry.id), name: entry.name, type: 'class' }))
    instructionalGroups.filter(group => group.status !== 'archived').forEach(group => options.set(group.id, { id: group.id, name: group.name || group.id, type: 'group' }))
    return Array.from(options.values()).sort((left, right) => left.name.localeCompare(right.name))
  }, [classes, instructionalGroups])
  const matchingStudents = useMemo(() => getPrintableRoster({ students: activeStudents, classes, scope, classId, teacherName, teacherClassId, primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships }), [activeStudents, additionalClassIdsByStudent, classId, classes, instructionalGroupMemberships, instructionalGroups, primaryClassIdsByStudent, scope, teacherClassId, teacherName])
  const selectedStudents = selectedIds === null ? matchingStudents : matchingStudents.filter(student => selectedIds.has(String(student.id)))
  const selectedTemplate = templates.find(template => template.id === templateId) || null
  const selectedTarget = classAndGroupOptions.find(option => option.id === classId)

  useEffect(() => {
    void refreshTemplates().catch(caught => setError(caught instanceof Error ? caught.message : 'Unable to load Davening templates.'))
  }, [])

  async function run(action: () => Promise<void>, successMessage?: string) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      if (successMessage) setMessage(successMessage)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to complete this action.')
    } finally {
      setBusy(false)
    }
  }

  async function refreshTemplates(selectId?: string) {
    const loaded = await loadDaveningTemplates()
    setTemplates(loaded)
    if (selectId) setTemplateId(selectId)
  }

  function applyTemplate(template: DaveningTemplate) {
    setTitle(template.title)
    setShowNumbering(template.show_numbering)
    setSections(template.sections.map(section => ({ ...section })))
    setRatings(template.ratings.map(rating => ({ ...rating })))
    setMessage(`Loaded ${template.name}.`)
  }

  function saveTemplate() {
    const name = selectedTemplate?.name || window.prompt('Template name')?.trim()
    if (!name) return
    void run(async () => {
      const saved = await saveDaveningTemplate({ id: selectedTemplate?.id, name, title: title.trim() || 'Davening Checklist', show_numbering: showNumbering, sections: sections.filter(section => section.label.trim()), ratings: ratings.filter(rating => rating.code.trim() && rating.label.trim()) })
      await refreshTemplates(saved.id)
    }, 'Template saved.')
  }

  function duplicateTemplate() {
    if (!selectedTemplate) return
    const name = window.prompt('Name for the duplicate template', `${selectedTemplate.name} Copy`)?.trim()
    if (!name) return
    void run(async () => {
      const saved = await saveDaveningTemplate({ name, title: selectedTemplate.title, show_numbering: selectedTemplate.show_numbering, sections: selectedTemplate.sections, ratings: selectedTemplate.ratings })
      await refreshTemplates(saved.id)
    }, 'Template duplicated.')
  }

  function renameTemplate() {
    if (!selectedTemplate) return
    const name = window.prompt('New template name', selectedTemplate.name)?.trim()
    if (!name) return
    void run(async () => { await renameDaveningTemplate(selectedTemplate.id, name); await refreshTemplates(selectedTemplate.id) }, 'Template renamed.')
  }

  function removeTemplate() {
    if (!selectedTemplate || !window.confirm(`Delete template "${selectedTemplate.name}"? Existing dated checklists will remain.`)) return
    void run(async () => { await deleteDaveningTemplate(selectedTemplate.id); setTemplateId(''); await refreshTemplates() }, 'Template deleted.')
  }

  function dropItem(type: 'section' | 'rating', targetIndex: number) {
    if (!draggedItem || draggedItem.type !== type) return
    if (type === 'section') setSections(previous => movePrintColumn(previous, draggedItem.index, targetIndex))
    else setRatings(previous => movePrintColumn(previous, draggedItem.index, targetIndex))
    setDraggedItem(null)
  }

  function toggleStudent(studentId: string | number) {
    setSelectedIds(previous => {
      const next = new Set(previous ?? matchingStudents.map(student => String(student.id)))
      const key = String(studentId)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function printChecklist() {
    const cleanSections = sections.filter(section => section.label.trim())
    const cleanRatings = ratings.filter(rating => rating.code.trim() && rating.label.trim())
    const label = scope === 'class' ? selectedTarget?.name || 'Selected Class / Group' : `Teacher: ${teacherName || 'Selected Teacher'}`
    const headers = cleanSections.map(section => `<th>${escapeHtml(section.label)}</th>`).join('')
    const rows = selectedStudents.map((student, index) => `<tr>${showNumbering ? `<td class="number">${index + 1}</td>` : ''}<td class="name">${escapeHtml(student.name)}</td>${cleanSections.map(() => '<td class="mark-space"></td>').join('')}</tr>`).join('')
    const legend = cleanRatings.map(rating => `<b>${escapeHtml(rating.code)}</b> = ${escapeHtml(rating.label)}`).join(' | ')
    const win = window.open('', '_blank')
    if (!win) return void setError('Please allow popups to print the Davening checklist.')
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;color:#111827}h1{margin:0;font-size:22px}.meta{margin:7px 0 10px;color:#475569;font-size:13px}.legend{border:1px solid #64748b;padding:7px 9px;margin-bottom:16px;font-size:11px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #475569;padding:7px}th{background:#e2e8f0;font-size:11px;text-align:left}.number{width:22px;text-align:center}.name{width:25%;font-size:12px;font-weight:700}.mark-space{height:38px}</style></head><body><h1>${escapeHtml(title || 'Davening Checklist')}</h1><div class="meta">${escapeHtml(label)} | ${escapeHtml(new Date().toLocaleDateString())} | ${selectedStudents.length} students</div><div class="legend"><b>Marking key:</b> ${legend}</div><table><thead><tr>${showNumbering ? '<th class="number">#</th>' : ''}<th>Student</th>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  function openDigital() {
    if (!selectedTemplate || !selectedTarget || !date) return
    void run(async () => {
      const opened = await openDaveningChecklist({ template: selectedTemplate, checklistDate: date, scopeType: selectedTarget.type, scopeId: selectedTarget.id, scopeLabel: selectedTarget.name, actorName })
      setChecklist(opened.checklist)
      setMarks(Object.fromEntries(opened.marks.map(mark => [`${mark.student_id}:${mark.section_id}`, mark.rating_id])))
    }, 'Checklist opened.')
  }

  function saveDigital() {
    if (!checklist) return
    const rows: DaveningMark[] = matchingStudents.flatMap(student => checklist.sections.map(section => ({ checklist_id: checklist.id, student_id: Number(student.id), section_id: section.id, rating_id: marks[`${student.id}:${section.id}`] || '', updated_by_name: actorName }))).filter(mark => Number.isFinite(mark.student_id))
    void run(() => saveDaveningMarks(checklist.id, rows), 'Davening marks saved.')
  }

  function loadHistory() {
    const studentId = Number(historyStudentId)
    if (!Number.isFinite(studentId)) return
    void run(async () => setHistory((await loadStudentDaveningHistory(studentId)).filter(row => Boolean(row.rating_id))))
  }

  const fieldStyle = { padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', minWidth: 0 }
  const labelStyle = { display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }

  return <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', padding: 18 }}>
    <section role="dialog" aria-modal="true" aria-label="Davening checklist workspace" style={{ width: 'min(96vw, 1100px)', maxHeight: '92vh', overflow: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 24px 70px rgba(15,23,42,0.3)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><div><h2 style={{ margin: 0, fontSize: 18, color: '#16243a' }}>Davening Checklist</h2><div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Print setup, templates, and separate dated Davening progress.</div></div><button onClick={onClose} style={S.btn('ghost')}>Close</button></div>
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6 }}>{([['setup', 'Setup & Print'], ['digital', 'Digital Entry'], ['history', 'Student History']] as const).map(([key, label]) => <button key={key} onClick={() => { setView(key); if (key === 'digital') setScope('class') }} style={{ ...S.btn(view === key ? 'primary' : 'ghost'), fontSize: 12 }}>{label}</button>)}</div>
      <div style={{ padding: 20, display: 'grid', gap: 16 }}>
        {(error || message) && <div role="status" style={{ padding: '9px 11px', border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`, background: error ? '#fef2f2' : '#f0fdf4', color: error ? '#991b1b' : '#166534', borderRadius: 6, fontSize: 12 }}>{error || message}</div>}
        {view !== 'history' && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: 8, alignItems: 'end' }}><label style={labelStyle}>Saved template<select value={templateId} onChange={event => setTemplateId(event.target.value)} style={fieldStyle}><option value="">Choose a template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button disabled={!selectedTemplate || busy} onClick={() => selectedTemplate && applyTemplate(selectedTemplate)} style={S.btn('ghost')}>Load Template</button><button disabled={busy} onClick={saveTemplate} style={S.btn('primary')}>Save Template</button><button disabled={!selectedTemplate || busy} onClick={renameTemplate} style={S.btn('ghost')}>Rename</button><button disabled={!selectedTemplate || busy} onClick={duplicateTemplate} style={S.btn('ghost')}>Duplicate</button><button disabled={!selectedTemplate || busy} onClick={removeTemplate} style={{ ...S.btn('ghost'), color: '#9f1239' }}>Delete</button></div></div>}

        {view === 'setup' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}><label style={labelStyle}>Sheet title<input value={title} onChange={event => setTitle(event.target.value)} style={fieldStyle} /></label><label style={{ ...labelStyle, display: 'flex', alignItems: 'center', alignSelf: 'end', paddingBottom: 9 }}><input type="checkbox" checked={showNumbering} onChange={event => setShowNumbering(event.target.checked)} /> Number students</label></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{([['class', 'Class / Group'], ['teacher', 'Specific Teacher']] as const).map(([key, label]) => <button key={key} onClick={() => { setScope(key); setSelectedIds(null) }} style={S.btn(scope === key ? 'primary' : 'ghost')}>{label}</button>)}</div>
          {scope === 'class' ? <label style={labelStyle}>Class / Group<select value={classId} onChange={event => { setClassId(event.target.value); setSelectedIds(null) }} style={fieldStyle}><option value="">Choose a class or group</option>{classAndGroupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label style={labelStyle}>Teacher<select value={teacherName} onChange={event => { setTeacherName(event.target.value); setTeacherClassId(''); setSelectedIds(null) }} style={fieldStyle}><option value="">Choose a teacher</option>{teacherNames.map(name => <option key={name}>{name}</option>)}</select></label><label style={labelStyle}>Class / Group<select value={teacherClassId} onChange={event => { setTeacherClassId(event.target.value); setSelectedIds(null) }} style={fieldStyle}><option value="">Choose one</option><option value="all">All classes</option>{teacherClassOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label></div>}
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b style={{ fontSize: 13 }}>Davening sections</b><button onClick={() => setSections(previous => [...previous, { id: newId('section'), label: `Section ${previous.length + 1}` }])} style={S.btn('ghost')}>Add Section</button></div><div style={{ display: 'grid', gap: 6 }}>{sections.map((section, index) => <div key={section.id} onDragOver={event => event.preventDefault()} onDrop={() => dropItem('section', index)} style={{ display: 'grid', gridTemplateColumns: '38px 1fr 38px', gap: 5, opacity: draggedItem?.type === 'section' && draggedItem.index === index ? .55 : 1 }}><button draggable onDragStart={() => setDraggedItem({ type: 'section', index })} onDragEnd={() => setDraggedItem(null)} title="Drag to reorder section" style={{ ...S.btn('ghost'), cursor: 'grab', padding: 4 }}>::</button><input value={section.label} onChange={event => setSections(previous => previous.map(item => item.id === section.id ? { ...item, label: event.target.value } : item))} style={fieldStyle} /><button onClick={() => setSections(previous => previous.filter(item => item.id !== section.id))} aria-label={`Remove ${section.label}`} style={{ ...S.btn('ghost'), color: '#9f1239', padding: 4 }}>x</button></div>)}</div></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b style={{ fontSize: 13 }}>Rating / marking key</b><button onClick={() => setRatings(previous => [...previous, { id: newId('rating'), code: '', label: '' }])} style={S.btn('ghost')}>Add Rating</button></div><div style={{ display: 'grid', gap: 6 }}>{ratings.map((rating, index) => <div key={rating.id} onDragOver={event => event.preventDefault()} onDrop={() => dropItem('rating', index)} style={{ display: 'grid', gridTemplateColumns: '38px minmax(70px,.35fr) 1fr 38px', gap: 5 }}><button draggable onDragStart={() => setDraggedItem({ type: 'rating', index })} onDragEnd={() => setDraggedItem(null)} title="Drag to reorder rating" style={{ ...S.btn('ghost'), cursor: 'grab', padding: 4 }}>::</button><input aria-label={`Rating ${index + 1} code`} placeholder="Code" value={rating.code} onChange={event => setRatings(previous => previous.map(item => item.id === rating.id ? { ...item, code: event.target.value } : item))} style={fieldStyle} /><input aria-label={`Rating ${index + 1} label`} placeholder="Meaning" value={rating.label} onChange={event => setRatings(previous => previous.map(item => item.id === rating.id ? { ...item, label: event.target.value } : item))} style={fieldStyle} /><button onClick={() => setRatings(previous => previous.filter(item => item.id !== rating.id))} aria-label={`Remove ${rating.code || 'rating'}`} style={{ ...S.btn('ghost'), color: '#9f1239', padding: 4 }}>x</button></div>)}</div></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><b style={{ fontSize: 13 }}>Students ({selectedStudents.length} of {matchingStudents.length})</b><button onClick={() => setSelectedIds(null)} style={S.btn('ghost')}>Select All</button></div><div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #e2e8f0' }}>{matchingStudents.map(student => <label key={student.id} style={{ display: 'flex', gap: 8, padding: 7, borderBottom: '1px solid #f1f5f9' }}><input type="checkbox" checked={selectedIds === null || selectedIds.has(String(student.id))} onChange={() => toggleStudent(student.id)} />{student.name}</label>)}</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button disabled={!selectedStudents.length || !sections.length} onClick={printChecklist} style={S.btn('primary')}>Print Checklist</button></div>
        </>}

        {view === 'digital' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}><label style={labelStyle}>Class / Group<select value={classId} onChange={event => { setClassId(event.target.value); setScope('class'); setChecklist(null) }} style={fieldStyle}><option value="">Choose a class or group</option>{classAndGroupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label><label style={labelStyle}>Date<input type="date" value={date} onChange={event => { setDate(event.target.value); setChecklist(null) }} style={fieldStyle} /></label><button disabled={!selectedTemplate || !selectedTarget || busy} onClick={openDigital} style={S.btn('primary')}>Open / Create</button></div>
          {!selectedTemplate && <div style={{ color: '#64748b', fontSize: 13 }}>Choose a saved template before opening a digital checklist.</div>}
          {checklist && <div style={{ overflowX: 'auto', border: '1px solid #dbe3ee' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}><thead><tr><th style={{ textAlign: 'left', padding: 8, background: '#f1f5f9' }}>Student</th>{checklist.sections.map(section => <th key={section.id} style={{ padding: 8, background: '#f1f5f9', fontSize: 12 }}>{section.label}</th>)}</tr></thead><tbody>{matchingStudents.map(student => <tr key={student.id}><td style={{ padding: 8, borderTop: '1px solid #e2e8f0', fontWeight: 700 }}>{student.name}</td>{checklist.sections.map(section => <td key={section.id} style={{ padding: 6, borderTop: '1px solid #e2e8f0' }}><select aria-label={`${student.name} ${section.label}`} value={marks[`${student.id}:${section.id}`] || ''} onChange={event => setMarks(previous => ({ ...previous, [`${student.id}:${section.id}`]: event.target.value }))} style={{ ...fieldStyle, width: '100%' }}><option value="">-</option>{checklist.ratings.map(rating => <option key={rating.id} value={rating.id}>{rating.code}</option>)}</select></td>)}</tr>)}</tbody></table></div>}
          {checklist && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button disabled={busy} onClick={saveDigital} style={S.btn('primary')}>Save Marks</button></div>}
        </>}

        {view === 'history' && <><div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}><label style={labelStyle}>Student<select value={historyStudentId} onChange={event => { setHistoryStudentId(event.target.value); setHistory([]) }} style={fieldStyle}><option value="">Choose a student</option>{activeStudents.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><button disabled={!historyStudentId || busy} onClick={loadHistory} style={S.btn('primary')}>Load History</button></div><div style={{ display: 'grid', gap: 8 }}>{history.map(row => { const section = row.davening_checklists.sections.find(item => item.id === row.section_id); const rating = row.davening_checklists.ratings.find(item => item.id === row.rating_id); return <div key={`${row.checklist_id}:${row.section_id}`} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 2px', display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 10, fontSize: 13 }}><b>{row.davening_checklists.checklist_date}</b><span>{row.davening_checklists.title} - {section?.label || row.section_id}</span><b>{rating?.code || row.rating_id}</b></div>})}{historyStudentId && !history.length && <div style={{ color: '#64748b', fontSize: 13 }}>No saved Davening marks loaded for this student.</div>}</div></>}
      </div>
    </section>
  </div>
}
