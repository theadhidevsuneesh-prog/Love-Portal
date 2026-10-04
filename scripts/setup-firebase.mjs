#!/usr/bin/env node
/**
 * One-shot Firebase setup for project new-project-f8d4e, following the Firebase agent-skills workflow
 * (firebase-basics → web_setup, firebase-auth-basics → provisioning).
 *
 *   npx -y firebase-tools@latest login          # once, in your own terminal/browser
 *   SUPPORT_EMAIL=you@example.com npm run firebase:setup
 *
 * It (1) selects the project, (2) registers a web app if none exists, (3) writes .env from the SDK config,
 * (4) enables Email/Password + Google sign-in (firebase.json "auth" block) and deploys auth + Firestore + Storage rules.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const PROJECT = process.env.FIREBASE_PROJECT || 'new-project-f8d4e'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL
const fb = (...args) => execFileSync('npx', ['-y', 'firebase-tools@latest', ...args, '--project', PROJECT], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const log = (m) => console.log(`\n▶ ${m}`)

if (!SUPPORT_EMAIL || !/^\S+@\S+\.\S+$/.test(SUPPORT_EMAIL)) {
  console.error('Set SUPPORT_EMAIL to the address shown on the Google sign-in consent screen, e.g.\n  SUPPORT_EMAIL=you@example.com npm run firebase:setup')
  process.exit(1)
}

log(`Using project ${PROJECT}`)
fb('use', PROJECT).trim()

log('Looking for an existing web app…')
let appId
try {
  const list = JSON.parse(fb('apps:list', 'WEB', '--json'))
  appId = list.result?.find((a) => a.platform === 'WEB' || a.appId)?.appId
} catch { /* none yet */ }
if (!appId) {
  log('Registering web app "Love Portal"…')
  const created = JSON.parse(fb('apps:create', 'WEB', 'Love Portal', '--json'))
  appId = created.result?.appId
}
if (!appId) { console.error('Could not determine the web App ID.'); process.exit(1) }
console.log('  App ID:', appId)

log('Fetching SDK config → .env')
const raw = fb('apps:sdkconfig', 'WEB', appId)
let cfg
try { cfg = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]) } catch {
  cfg = Object.fromEntries([...raw.matchAll(/["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g)].map((m) => [m[1], m[2]]))
}
const map = { VITE_FIREBASE_API_KEY: 'apiKey', VITE_FIREBASE_AUTH_DOMAIN: 'authDomain', VITE_FIREBASE_PROJECT_ID: 'projectId', VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket', VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId', VITE_FIREBASE_APP_ID: 'appId' }
const missing = Object.values(map).filter((k) => !cfg[k])
if (missing.length) { console.error('SDK config is missing:', missing.join(', '), '\n', raw); process.exit(1) }
const existing = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8').split('\n').filter((l) => !l.startsWith('VITE_FIREBASE_') && !l.startsWith('VITE_USE_EMULATORS')) : []
fs.writeFileSync('.env', [...existing.filter(Boolean), ...Object.entries(map).map(([k, v]) => `${k}=${cfg[v]}`), 'VITE_USE_EMULATORS=false', ''].join('\n'))
console.log('  wrote .env (gitignored)')

log('Configuring Email/Password + Google sign-in in firebase.json')
const conf = JSON.parse(fs.readFileSync('firebase.json', 'utf8'))
conf.auth.providers.googleSignIn.supportEmail = SUPPORT_EMAIL
conf.auth.providers.googleSignIn.authorizedRedirectUris = [`https://${PROJECT}.firebaseapp.com/__/auth/handler`, 'http://localhost']
fs.writeFileSync('firebase.json', JSON.stringify(conf, null, 2) + '\n')

log('Deploying auth config + Firestore & Storage rules…')
console.log(fb('deploy', '--only', 'auth,firestore:rules,firestore:indexes,storage'))

console.log(`
✔ Done. Next:
  • Make sure Firestore (Build → Firestore Database) and Storage (Build → Storage) have been created once in the console.
  • In Authentication → Settings → Authorized domains, add your deployed domain (localhost is allowed by default).
  • npm run dev   → sign up, or "Continue with Google".`)
