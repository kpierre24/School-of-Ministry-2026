# HTEIM School of Ministry Portal

A Progressive Web App (PWA) and admin portal for Heaven Touching Earth International Ministries (HTEIM) School of Ministry — built to manage students, attendance, assignments, grades, payments, library resources, and AI-assisted lesson evaluation.

---

## Live demo / repo
Repository: https://github.com/kpierre24/School-of-Ministry-2026

## Key features
- Student management (profiles, enrollment, academic level)
- Attendance tracking with sync/merge policies for Google Sheets/CSV feeds
- Assignments, quizzes and exam management with submission workflow
- Grading and reports (honor roll, at-risk flags)
- Tuition/payment records and receipts
- Library/media resources (audio/video) with download/stream support
- PWA support (service worker) for basic offline buffering and sync
- AI-assisted lesson evaluation endpoint (Gemini integration) to generate summaries/key takeaways
- Admin/teacher/student roles and tailored UX

## Tech stack
- Language: TypeScript
- Frontend: React + Vite (SPA)
- Server: Express (Node) — dev middleware via Vite, bundled into dist/server.cjs for production
- PWA support: service worker (registered in src/main.tsx)
- Notable libraries: @supabase/supabase-js, firebase, @google/genai (Gemini), lucide-react, motion, recharts

## Project structure (top-level)
```
.env.example            # example environment variables
AGENTS.md               # developer & AI-agent guidelines (attendance rules, merge policy, etc.)
firebase-applet-config.json
firebase-blueprint.json
firestore.rules
index.html
package.json            # scripts, deps
server.ts               # express server + vite middleware + /api endpoints
src/                    # frontend source
  App.tsx               # main SPA (UI handlers, modals, routing)
  main.tsx              # React mount + service worker registration
  index.css             # global styles / Tailwind
  types.ts              # domain types (StudentProfile, Course, Quiz, etc.)
  components/           # UI components
  lib/                  # utilities
vite.config.ts
tsconfig.json
```

## How to run (development)
Prerequisites:
- Node (recommend v18+)
- npm or yarn (repo contains package-lock.json and bun.lock)

Install dependencies:
```bash
npm install
```

Run development server (Vite middleware + Express server):
```bash
npm run dev
```
- Development server runs on port 3000 (see `server.ts`).
- The server script uses `tsx server.ts` to run TypeScript server with Vite in middleware mode.

Build (production) and run:
```bash
npm run build
npm run start
```
- `npm run build` runs `vite build` and uses esbuild to bundle `server.ts` into `dist/server.cjs`
- `npm run start` runs `node dist/server.cjs`

Lint / types:
```bash
npm run lint   # runs `tsc --noEmit`
```

## Environment variables
See `.env.example`. Important variables:
- GEMINI_API_KEY — required for AI (Gemini) evaluation endpoint (/api/evaluate-lesson). Leave unset to use the fallback heuristic evaluator.
- APP_URL — app public URL (used for callbacks and self-referential links).
- VITE_SUPABASE_URL — Supabase project URL for client usage.
- VITE_SUPABASE_ANON_KEY — Supabase anon/public key.

Important: Do not commit secrets; use environment variables or your deployment secret manager.

## Notable server endpoints
- POST /api/evaluate-lesson
  - Accepts: { title, content, author, courseCode, fileName }
  - Uses Gemini when GEMINI_API_KEY is present to return structured JSON: { summary, category, keyTakeaways, courseCode }
  - Falls back to local heuristics if Gemini is unavailable.

- POST /api/pull-from-github
  - Accepts: { repoUrl } (optional)
  - Clones the given repo into a temporary directory and copies files into the current workspace (used for dev/agent workflows). Intended for controlled, trusted environments only.

See `server.ts` for implementation details and request/response formats.

## PWA & offline behavior
- Service worker registration is present in `src/main.tsx`.
- Offline attendance changes are buffered in localStorage and auto-synced when online (per AGENTS.md rules).
- Ensure `sw.js` is present on your public host when deploying the built app.

## Firebase & Supabase
- This project contains `firebase-applet-config.json`, `firebase-blueprint.json`, and `firestore.rules`.
- Supabase is used for cloud backup/state (client SDK present). Configure VITE_SUPABASE_* env vars before running the client.

## Development notes & resources
- Main app UI lives in `src/App.tsx` (very large single-file app). Consider breaking into smaller components/modules for maintainability.
- Domain types live in `src/types.ts` and should be the single source of truth for object shapes across frontend and server logic.
- Agent/developer guidelines, sync rules, and grading/attendance thresholds are documented in `AGENTS.md`.

## Testing & CI
- No test suite is included in the repo root. Start by adding unit tests for domain logic from `src/types.ts` and component tests for critical flows (attendance, assignments, payments).
- Linting is via TypeScript type checking (`npm run lint`).

## Deployment suggestions
- Build with `npm run build`.
- Ensure environment variables (GEMINI_API_KEY, SUPABASE keys, APP_URL) are configured in your hosting environment.
- Host static assets on any static host (Netlify, Vercel) and run the Node server for server endpoints (Cloud Run, Heroku, or a VPS). Alternatively, adapt server endpoints to serverless functions if preferred.
- If using Cloud Run / AI Studio, ensure secrets are injected through the platform's secret manager.

## Contributing
- Read `AGENTS.md` for project domain rules and guidelines (attendance thresholds, merge policy, canonicalization rules).
- Open issues or PRs for bugs, feature requests, or refactors. Please include reproduction steps and relevant screenshots or logs.

## Security & privacy
- Student data is sensitive. Ensure secure transport (HTTPS), strict access controls, and do not leak API keys or service role keys to the client.
- Review `firestore.rules` before deploying Firebase-backed features.

## Next steps / TODOs
- Break `src/App.tsx` into logical modules and add tests around attendance merging and payments.
- Add an integration test for /api/evaluate-lesson to validate AI fallback behavior when Gemini key is absent.
- Add a LICENSE file (this repo has none currently).

---

If you’d like, I can:
- commit this README to the repository,
- create a PR with a proposed refactor (split App into modules),
- or extract the attendance sync code paths mentioned in AGENTS.md for a focused audit.
