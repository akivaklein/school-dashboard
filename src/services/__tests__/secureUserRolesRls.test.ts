import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260806_secure_user_roles_and_admin_rls.sql'),
  'utf8',
)

describe('secure user_roles RLS', () => {
  it('keeps row level security enabled', () => {
    expect(migration).toContain('alter table public.user_roles enable row level security')
  })

  it('only lets a user read their own active role', () => {
    expect(migration).toContain('create policy user_roles_select_own_active')
  })

  it('keeps anonymous access revoked', () => {
    expect(migration).toContain('revoke all on table public.user_roles from anon')
  })

  it('restricts writes to admins', () => {
    expect(migration).toContain('create policy user_roles_insert_admin')
    expect(migration).toContain('create policy user_roles_update_admin')
    expect(migration).toContain('create policy user_roles_delete_admin')
  })
})
