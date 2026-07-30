export type DemoLoginAccount = {
  id: number | string
  name: string
  role: string
  roleLabel: string
  email?: string
  active?: boolean
}

export function normalizeLoginSearchText(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
}

export function getLastName(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return parts[parts.length - 1] || ''
}

export function getLoginRoleKey(role: string) {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'store' || normalized === 'staff' || normalized === 'canteen') return 'store'
  if (normalized === 'teacher' || normalized === 'rebbe') return 'teacher'
  if (normalized === 'therapist' || normalized === 'speech' || normalized === 'ot' || normalized === 'pt' || normalized === 'bcba' || normalized === 'social-counseling' || normalized === 'bt') return 'therapist'
  return 'admin'
}

export function buildLoginAccountRoleLabel(role: string) {
  const key = getLoginRoleKey(role)
  if (key === 'teacher') return 'Teacher'
  if (key === 'therapist') return 'Therapist'
  if (key === 'store') return 'Canteen'
  return 'Admin'
}

export function createLoginAccounts(accounts: Array<Partial<DemoLoginAccount> & { name: string; role: string }>): DemoLoginAccount[] {
  return accounts
    .filter(account => account?.name)
    .map((account, index) => ({
      id: account.id ?? `account-${index}`,
      name: String(account.name),
      role: String(account.role || 'admin'),
      roleLabel: buildLoginAccountRoleLabel(String(account.role || 'admin')),
      email: account.email ? String(account.email) : undefined,
      active: account.active ?? true,
    }))
    .filter(account => account.active !== false)
}

export function getMatchingLoginAccounts(accounts: DemoLoginAccount[], query: string, selectedRole: string) {
  const normalizedQuery = normalizeLoginSearchText(query)
  const normalizedRole = selectedRole && selectedRole !== 'all' ? selectedRole : ''

  return accounts.filter(account => {
    const roleMatches = !normalizedRole || getLoginRoleKey(account.role) === normalizedRole
    if (!roleMatches) return false
    if (!normalizedQuery) return true

    const normalizedName = normalizeLoginSearchText(account.name)
    const normalizedLastName = normalizeLoginSearchText(getLastName(account.name))
    return normalizedName.includes(normalizedQuery) || normalizedLastName.includes(normalizedQuery)
  })
}
