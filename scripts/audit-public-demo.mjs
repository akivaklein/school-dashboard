import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

const root = process.cwd()
const scanDist = process.argv.includes('--dist')
const failures = []

function walk(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const forbiddenPaths = walk(root).filter((path) => {
  const projectPath = relative(root, path)
  if (projectPath.startsWith('node_modules/') || projectPath.startsWith('dist/') || projectPath.startsWith('.git/')) return false
  return basename(path).startsWith('.env') || projectPath.startsWith('api/') || /supabase/i.test(projectPath)
})

for (const path of forbiddenPaths) failures.push(`forbidden file: ${relative(root, path)}`)

const sourceFiles = [
  ...walk(join(root, 'src')),
  join(root, 'index.html'),
  join(root, 'vite.config.ts'),
  join(root, 'package.json'),
].filter((path) => existsSync(path) && ['.js', '.jsx', '.ts', '.tsx', '.json', '.html'].includes(extname(path)))

const sourceRules = [
  ['Supabase reference', /supabase/i],
  ['environment variable access', /import\.meta\.env|process\.env/],
  ['external data call', /\bfetch\s*\(|\baxios\b|XMLHttpRequest|WebSocket|EventSource|sendBeacon/],
  ['live API route', /["'`]\/api\//],
  ['authentication dependency', /LoginPage|type=["']password|signInWith|signOut\s*\(|\bauth\./],
]

for (const path of sourceFiles) {
  const content = readFileSync(path, 'utf8')
  for (const [label, pattern] of sourceRules) {
    if (pattern.test(content)) failures.push(`${label}: ${relative(root, path)}`)
  }
}

if (scanDist) {
  const bundleRules = [
    ['Supabase reference in bundle', /supabase/i],
    ['environment configuration in bundle', /VITE_SUPABASE|SUPABASE_URL|SUPABASE_KEY/],
    ['authentication dependency in bundle', /LoginPage|signInWithPassword|auth\.getSession/],
  ]
  for (const path of walk(join(root, 'dist')).filter((file) => ['.js', '.html'].includes(extname(file)))) {
    const content = readFileSync(path, 'utf8')
    for (const [label, pattern] of bundleRules) {
      if (pattern.test(content)) failures.push(`${label}: ${relative(root, path)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(`Public demo safety audit failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Public demo safety audit passed (${scanDist ? 'built bundle' : 'source'}).`)