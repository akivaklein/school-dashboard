import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationPath = '../../../supabase/migrations/20260728_points_store_tx_functions.sql'
const migrationSql = readFileSync(new URL(migrationPath, import.meta.url), 'utf8')

describe('points/store transaction migration safeguards', () => {
  it('serializes same-key purchases and handles idempotency unique violations safely', () => {
    expect(migrationSql).toContain('perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));')
    expect(migrationSql).toContain('when unique_violation then')
    expect(migrationSql).toContain("'status', 'duplicate_completed'")
  })

  it('enforces one redemption per points_event_id with a duplicate-check guard', () => {
    expect(migrationSql).toContain('Cannot enforce unique points_event_id on store_redemptions: points_event_id % appears % times.')
    expect(migrationSql).toContain('create unique index if not exists store_redemptions_points_event_id_uidx')
    expect(migrationSql).toContain('on public.store_redemptions (points_event_id)')
    expect(migrationSql).toContain('where points_event_id is not null;')
  })
})
