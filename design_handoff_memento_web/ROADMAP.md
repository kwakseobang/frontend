# Roadmap: Memento Web → React + Next.js + TypeScript (PWA)

Implementation plan for turning the design reference (`Memento Web.dc.html`, `README.md`, `screenshots/`) into a production app. Follow phases in order — each is independently shippable.

## Stack
- **Next.js (App Router) + TypeScript + React 18**
- CSS: styled-components, vanilla-extract, or plain CSS Modules — pick one, keep design tokens (see README) in a single `theme.ts` / `tokens.css`
- **PWA**: `next-pwa` (or hand-rolled `manifest.json` + service worker via Workbox) for installability + offline shell
- Auth/data layer: not specified by the design — use whatever the team's backend is (REST/GraphQL). Mock with local state first (see Phase 1).
- Image upload: real file input + object storage (S3/Cloudinary/etc.) replacing the prototype's gradient placeholders and `image-slot` drag-and-drop.

## Phase 0 — Project setup
- `create-next-app` (App Router, TS, ESLint).
- Add `theme.ts`: color tokens, type scale, spacing, radius from README's "Design Tokens" section.
- Load `Gowun Batang` + `Noto Sans KR` via `next/font/google`.
- Set up route structure matching screens: `/`, `/login`, `/signup`, `/(app)/home`, `/(app)/write`, `/(app)/entry/[id]`, `/(app)/profile`, `/(app)/profile/edit`, `/(app)/u/[username]`, `/(app)/u/[username]/[id]`.

## Phase 1 — Static screens (no backend)
- Build each screen as a component using the screenshots + README spec, with mock in-memory data (port the `memories` array from the DC's logic class as fixture data).
- Match exactly: card rotation/hover lift, filmstrip scroll-snap on detail, underline inputs, pill toggles, sidebar active-bar indicator.
- Reuse one `<MemoryCard>` component for timeline/list/public views (appears 3+ times — the one component worth extracting per the design's own componentization signal).

## Phase 2 — State & navigation
- Wire real client-side navigation (Next.js routing replaces the DC's `screen` state machine).
- Calendar/list toggle, date selection, write/edit form, delete confirm modal — port logic 1:1 from the DC's `Component` class (it's already a clean state-transition map, see README's "State Management").
- Form validation: text-or-image-required rule on save.

## Phase 3 — Real data & auth
- Connect to backend for memories CRUD, auth (login/signup), profile.
- Real image upload (replace `image-slot` placeholder): file picker + preview + upload to storage, progress state, remove/replace.
- Avatar upload on profile/edit-profile (shared across both views, per design).

## Phase 4 — PWA
- `manifest.json`: name "Memento", theme/background color `#0a0908`, icons (need real app icon asset — not in this design pass), `display: standalone`.
- Service worker: cache app shell + fonts; runtime caching for API reads; offline fallback for the write screen (queue writes when offline, sync on reconnect — journaling apps benefit a lot from this).
- Install prompt handling (`beforeinstallprompt`) — optional custom install CTA on landing.
- Verify Lighthouse PWA checklist (viewport meta, HTTPS, icons, manifest, offline 200).

## Phase 5 — Polish & QA
- Motion: port `fadeUp`/`drift` keyframes and hover transitions; respect `prefers-reduced-motion`.
- Responsive pass — the design is desktop-first (max-widths, 226px sidebar); decide mobile web behavior (collapse sidebar? bottom nav?) since this wasn't in scope of the design pass — flag to design if mobile web matters before PWA install on phones.
- Accessibility: focus states on underline inputs, alt text for images, keyboard nav for card grid.
- Cross-check every screen against its screenshot in `screenshots/` for pixel fidelity.

## Open questions for design (flag before building)
- Mobile-web layout isn't designed — PWA installs on phones too, so decide: reuse this desktop layout responsively, or is a separate mobile design coming?
- Real photo upload UX (multi-select, reorder, max count — prototype caps at 4) needs final confirmation.
- "전체 기록 / 공개 기록" stats and public-profile entry point were intentionally removed from 마이페이지 for this pass — planned to return later (see main README note).

## Resolved (2026-08-25)
- Mobile web: rebuild responsively (sidebar → bottom nav under a breakpoint), not desktop-only, not deferred.
- Image attachments: capped at **5** per memory (not 4).
- Mypage stats / public-profile-link: confirmed excluded from this pass.
- Backend: this app integrates directly with the existing `memento` Spring Boot API (see `../../memento/docs/api.md`) from Phase 3 onward, not a separate mock backend.
