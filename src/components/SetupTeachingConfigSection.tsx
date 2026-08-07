import { useMemo, useState } from 'react'
import { createTeachingAction, deleteTeachingAction, saveAcademicCatalog } from '../services/setupCenterService'

export default function SetupTeachingConfigSection({
  setupActionDraft,
  setSetupActionDraft,
  setSetupCustomActions,
  setupCustomActions,
  academicCatalog,
  setAcademicCatalog,
  CLASSES,
  DIVISIONS,
  TEACHING_STAFF_OPTIONS,
  S,
}) {
  const [newSubjectLabel, setNewSubjectLabel] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [newSkillLabel, setNewSkillLabel] = useState('')
  const [catalogSaveStatus, setCatalogSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const subjects = useMemo(
    () => (academicCatalog?.subjects || []).slice().sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''))),
    [academicCatalog],
  )

  const selectedSubject = subjects.find(subject => subject.id === selectedSubjectId) || subjects[0] || null

  function updateCatalogSubject(subjectId, updater) {
    setAcademicCatalog(previous => ({
      ...previous,
      subjects: (previous?.subjects || []).map(subject => (
        subject.id === subjectId ? updater(subject) : subject
      )),
    }))
  }

  function toggleValue(values, value) {
    return values.includes(value)
      ? values.filter(item => item !== value)
      : [...values, value]
  }

  function addSubject() {
    const label = newSubjectLabel.trim()
    if (!label) return

    const exists = subjects.some(subject => subject.label.toLowerCase() === label.toLowerCase())
    if (exists) {
      alert('That subject already exists.')
      return
    }

    const id = `subject-${Date.now()}`
    setAcademicCatalog(previous => ({
      ...previous,
      subjects: [
        ...(previous?.subjects || []),
        {
          id,
          label,
          active: true,
          divisionKeys: [],
          classIds: [],
          teacherNames: [],
          skills: [],
        },
      ],
    }))
    setSelectedSubjectId(id)
    setNewSubjectLabel('')
  }

  function addSkill() {
    if (!selectedSubject) return
    const label = newSkillLabel.trim()
    if (!label) return

    const exists = (selectedSubject.skills || []).some(skill => skill.label.toLowerCase() === label.toLowerCase())
    if (exists) {
      alert('That skill/topic already exists for this subject.')
      return
    }

    updateCatalogSubject(selectedSubject.id, subject => ({
      ...subject,
      skills: [
        ...(subject.skills || []),
        { id: `skill-${Date.now()}`, label, active: true },
      ],
    }))
    setNewSkillLabel('')
  }

  async function saveCatalogNow() {
    if (!academicCatalog?.subjects?.length) return
    setCatalogSaveStatus('saving')
    const ok = await saveAcademicCatalog(academicCatalog)
    setCatalogSaveStatus(ok ? 'saved' : 'error')
    setTimeout(() => setCatalogSaveStatus('idle'), 2500)
  }

  async function handleAddAction() {
    const label = setupActionDraft.label.trim()
    if (!label) return

    try {
      const created = await createTeachingAction({
        label,
        points: Number(setupActionDraft.points || 0),
        category: setupActionDraft.category,
      })

      setSetupCustomActions(previous => [...previous, created])
      setSetupActionDraft({
        label: '',
        points: 1,
        category: 'Praise'
      })
    } catch (error) {
      console.error('Failed to create teaching action:', error)
      alert('Unable to add action. Please try again.')
    }
  }

  async function handleRemoveAction(actionId: string) {
    try {
      await deleteTeachingAction(actionId)
      setSetupCustomActions(previous =>
        previous.filter(item => item.id !== actionId)
      )
    } catch (error) {
      console.error('Failed to delete teaching action:', error)
      alert('Unable to remove action. Please try again.')
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16
    }}>
                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Add Teaching Action
                        </div>

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Reason
                        </label>

                        <input
                          value={setupActionDraft.label}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              label: event.target.value
                            }))
                          }
                          placeholder="Example: Brought back homework"
                          spellCheck
                          lang="en"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 10
                          }}
                        />

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Point amount
                        </label>

                        <input
                          type="number"
                          min="-20"
                          max="20"
                          value={setupActionDraft.points}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              points: Number(event.target.value)
                            }))
                          }
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 10
                          }}
                        />

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Category
                        </label>

                        <select
                          value={setupActionDraft.category}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              category: event.target.value
                            }))
                          }
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 12
                          }}
                        >
                          <option>Praise</option>
                          <option>Responsibility</option>
                          <option>Academic</option>
                          <option>Behavior Deduction</option>
                          <option>Other</option>
                        </select>

                        <button
                          onClick={handleAddAction}
                          style={S.btn('primary')}
                        >
                          Add Action
                        </button>
                      </div>

                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Custom Teaching Actions
                        </div>

                        <div style={{
                          display: 'grid',
                          gap: 8
                        }}>
                          {setupCustomActions.map(action => (
                            <div
                              key={action.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '11px 12px',
                                border: '1px solid #e0e7ef',
                                borderRadius: 10,
                                background: '#ffffff'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: '#2b3d54'
                                }}>
                                  {action.label}
                                </div>

                                <div style={{
                                  fontSize: 10.5,
                                  color: '#758398',
                                  marginTop: 3
                                }}>
                                  {action.category}
                                </div>
                              </div>

                              <div style={{
                                fontSize: 14,
                                fontWeight: 900,
                                color:
                                  action.points >= 0
                                    ? '#4f735a'
                                    : '#9b4358'
                              }}>
                                {action.points > 0 ? '+' : ''}
                                {action.points}
                              </div>

                              <button
                                onClick={() =>
                                  handleRemoveAction(action.id)
                                }
                                style={{
                                  border: 'none',
                                  background: '#f5f7fa',
                                  color: '#8a5160',
                                  borderRadius: 7,
                                  padding: '6px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <div style={{
                          color: '#68778a',
                          fontSize: 11
                        }}>
                          These settings are saved for the current environment and are available in Teaching Mode class actions.
                        </div>
                      </div>

      <div style={{ ...S.card, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#223046' }}>Academic Subjects and Skills</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              Add/edit subjects, archive inactive items, and assign by division, class, or teacher.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={newSubjectLabel}
              onChange={event => setNewSubjectLabel(event.target.value)}
              placeholder="Add subject (e.g. Gemara)"
              spellCheck
              lang="en"
              style={{ padding: '8px 10px', border: '1px solid #dce4ed', borderRadius: 8, minWidth: 220 }}
            />
            <button onClick={addSubject} style={S.btn('primary')}>Add Subject</button>
            <button
              onClick={saveCatalogNow}
              disabled={catalogSaveStatus === 'saving'}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid',
                borderColor: catalogSaveStatus === 'saved' ? '#bbf7d0' : catalogSaveStatus === 'error' ? '#fecaca' : '#dce4ed',
                background: catalogSaveStatus === 'saved' ? '#f0fdf4' : catalogSaveStatus === 'error' ? '#fef2f2' : '#f8fafc',
                color: catalogSaveStatus === 'saved' ? '#15803d' : catalogSaveStatus === 'error' ? '#dc2626' : '#334155',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {catalogSaveStatus === 'saving' ? 'Saving...' : catalogSaveStatus === 'saved' ? '✓ Saved' : catalogSaveStatus === 'error' ? '✗ Error' : '💾 Save'}
            </button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div style={{ border: '1px dashed #dce4ed', borderRadius: 10, padding: '14px 12px', color: '#64748b', fontSize: 12 }}>
            No subjects configured yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#fbfdff', maxHeight: 460, overflowY: 'auto' }}>
              {subjects.map(subject => {
                const isActive = selectedSubject?.id === subject.id
                return (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubjectId(subject.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: `1px solid ${isActive ? '#bfd2e6' : '#e2e8f0'}`,
                      background: isActive ? '#edf4fb' : '#fff',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'grid',
                      gap: 4,
                      marginBottom: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>{subject.label}</div>
                    <div style={{ fontSize: 11, color: subject.active ? '#4b6854' : '#9a6a2a', fontWeight: 700 }}>
                      {subject.active ? 'Active' : 'Archived'} · {(subject.skills || []).filter(skill => skill.active !== false).length} skills
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedSubject && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 700, flex: 1, minWidth: 220 }}>
                    Subject Name
                    <input
                      value={selectedSubject.label}
                      onChange={event => updateCatalogSubject(selectedSubject.id, subject => ({ ...subject, label: event.target.value }))}
                      spellCheck
                      lang="en"
                      style={{ padding: '8px 10px', border: '1px solid #dce4ed', borderRadius: 8 }}
                    />
                  </label>
                  <button
                    onClick={() => updateCatalogSubject(selectedSubject.id, subject => ({ ...subject, active: !subject.active }))}
                    style={selectedSubject.active ? S.btn('ghost') : S.btn('success')}
                  >
                    {selectedSubject.active ? 'Archive Subject' : 'Reactivate Subject'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Divisions
                      <button onClick={() => updateCatalogSubject(selectedSubject.id, s => ({ ...s, divisionKeys: Object.keys(DIVISIONS || {}) }))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {Object.entries(DIVISIONS || {}).map(([divisionKey, division]) => (
                        <label key={divisionKey} style={{ fontSize: 11, color: '#334155', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={(selectedSubject.divisionKeys || []).includes(divisionKey)}
                            onChange={() => updateCatalogSubject(selectedSubject.id, subject => ({ ...subject, divisionKeys: toggleValue(subject.divisionKeys || [], divisionKey) }))}
                          />
                          {division?.label || divisionKey}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Classes
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => updateCatalogSubject(selectedSubject.id, s => ({ ...s, classIds: (CLASSES || []).map(c => c.id) }))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>All</button>
                        <button onClick={() => updateCatalogSubject(selectedSubject.id, s => ({ ...s, classIds: [] }))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Clear</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 6, maxHeight: 132, overflowY: 'auto', paddingRight: 2 }}>
                      {(CLASSES || []).map(classItem => (
                        <label key={classItem.id} style={{ fontSize: 11, color: '#334155', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={(selectedSubject.classIds || []).includes(classItem.id)}
                            onChange={() => updateCatalogSubject(selectedSubject.id, subject => ({ ...subject, classIds: toggleValue(subject.classIds || [], classItem.id) }))}
                          />
                          {classItem.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Teachers
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => updateCatalogSubject(selectedSubject.id, s => ({ ...s, teacherNames: (TEACHING_STAFF_OPTIONS || []) }))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>All</button>
                        <button onClick={() => updateCatalogSubject(selectedSubject.id, s => ({ ...s, teacherNames: [] }))} style={{ fontSize: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Clear</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 6, maxHeight: 132, overflowY: 'auto', paddingRight: 2 }}>
                      {(TEACHING_STAFF_OPTIONS || []).map(teacherName => (
                        <label key={teacherName} style={{ fontSize: 11, color: '#334155', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={(selectedSubject.teacherNames || []).includes(teacherName)}
                            onChange={() => updateCatalogSubject(selectedSubject.id, subject => ({ ...subject, teacherNames: toggleValue(subject.teacherNames || [], teacherName) }))}
                          />
                          {teacherName}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e7edf5', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>Skills / Topics</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        value={newSkillLabel}
                        onChange={event => setNewSkillLabel(event.target.value)}
                        placeholder="Add skill/topic"
                        spellCheck
                        lang="en"
                        style={{ padding: '8px 10px', border: '1px solid #dce4ed', borderRadius: 8, minWidth: 200 }}
                      />
                      <button onClick={addSkill} style={S.btn('primary')}>Add Skill</button>
                    </div>
                  </div>

                  {(selectedSubject.skills || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>No skills/topics yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {(selectedSubject.skills || []).map(skill => (
                        <div key={skill.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 8px' }}>
                          <input
                            value={skill.label}
                            onChange={event => updateCatalogSubject(selectedSubject.id, subject => ({
                              ...subject,
                              skills: (subject.skills || []).map(item => item.id === skill.id ? { ...item, label: event.target.value } : item),
                            }))}
                            spellCheck
                            lang="en"
                            style={{ padding: '7px 8px', border: '1px solid #dce4ed', borderRadius: 7 }}
                          />
                          <button
                            onClick={() => updateCatalogSubject(selectedSubject.id, subject => ({
                              ...subject,
                              skills: (subject.skills || []).map(item => item.id === skill.id ? { ...item, active: !item.active } : item),
                            }))}
                            style={skill.active ? S.btn('ghost') : S.btn('success')}
                          >
                            {skill.active ? 'Archive' : 'Reactivate'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
