<div align="center">
  <img src="public/Stable.png" width="96" alt="StableApp logo" />
  <h1>StableApp</h1>
  <p><strong>A friendly desktop workspace for local MySQL development on Windows.</strong></p>
  <p>Onboarding environment check · private MySQL server · XAMPP-aware · Monaco-powered SQL editor · visual schema canvas</p>
  <p>
    <a href="https://github.com/Untitled-Master/stableapp/actions/workflows/ci.yml"><img src="https://github.com/Untitled-Master/stableapp/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://github.com/Untitled-Master/stableapp/releases"><img src="https://img.shields.io/github/v/release/Untitled-Master/stableapp" alt="Latest release" /></a>
  </p>
</div>

## Download

Grab the latest Windows installer or portable `.exe` from the
[**Releases page**](https://github.com/Untitled-Master/stableapp/releases).
Every `v*` tag is built automatically by GitHub Actions — no manual packaging.

> The installers are unsigned, so Windows SmartScreen will ask for confirmation on first run.

## What it does

- **Guided onboarding** — every launch starts with an environment check that detects MySQL, PHP, Apache, and XAMPP, and probes whether MySQL is reachable on `127.0.0.1:3306`.
- **Private MySQL server** — downloads a verified Oracle MySQL 8.4 LTS build, keeps its data + `safeStorage`-encrypted root password in your app profile, and runs on its own ports (3307+) so it never fights XAMPP or system services.
- **XAMPP integration** — one click opens the XAMPP Control Panel; reachable XAMPP MySQL instances get a one-click connect shortcut.
- **SQL editor** — real [Monaco](https://microsoft.github.io/monaco-editor/) (VS Code engine) with MySQL IntelliSense fed by your live databases, tables, and columns. `Ctrl+Enter` runs, results cap at 500 rows.
- **Schema canvas** — Supabase-style visual designer with foreign-key edges, zoom/pan controls, minimap, and click-to-query tables.
- **Workspace** — sidebar database browser with live filter, search tab, query history via recent connections, and English + French UI.
- **Personal touches** — light/dark/system modes, Vercel/GitHub/Grape accent packs, custom background image with transparency, custom dropdowns and checkboxes throughout.

## Run from source

Requires [Node.js](https://nodejs.org/) 22+.

```powershell
npm install
npm run dev        # Vite + Electron with hot reload
npm run dev:web    # browser-only preview (no Electron APIs)
npm run lint       # Oxlint
npm run build      # production renderer into dist/
npm start          # run Electron against dist/ (build first)
npm run dist       # installer + portable exe into release/
```

`npm run dev` serves Vite on `http://localhost:5173` and launches Electron against it;
`npm start` loads the packaged `dist/index.html` instead.

## How it's built

- **Renderer:** React 19 + Vite + Tailwind CSS v4, `react-i18next` (EN/FR in `src/locales/`)
- **Desktop shell:** Electron (`electron/main.cjs` owns all DB, filesystem, child-process, and `safeStorage` work; `electron/preload.cjs` exposes a narrow `contextBridge`)
- **Data:** `mysql2`, hardened `yauzl` extraction, `@xyflow/react` canvas, `@monaco-editor/react` editor

See [AGENTS.md](AGENTS.md) for contributor/agent notes (commands, IPC contract, conventions).

## CI/CD

- **CI** (`.github/workflows/ci.yml`): `npm ci` → `npm run lint` → `npm run build` on every push to `main` and every pull request.
- **Release** (`.github/workflows/release.yml`): every push to `main` rebuilds the Windows installer + portable exe and attaches them to the rolling **`dev` prerelease**; pushing a `v*` tag (e.g. `git tag v1.0.0 && git push origin v1.0.0`) publishes a stable release instead.

## License

Private project by Ahmed Belmehnouf — all rights reserved unless stated otherwise.
