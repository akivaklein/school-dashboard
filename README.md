# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Supabase Migration Notes

The project now includes a first database migration for the event-based points ledger:

- `supabase/migrations/20260723_create_points_events.sql`
- `supabase/migrations/20260723_allow_zero_delta_points_events.sql`

Apply it in the Supabase SQL editor, or with your normal Supabase migration workflow if you add one later.

This table is intentionally append-only and stores every points change as its own event row. Role policies are not included yet; those will be added in the later permissions step.

If you already ran the first migration before the zero-delta reminder update was added, also run `supabase/migrations/20260723_allow_zero_delta_points_events.sql` so reminder events can be stored without changing the student's point balance.

Before using real student or staff data, you must enable and verify Supabase RLS policies for `public.points_events`. Running without RLS is acceptable only during local development while the permissions model is still being built.

## Polish Configuration Principle

For the polish/configuration phase, treat dropdown and list options as admin-managed data, not hardcoded code constants.

Principle:

- Admin users should be able to add, edit, activate/deactivate, and reorder option lists inside the app.
- New options must appear immediately across all screens that use that list.
- This applies broadly to subjects, categories, behavior types, store categories, and other currently fixed option sets.

Implementation rule:

- New feature work should avoid introducing new hardcoded dropdown options when the option set is expected to change operationally.
- Prefer persisted configuration tables (or a centralized config service) and admin-facing management UI in Setup/Settings.
