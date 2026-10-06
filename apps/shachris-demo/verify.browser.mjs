import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.SHACHRIS_DEMO_URL || 'http://localhost:5191/'
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const requests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
  await page.goto(url)
  await page.locator('.sh-live-card').nth(15).waitFor()
  assert.equal(await page.locator('.sh-live-card').count(), 16)
  assert.equal(await page.getByRole('button', { name: 'School Day', exact: true }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Rules & Settings', exact: true }).count(), 0)
  assert.equal(await page.locator('input[type=password]').count(), 0)
  assert.equal(await page.getByLabel('Session date').isDisabled(), true)
  await page.screenshot({ path: '/tmp/shachris-demo-desktop.png', fullPage: true })

  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu', exact: true }).click()
  await page.locator('.sh-presence-badge.present').nth(15).waitFor()
  const first = page.locator('.sh-live-card').filter({ hasText: 'Aron Marcus' })
  await first.getByRole('button', { name: 'Left Without Permission', exact: true }).click()
  await first.getByRole('button', { name: 'Returned', exact: true }).waitFor()
  await page.locator('.sh-communal-milestone').filter({ hasText: 'After Shemoneh Esrei' }).getByRole('button', { name: 'Mark Now', exact: true }).click()
  await first.getByText('Requirement Not Met', { exact: true }).waitFor()
  await first.getByRole('button', { name: 'Returned', exact: true }).click()
  await first.getByRole('button', { name: 'Left With Permission', exact: true }).waitFor()
  assert.equal(await first.getByText('Requirement Not Met', { exact: true }).count(), 1)
  const second = page.locator('.sh-live-card').filter({ hasText: 'Avi Eisenberg' })
  assert.equal(await second.getByText('Met Requirement', { exact: true }).count(), 1)
  await second.getByRole('button', { name: 'Left With Permission', exact: true }).click()
  await second.getByRole('button', { name: 'Returned', exact: true }).waitFor()
  assert.equal(await second.getByText('Met Requirement', { exact: true }).count(), 1)

  await first.getByRole('button', { name: 'Change requirement', exact: true }).click()
  await page.getByLabel('Required until milestone').selectOption('end-davening')
  await page.getByRole('button', { name: 'Save Override', exact: true }).click()
  await page.getByText('Stay requirement saved for today only.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Close stay requirement', exact: true }).click()
  assert.match(await first.locator('.sh-stay-requirement').innerText(), /End Davening/)
  await page.getByRole('button', { name: 'Reload saved session', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.match(await first.locator('.sh-stay-requirement').innerText(), /End Davening/)

  await page.getByLabel('Class or group').selectOption('class:yk-b')
  assert.equal(await page.locator('.sh-live-card').count(), 8)
  await page.getByLabel('Find student').fill('Aron')
  assert.equal(await page.locator('.sh-live-card').count(), 1)
  await page.getByRole('button', { name: 'Reset demo session', exact: true }).click()
  await page.getByRole('button', { name: 'Start Session', exact: true }).waitFor()
  assert.equal(await page.locator('.sh-presence-badge.present').count(), 0)

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`)
    if (width === 390) await page.screenshot({ path: '/tmp/shachris-demo-mobile.png', fullPage: true })
    await page.locator('.sh-live-card').first().getByRole('button', { name: 'Change requirement', exact: true }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.getByRole('button', { name: 'Close stay requirement', exact: true }).click()
  }
  const data = await page.evaluate(() => ({ html: document.documentElement.outerHTML, local: { ...localStorage }, session: { ...sessionStorage } }))
  assert.doesNotMatch(JSON.stringify(data), /date_of_birth|supabase|\b(?:19\d{2}|20[01]\d)-\d{2}-\d{2}\b/i)
  for (const request of requests) {
    assert.equal(new URL(request).origin, new URL(url).origin, `Unexpected external request: ${request}`)
    assert.doesNotMatch(request, /\/api\/|\/rest\/|\/auth\//)
  }
  assert.deepEqual(errors, [])
  console.log(`Shachris demo browser passed at ${url}: 16 students, simulated workflow, reset, desktop/mobile, no external API or DOB data.`)
} finally {
  await browser.close()
}