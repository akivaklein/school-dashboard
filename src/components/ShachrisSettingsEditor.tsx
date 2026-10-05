import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { saveShachrisSettings, type ShachrisSettings } from '../services/shachrisService'
import { validateShachrisConfig } from '../utils/shachris'

type Props = { settings: ShachrisSettings; canEdit: boolean; onSaved: (settings: ShachrisSettings) => void }

export default function ShachrisSettingsEditor({ settings, canEdit, onSaved }: Props) {
  const [config, setConfig] = useState(() => structuredClone(settings.config))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const disabled = saving || !canEdit
  const dirty = JSON.stringify(config) !== JSON.stringify(settings.config)

  async function save() {
    const validation = validateShachrisConfig(config)
    if (validation) { setError(validation); return }
    setSaving(true)
    setError('')
    try {
      onSaved(await saveShachrisSettings({ config, revision: settings.revision }))
    } catch (caught) {
      setError(caught && typeof caught === 'object' && 'message' in caught ? String(caught.message) : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function moveSection(index: number, offset: number) {
    setConfig(previous => {
      const sections = [...previous.sections]
      const [section] = sections.splice(index, 1)
      sections.splice(index + offset, 0, section)
      return { ...previous, sections }
    })
  }

  return <div className="sh-settings">
    {error && <div role="alert" className="sh-error">{error}</div>}
    <section><h2>Sections</h2>{config.sections.map((section, index) => <div key={section.id} className="sh-settings-line"><input aria-label={`Section ${index + 1} name`} value={section.label} disabled={disabled} onChange={event => setConfig(previous => ({ ...previous, sections: previous.sections.map(entry => entry.id === section.id ? { ...entry, label: event.target.value } : entry) }))} /><button className="sh-icon" title="Move section up" aria-label={`Move ${section.label} up`} disabled={disabled || index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={16} /></button><button className="sh-icon" title="Move section down" aria-label={`Move ${section.label} down`} disabled={disabled || index === config.sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={16} /></button></div>)}<button className="sh-button" disabled={disabled} onClick={() => setConfig(previous => ({ ...previous, sections: [...previous.sections, { id: crypto.randomUUID(), label: 'New section' }] }))}><Plus size={16} /> Add Section</button></section>
    <section><h2>Milestones</h2>{config.milestones.map((milestone, index) => <div className="sh-milestone-edit" key={milestone.id}><input aria-label={`Milestone ${index + 1} name`} value={milestone.label} disabled={disabled} onChange={event => setConfig(previous => ({ ...previous, milestones: previous.milestones.map(entry => entry.id === milestone.id ? { ...entry, label: event.target.value } : entry) }))} /><div className="sh-milestone-checks">{config.sections.map(section => <label className="sh-check-label" key={section.id}><input type="checkbox" disabled={disabled} checked={milestone.sectionIds.includes(section.id)} onChange={event => setConfig(previous => ({ ...previous, milestones: previous.milestones.map(entry => entry.id === milestone.id ? { ...entry, sectionIds: event.target.checked ? [...entry.sectionIds, section.id] : entry.sectionIds.filter(id => id !== section.id) } : entry) }))} />{section.label}</label>)}</div></div>)}<button className="sh-button" disabled={disabled} onClick={() => setConfig(previous => ({ ...previous, milestones: [...previous.milestones, { id: crypto.randomUUID(), label: 'New milestone', sectionIds: [previous.sections[0].id] }] }))}><Plus size={16} /> Add Milestone</button></section>
    <section className="sh-stay-rules"><h2>Required Stay By Age</h2><p className="sh-muted">Automatic results are recorded when the communal milestone is marked.</p>{([11, 12, 13] as const).map(age => <label key={age}>Age {age}<select aria-label={`Age ${age} required until`} disabled={disabled} value={config.stayRules.find(rule => rule.age === age)?.milestoneId || ''} onChange={event => setConfig(previous => ({ ...previous, stayRules: event.target.value ? [...previous.stayRules.filter(rule => rule.age !== age), { id: previous.stayRules.find(rule => rule.age === age)?.id || `age-${age}`, age, milestoneId: event.target.value }] : previous.stayRules.filter(rule => rule.age !== age) }))}><option value="">No default</option>{config.stayMilestones.filter(milestone => milestone.id !== 'hodu').map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label>)}</section>
    <section className="sh-progress-rules"><h2>Davening Progress Defaults</h2><p className="sh-muted">Secondary checklist progression; separate from required stay.</p><label>School fallback<select value={config.fallbackMilestoneId} aria-label="Davening progress fallback milestone" disabled={disabled} onChange={event => setConfig(previous => ({ ...previous, fallbackMilestoneId: event.target.value }))}>{config.milestones.map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label>{config.rules.map((rule, index) => <div className="sh-rule" key={rule.id}><label>Actual Grade<select aria-label={`Davening rule ${index + 1} grade`} disabled={disabled} value={rule.grade} onChange={event => setConfig(previous => ({ ...previous, rules: previous.rules.map(entry => entry.id === rule.id ? { ...entry, grade: event.target.value as '7' | '8' } : entry) }))}>{(['7', '8'] as const).map(grade => <option key={grade} value={grade} disabled={config.rules.some(entry => entry.id !== rule.id && entry.grade === grade)}>{grade}th Grade</option>)}</select></label><label>Milestone<select aria-label={`Davening rule ${index + 1} milestone`} disabled={disabled} value={rule.milestoneId} onChange={event => setConfig(previous => ({ ...previous, rules: previous.rules.map(entry => entry.id === rule.id ? { ...entry, milestoneId: event.target.value } : entry) }))}>{config.milestones.map(milestone => <option key={milestone.id} value={milestone.id}>{milestone.label}</option>)}</select></label><button className="sh-icon" title="Remove progress default" aria-label={`Remove Davening rule ${index + 1}`} disabled={disabled} onClick={() => setConfig(previous => ({ ...previous, rules: previous.rules.filter(entry => entry.id !== rule.id) }))}><Trash2 size={16} /></button></div>)}<button className="sh-button" disabled={disabled || config.rules.length >= 2} onClick={() => setConfig(previous => ({ ...previous, rules: [...previous.rules, { id: crypto.randomUUID(), grade: previous.rules.some(rule => rule.grade === '7') ? '8' : '7', milestoneId: previous.fallbackMilestoneId }] }))}><Plus size={16} /> Add Progress Default</button></section>
    <section><h2>Ratings</h2>{config.ratings.map((rating, index) => <input key={rating.id} aria-label={`Rating ${index + 1} name`} disabled={disabled} value={rating.label} onChange={event => setConfig(previous => ({ ...previous, ratings: previous.ratings.map(entry => entry.id === rating.id ? { ...entry, label: event.target.value } : entry) }))} />)}<button className="sh-button" disabled={disabled} onClick={() => setConfig(previous => ({ ...previous, ratings: [...previous.ratings, { id: crypto.randomUUID(), label: 'New rating' }] }))}><Plus size={16} /> Add Rating</button></section>
    <div className="sh-settings-save"><button className="sh-button sh-primary" disabled={disabled || !dirty} onClick={() => void save()}><Save size={17} />{saving ? 'Saving...' : 'Save Settings'}</button></div>
  </div>
}