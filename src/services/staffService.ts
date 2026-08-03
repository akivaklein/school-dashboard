import { supabase } from '../supabaseClient'

export const STAFF_ROLE_OPTIONS = [
  'admin',
  'teacher',
  'rebbe',
  'menahel',
  'mashgiach',
  'therapist',
  'speech',
  'ot',
  'pt',
  'bcba',
  'social-counseling',
  'bt',
  'support',
  'office',
  'store',
  'staff',
] as const

export type StaffRole = typeof STAFF_ROLE_OPTIONS[number]

export interface StaffMemberRecord {
  id: number
  name: string
  role: string
  roles: string[]
  email: string
  phone: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface StaffAccountRecord {
  staffName: string
  fullName: string
  role: string
  roles: string[]
  email: string
  phone: string
  divisions: string
  assignments: string[]
  active: boolean
  accountState: 'active' | 'inactive' | 'pending' | 'missing'
  invitedAt?: string
  invitedBy?: string
  invitedByRole?: string
  lastSeenAt?: string
  updatedAt?: string
  updatedBy?: string
  updatedByRole?: string
}

interface AddStaffInput {
  name: string
  roles?: string[]
  email?: string
  phone?: string
  active?: boolean
}

interface UpdateStaffInput {
  name?: string
  role?: string
  roles?: string[]
  email?: string
  phone?: string
  active?: boolean
}

export const FALLBACK_STAFF_MEMBERS: StaffMemberRecord[] = [
  { id: 1, name: 'Rabbi Baum', role: 'admin', roles: ['admin'], email: '', phone: '', active: true },
  { id: 2, name: 'Rabbi Fried', role: 'admin', roles: ['admin'], email: '', phone: '', active: true },
  { id: 3, name: 'Rabbi Klein', role: 'teacher', roles: ['teacher'], email: '', phone: '', active: true },
  { id: 4, name: 'Rabbi Schults', role: 'teacher', roles: ['teacher'], email: '', phone: '', active: true },
  { id: 5, name: 'Shelly Wagschal', role: 'therapist', roles: ['therapist'], email: '', phone: '', active: true },
  { id: 6, name: 'Aryeh Schechter', role: 'therapist', roles: ['therapist'], email: '', phone: '', active: true },
  { id: 7, name: 'Mrs. Goldberg', role: 'therapist', roles: ['therapist'], email: '', phone: '', active: true },
  { id: 8, name: 'Canteen Register', role: 'staff', roles: ['staff'], email: '', phone: '', active: true },
]

function normalizeRole(role: string): string {
  const value = String(role || '').trim().toLowerCase()
  if (!value) return ''

  if (value === 'social counseling' || value === 'social-counseling') {
    return 'social-counseling'
  }

  if (value === 'yeshiva ketana rebbe' || value === 'rebbe') {
    return 'rebbe'
  }

  if (value === 'admin / office') {
    return 'admin'
  }

  return value.replace(/\s+/g, '-')
}

function humanizeRole(role: string): string {
  const normalized = normalizeRole(role)

  if (!normalized) return 'Staff'
  if (normalized === 'bt') return 'BT'
  if (normalized === 'bcba') return 'BCBA'
  if (normalized === 'ot') return 'OT'
  if (normalized === 'pt') return 'PT'
  if (normalized === 'social-counseling') return 'Social Counseling'

  return normalized
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function normalizeStaffRoles(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[,/|]/)
      : []

  const unique = new Set<string>()

  values
    .map(value => normalizeRole(String(value || '')))
    .filter(Boolean)
    .forEach(value => unique.add(value))

  if (unique.size === 0) {
    unique.add('staff')
  }

  return Array.from(unique)
}

export function formatStaffRoleLabel(roles: string[] | undefined, fallbackRole?: string): string {
  const normalized = normalizeStaffRoles(roles && roles.length > 0 ? roles : fallbackRole || 'staff')
  return normalized.map(humanizeRole).join(' + ')
}

export function staffMatchesAnyRole(member: Pick<StaffMemberRecord, 'role' | 'roles'>, rolePattern: RegExp): boolean {
  const roleText = [member.role, ...(member.roles || [])]
    .join(' ')
    .toLowerCase()

  return rolePattern.test(roleText)
}

function mapStaffRecord(row: Record<string, unknown> | null | undefined): StaffMemberRecord {
  const source = (row || {}) as Record<string, unknown>
  const roles = normalizeStaffRoles(source.roles || source.role)
  const rawActive = source.active
  const active = rawActive === false ? false : true

  return {
    id: Number(source.id ?? 0),
    name: String(source.name || ''),
    role: formatStaffRoleLabel(roles, String(source.role || '')),
    roles,
    email: String(source.email || ''),
    phone: String(source.phone || ''),
    active,
    created_at: typeof source.created_at === 'string' ? source.created_at : undefined,
    updated_at: typeof source.updated_at === 'string' ? source.updated_at : undefined,
  }
}

function normalizeStaffRows(input: unknown): StaffMemberRecord[] {
  if (!Array.isArray(input)) {
    return FALLBACK_STAFF_MEMBERS
  }

  const normalized = input
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    .map(item => mapStaffRecord(item))
    .filter(member => typeof member.name === 'string' && member.name.trim().length > 0)

  return normalized.length > 0 ? normalized : FALLBACK_STAFF_MEMBERS
}

export async function loadStaffMembers() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, roles, email, phone, active, created_at, updated_at')
      .order('name')

