/**
 * Love Assistant proxy (Vercel serverless function).
 * Keeps ANTHROPIC_API_KEY on the server and only serves signed-in Love Portal users.
 *
 * Env (server-side only, never VITE_-prefixed):
 *   ANTHROPIC_API_KEY, ANTHROPIC_MODEL (optional), FIREBASE_WEB_API_KEY
 */
interface Req { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
interface Res { status(code: number): Res; json(body: unknown): void; setHeader(k: string, v: string): void }

const SYSTEM = `You are "Love Assistant", a warm, tasteful writing and idea helper inside Love Portal, a private app for couples.
Your job is to help ONE person say or plan something lovely for their partner.
Rules:
- You are an assistant. Never pretend to be the user's partner, never write as if the partner replied, and never claim to have feelings for the user.
- Write in the voice of the user (first person) when drafting letters, messages or poems meant for their partner.
- Keep a romantic, sincere, modern tone. Avoid cliché overload and avoid cringe.
- Be concise: letters under 220 words unless asked, ideas as short lists.
- If asked for Urdu shayari, write the couplet in Urdu script followed by a Roman transliteration and a one-line English meaning.
- If the user wants to apologise, help them take responsibility sincerely without excuses.
- Decline anything abusive, manipulative, or intended to monitor or control a partner; suggest a healthier alternative.
- Never ask for or repeat sensitive personal data.`

const buckets = new Map<string, { n: number; t: number }>()

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  const key = process.env.ANTHROPIC_API_KEY
  const webKey = process.env.FIREBASE_WEB_API_KEY
  if (!key || !webKey) return res.status(503).json({ error: 'The Love Assistant is not configured yet.' })

  // 1. Authenticate the caller with their Firebase ID token.
  const auth = String(req.headers.authorization ?? '')
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!idToken) return res.status(401).json({ error: 'Please log in again.' })
  let uid = ''
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(webKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
    })
    if (!r.ok) return res.status(401).json({ error: 'Please log in again.' })
    const data = (await r.json()) as { users?: { localId: string; emailVerified?: boolean }[] }
    const user = data.users?.[0]
    if (!user?.emailVerified) return res.status(403).json({ error: 'Please verify your email first.' })
    uid = user.localId
  } catch { return res.status(502).json({ error: 'Could not verify your session.' }) }

  // 2. Tiny in-memory rate limit (per warm instance): 20 requests / 10 minutes / user.
  const now = Date.now()
  const b = buckets.get(uid)
  if (!b || now - b.t > 600_000) buckets.set(uid, { n: 1, t: now })
  else if (++b.n > 20) return res.status(429).json({ error: 'That’s a lot of romance! Please try again in a few minutes.' })

  // 3. Validate input.
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { messages?: { role: string; content: string }[]; context?: { you?: string; partner?: string; days?: number } } | undefined
  const msgs = (body?.messages ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'Say what you need help with.' })
  const c = body?.context ?? {}
  const ctx = `Context: the user is ${String(c.you ?? 'the user').slice(0, 40)}; their partner is ${String(c.partner ?? 'their partner').slice(0, 40)}${typeof c.days === 'number' ? `; they have been together for ${c.days} days` : ''}.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 900, system: `${SYSTEM}\n\n${ctx}`, messages: msgs }),
    })
    if (!r.ok) return res.status(502).json({ error: 'The Love Assistant is resting. Please try again shortly.' })
    const data = (await r.json()) as { content?: { type: string; text?: string }[] }
    const reply = (data.content ?? []).filter((p) => p.type === 'text').map((p) => p.text).join('\n').trim()
    return res.status(200).json({ reply: reply || 'I’m lost for words — try asking another way?' })
  } catch { return res.status(502).json({ error: 'The Love Assistant is resting. Please try again shortly.' }) }
}
