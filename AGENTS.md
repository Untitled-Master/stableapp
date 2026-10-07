# AGENTS.md

Single-package Vite + React 19 (plain JSX, no TypeScript) + Electron desktop app for local MySQL management. `README.md` is the stock Vite template — ignore it.

## Commands

- `npm install` after cloning.
- `npm run dev` — Vite on `http://localhost:5173` (`wait-on`) + `electron .`. Hardcoded in `electron/main.cjs`; don't change the port without updating both.
- `npm run dev:web` — renderer only, no Electron APIs (`window.stableApp` / `window.windowControls` are undefined; `src/App.jsx` guards with `?.` — keep those guards).
- `npm run build` then `npm start` — packaged renderer loads `dist/index.html`. `npm start` without a build serves stale output.
- `npm run dist` — `vite build` + `electron-builder --win` (NSIS installer + portable exe into `release/`). Windows icon is generated from `public/Stable.png` via `png-to-ico` into `build/icon.ico`. First run downloads signing/toolchain binaries.
- `npm run lint` — Oxlint only. No test script, typecheck, formatter, or CI. Verify changes with `npm run lint` + `npm run build`.

## Architecture

- Entrypoints: `src/main.jsx` → `src/App.jsx` (monolithic UI state; `localStorage` keys are `stableapp:*`); Electron `electron/main.cjs` (all DB, filesystem, child-process, `safeStorage` work) + `electron/preload.cjs` (narrow `contextBridge` only).
- `package.json` is `"type": "module"` but Electron main/preload must stay CommonJS (`.cjs`, `require`) with `contextIsolation: true, nodeIntegration: false`. Never expose unrestricted Node APIs.
- Renderer↔main contract is the preload surface: `window.stableApp.{detectLocalStack, openXampp, getManagedDatabaseStatus, setupManagedDatabase, startManagedDatabase, connectDatabase, listTables, getSchema, selectDatabase, runQuery, disconnectDatabase, onDatabaseSetupProgress}` and `window.windowControls.{minimize, maximize, close}`. Add new IPC in both `main.cjs` (`ipcMain.handle`) and `preload.cjs`. `detectLocalStack` also probes MySQL on `127.0.0.1:3306` (`xampp.mysqlReachable`); `openXampp` shells out to the detected `xampp-control.exe` via `shell.openPath` only.
- Managed MySQL is Windows-only (`win32` early-returns elsewhere): downloads Oracle MySQL 8.4.11 zip with MD5 check, extracts with hardened `yauzl` (traversal/symlink/size guards — keep them), stores under `app.getPath('userData')/managed-database`, root password in `safeStorage`-encrypted `root-password.bin`, probes ports 3307–3406. Default manual port is 3306.
- Frameless window (`frame: false`): headers use `WebkitAppRegion: 'drag'` with `no-drag` on buttons — preserve on any new header.

## Conventions

- `@/` alias → `src/` (defined in both `vite.config.js` and `jsconfig.json`); shadcn-style primitives in `src/components/ui/`, `cn()` in `src/lib/utils.js`; PascalCase components, kebab-case filenames (`app-navbar.jsx`); two-space indent, single quotes, no semicolons.
- Styling is Tailwind v4 CSS-first (`src/index.css`, `@theme inline`, `.dark` variant via class toggle) — no tailwind.config file.
- Oxlint enforces `react/rules-of-hooks`; keep component exports clean (`only-export-components` warns).
- UI copy lives in `src/locales/{en,fr}.json` via `i18next` + `react-i18next` (`src/i18n.js`, English + French only); use `t('section.key')` with interpolation (`{{var}}`) for every user-facing string — never hardcode copy. Backend/main-process messages stay English.
- Main-process inputs are validated (host/user/port ≤65535, db names via `mysql.escapeId`, SQL ≤100 KB, results capped at 500 rows). Reuse that pattern: validate in `main.cjs`, never pass renderer strings to shell, use `execFile`/`spawn` with arg arrays only.
