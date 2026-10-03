export type BoothMode = 'single' | 'strip'

export interface Sticker { id: string; emoji: string; x: number; y: number; size: number } // x,y,size are 0..1 of composite width/height

export interface FilterDef { id: string; name: string; css: string; tint?: { color: string; op: GlobalCompositeOperation; alpha: number }; vignette?: number }

export const FILTERS: FilterDef[] = [
  { id: 'none', name: 'Natural', css: 'none' },
  { id: 'rose', name: 'Rosé', css: 'saturate(1.1) sepia(.12) brightness(1.04)', tint: { color: '#e8a5b0', op: 'soft-light', alpha: 0.35 } },
  { id: 'warm', name: 'Golden', css: 'sepia(.25) saturate(1.2) brightness(1.05) contrast(1.03)', tint: { color: '#ffb36b', op: 'soft-light', alpha: 0.2 } },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.18) brightness(1.03)' },
  { id: 'fade', name: 'Fade', css: 'contrast(.86) brightness(1.1) saturate(.8)', tint: { color: '#f7dde0', op: 'lighten', alpha: 0.12 } },
  { id: 'film', name: 'Film', css: 'sepia(.3) contrast(1.1) saturate(.92)', vignette: 0.45 },
  { id: 'dream', name: 'Dreamy', css: 'brightness(1.08) saturate(1.15) contrast(.95)', tint: { color: '#ffd6e0', op: 'screen', alpha: 0.18 }, vignette: 0.15 },
]

export type Deco = 'none' | 'double' | 'hearts' | 'film'
export interface Template { id: string; name: string; bg: [string, string]; ink: string; accent: string; deco: Deco }

export const TEMPLATES: Template[] = [
  { id: 'ivory', name: 'Ivory', bg: ['#fbf6ef', '#fbf6ef'], ink: '#4a1220', accent: '#b0344f', deco: 'double' },
  { id: 'burgundy', name: 'Burgundy', bg: ['#6b1d2e', '#4a1220'], ink: '#f7dde0', accent: '#e8a5b0', deco: 'double' },
  { id: 'blush', name: 'Blush', bg: ['#f7dde0', '#fbf6ef'], ink: '#6b1d2e', accent: '#c0566e', deco: 'hearts' },
  { id: 'rosegold', name: 'Rosé gold', bg: ['#e8a5b0', '#f3d9c4'], ink: '#4a1220', accent: '#ffffff', deco: 'hearts' },
  { id: 'midnight', name: 'Midnight film', bg: ['#1b0a10', '#1b0a10'], ink: '#f7dde0', accent: '#e8a5b0', deco: 'film' },
  { id: 'polaroid', name: 'Polaroid', bg: ['#ffffff', '#ffffff'], ink: '#3a2a2e', accent: '#b0344f', deco: 'none' },
]

export const STICKERS = ['❤️', '💋', '✨', '🌹', '🥂', '🎀', '💌', '🌙', '😘', '🫶', '🍓', '🦋', '🔥', '💍']

export interface RenderOpts {
  mode: BoothMode
  filter: FilterDef
  template: Template
  caption: string
  showDate: boolean
  showNames: boolean
  names: [string, string]
  stickers: Sticker[]
  date?: Date
}

const SERIF = '"Cormorant Garamond", Georgia, serif'
const SANS = 'Inter, system-ui, sans-serif'

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  return img
}

export async function ensureFonts() {
  try {
    await Promise.all([document.fonts.load(`600 40px ${SERIF}`), document.fonts.load(`italic 500 40px ${SERIF}`), document.fonts.load(`500 20px ${SANS}`)])
  } catch { /* fall back to system fonts */ }
}

