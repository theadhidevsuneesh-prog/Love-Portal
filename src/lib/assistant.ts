import { auth } from './firebase'
import { pick } from './utils'

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface AssistantContext { you: string; partner: string; days?: number }

export const ACTIONS = [
  { id: 'letter', emoji: '💌', label: 'Write a love letter', prompt: 'Write me a heartfelt love letter to my partner.' },
  { id: 'dates', emoji: '🌹', label: 'Give date ideas', prompt: 'Give me 5 creative date ideas for us this week.' },
  { id: 'starters', emoji: '💬', label: 'Conversation starters', prompt: 'Give me 6 fun and meaningful conversation starters for me and my partner.' },
  { id: 'anniversary', emoji: '🎉', label: 'Anniversary message', prompt: 'Write a short, sweet anniversary message for my partner.' },
  { id: 'gifts', emoji: '🎁', label: 'Suggest gifts', prompt: 'Suggest 6 thoughtful gift ideas for my partner at different budgets.' },
  { id: 'poem', emoji: '🪶', label: 'Romantic poetry', prompt: 'Write a short romantic poem about my partner and me.' },
  { id: 'shayari', emoji: '🌙', label: 'Urdu shayari', prompt: 'Write two Urdu shayari couplets for my partner, in Urdu script with Roman transliteration and English meaning.' },
  { id: 'apology', emoji: '🕊️', label: 'Help me apologise', prompt: 'Help me write a sincere apology to my partner. Ask me what happened first, then draft it.' },
  { id: 'fun', emoji: '🎲', label: 'Something fun to do', prompt: 'Suggest something fun and low-effort we can do together tonight.' },
] as const

/** Calls the server-side proxy. Throws on failure so the UI can fall back or show a friendly note. */
export async function askAssistant(messages: ChatTurn[], ctx: AssistantContext): Promise<string> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error('no-token')
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages, context: ctx }),
  })
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) throw new Error('unavailable')
  const data = (await res.json()) as { reply?: string; error?: string }
  if (!res.ok || !data.reply) throw Object.assign(new Error(data.error ?? 'failed'), { friendly: data.error })
  return data.reply
}

/** Offline sample responses used in the demo and when the AI server isn't configured. */
export function sampleReply(prompt: string, ctx: AssistantContext): string {
  const p = prompt.toLowerCase()
  const { you, partner } = ctx
  const days = ctx.days ? `${ctx.days} days` : 'every day'
  if (p.includes('shayari') || p.includes('urdu')) return pick([
    `تم سے مل کر یوں لگا جیسے دل کو گھر مل گیا\nہر سفر کا آخری پڑاؤ، بس تمہارا در مل گیا\n\nTum se mil kar yun laga jaise dil ko ghar mil gaya\nHar safar ka aakhri padaao, bas tumhara dar mil gaya\n\nMeaning: Meeting you felt like my heart finally found a home — the end of every journey is simply your doorstep.`,
    `تمہاری ہنسی میں چھپا ہے میرا سارا جہاں\nتم جو ساتھ ہو تو ہر موسم مہربان\n\nTumhari hansi mein chhupa hai mera saara jahaan\nTum jo saath ho to har mausam meherbaan\n\nMeaning: My whole world hides inside your laughter; with you beside me, every season is kind.`,
  ])
  if (p.includes('apolog')) return `Here’s a starting point — change anything that doesn’t sound like you:\n\n“${partner}, I’m sorry. I’ve been thinking about what happened and I know I hurt you. I don’t want to make excuses — I want to understand how it felt for you, and do better. You matter more to me than being right. Can we talk when you’re ready?”\n\nTip: say what you did, not what you “meant”. Then listen.`
  if (p.includes('date')) return `Five ideas for you and ${partner}:\n\n1. **Sunset + chai** — find a high spot, no phones.\n2. **Cook a mystery-country dish** — draw a country from a hat.\n3. **Photo-booth night** — dress up and recreate your first photo.\n4. **Letter swap** — write each other a letter and read them aloud.\n5. **Midnight walk** — no destination, just wandering.`
  if (p.includes('starter') || p.includes('conversation')) return `Six conversation starters:\n\n1. What’s a small moment from this week you want to remember?\n2. What’s something you’re looking forward to — just for you?\n3. When did you last feel proud of us?\n4. What’s a tiny thing I do that you secretly love?\n5. If we had a free weekend and no limits, what would we do?\n6. What’s one thing you’d like us to try this year?`
  if (p.includes('gift')) return `Gift ideas for ${partner}:\n\n**Under $15** — a handwritten “open when” letter set, their favourite snack box.\n**$15–50** — a framed photo strip from your favourite night, a playlist on a mini vinyl-style card.\n**$50+** — a surprise weekend away, or a custom star map of the night you met.\n\nThe best gifts say “I noticed”. Think of something they mentioned once.`
  if (p.includes('anniversary')) return `Happy anniversary, ${partner}. Through all of it — the ordinary Tuesdays, the late-night laughs, the adventures — you’re still my favourite person. Thank you for choosing me, again and again. Here’s to us. ❤️`
  if (p.includes('poem') || p.includes('poetry')) return `**Home**\n\nI used to think that home was walls,\na key, a door, a light —\nthen you walked in, and just like that,\nthe world felt warm and right.\n\nNow home is wherever you are,\na laugh, a hand to hold,\nand every day we’re side by side\nis worth its weight in gold.`
  if (p.includes('fun') || p.includes('tonight')) return `Try this: **“Rate that…” night.** Pick a theme (snacks, songs, old photos), take turns presenting your top 3, and rate each other’s picks out of 10 — loser makes tea.`
  return `My love ${partner},\n\nI don’t say it enough, but ${days} with you has been my favourite part of life. You make ordinary days feel like little adventures. Thank you for your patience, your laugh, and the way you make me feel at home.\n\nI love you, today and always.\n\nYours,\n${you}`
}
