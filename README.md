# Love Portal ♥

*A little corner of the internet that belongs only to you two.*

A private web app for two people: shared memories, a real-time chat, sealed love letters, date ideas,
games, surprises, a timeline of your story, a playlist, mood sharing, milestones and an AI writing assistant.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Lucide · Firebase (Auth, Firestore, Storage).
UI primitives (buttons, cards, modals, toasts, …) are hand-built in `src/components/ui` rather than generated with the shadcn CLI.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

With no Firebase keys the app still runs: the landing page works and **`/demo`** opens a fully interactive
demo couple (Adhidev & Ridhika) backed by an in-memory store. Demo data lives only in memory, is clearly bannered,
and never touches Firebase.

### Connect your Firebase project (`new-project-f8d4e`)

Sign-in methods: **Email/Password** and **Google**. `.firebaserc` already points at `new-project-f8d4e`.

On your own computer (this needs a browser login, so it can't run in a locked-down sandbox):

```bash
npm install
npx -y firebase-tools@latest login
SUPPORT_EMAIL=you@example.com npm run firebase:setup
```

`scripts/setup-firebase.mjs` follows the Firebase agent-skills workflow: it selects the project, registers a web app if none
exists, writes `.env` from `apps:sdkconfig`, enables both sign-in providers via the `auth` block in `firebase.json`, and deploys
`auth`, Firestore rules/indexes and Storage rules. Before it runs, create the databases once in the console
(**Build → Firestore Database**, **Build → Storage**). Add your deployed domain under **Authentication → Settings → Authorized domains**
(`localhost` is allowed by default).

Prefer to do it by hand? `npx -y firebase-tools@latest apps:create WEB "Love Portal"`, then
`apps:sdkconfig WEB <APP_ID>` → copy the values into `.env` (see `.env.example`), then
`npx -y firebase-tools@latest deploy --only auth,firestore,storage`.

### Local development with the Firebase Emulator Suite

```bash
npm run emulators                      # auth + firestore + storage on 127.0.0.1
VITE_USE_EMULATORS=true npm run dev    # with demo-* project keys in .env
npm run test:rules                     # 76 Firestore security-rule tests (needs Java)
```

Verification emails appear in the emulator log / `http://127.0.0.1:9099/emulator/v1/projects/<id>/oobCodes`.

## How it works

### Pairing two accounts
1. Every user gets a unique code like `LOVE-7X92` (`connectionCodes/{code}` – exact-code lookup only, no listing).
2. Person A shares the code / QR / invite link (`/connect?code=…`). Person B enters it, sees *“Is this your person?”* and sends a request
   (`connectionRequests/{from}_{to}`: one doc per pair ⇒ no duplicates; expires after 7 days).
3. Person A sees *“Ridhika wants to connect with you ❤️”* and accepts. One **atomic batch** marks the request accepted,
   creates `couples/{coupleId}` (the Couple ID) and writes `partnerLinks/{uid}` for both people.
   The rules refuse the batch if either person already has a link, so **one partner per user** is enforced server-side.
4. Both get the connection ceremony. Disconnecting deletes both links.

### Data model (Firestore)
`users`, `connectionCodes`, `connectionRequests`, `partnerLinks`, `couples`, and couple-owned collections —
`messages`, `memories`, `letters`, `dateIdeas`, `games`, `surprises`, `coupons`, `timelineEvents`, `playlist`, `moods`,
`notifications` — each document carries a `coupleId`. Files live in Storage under `couples/{coupleId}/…` and `users/{uid}/avatar.jpg`.

### Security
* `firestore.rules` / `storage.rules`: access requires a verified email **and** membership of the document’s couple.
  Partners may only react/pin/favourite each other’s messages, mark letters opened, redeem coupons, etc. (field-level `onlyKeys` checks).
* `tests/firestore.rules.test.mjs` covers forged couples, hijacked codes, cross-couple reads/writes, duplicate requests,
  second partners, spoofed authors, locked-out unverified users and disconnect.
* Secrets: only public Firebase web config is in the client. The Anthropic key is read from server env (`api/assistant.ts`).
* All user input is validated with Zod; rich text is sanitized with DOMPurify; uploads are type- and size-checked.
* Camera frames from the Photo Booth stay in memory; nothing is stored unless you press *Save to Memories* / *Send in chat*.

### Love Assistant (AI)
`api/assistant.ts` is a Vercel serverless function: it verifies the caller’s Firebase ID token, rate-limits, and calls the
Anthropic Messages API with a system prompt that keeps the assistant a helper (it never speaks *as* your partner).
Set `ANTHROPIC_API_KEY`, `FIREBASE_WEB_API_KEY` (and optionally `ANTHROPIC_MODEL`) in the host’s environment.
Without them — and always in the demo — the UI falls back to clearly-labelled sample replies.

### Deploy
`vercel.json` rewrites SPA routes and exposes `/api/*`. Any static host works for the front end (`npm run build` → `dist/`);
the assistant needs a serverless runtime.

## Project layout

```
src/
  components/ui/        design system (Button, Card, Input, Modal, Feedback, Motion, …)
  components/layout/    AppShell (sidebar + bottom nav), guards, notification center
  components/features/  MoodCard, Milestones, ConnectionCeremony, RelationshipDatesModal
  components/photobooth/ camera hook + canvas compositor (filters, frames, strips, stickers)
  context/              Auth, Couple, Toast
  data/                 Store abstraction: Firestore store, in-memory demo store, connection service, content
  pages/                one file per route (+ auth/)
api/assistant.ts        server-side AI proxy
firestore.rules  storage.rules  tests/
```

## Known limitations (honest list)
* **Locked letters / “private” game answers are enforced in the UI**, not by the database: a determined partner could read the
  stored document early. Rules do stop everyone *outside* the couple.
* **Storage rules** are written and reviewed but could not be exercised in this build environment’s emulator (cross-service
  `firestore.get` lookups did not resolve there). Please run the Storage emulator tests in your own environment before launch.
* Two-factor auth and push/email notifications are not implemented (notifications are in-app). The Settings screen says so.
* Voice messages use the browser’s MediaRecorder (format differs per browser). Playback of Safari’s `audio/mp4` and Chrome’s `audio/webm` is not cross-compatible on every browser.
* Fonts load from Google Fonts; offline they fall back to system serif/sans.
