import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const migration = readFileSync('supabase/migrations/20261005_shachris_checkpoint.sql', 'utf8')
const config = JSON.parse(migration.match(/values \('([\s\S]*?)'::jsonb\)/)[1])
const settings = { config: structuredClone(config), revision: 0 }
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const session = { id: 'qa-session', session_date: today, config }
let permission = 'edit'
let failSave = false
let savedDob = '2014-11-28'
const history = []
const records = ['start', 'full', 'ashrei'].map((milestoneId, index) => {
  const milestone = config.milestones.find(entry => entry.id === milestoneId)
  return { session_id: session.id, student_id: 1001 + index, expectation: { milestoneId, label: milestone.label, sectionIds: [...milestone.sectionIds], source: index ? 'manual' : 'default' }, presence: ['present', 'unmarked', 'absent'][index], said_section_ids: [], rating_id: index ? '' : 'ni', note: '', revision: 0, updated_by_name: '' }
})
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript(() => { window.__SHACHRIS_BROWSER_TEST__ = true })
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.route('**/rest/v1/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const name = url.pathname.split('/').at(-1)
  const input = request.postDataJSON() || {}
  let response
  if (name === 'shachris_settings') response = settings
  else if (name === 'dashboard_current_permissions') response = { attendance: permission, setup: permission }
  else if (name === 'shachris_open_session') response = { session, records }
  else if (name === 'shachris_expectations') response = history.filter(entry => entry.student_id === Number(url.searchParams.get('student_id')?.replace('eq.', '')))
  else if (name === 'shachris_save_records') {
    if (failSave) {
      failSave = false
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'Another staff member changed this session. Reload before saving.' }) })
      return
    }
    response = input.p_records.map(incoming => {
      const record = records.find(entry => entry.student_id === incoming.student_id)
      assert.equal(record.revision, incoming.revision)
      Object.assign(record, incoming, { revision: record.revision + 1, updated_by_name: input.p_actor_name })
      return record
    })
  } else if (name === 'shachris_set_expectation') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    assert.equal(record.revision, input.p_record_revision)
    const milestone = config.milestones.find(entry => entry.id === (input.p_mode === 'manual' ? input.p_milestone_id : config.fallbackMilestoneId))
    record.expectation = { milestoneId: milestone.id, label: milestone.label, sectionIds: input.p_mode === 'manual' ? input.p_section_ids : milestone.sectionIds, source: input.p_mode, duration: input.p_duration }
    record.revision++
    const assignment = { id: `qa-${history.length}`, student_id: input.p_student_id, mode: input.p_mode, milestone_id: milestone.id, section_ids: input.p_mode === 'manual' ? input.p_section_ids : null, reason: input.p_reason, actor_name: input.p_actor_name, effective_date: today, duration: input.p_duration, created_at: now.toISOString() }
    history.unshift(assignment)
    response = { assignment, record }
  } else if (name === 'shachris_save_settings') {
    assert.equal(settings.revision, input.p_revision)
    settings.config = input.p_config
    settings.revision++
    response = settings
  } else if (name === 'students') {
    savedDob = input.date_of_birth
    response = { id: 1001, date_of_birth: savedDob }
  } else throw new Error(`Unexpected API: ${name}`)
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) })
})

async function waitSaved() {
  await page.getByRole('status').filter({ hasText: /All changes saved|Expectation saved/ }).waitFor()
}

