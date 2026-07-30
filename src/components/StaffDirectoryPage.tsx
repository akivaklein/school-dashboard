import { useMemo, useState } from 'react'
import { buildStaffAccountData } from '../services/staffService'
import { matchesContextualSearch } from '../utils/contextualSearch'
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
  division?: string
  assignments?: string[]
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

function normalizeDirectoryMembers(input: StaffDirectoryMember[] | null | undefined): StaffDirectoryMember[] {
  const normalized = (Array.isArray(input) ? input : [])
    .filter((member): member is StaffDirectoryMember => !!member && typeof member === 'object' && typeof member.name === 'string' && member.name.trim().length > 0)
    .map(member => ({
      ...member,
      name: member.name.trim(),
      roles: Array.isArray(member.roles) && member.roles.length > 0
        ? member.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
        : (typeof member.role === 'string' && member.role.trim().length > 0 ? [member.role.trim()] : ['staff']),
      active: member.active !== false,
      email: typeof member.email === 'string' ? member.email : '',
      phone: typeof member.phone === 'string' ? member.phone : '',
    }))

  return normalized.length > 0 ? normalized : FALLBACK_STAFF_MEMBERS.map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
    roles: member.roles,
    email: member.email,
    phone: member.phone,
    active: member.active,
  }))
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
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [directorySearch, setDirectorySearch] = useState('')
  const [creatingAccountFor, setCreatingAccountFor] = useState<number | null>(null)

  const directoryMembers = normalizeDirectoryMembers(staffMembers)

  const grouped = useMemo(() => {
    const base = {
      Administration: [] as StaffDirectoryMember[],
      'Teachers & Rebbeim': [] as StaffDirectoryMember[],
      'Therapists & Clinicians': [] as StaffDirectoryMember[],
      'Office & Operations': [] as StaffDirectoryMember[],
      'Support Staff': [] as StaffDirectoryMember[],
    }

    const q = directorySearch.trim().toLowerCase()

    directoryMembers
      .filter(member => showInactive || member.active !== false)
      .filter(member => matchesContextualSearch(q, [member.name, member.role, member.roles.join(' '), member.email, member.phone]))
      .forEach(member => {
        const category = categoryForRoles(member.roles || [])
        base[category].push(member)
      })

    Object.values(base).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name))
    })

    return base
  }, [directoryMembers, directorySearch, showInactive])

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
    if (!addForm.name.trim()) return false

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
        return false
      }

      setAddForm({ name: '', roles: ['staff'], email: '', phone: '' })
      await onStaffChanged()
      return true
    } catch (createError) {
      console.error('Failed to create staff member:', createError)
      setError('Could not create this staff member.')
      return false
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

  async function createAccountForMember(member: StaffDirectoryMember) {
    try {
      setSaving(true)
      setError('')
      setCreatingAccountFor(member.id)

      const accountData = buildStaffAccountData(member, {
        active: true,
        accountState: 'active',
        divisions: member.division || 'both',
        assignments: member.assignments || [],
      })

      const accountPayload = {
        staffName: accountData.staffName,
        fullName: accountData.fullName,
        role: accountData.role,
        roles: accountData.roles,
        email: accountData.email,
        phone: accountData.phone,
        divisions: accountData.divisions,
        assignments: accountData.assignments,
        active: true,
        accountState: 'active' as const,
      }

      const stored = localStorage.getItem('demo-staff-accounts')
      const entries = stored ? JSON.parse(stored) : {}
      entries[member.name] = accountPayload
      localStorage.setItem('demo-staff-accounts', JSON.stringify(entries))
      await onStaffChanged()
    } catch (createError) {
      console.error('Failed to create account from staff directory:', createError)
      setError('Could not create the staff account.')
    } finally {
      setSaving(false)
      setCreatingAccountFor(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16243a', margin: '0 0 6px' }}>
          Staff Directory
          </h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Add, edit, and deactivate staff from a single source of truth used by the entire app.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={directorySearch}
            onChange={event => setDirectorySearch(event.target.value)}
            placeholder="Search staff"
            spellCheck
            lang="en"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12, width: 'min(100%, 220px)' }}
          />
          <button onClick={() => setShowInactive(value => !value)} style={S.btn('ghost')}>
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button onClick={() => setShowAddStaff(true)} style={S.btn('primary')}>
            + Add Staff
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#991b1b', fontSize: 12, fontWeight: 700 }}>
          {error}
        </div>
      )}

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
                            spellCheck
                            lang="en"
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
                          <div style={{ display: 'grid', gap: 6 }}>
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
                            <button onClick={() => createAccountForMember(person)} disabled={saving} style={{ ...S.btn('primary'), width: '100%' }}>
                              {creatingAccountFor === person.id ? 'Creating…' : 'Enable Login / Create Account'}
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

      {showAddStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ ...S.card, width: '100%', maxWidth: 760, padding: 0, border: '1px solid #dbe4ef' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#223046' }}>Add Staff</div>
              <button
                onClick={() => setShowAddStaff(false)}
                style={{ border: '1px solid #dce4ed', background: '#ffffff', color: '#475569', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  value={addForm.name}
                  onChange={event => setAddForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Full name"
                  spellCheck
                  lang="en"
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
                <button
                  onClick={async () => {
                    const created = await handleCreateStaff()
                    if (created) {
                      setShowAddStaff(false)
                    }
                  }}
                  disabled={saving}
                  style={S.btn('primary')}
                >
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