    if (error) {
      console.error('Failed to load staff members:', error)
      return FALLBACK_STAFF_MEMBERS
    }

    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_STAFF_MEMBERS
    }

    return normalizeStaffRows(data)
  } catch (error) {
    console.error('Error loading staff members:', error)
    return FALLBACK_STAFF_MEMBERS
  }
}

export async function getStaffById(id) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, roles, email, phone, active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to load staff member:', error)
      return null
    }

    return mapStaffRecord(data)
  } catch (error) {
    console.error('Error getting staff member:', error)
    return null
  }
}

export async function getStaffByName(name) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, roles, email, phone, active, created_at, updated_at')
      .eq('name', name)
      .single()

    if (error) {
      console.error('Failed to load staff member:', error)
      return null
    }

    return mapStaffRecord(data)
  } catch (error) {
    console.error('Error getting staff member by name:', error)
    return null
  }
}

export async function addStaffMember(nameOrInput: string | AddStaffInput, role = 'staff') {
  const normalizedInput: AddStaffInput =
    typeof nameOrInput === 'string'
      ? { name: nameOrInput, roles: [role] }
      : nameOrInput

  const roles = normalizeStaffRoles(normalizedInput.roles || role)

  try {
    const { data, error } = await supabase
      .from('staff')
      .insert([{
        name: normalizedInput.name,
        role: roles[0],
        roles,
        email: normalizedInput.email || null,
        phone: normalizedInput.phone || null,
        active: normalizedInput.active ?? true,
      }])
      .select()

    if (error) {
      console.error('Failed to add staff member:', error)
      return null
    }

    return data?.[0] ? mapStaffRecord(data[0]) : null
  } catch (error) {
    console.error('Error adding staff member:', error)
    return null
  }
}

export async function updateStaffMember(id, updates) {
  const normalizedUpdates: UpdateStaffInput = { ...updates }

  if (normalizedUpdates.roles || normalizedUpdates.role) {
    const roles = normalizeStaffRoles(normalizedUpdates.roles || normalizedUpdates.role)
    normalizedUpdates.roles = roles
    normalizedUpdates.role = roles[0]
  }

  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'email')) {
    normalizedUpdates.email = normalizedUpdates.email || ''
  }

  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'phone')) {
    normalizedUpdates.phone = normalizedUpdates.phone || ''
  }

  try {
    const { error } = await supabase
      .from('staff')
      .update({ ...normalizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Failed to update staff member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating staff member:', error)
    return false
  }
}

export async function deleteStaffMember(id) {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete staff member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return false
  }
}

export async function deactivateStaffMember(id) {
  return updateStaffMember(id, { active: false })
}

export async function reactivateStaffMember(id) {
  return updateStaffMember(id, { active: true })
}

export function buildStaffAccountData(staffMember: Partial<StaffMemberRecord> | null | undefined, overrides: Partial<StaffAccountRecord> = {}) {
  const normalizedStaff = staffMember || {}
  const role = String(normalizedStaff.role || '').trim() || 'staff'
  const roles = Array.isArray(normalizedStaff.roles) && normalizedStaff.roles.length > 0
    ? normalizedStaff.roles.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [role]

  return {
    staffName: String(normalizedStaff.name || '').trim(),
    fullName: String(normalizedStaff.name || '').trim(),
    role,
    roles,
    email: String(normalizedStaff.email || '').trim(),
    phone: String(normalizedStaff.phone || '').trim(),
    divisions: 'both',
    assignments: [],
    active: normalizedStaff.active !== false,
    accountState: 'missing',
    ...overrides,
  } as StaffAccountRecord
}

export function getStaffAccountStatus(account: Partial<StaffAccountRecord> | null | undefined) {
  if (!account) return 'no-account'
  if (account.accountState === 'pending') return 'pending-invitation'
  if (account.accountState === 'inactive' || account.active === false) return 'inactive-account'
  if (account.accountState === 'active') return 'active-account'
  if (account.accountState === 'missing') return 'no-account'
  if (account.active === true) return 'active-account'
  return 'no-account'
}
