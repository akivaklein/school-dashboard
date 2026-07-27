import { useEffect, useState } from 'react'
import { CLASSES, DIVISIONS, CLASS_DIVISION } from './dashboardData'

type SchoolClass = {
  id: string
  name: string
  grade: string
  teacher: string
  divisionKey: string
}

type SchoolDivision = {
  label: string
  shortLabel: string
}

function loadStoredConfig<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`Unable to load ${key}:`, error)
    return fallback
  }
}

export default function SetupSchoolStructureSection({ S }) {
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>(() =>
    loadStoredConfig('school-dashboard-classes', CLASSES.map(cls => ({
      ...cls,
      divisionKey: CLASS_DIVISION[cls.id] || Object.keys(DIVISIONS)[0] || 'mesivta',
    })))
  )
  const [schoolDivisions, setSchoolDivisions] = useState<Record<string, SchoolDivision>>(() =>
    loadStoredConfig('school-dashboard-divisions', Object.fromEntries(
      Object.entries(DIVISIONS).map(([key, value]) => [key, { ...value }])
    ))
  )
  const [showClassEditor, setShowClassEditor] = useState(false)
  const [showDivisionEditor, setShowDivisionEditor] = useState(false)
  const [classForm, setClassForm] = useState({
    name: '',
    grade: '',
    teacher: '',
    divisionKey: Object.keys(DIVISIONS)[0] || 'mesivta',
  })
  const [divisionForm, setDivisionForm] = useState({
    key: '',
    label: '',
    shortLabel: '',
  })
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingDivisionKey, setEditingDivisionKey] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('school-dashboard-classes', JSON.stringify(schoolClasses))
      window.localStorage.setItem('school-dashboard-divisions', JSON.stringify(schoolDivisions))
    }

    CLASSES.splice(0, CLASSES.length, ...schoolClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      teacher: cls.teacher,
      divisionKey: cls.divisionKey,
    })))

    Object.keys(DIVISIONS).forEach(key => delete DIVISIONS[key])
    Object.entries(schoolDivisions).forEach(([key, value]) => {
      DIVISIONS[key] = { ...(value as SchoolDivision) }
    })

    Object.keys(CLASS_DIVISION).forEach(key => delete CLASS_DIVISION[key])
    schoolClasses.forEach(cls => {
      const divisionKey = cls.divisionKey || Object.keys(schoolDivisions)[0] || 'mesivta'
      CLASS_DIVISION[cls.id] = divisionKey
    })
  }, [schoolClasses, schoolDivisions])

  const defaultDivisionKey = Object.keys(schoolDivisions)[0] || 'mesivta'

  const resetClassForm = () => {
    setClassForm({
      name: '',
      grade: '',
      teacher: '',
      divisionKey: defaultDivisionKey,
    })
    setEditingClassId(null)
    setShowClassEditor(true)
  }

  const startEditClass = (cls: SchoolClass) => {
    setEditingClassId(cls.id)
    setClassForm({
      name: cls.name,
      grade: cls.grade || '',
      teacher: cls.teacher || '',
      divisionKey: cls.divisionKey || defaultDivisionKey,
    })
    setShowClassEditor(true)
  }

  const handleSaveClass = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = classForm.name.trim()
    const grade = classForm.grade.trim()
    const teacher = classForm.teacher.trim()
    const divisionKey = classForm.divisionKey || defaultDivisionKey

    if (!name || !grade) return

    if (editingClassId) {
      setSchoolClasses(previous =>
        previous.map(item =>
          item.id === editingClassId
            ? { ...item, name, grade, teacher, divisionKey }
            : item
        )
      )
    } else {
      setSchoolClasses(previous => [
        ...previous,
        {
          id: `class-${Date.now()}`,
          name,
          grade,
          teacher,
          divisionKey,
        },
      ])
    }

    setShowClassEditor(false)
    setEditingClassId(null)
    setClassForm({
      name: '',
      grade: '',
      teacher: '',
      divisionKey: defaultDivisionKey,
    })
  }

  const resetDivisionForm = () => {
    setDivisionForm({ key: '', label: '', shortLabel: '' })
    setEditingDivisionKey(null)
    setShowDivisionEditor(true)
  }

  const startEditDivision = (key: string, value: SchoolDivision) => {
    setEditingDivisionKey(key)
    setDivisionForm({ key, label: value.label, shortLabel: value.shortLabel })
    setShowDivisionEditor(true)
  }

  const handleSaveDivision = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const label = divisionForm.label.trim()
    const shortLabel = divisionForm.shortLabel.trim()
    const key = divisionForm.key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    if (!key || !label || !shortLabel) return

    setSchoolDivisions(previous => {
      const next = { ...previous }
      if (editingDivisionKey && editingDivisionKey !== key) {
        delete next[editingDivisionKey]
      }
      next[key] = { label, shortLabel }
      return next
    })

    if (editingDivisionKey && editingDivisionKey !== key) {
      setSchoolClasses(previous =>
        previous.map(item =>
          item.divisionKey === editingDivisionKey
            ? { ...item, divisionKey: key }
            : item
        )
      )
    }

    setShowDivisionEditor(false)
    setEditingDivisionKey(null)
    setDivisionForm({ key: '', label: '', shortLabel: '' })
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#223046' }}>Classes & Divisions</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Add, edit, and keep the structure that drives grouping, reporting, and access.</div>
          </div>
          <button
            onClick={resetClassForm}
            style={{ border: '1px solid #dbe7f1', background: '#ffffff', color: '#31506f', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Class
          </button>
        </div>

        {showClassEditor && (
          <form onSubmit={handleSaveClass} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10, background: '#f8fafc' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>{editingClassId ? 'Edit Class' : 'Add Class'}</div>
            <input
              value={classForm.name}
              onChange={event => setClassForm(previous => ({ ...previous, name: event.target.value }))}
              placeholder="Class name"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <input
              value={classForm.grade}
              onChange={event => setClassForm(previous => ({ ...previous, grade: event.target.value }))}
              placeholder="Grade"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <input
              value={classForm.teacher}
              onChange={event => setClassForm(previous => ({ ...previous, teacher: event.target.value }))}
              placeholder="Teacher"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <select
              value={classForm.divisionKey}
              onChange={event => setClassForm(previous => ({ ...previous, divisionKey: event.target.value }))}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            >
              {Object.entries(schoolDivisions).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>{editingClassId ? 'Save Class' : 'Create Class'}</button>
              <button type="button" onClick={() => setShowClassEditor(false)} style={{ ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {schoolClasses.map(cls => (
            <div key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#223046', fontSize: 13 }}>{cls.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cls.grade || 'Grade pending'}{cls.teacher ? ` · ${cls.teacher}` : ''}</div>
                <div style={{ fontSize: 11, color: '#4f6687', marginTop: 4 }}>{schoolDivisions[cls.divisionKey]?.label || 'Division pending'}</div>
              </div>
              <button onClick={() => startEditClass(cls)} style={{ border: '1px solid #dbe7f1', background: '#f8fbff', color: '#31506f', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#223046' }}>Divisions</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Adjust the division labels and short codes used across the dashboard.</div>
          </div>
          <button
            onClick={resetDivisionForm}
            style={{ border: '1px solid #dbe7f1', background: '#ffffff', color: '#31506f', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Division
          </button>
        </div>

        {showDivisionEditor && (
          <form onSubmit={handleSaveDivision} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10, background: '#f8fafc' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>{editingDivisionKey ? 'Edit Division' : 'Add Division'}</div>
            <input
              value={divisionForm.key}
              onChange={event => setDivisionForm(previous => ({ ...previous, key: event.target.value }))}
              placeholder="Internal key (example: yeshiva_ketana)"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <input
              value={divisionForm.label}
              onChange={event => setDivisionForm(previous => ({ ...previous, label: event.target.value }))}
              placeholder="Display label"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <input
              value={divisionForm.shortLabel}
              onChange={event => setDivisionForm(previous => ({ ...previous, shortLabel: event.target.value }))}
              placeholder="Short label"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>{editingDivisionKey ? 'Save Division' : 'Create Division'}</button>
              <button type="button" onClick={() => setShowDivisionEditor(false)} style={{ ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(schoolDivisions || {}).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#223046', fontSize: 13 }}>{value.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{value.shortLabel} · {key}</div>
              </div>
              <button onClick={() => startEditDivision(key, value)} style={{ border: '1px solid #dbe7f1', background: '#f8fbff', color: '#31506f', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
