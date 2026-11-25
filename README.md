# Love Portal ♥

*A little corner of the internet that belongs only to you two.*

**Live app: https://love-portal-mu.vercel.app** · Try it without an account: https://love-portal-mu.vercel.app/demo

A private web app for two people: shared memories, real-time chat, sealed love letters, date ideas, games,
surprises, a timeline of your story, a playlist, mood sharing, milestones, a **long-distance photo booth** and a
**custom bouquet designer**. Built with React, TypeScript and Firebase, and it runs on Firebase's free plan.

## Features

| | |
|---|---|
| **Pairing** | Unique `LOVE-XXXX` code, QR, invite link, request/accept, one partner per user (enforced by the database rules) |
| **Dashboard** | Together counter, mood sharing, milestones, notifications |
| **Photo Booth** | Solo booth with filters, frames and stickers, plus a **Together** mode: both partners wait for each other, shoot at the same time and get one merged strip |
| **Bouquets** | Design with 8 flower types, counts, greenery, wrap and ribbon, add a card, send it |
| **Share links** | Send a letter or bouquet as an unlisted link anyone can open, revocable at any time |
| **Memories · Chat · Letters** | Photos and voice notes, real-time messages and reactions, rich-text letters with unlock dates |
| **Dates · Games · Surprises** | Date ideas, couple games, surprise box and coupons |
| **Our Story · Playlist** | Timeline of your relationship and a shared playlist |
| **Love Assistant** | Optional AI helper for writing, through a server-side proxy so the key never reaches the browser |
| **Settings** | Profile, theme (light/dark), data export, disconnect, delete account |

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Lucide · Zod · Firebase (Auth, Firestore, optional Storage).
UI primitives are hand-built in `src/components/ui`.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

With no Firebase keys the app still runs: the landing page works and **`/demo`** opens an interactive demo couple
backed by an in-memory store. Demo data never touches Firebase.

## Connect your own Firebase project

Sign-in methods: **Email/Password** and **Google**.

1. Create a Firebase project and enable **Authentication** (Email/Password and Google) and **Firestore**.
2. Register a web app and copy its config into `.env` (see `.env.example`).
3. Publish `firestore.rules`. From your own computer:
   ```bash
   npx -y firebase-tools@latest login
   SUPPORT_EMAIL=you@example.com npm run firebase:setup
   ```
   `scripts/setup-firebase.mjs` selects the project, registers the web app, writes `.env`, enables both sign-in
   providers and deploys the Auth config and Firestore rules. `.firebaserc` points at `new-project-f8d4e`, so change it for your project.
4. Add your domain under **Authentication → Settings → Authorized domains** (`localhost` is allowed by default).

### Free plan: no Cloud Storage needed
New Storage buckets need Firebase's paid Blaze plan, so by default (`VITE_STORAGE_MODE` unset) photos and voice notes are
stored **inside Firestore** as compressed data URLs (images are shrunk to fit the 1 MiB document limit; voice notes up to
about two minutes; video is disabled). Auth and Firestore are free on the Spark plan. To switch to real files later, enable Storage,
set `VITE_STORAGE_MODE=storage` and deploy `storage.rules` (`WITH_STORAGE=1 npm run firebase:setup`).

### Love Assistant (optional)
`api/assistant.ts` is a Vercel serverless function. It verifies the caller's Firebase ID token, rate-limits, and calls the
Anthropic Messages API with a system prompt that keeps the assistant a helper (it never speaks *as* your partner).
Set `ANTHROPIC_API_KEY` and `FIREBASE_WEB_API_KEY` (and optionally `ANTHROPIC_MODEL`) in your host's environment.
Without them, and always in the demo, the UI shows clearly labelled sample replies.

### Deploy
`vercel.json` rewrites SPA routes and exposes `/api/*`. Any static host works for the front end (`npm run build` → `dist/`);
the assistant needs a serverless runtime.

## How it works

**Pairing.** Every user gets a code like `LOVE-7X92` (`connectionCodes/{code}`, exact lookup only, never listable). Person B enters it
and sends a request (`connectionRequests/{from}_{to}`, one document per pair, expires after 7 days). When Person A accepts, one atomic
batch marks the request accepted, creates `couples/{coupleId}` and writes `partnerLinks/{uid}` for both people. The rules refuse the
batch if either person is already linked.

**Together Photo Booth.** Each partner writes a heartbeat to `booth/{coupleId}`; when both are present either can press *Start together*.
Both devices run the same 3-2-1 ×4 sequence locally, exchange frames through short-lived `boothFrames` documents, and merge them into
a two-column strip. Frames are deleted when you leave the editor.

**Share links.** A `shares/{randomId}` document holds a snapshot of a letter or bouquet. The random ID is the secret: anyone with the
link can `get` it (`/s/:id`, no login), nobody can list them, and members of the couple can revoke.

**Data model.** `users`, `connectionCodes`, `connectionRequests`, `partnerLinks`, `couples`, and couple-owned collections
(`messages`, `memories`, `letters`, `dateIdeas`, `games`, `surprises`, `coupons`, `timelineEvents`, `playlist`, `moods`,
`notifications`, `bouquets`, `shares`, `booth`, `boothFrames`), each carrying a `coupleId`.

**Security.**
* `firestore.rules`: access needs a verified email **and** membership of the document's couple, with field-level `onlyKeys`
  checks for what a partner may change (react, pin, mark opened, redeem…). Default deny.
* Only the public Firebase web config is in the client. The AI key lives on the server.
* Input is validated with Zod, rich text is sanitized with DOMPurify, uploads are type and size checked.
* Camera frames stay in memory unless you press *Save to Memories* or *Send in chat*.

## Testing

```bash
npm run typecheck
npm run build
npm run emulators                      # auth + firestore on 127.0.0.1
npm run test:rules                     # 90 Firestore security-rule tests (needs Java)
VITE_USE_EMULATORS=true npm run dev    # run the app against the emulators
```

The rule tests cover forged couples, hijacked codes, cross-couple reads and writes, duplicate requests, second partners,
spoofed authors, unverified users, share-link access and disconnect.

## Project layout

```
src/
  components/ui/         design system (Button, Card, Input, Modal, …)
  components/layout/     AppShell (sidebar + bottom nav), guards, notifications
  components/features/   MoodCard, Milestones, ConnectionCeremony, …
  components/photobooth/ camera hook, canvas compositor, TogetherBooth
  components/bouquet/    SVG bouquet art
  context/               Auth, Couple, Toast
  data/                  Store abstraction: Firestore store, in-memory demo store, connection service, content
  pages/                 one file per route (+ auth/)
api/assistant.ts         server-side AI proxy
firestore.rules  storage.rules  tests/  scripts/
```

## Known limitations

* **Locked letters and "private" game answers are enforced in the UI**, not by the database: a determined partner could read the stored
  document early. The rules do stop everyone outside the couple.
* **The Together booth has only been tested with simulated clients**, not two real devices on different networks.
* **`storage.rules`** are written but could not be verified in the build sandbox's emulator. Test them before enabling Storage.
* Free-plan capacity is limited (Firestore 50k reads and 20k writes per day), and collections are read in full on open, without pagination.
* Delete account is available once paired and asks Google users to re-authenticate by password, which they don't have.
* No two-factor auth or push/email notifications (notifications are in-app). No video in free mode.
* Voice messages use the browser's MediaRecorder, so Safari (`audio/mp4`) and Chrome (`audio/webm`) recordings may not play on each other's browsers.
* Vercel's free Hobby plan is for non-commercial use.
