import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const screenshotDirectory = process.env.SHACHRIS_SCREENSHOT_DIR || 'docs'

const migration = readFileSync('supabase/migrations/20261005_shachris_checkpoint.sql', 'utf8')
const config = JSON.parse(migration.match(/values \('([\s\S]*?)'::jsonb\)/)[1])
config.stayMilestones = [
  { id: 'hodu', label: 'Start Hodu', order: 0 },
  { id: 'shemoneh-esrei', label: 'After Shemoneh Esrei', order: 1 },
  { id: 'chazaras-hashatz', label: 'After Chazaras HaShatz', order: 2 },
  { id: 'end-davening', label: 'End Davening', order: 3 },
]
config.stayRules = [
  { id: 'age-11', age: 11, milestoneId: 'shemoneh-esrei' },
  { id: 'age-12', age: 12, milestoneId: 'chazaras-hashatz' },
  { id: 'age-13', age: 13, milestoneId: 'end-davening' },
]
const settings = { config: structuredClone(config), revision: 0 }
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const session = { id: 'qa-session', session_date: today, config, started_at: null, started_by_name: '', milestone_times: {} }
let permission = 'edit'
let savedDob = '2014-11-28'
let eventMinute = 3
const progressionHistory = []
const stayHistory = []
const records = ['start', 'full', 'ashrei'].map((milestoneId, index) => {
  const progressMilestone = config.milestones.find(entry => entry.id === milestoneId)
  const age = 11 + index
  const stayMilestone = config.stayMilestones.find(entry => entry.id === config.stayRules.find(rule => rule.age === age).milestoneId)
  return {
    session_id: session.id,
    student_id: 1001 + index,
    expectation: { milestoneId, label: progressMilestone.label, sectionIds: [...progressMilestone.sectionIds], source: 'default' },
    stay_requirement: { age, requiredUntil: stayMilestone.id, label: stayMilestone.label, source: 'default' },
    presence: 'unmarked', arrival_at: null, last_return_at: null, leave_intervals: [],
    requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null,
    said_section_ids: [], rating_id: '', note: '', revision: 0, updated_by_name: '',
    late_minutes: null, late_reason: null, late_reason_note: '', late_excused: false, absence_status: null,
    personally_cleared_at: null, personally_cleared_by_name: '', personally_cleared_milestone: null, extra_stay_intervals: [], stayed_beyond_required: false,
  }
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
  else if (name === 'shachris_open_session') {
    assert.deepEqual(input.p_student_ids, [1001, 1002, 1003])
    response = { session, records }
  }
  else if (name === 'shachris_start_session') {
    session.started_at ||= `${today}T07:00:00.000Z`
    session.started_by_name = input.p_actor_name
    session.milestone_times.hodu ||= session.started_at
    response = session
  } else if (name === 'shachris_bulk_arrive_at_start') {
    response = input.p_student_ids.map(studentId => {
      const record = records.find(entry => entry.student_id === studentId)
      record.presence = 'present'
      record.arrival_at ||= session.started_at
      record.late_minutes = 0
      record.revision++
      return record
    })
  } else if (name === 'shachris_record_presence_event') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
    if (input.p_event_type === 'arrival') { record.presence = 'present'; record.arrival_at ||= at; record.late_minutes = Math.floor((Date.parse(record.arrival_at) - Date.parse(session.started_at)) / 60000); record.late_reason = 'no_reason'; record.absence_status = null }
    if (input.p_event_type === 'left') { record.presence = 'left'; record.leave_intervals.push({ leftAt: at, returnedAt: null, permission: input.p_permission }); if (record.extra_stay_intervals.at(-1)?.endedAt === null) { record.extra_stay_intervals.at(-1).endedAt = at; record.stayed_beyond_required = true } }
    if (input.p_event_type === 'returned') { record.presence = 'present'; record.last_return_at = at; record.leave_intervals.at(-1).returnedAt = at; if (record.personally_cleared_at) record.extra_stay_intervals.push({ startedAt: at, endedAt: null }) }
    record.revision++
    response = record
  } else if (name === 'shachris_mark_milestone') {
    const at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
    session.milestone_times[input.p_milestone_id] = at
    response = { session, records, metCount: 0, notMetCount: 0, alreadyMarked: false }
  } else if (name === 'shachris_update_daily_fact') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    assert.equal(input.p_record_revision, record.revision)
    if (input.p_action === 'late-reason') {
      record.late_reason = input.p_detail.reason
      record.late_reason_note = input.p_detail.note
      record.late_excused = input.p_detail.reason === 'excused' || input.p_detail.excused
    } else if (input.p_action === 'nonattendance') {
      record.presence = input.p_detail.status === 'unmarked' ? 'unmarked' : 'absent'
      record.absence_status = input.p_detail.status === 'unmarked' ? null : input.p_detail.status
    } else if (input.p_action === 'personal-clearance') {
      assert.equal(record.presence, 'present')
      assert.ok(session.milestone_times[record.stay_requirement.requiredUntil])
      record.personally_cleared_at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
      record.personally_cleared_by_name = input.p_actor_name
      record.personally_cleared_milestone = record.stay_requirement.requiredUntil
      record.requirement_result = 'met'
      record.extra_stay_intervals.push({ startedAt: record.personally_cleared_at, endedAt: null })
    }
    record.revision++
    response = record
  } else if (name === 'shachris_set_stay_requirement') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const milestone = config.stayMilestones.find(entry => entry.id === input.p_required_until)
    record.stay_requirement = { age: record.stay_requirement.age, requiredUntil: input.p_required_until, label: milestone.label, source: input.p_mode, duration: input.p_duration }
    record.requirement_result = 'pending'
    record.requirement_met_at = null
    record.requirement_met_milestone = null
    record.revision++
    const assignment = { id: `stay-${stayHistory.length}`, student_id: input.p_student_id, mode: input.p_mode, required_until: input.p_required_until, reason: input.p_reason, actor_name: input.p_actor_name, effective_date: today, duration: input.p_duration, created_at: now.toISOString() }
    stayHistory.unshift(assignment)
    response = { assignment, record }
  } else if (name === 'shachris_stay_expectations') response = stayHistory.filter(entry => entry.student_id === Number(url.searchParams.get('student_id')?.replace('eq.', '')))
  else if (name === 'shachris_expectations') response = progressionHistory.filter(entry => entry.student_id === Number(url.searchParams.get('student_id')?.replace('eq.', '')))
  else if (name === 'shachris_save_records') {
    response = input.p_records.map(incoming => {
      const record = records.find(entry => entry.student_id === incoming.student_id)
      assert.equal(record.revision, incoming.revision)
      Object.assign(record, incoming, { revision: record.revision + 1, updated_by_name: input.p_actor_name })
      return record
    })
  } else if (name === 'shachris_set_expectation') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const milestone = config.milestones.find(entry => entry.id === (input.p_mode === 'manual' ? input.p_milestone_id : config.fallbackMilestoneId))
    record.expectation = { milestoneId: milestone.id, label: milestone.label, sectionIds: input.p_mode === 'manual' ? input.p_section_ids : milestone.sectionIds, source: input.p_mode, duration: input.p_duration }
    record.revision++
    const assignment = { id: `progress-${progressionHistory.length}`, student_id: input.p_student_id, mode: input.p_mode, milestone_id: milestone.id, section_ids: input.p_mode === 'manual' ? input.p_section_ids : null, reason: input.p_reason, actor_name: input.p_actor_name, effective_date: today, duration: input.p_duration, created_at: now.toISOString() }
    progressionHistory.unshift(assignment)
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
  await page.getByRole('status').filter({ hasText: /Hodu started|Marked .* In Shul|Arrival recorded|Departure recorded|Return recorded|Communal milestone|Stay requirement saved|Settings saved|All changes saved|Late reason saved|Personal completion|Shul status saved/ }).waitFor()
}

