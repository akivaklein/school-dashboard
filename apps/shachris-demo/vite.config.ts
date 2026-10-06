import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  envPrefix: 'SHACHRIS_DEMO_PUBLIC_',
  plugins: [react(), {
    name: 'shachris-only-boundary',
    generateBundle() {
      const allowed = ['/components/ShachrisWorkspace.tsx', '/components/ShachrisSettingsEditor.tsx', '/components/ShachrisWorkspace.css', '/utils/shachris.ts']
      const schoolSource = fileURLToPath(new URL('../../src/', import.meta.url))
      for (const moduleId of this.getModuleIds()) {
        if (moduleId.startsWith(schoolSource) && !allowed.some(path => moduleId.endsWith(path))) {
          this.error(`Unexpected school module in public demo: ${moduleId}`)
        }
        if (moduleId.includes('supabase')) this.error('Supabase must not be bundled in this demo.')
      }
      this.emitFile({ type: 'asset', fileName: 'vercel.json', source: readFileSync(new URL('./vercel.json', import.meta.url), 'utf8') })
    },
  }],
  build: { outDir: 'dist', sourcemap: false },
})