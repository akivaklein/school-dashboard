import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const source = readFileSync('docs/20261005_shachris_dob_import.sql', 'utf8')
const database = 'shachris_corrections'
const container = 'school-shachris-checkpoint-db'
function runSql(input) {
  return execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
}

const syntheticEntries = Array.from({ length: 16 }, (unused, index) => `(array['QA DOB Student ${index + 1}'], '2000-01-01')`).join(',\n')
const incompleteEntries = syntheticEntries.split(',\n').slice(0, 14).join(',\n')
const incompleteImport = source.replace(/insert into shachris_dob_input values[\s\S]*?;\n/, () => `insert into shachris_dob_input values\n${incompleteEntries};\n`)
assert.throws(() => runSql(incompleteImport), error => /exactly 16 reviewed DOBs/.test(String(error.stderr)))
const template = source.replace(/insert into shachris_dob_input values[\s\S]*?;\n/, () => `insert into shachris_dob_input values\n${syntheticEntries};\n`)
const seed = 'insert into public.students(id,name,is_active) select 100+row_number() over(order by names[1]),names[1],true from shachris_dob_input;\n'
const marker = 'create temporary table shachris_dob_matches'
const cases = [
  ['success', ''],
  ['missing', 'delete from public.students where id=101;\n'],
  ['duplicate', 'insert into public.students(id,name,is_active) select 5000,name,true from public.students where id=101;\n'],
  ['conflict', "update public.students set date_of_birth='1999-01-01' where id=101;\n"],
]
for (const [name, extra] of cases) {
  const input = template.replace(marker, () => seed + extra + marker).replace('commit;', () => "do $$ begin if (select count(*) from public.students where id>100 and date_of_birth='2000-01-01') <> 16 then raise exception 'Not all synthetic DOBs were imported'; end if; end $$; rollback;")
  if (name === 'success') runSql(input)
  else assert.throws(() => runSql(input), error => /DOB import stopped/.test(String(error.stderr)))
  console.log(`PASS: 16-entry synthetic DOB import ${name}`)
}
assert.match(runSql('select count(*) from public.students;'), /\b3\b/)
console.log('PASS: incomplete 14-entry import blocked; all synthetic cases rolled back; school database untouched.')