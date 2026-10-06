import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const output = fileURLToPath(new URL('./dist', import.meta.url))
function audit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) { audit(path); continue }
    if (entry.name === 'vercel.json') {
      const config = JSON.parse(readFileSync(path, 'utf8'))
      assert.equal(config.framework, null)
      assert.equal(config.buildCommand, null)
      assert.equal(config.installCommand, null)
      assert.equal(config.functions, undefined)
      assert.equal(config.rewrites, undefined)
      assert.match(JSON.stringify(config.routes), /connect-src 'none'/)
      assert.equal(config.routes.at(-1).status, 404)
      continue
    }
    assert.match(entry.name, /\.(?:html|js|css)$/)
    const content = readFileSync(path, 'utf8')
    assert.doesNotMatch(content, /supabase|date_of_birth|service_role|sb_secret_|sbp_|student_notes|class_log|\/api\//i)
    assert.doesNotMatch(content, /\b(?:19\d{2}|20[01]\d)-\d{2}-\d{2}\b/)
    assert.doesNotMatch(content, /sourceMappingURL/)
  }
}
audit(output)
console.log('Shachris demo audit passed: static files only; no Supabase, DOB data, school API, or source maps.')