try {
  const base = process.env.SHACHRIS_TEST_URL || 'http://localhost:5190'
  const url = `${base}/src/components/__tests__/fixtures/shachris-preview.html`
  await page.goto(url)
  await page.getByRole('button', { name: 'Complete Present Requirements' }).waitFor()
  await page.getByLabel('Class or group').selectOption('class:yk-b')
  assert.equal(await page.locator('.sh-student-row').count(), 2)
  await page.getByRole('button', { name: 'Complete Present Requirements' }).click()
  await waitSaved()
  assert.equal(records[0].said_section_ids.length, 1)
  assert.equal(records[1].said_section_ids.length, 0)
  assert.equal(records[2].said_section_ids.length, 0)
  assert.deepEqual(records.map(record => record.presence), ['present', 'unmarked', 'absent'])
  assert.equal(records[0].rating_id, 'ni')
  await page.getByRole('button', { name: 'All In Shul' }).click()
  await waitSaved()
  assert.deepEqual(records.map(record => record.presence), ['present', 'present', 'absent'])
  await page.getByLabel('Class or group').selectOption('all')
  await page.getByRole('button', { name: 'Complete Present Requirements' }).click()
  await waitSaved()
  assert.equal(records[1].said_section_ids.length, 4)
  assert.equal(records[2].said_section_ids.length, 0)
  const studentRow = page.locator('.sh-student-row').filter({ hasText: 'Student Alef' })
  await studentRow.getByRole('button', { name: 'Expectation / History' }).click()
  await page.getByLabel('Current milestone').selectOption('ashrei')
  await page.getByLabel('Expectation change reason').fill('Ready for Ashrei')
  await page.getByRole('radio', { name: 'Today and future', exact: true }).check()
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(records[0].expectation.source, 'manual')
  assert.equal(records[0].expectation.sectionIds.length, 2)
  assert.equal(history[0].duration, 'future')
  await page.screenshot({ path: 'docs/shachris-checkpoint-progression.png', fullPage: true })
  await page.getByRole('button', { name: 'Close expectation' }).click()
  await page.reload()
  await page.locator('.sh-student-row').first().waitFor()
  assert.match(await page.locator('.sh-student-row').filter({ hasText: 'Student Alef' }).textContent(), /Through Ashrei.*Manual/)
  assert.match(await page.locator('.sh-student-row').filter({ hasText: 'Student Alef' }).textContent(), /Next: Shema/)
  assert.equal(await page.getByLabel('Student Beis: Shema').isChecked(), true)
  await page.locator('.sh-student-row').filter({ hasText: 'Student Beis' }).getByRole('button', { name: 'Expectation / History' }).click()
  assert.equal(await page.getByRole('radio', { name: 'Today only', exact: true }).isChecked(), true)
  await page.getByLabel('Current milestone').selectOption('ashrei')
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(history[0].duration, 'today')
  await page.getByRole('button', { name: 'Close expectation' }).click()
  await page.reload()
  await page.locator('.sh-student-row').first().waitFor()
  assert.match(await page.locator('.sh-student-row').filter({ hasText: 'Student Beis' }).textContent(), /Today only/)
  await page.getByLabel('Set rating for visible students').selectOption('g')
  await waitSaved()
  assert.equal(records[0].rating_id, 'g')
  assert.equal(records[2].presence, 'absent')
  failSave = true
  await page.locator('.sh-student-row').filter({ hasText: 'Student Alef' }).getByRole('button', { name: 'Left', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Another staff member' }).waitFor()
  assert.equal(records[0].presence, 'present')
  assert.equal(await page.locator('.sh-student-row').filter({ hasText: 'Student Alef' }).getByRole('button', { name: 'In Shul', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: 'Reload saved session' }).click()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  await page.screenshot({ path: 'docs/shachris-checkpoint-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.screenshot({ path: 'docs/shachris-checkpoint-mobile.png', fullPage: true })
  await page.locator('.sh-student-row').filter({ hasText: 'Student Beis' }).getByRole('button', { name: 'Expectation / History' }).click()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('radio', { name: 'Today and future', exact: true }).check()
  await page.getByRole('button', { name: 'Close expectation' }).click()
  await page.getByRole('button', { name: 'Rules & Settings' }).click()
  await page.getByLabel('School fallback milestone').selectOption('shema')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await page.getByRole('status').filter({ hasText: 'Settings saved' }).waitFor()
  assert.equal(settings.config.fallbackMilestoneId, 'shema')
  await page.getByRole('button', { name: 'Live Session', exact: true }).click()
  permission = 'view'
  await page.reload()
  await page.getByRole('status').filter({ hasText: 'View only' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'All In Shul' }).isDisabled(), true)
  await page.goto(`${url}?dob=1`)
  await page.getByLabel('Regular date of birth').fill('2013-10-06')
  await page.getByRole('button', { name: 'Save DOB' }).click()
  await page.getByRole('status').filter({ hasText: 'Date of birth saved.' }).waitFor()
  assert.equal(savedDob, '2013-10-06')
  assert.deepEqual(errors, [])
  console.log('PASS: filtered bulk requirements, independent presence/rating, manual override/history, refresh, rollback, read-only access, DOB save, and mobile overflow. Screenshots in docs/. Browser APIs used synthetic fixtures; no school writes.')
} finally {
  await browser.close()
}