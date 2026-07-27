import { useMemo, useState } from 'react'
import {
  addStaffMember,
  STAFF_ROLE_OPTIONS,
  formatStaffRoleLabel,
  updateStaffMember,
  FALLBACK_STAFF_MEMBERS,
} from '../services/staffService'
import { renameSetupStaffReferences } from '../services/setupCenterService'

type StaffDirectoryMember = {
  id: number
  name: string
  role: string
  roles: string[]
  email?: string
  phone?: string
  active: boolean
}

type StaffDraft = {
  name: string
  roles: string[]
  email: string
  phone: string
}

const ROLE_OPTIONS = STAFF_ROLE_OPTIONS.filter(role => role !== 'staff')

function roleLabel(role: string): string {
  return formatStaffRoleLabel([role])
}

function categoryForRoles(roles: string[] = []) {
  const roleText = roles.join(' ')

  if (/menahel|mashgiach|admin/.test(roleText)) return 'Administration'
  if (/teacher|rebbe/.test(roleText)) return 'Teachers & Rebbeim'
  if (/therapist|speech|ot|pt|bcba|social-counseling/.test(roleText)) return 'Therapists & Clinicians'
  if (/office|store/.test(roleText)) return 'Office & Operations'
  return 'Support Staff'
}

function RoleSelector({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (roles: string[]) => void
}) {
  function toggleRole(role: string) {
    if (selected.includes(role)) {
      const next = selected.filter(item => item !== role)
      onChange(next.length > 0 ? next : ['staff'])
      return
    }
    onChange([...selected, role])
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 6 }}>
      {ROLE_OPTIONS.map(role => (
        <label
          key={role}
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            border: '1px solid #dce4ed',
            borderRadius: 8,
            background: selected.includes(role) ? '#edf4fb' : '#fff',
            color: selected.includes(role) ? '#2f4f72' : '#334155',
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(role)}
            onChange={() => toggleRole(role)}
          />
          {roleLabel(role)}
        </label>
      ))}
    </div>
  )
}

type StaffDirectoryPageProps = {
  S: {
    card: React.CSSProperties
    btn: (variant: string) => React.CSSProperties
    avatar: (index: number, size: number) => React.CSSProperties
  }
  staffMembers: StaffDirectoryMember[]
  initials: (name: string) => string
  onStaffChanged: () => Promise<void>
}