try {
  const base = process.env.SHACHRIS_TEST_URL || 'http://localhost:5190'
  const url = `${base}/src/components/__tests__/fixtures/shachris-preview.html`
  await page.clock.install({ time: new Date(`${today}T07:30:00.000Z`) })
  await page.goto(url)
  await page.getByRole('button', { name: 'Start Session' }).waitFor()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.equal(await page.locator('.sh-live-card').count(), 3, await page.locator('body').innerText())
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Alef' }).textContent(), /Age 11.*Shemoneh Esrei/)
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Beis' }).textContent(), /Age 12.*Chazaras HaShatz/)
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' }).textContent(), /Age 13.*End Davening/)

  const expectedBeforeFilter = JSON.stringify(records.map(record => record.stay_requirement))
  assert.deepEqual(await page.getByLabel('Class or group').locator('option').allTextContents(), ['Entire roster', '7th Grade', '8th Grade'])
  await page.getByLabel('Class or group').selectOption('class:yk-a')
  assert.equal(await page.locator('.sh-live-card').count(), 1)
  assert.equal(JSON.stringify(records.map(record => record.stay_requirement)), expectedBeforeFilter)
  await page.getByLabel('Class or group').selectOption('all')

  await page.getByRole('button', { name: 'Start Session' }).click()
  await waitSaved()
  assert.equal(session.milestone_times.hodu, session.started_at)
  await page.getByLabel('Class or group').selectOption('class:yk-b')
  await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu' }).click()
  await waitSaved()
  assert.equal(records[0].arrival_at, session.started_at)
  assert.equal(records[1].arrival_at, session.started_at)
  await page.getByLabel('Class or group').selectOption('all')

  const age13Card = page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' })
  await age13Card.getByRole('button', { name: 'In Shul / Arrived' }).click()
  await waitSaved()
  assert.ok(Date.parse(records[2].arrival_at) > Date.parse(session.started_at))
  assert.match(await age13Card.textContent(), /min late/)
  await page.getByLabel('Late arrival reason option').selectOption('excused')
  await page.getByRole('button', { name: 'Save Reason' }).click()
  await waitSaved()
  assert.equal(records[2].late_excused, true)
  assert.match(await age13Card.locator('.sh-late-pill.excused').textContent(), /min late/)

  const age11Card = page.locator('.sh-live-card').filter({ hasText: 'Student Alef' })
  await age11Card.getByRole('button', { name: 'Left With Permission' }).click()
  await waitSaved()
  await age11Card.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  await age11Card.getByRole('button', { name: 'Left Without Permission' }).click()
  await waitSaved()
  await age11Card.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  assert.equal(records[0].leave_intervals.length, 2)
  assert.equal(records[0].leave_intervals[0].permission, 'with')
  assert.equal(records[0].leave_intervals[1].permission, 'without')

  const age12Card = page.locator('.sh-live-card').filter({ hasText: 'Student Beis' })
  await age12Card.getByRole('button', { name: 'Change requirement' }).click()
  await page.getByLabel('Required until milestone').selectOption('end-davening')
  await page.getByLabel('Stay requirement reason').fill('Temporary full davening')
  await page.getByRole('radio', { name: 'Today and future', exact: true }).check()
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(records[1].stay_requirement.source, 'manual')
  assert.equal(stayHistory[0].duration, 'future')
  await page.getByRole('button', { name: 'Close stay requirement' }).click()

  const age13Requirement = page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' })
  await age13Requirement.getByRole('button', { name: 'Change requirement' }).click()
  await page.getByLabel('Required until milestone').selectOption('shemoneh-esrei')
  await page.getByRole('radio', { name: 'Today only', exact: true }).check()
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(records[2].stay_requirement.duration, 'today')
  await page.getByRole('button', { name: 'Close stay requirement' }).click()
  await age13Requirement.getByRole('button', { name: 'Left Without Permission' }).click()
  await waitSaved()

  await page.getByRole('button', { name: 'Mark Now' }).first().click()
  await waitSaved()
  assert.equal(records[0].requirement_result, 'pending')
  assert.equal(records[2].requirement_result, 'pending')
  await age11Card.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  assert.ok(records[0].personally_cleared_at)
  await age11Card.getByRole('button', { name: 'Left With Permission' }).click()
  await waitSaved()
  assert.equal(records[0].requirement_result, 'met')
  assert.equal(records[1].requirement_result, 'pending')

  await age13Requirement.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  await age13Requirement.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  await page.locator('.sh-communal-milestone').filter({ hasText: 'After Chazaras HaShatz' }).getByRole('button', { name: 'Mark Now' }).click()
  await waitSaved()
  assert.equal(records[1].requirement_result, 'pending')
  await page.locator('.sh-communal-milestone').filter({ hasText: 'End Davening' }).getByRole('button', { name: 'Mark Now' }).click()
  await waitSaved()
  assert.equal(records[1].requirement_result, 'pending')
  await age12Card.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  assert.equal(records[1].requirement_result, 'met')
  assert.equal(records[2].requirement_result, 'met')
  assert.equal(records[0].stayed_beyond_required, true)

  assert.equal(await age11Card.locator('details.sh-progress-card').evaluate(node => node.open), false)
  await age11Card.locator('details.sh-progress-card > summary').click()
  assert.equal(await page.getByLabel('Student Alef: Shema').count(), 1)
  assert.match(await age11Card.locator('details.sh-progress-card').textContent(), /Next: Ashrei/)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-live-session-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-live-session-mobile.png`, fullPage: true })

  await page.getByRole('button', { name: 'Rules & Settings' }).click()
  assert.equal(await page.getByLabel('Age 11 required until').inputValue(), 'shemoneh-esrei')
  assert.equal(await page.getByLabel('Age 12 required until').inputValue(), 'chazaras-hashatz')
  assert.equal(await page.getByLabel('Age 13 required until').inputValue(), 'end-davening')
  assert.equal(await page.getByLabel('Arrival grace minutes').inputValue(), '2')
  await page.getByRole('button', { name: 'Live Session' }).click()
  permission = 'view'
  await page.reload()
  await page.getByRole('status').filter({ hasText: 'View only' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Correct Hodu Start', exact: true }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Start Session' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu' }).isDisabled(), true)

  await page.goto(`${url}?dob=1`)
  await page.getByLabel('Regular date of birth').fill('2013-10-06')
  await page.getByRole('button', { name: 'Save DOB' }).click()
  await page.getByRole('status').filter({ hasText: 'Date of birth saved.' }).waitFor()
  assert.equal(savedDob, '2013-10-06')
  assert.deepEqual(errors, [])
  console.log('PASS: shared secure adapter, late excusal, communal-only milestones, personal clearance, extra stay, repeated leave/return, stay overrides, view-only permissions, DOB save and mobile overflow. Synthetic data only; no school writes.')
} finally {
  await browser.close()
}