/** Center-crop `img` to `ratio` (w/h) and draw into the rect with the filter applied. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, f: FilterDef, radius = 0) {
  const ir = img.width / img.height
  const tr = w / h
  let sw = img.width, sh = img.height, sx = 0, sy = 0
  if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2 } else { sh = img.width / tr; sy = (img.height - sh) / 2 }
  ctx.save()
  ctx.beginPath()
  if (radius) ctx.roundRect(x, y, w, h, radius); else ctx.rect(x, y, w, h)
  ctx.clip()
  if ('filter' in ctx) ctx.filter = f.css
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  if ('filter' in ctx) ctx.filter = 'none'
  if (f.tint) {
    ctx.globalCompositeOperation = f.tint.op
    ctx.globalAlpha = f.tint.alpha
    ctx.fillStyle = f.tint.color
    ctx.fillRect(x, y, w, h)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  if (f.vignette) {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(20,5,10,${f.vignette})`)
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}

function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.9)
  ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.35)
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9)
  ctx.fill()
}

function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1)
  let x = cx - total / 2
  ctx.textAlign = 'left'
  chars.forEach((c, i) => { ctx.fillText(c, x, y); x += widths[i] + spacing })
  ctx.textAlign = 'center'
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, font: (s: number) => string) {
  let s = size
  ctx.font = font(s)
  while (ctx.measureText(text).width > maxW && s > 14) { s -= 2; ctx.font = font(s) }
  return s
}

function footer(ctx: CanvasRenderingContext2D, o: RenderOpts, cx: number, top: number, width: number, height: number) {
  const t = o.template
  const d = o.date ?? new Date()
  const year = String(d.getFullYear())
  const stamp = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const unit = width / 640
  let y = top + height * 0.2
  if (o.caption.trim()) {
    ctx.fillStyle = t.ink
    const s = fitText(ctx, o.caption.trim(), width * 0.86, 40 * unit, (n) => `italic 500 ${n}px ${SERIF}`)
    ctx.fillText(o.caption.trim(), cx, y + s * 0.3)
    y += s + 14 * unit
  }
  if (o.showNames) {
    const [a, b] = o.names.map((n) => n.toUpperCase())
    const text = `${a}  ♥  ${b}`
    ctx.fillStyle = t.ink
    const s = fitText(ctx, text, width * 0.86, 44 * unit, (n) => `600 ${n}px ${SERIF}`)
    const wa = ctx.measureText(`${a}  `).width, wh = ctx.measureText('♥').width, wt = ctx.measureText(text).width
    const x0 = cx - wt / 2
    ctx.textAlign = 'left'
    ctx.fillText(`${a}  `, x0, y + s * 0.4)
    ctx.fillStyle = t.accent
    ctx.fillText('♥', x0 + wa, y + s * 0.4)
    ctx.fillStyle = t.ink
    ctx.fillText(`  ${b}`, x0 + wa + wh, y + s * 0.4)
    ctx.textAlign = 'center'
    y += s + 12 * unit
  }
  ctx.fillStyle = t.ink
  ctx.globalAlpha = 0.75
  ctx.font = `600 ${15 * unit}px ${SANS}`
  spaced(ctx, 'LOVE PORTAL', cx, y + 10 * unit, 6 * unit)
  y += 30 * unit
  ctx.font = `500 ${14 * unit}px ${SANS}`
  spaced(ctx, o.showDate ? stamp : year, cx, y + 6 * unit, 4 * unit)
  ctx.globalAlpha = 1
}

function decorate(ctx: CanvasRenderingContext2D, o: RenderOpts, W: number, H: number, inset: number) {
  const t = o.template
  if (t.deco === 'double') {
    ctx.strokeStyle = t.accent
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 2
    ctx.strokeRect(inset / 2, inset / 2, W - inset, H - inset)
    ctx.globalAlpha = 1
  } else if (t.deco === 'hearts') {
    ctx.fillStyle = t.accent
    ctx.globalAlpha = 0.4
    const n = Math.round(H / 90)
    for (let i = 0; i < n; i++) {
      const y = (H / n) * (i + 0.5)
      heart(ctx, inset / 2, y, 5 + (i % 3) * 2)
      heart(ctx, W - inset / 2, y + 20, 5 + ((i + 1) % 3) * 2)
    }
    ctx.globalAlpha = 1
  } else if (t.deco === 'film') {
    ctx.fillStyle = '#f7dde0'
    ctx.globalAlpha = 0.14
    const n = Math.round(H / 56)
    for (let i = 0; i < n; i++) {
      const y = (H / n) * (i + 0.35)
      ctx.beginPath(); ctx.roundRect(inset / 2 - 7, y, 14, 20, 4); ctx.fill()
      ctx.beginPath(); ctx.roundRect(W - inset / 2 - 7, y, 14, 20, 4); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

export async function renderComposite(frames: HTMLImageElement[], o: RenderOpts): Promise<HTMLCanvasElement> {
  const strip = o.mode === 'strip'
  const W = strip ? 640 : 900
  const P = strip ? 44 : 52
  const photoW = W - P * 2
  const photoH = strip ? Math.round(photoW * 0.75) : Math.round(photoW * (4 / 3))
  const gap = strip ? 18 : 0
  const count = strip ? 4 : 1
  const footerH = strip ? 210 : 230
  const H = P + count * photoH + (count - 1) * gap + (strip ? 26 : 22) + footerH
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, o.template.bg[0]); g.addColorStop(1, o.template.bg[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  decorate(ctx, o, W, H, P)

  for (let i = 0; i < count; i++) {
    const img = frames[i] ?? frames[frames.length - 1]
    if (!img) continue
    const y = P + i * (photoH + gap)
    ctx.save()
    ctx.shadowColor = 'rgba(40,10,20,.22)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(P, y, photoW, photoH, 6); ctx.fill()
    ctx.restore()
    drawCover(ctx, img, P, y, photoW, photoH, o.filter, 6)
  }
  const photosBottom = P + count * photoH + (count - 1) * gap
  footer(ctx, o, W / 2, photosBottom + (strip ? 26 : 22), W, footerH)

  // stickers
  for (const s of o.stickers) {
    ctx.font = `${Math.round(s.size * W)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(s.emoji, s.x * W, s.y * H)
  }
  return canvas
}

export const canvasToBlob = (c: HTMLCanvasElement, type = 'image/jpeg', q = 0.92) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), type, q))