export default function StaffDirectoryPage({
  S,
  staffMembers,
  initials,
  onStaffChanged,
}: StaffDirectoryPageProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [addForm, setAddForm] = useState<StaffDraft>({
    name: '',
    roles: ['staff'],
    email: '',
    phone: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftById, setDraftById] = useState<Record<number, StaffDraft>>({})
  const [showInactive, setShowInactive] = useState(false)

  const directoryMembers = Array.isArray(staffMembers) && staffMembers.length > 0 ? staffMembers : FALLBACK_STAFF_MEMBERS

  const grouped = useMemo(() => {
    const base = {
      Administration: [] as StaffDirectoryMember[],
      'Teachers & Rebbeim': [] as StaffDirectoryMember[],
      'Therapists & Clinicians': [] as StaffDirectoryMember[],
      'Office & Operations': [] as StaffDirectoryMember[],
      'Support Staff': [] as StaffDirectoryMember[],
    }

    directoryMembers
      .filter(member => showInactive || member.active !== false)
      .forEach(member => {
        const category = categoryForRoles(member.roles || [])
        base[category].push(member)
      })

    Object.values(base).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name))
    })

    return base
  }, [directoryMembers, showInactive])

  function startEdit(member: StaffDirectoryMember) {
    setEditingId(member.id)
    setDraftById(prev => ({
      ...prev,
      [member.id]: {
        name: member.name,
        roles: member.roles?.length ? member.roles : ['staff'],
        email: member.email || '',
        phone: member.phone || '',
      },
    }))
  }

  async function handleCreateStaff() {
    if (!addForm.name.trim()) return

    try {
      setSaving(true)
      setError('')

      const created = await addStaffMember({
        name: addForm.name.trim(),
        roles: addForm.roles,
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        active: true,
      })

      if (!created) {
        setError('Could not create this staff member.')
        return
      }

      setAddForm({ name: '', roles: ['staff'], email: '', phone: '' })
      await onStaffChanged()
    } catch (createError) {
      console.error('Failed to create staff member:', createError)
      setError('Could not create this staff member.')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(memberId: number) {
    const draft = draftById[memberId]
    if (!draft || !draft.name.trim()) return
    const existing = directoryMembers.find(member => member.id === memberId)
    const oldName = existing?.name || ''
    const newName = draft.name.trim()

    try {
      setSaving(true)
      setError('')

      const ok = await updateStaffMember(memberId, {
        name: newName,
        roles: draft.roles,
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      })

      if (!ok) {
        setError('Could not save staff updates.')
        return
      }

      if (oldName && oldName !== newName) {
        const renamed = await renameSetupStaffReferences(oldName, newName)
        if (!renamed) {
          setError('Staff saved, but setup references were not fully renamed.')
        }
      }

      setEditingId(null)
      await onStaffChanged()
    } catch (saveError) {
      console.error('Failed to save staff update:', saveError)
      setError('Could not save staff updates.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(member: StaffDirectoryMember) {
    try {
      setSaving(true)
      setError('')

      const ok = await updateStaffMember(member.id, { active: !member.active })
      if (!ok) {
        setError('Could not update staff status.')
        return
      }

      await onStaffChanged()
    } catch (statusError) {
      console.error('Failed to toggle staff active state:', statusError)
      setError('Could not update staff status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 6px' }}>
          Staff Directory
        </h1>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Add, edit, and deactivate staff from a single source of truth used by the entire app.
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#223046' }}>Add Staff</div>
          <button onClick={() => setShowInactive(value => !value)} style={S.btn('ghost')}>
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            value={addForm.name}
            onChange={event => setAddForm(prev => ({ ...prev, name: event.target.value }))}
            placeholder="Full name"
            style={{ padding: '9px 10px', border: '1px solid #dce4ed', borderRadius: 9, fontSize: 12 }}
          />
          <input
            value={addForm.email}
            onChange={event => setAddForm(prev => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            style={{ padding: '9px 10px', border: '1px solid #dce4ed', borderRadius: 9, fontSize: 12 }}
          />
          <input
            value={addForm.phone}
            onChange={event => setAddForm(prev => ({ ...prev, phone: event.target.value }))}
            placeholder="Phone"
            style={{ padding: '9px 10px', border: '1px solid #dce4ed', borderRadius: 9, fontSize: 12 }}
          />
          <button onClick={handleCreateStaff} disabled={saving} style={S.btn('primary')}>
            {saving ? 'Saving...' : 'Add Staff Member'}
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 7 }}>Roles</div>
          <RoleSelector
            selected={addForm.roles}
            onChange={roles => setAddForm(prev => ({ ...prev, roles }))}
          />
        </div>

        {error && (
          <div style={{ marginTop: 10, color: '#991b1b', fontSize: 12, fontWeight: 700 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {Object.entries(grouped).map(([category, people]) => (
          <div key={category} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#223046' }}>{category}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{people.length} staff</div>
            </div>

            {people.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No staff in this category.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {people.map((person, index) => {
                  const isEditing = editingId === person.id
                  const draft = draftById[person.id]

                  return (
                    <div
                      key={`${category}-${person.id}`}
                      style={{
                        border: person.active ? '1px solid #e2e8f0' : '1px solid #fecaca',
                        borderRadius: 10,
                        padding: '10px 11px',
                        background: person.active ? '#fff' : '#fff7f7',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={S.avatar(index, 30)}>{initials(person.name)}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person.name}
                          </div>
                          <div style={{ fontSize: 11, color: person.active ? '#64748b' : '#9f1239', fontWeight: 700 }}>
                            {person.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>

                      {isEditing && draft ? (
                        <div style={{ display: 'grid', gap: 7 }}>
                          <input
                            value={draft.name}
                            onChange={event => setDraftById(prev => ({
                              ...prev,
                              [person.id]: { ...draft, name: event.target.value },
                            }))}
                            style={{ padding: '8px 9px', border: '1px solid #dce4ed', borderRadius: 8, fontSize: 12 }}
                          />
                          <input
                            value={draft.email}
                            onChange={event => setDraftById(prev => ({
                              ...prev,
                              [person.id]: { ...draft, email: event.target.value },
                            }))}
                            placeholder="Email"
                            style={{ padding: '8px 9px', border: '1px solid #dce4ed', borderRadius: 8, fontSize: 12 }}
                          />
                          <input
                            value={draft.phone}
                            onChange={event => setDraftById(prev => ({
                              ...prev,
                              [person.id]: { ...draft, phone: event.target.value },
                            }))}
                            placeholder="Phone"
                            style={{ padding: '8px 9px', border: '1px solid #dce4ed', borderRadius: 8, fontSize: 12 }}
                          />
                          <RoleSelector
                            selected={draft.roles}
                            onChange={roles => setDraftById(prev => ({
                              ...prev,
                              [person.id]: { ...draft, roles },
                            }))}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => saveEdit(person.id)} style={{ ...S.btn('primary'), flex: 1 }}>
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} style={{ ...S.btn('ghost'), flex: 1 }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                            {(person.roles || ['staff']).map(role => (
                              <span
                                key={`${person.id}-${role}`}
                                style={{
                                  borderRadius: 999,
                                  border: '1px solid #cbd5e1',
                                  background: '#f8fafc',
                                  padding: '2px 8px',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: '#334155',
                                }}
                              >
                                {roleLabel(role)}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {person.email || 'No email'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                            {person.phone || 'No phone'}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => startEdit(person)} style={{ ...S.btn('ghost'), flex: 1 }}>
                              Edit
                            </button>
                            <button
                              onClick={() => toggleActive(person)}
                              style={
                                person.active
                                  ? { ...S.btn('ghost'), flex: 1, borderColor: '#fecaca', color: '#9f1239' }
                                  : { ...S.btn('success'), flex: 1 }
                              }
                            >
                              {person.active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
