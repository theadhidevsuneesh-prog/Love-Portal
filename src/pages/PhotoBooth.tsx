import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CameraOff, Check, Download, FlipHorizontal2, Heart, ImagePlus, RotateCcw, Send, Sticker as StickerIcon, Type, Trash2, Wand2, Frame, X } from 'lucide-react'
import { useCamera } from '@/components/photobooth/useCamera'
import { TogetherBooth, deleteBoothFrames, type TogetherResult } from '@/components/photobooth/TogetherBooth'
import { FILTERS, STICKERS, TEMPLATES, canvasToBlob, ensureFonts, loadImage, renderComposite, type BoothMode, type Sticker } from '@/components/photobooth/render'
import { useCouple } from '@/context/CoupleContext'
import { useWriters } from '@/data/hooks'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Segmented, Spinner } from '@/components/ui/Feedback'
import { friendlyError } from '@/lib/errors'
import { cn, downloadDataUrl, today } from '@/lib/utils'
import { validateFile } from '@/lib/validation'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type Tab = 'filters' | 'frames' | 'stickers' | 'text'

export default function PhotoBooth() {
  const { me, partner, coupleId, couple } = useCouple()
  const { add, remove, upload, notifyPartner, uid } = useWriters()
  const toast = useToast()
  const cam = useCamera()

  const [phase, setPhase] = useState<'camera' | 'edit'>('camera')
  const [mode, setMode] = useState<BoothMode>('strip')
  const [source, setSource] = useState<'solo' | 'together'>('solo')
  const [pairNames, setPairNames] = useState<[string, string]>(['', ''])
  const pairSession = useRef('')
  const [timer, setTimer] = useState(3)
  const [frames, setFrames] = useState<string[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotIdx, setShotIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [flash, setFlash] = useState(0)
  const cancelRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // edit state
  const [filterId, setFilterId] = useState('rose')
  const [templateId, setTemplateId] = useState('ivory')
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [showNames, setShowNames] = useState(true)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('filters')
  const [preview, setPreview] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [busy, setBusy] = useState<'' | 'save' | 'share'>('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const filter = FILTERS.find((f) => f.id === filterId)!
  const template = TEMPLATES.find((t) => t.id === templateId)!
  const effMode: BoothMode = source === 'together' ? 'pair' : mode
  const names: [string, string] = source === 'together' && pairNames[0] ? pairNames : [me?.name ?? 'Me', partner?.name ?? 'You']
  const ratio = mode === 'strip' ? 4 / 3 : 3 / 4

  // Camera lifecycle: on while shooting, off while editing.
  useEffect(() => { if (phase === 'camera' && source === 'solo') cam.start() ; else cam.stop() }, [phase, source]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelRef.current = true }, [])

  const shoot = useCallback(async () => {
    if (running || cam.status !== 'ready') return
    cancelRef.current = false
    setRunning(true); setFrames([])
    const n = mode === 'strip' ? 4 : 1
    const secs = mode === 'strip' ? Math.max(timer, 3) : timer
    const shots: string[] = []
    for (let i = 0; i < n; i++) {
      setShotIdx(i)
      for (let c = secs; c > 0; c--) { setCountdown(c); await sleep(1000); if (cancelRef.current) break }
      setCountdown(null)
      if (cancelRef.current) { setRunning(false); setFrames([]); return }
      const shot = cam.grab(ratio)
      if (!shot) { toast.error("We couldn't capture that — please try again."); setRunning(false); setFrames([]); return }
      setFlash((f) => f + 1)
      shots.push(shot); setFrames([...shots])
      await sleep(mode === 'strip' && i < n - 1 ? 900 : 450)
    }
    setRunning(false); setPhase('edit'); setStickers([]); setSelected(null)
  }, [running, cam, mode, timer, ratio, toast])

  const cancel = () => { cancelRef.current = true; setCountdown(null) }

  const fromFiles = async (list: FileList | null) => {
    if (!list?.length) return
    const files = Array.from(list).slice(0, mode === 'strip' ? 4 : 1)
    for (const f of files) { const e = validateFile(f, 'image'); if (e) return toast.error(e) }
    const urls = await Promise.all(files.map((f) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f) })))
    while (mode === 'strip' && urls.length < 4) urls.push(urls[urls.length - 1])
    setFrames(urls); setPhase('edit'); setStickers([])
  }

  // Render composite whenever edit options change.
  useEffect(() => {
    if (phase !== 'edit' || !frames.length) return
    let dead = false
    setRendering(true)
    ;(async () => {
      await ensureFonts()
      const imgs = await Promise.all(frames.map(async (src) => {
        const hit = imgCache.current.get(src)
        if (hit) return hit
        const im = await loadImage(src); imgCache.current.set(src, im); return im
      }))
      const canvas = await renderComposite(imgs, { mode: effMode, filter, template, caption, showDate, showNames, names, stickers: [], date: new Date() })
      if (dead) return
      canvasRef.current = canvas
      setPreview(canvas.toDataURL('image/jpeg', 0.9))
      setRendering(false)
    })().catch(() => { if (!dead) { setRendering(false); toast.error("We couldn't build your photo. Please retake.") } })
    return () => { dead = true }
  }, [phase, frames, effMode, filter, template, caption, showDate, showNames, names[0], names[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  // Final export (with stickers) as canvas.
  const exportCanvas = async () => {
    const imgs = await Promise.all(frames.map((s) => imgCache.current.get(s) ?? loadImage(s)))
    return renderComposite(imgs, { mode: effMode, filter, template, caption, showDate, showNames, names, stickers, date: new Date() })
  }

  const download = async () => {
    try {
      const c = await exportCanvas()
      downloadDataUrl(c.toDataURL('image/png'), `love-portal-${effMode === 'single' ? 'photo' : 'strip'}-${today()}.png`)
      toast.success('Saved to your device.')
    } catch { toast.error("Download didn't work. Please try again.") }
  }

  const saveMemory = async () => {
    if (!coupleId) return
    setBusy('save')
    try {
      const blob = await canvasToBlob(await exportCanvas())
      const url = await upload(`couples/${coupleId}/memories/booth_${Date.now()}.jpg`, blob)
      await add('memories', { title: caption.trim() || `${effMode === 'single' ? 'Photo booth' : 'Photo strip'} with ${partner?.name}`, date: today(), category: 'Just Us', tags: ['photobooth'], mediaType: 'photo', mediaURL: url })
      notifyPartner('memory', `${me?.name} saved a photo booth memory`, '/memories')
      toast.show('Saved to Memories ❤️', 'love')
    } catch (e) { toast.error(friendlyError(e, "That upload didn't go through. Please try again.")) } finally { setBusy('') }
  }
  const shareChat = async () => {
    if (!coupleId) return
    setBusy('share')
    try {
      const blob = await canvasToBlob(await exportCanvas())
      const url = await upload(`couples/${coupleId}/chat/booth_${Date.now()}.jpg`, blob)
      await add('messages', { kind: 'image', mediaURL: url, authorId: uid })
      notifyPartner('message', `${me?.name} sent you a photo`, '/chat')
      toast.show(`Sent to ${partner?.name} 💌`, 'love')
    } catch (e) { toast.error(friendlyError(e, "That didn't send. Please try again.")) } finally { setBusy('') }
  }

  const dropPairFrames = useCallback(() => {
    if (pairSession.current && couple) deleteBoothFrames(remove, pairSession.current, [...couple.members])
    pairSession.current = ''
  }, [couple, remove])
  useEffect(() => () => { dropPairFrames() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const retake = () => { dropPairFrames(); setFrames([]); setPreview(null); setPhase('camera') }
  const onTogether = (r: TogetherResult) => {
    pairSession.current = r.sessionId
    setPairNames(r.names); setFrames(r.frames); setStickers([]); setSelected(null); setPhase('edit')
  }

  const addSticker = (emoji: string) => {
    const s: Sticker = { id: Math.random().toString(36).slice(2), emoji, x: 0.5 + (Math.random() - 0.5) * 0.3, y: 0.35 + (Math.random() - 0.5) * 0.3, size: effMode === 'single' ? 0.16 : 0.14 }
    setStickers((l) => [...l, s]); setSelected(s.id)
  }

  /* ───────── Edit phase ───────── */
  if (phase === 'edit') {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex w-full items-center justify-between">
            <div><p className="eyebrow mb-1">Looking good</p><h1 className="text-4xl font-semibold sm:text-5xl">Make it yours</h1></div>
            <Button variant="outline" onClick={retake}><RotateCcw className="h-4 w-4" /> Retake</Button>
          </div>
          <StickerStage preview={preview} rendering={rendering} stickers={stickers} setStickers={setStickers} selected={selected} setSelected={setSelected} mode={effMode} />
        </div>

        <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <Segmented<Tab> value={tab} onChange={setTab} options={[
            { value: 'filters', label: <><Wand2 className="h-3.5 w-3.5" />Filters</> }, { value: 'frames', label: <><Frame className="h-3.5 w-3.5" />Frames</> },
            { value: 'stickers', label: <><StickerIcon className="h-3.5 w-3.5" />Stickers</> }, { value: 'text', label: <><Type className="h-3.5 w-3.5" />Text</> },
          ]} />
          <div className="card min-h-[11rem] p-4">
            {tab === 'filters' && (
              <div className="grid grid-cols-4 gap-2">
                {FILTERS.map((f) => (
                  <button key={f.id} onClick={() => setFilterId(f.id)} aria-pressed={filterId === f.id} className="text-center">
                    <span className={cn('relative block aspect-square overflow-hidden rounded-2xl border-2 transition-colors', filterId === f.id ? 'border-wine' : 'border-transparent')}>
                      <img src={frames[0]} alt="" className="h-full w-full object-cover" style={{ filter: f.css }} />
                      {f.tint && <span className="absolute inset-0" style={{ background: f.tint.color, opacity: f.tint.alpha * 0.8, mixBlendMode: f.tint.op === 'soft-light' ? 'soft-light' : 'normal' }} />}
                    </span>
                    <span className="mt-1 block text-[11px]">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
            {tab === 'frames' && (
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplateId(t.id)} aria-pressed={templateId === t.id} className="text-center">
                    <span className={cn('flex aspect-[3/4] flex-col justify-between rounded-2xl border-2 p-2 transition-colors', templateId === t.id ? 'border-wine' : 'border-line')} style={{ background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})` }}>
                      <span className="block flex-1 rounded bg-black/25" /><span className="mt-1 text-[8px] font-semibold tracking-widest" style={{ color: t.ink }}>♥ LOVE PORTAL</span>
                    </span>
                    <span className="mt-1 block text-[11px]">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
            {tab === 'stickers' && (
              <div>
                <div className="grid grid-cols-7 gap-1.5">
                  {STICKERS.map((s) => <button key={s} onClick={() => addSticker(s)} className="aspect-square rounded-xl text-2xl transition-colors hover:bg-blush" aria-label={`Add ${s}`}>{s}</button>)}
                </div>
                {selected ? (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-blush/50 p-3">
                    <label className="flex flex-1 items-center gap-2 text-xs">Size
                      <input type="range" min={0.06} max={0.4} step={0.01} value={stickers.find((s) => s.id === selected)?.size ?? 0.14} className="flex-1 accent-[rgb(var(--c-wine))]"
                        onChange={(e) => setStickers((l) => l.map((s) => (s.id === selected ? { ...s, size: Number(e.target.value) } : s)))} />
                    </label>
                    <Button variant="ghost" size="icon" aria-label="Remove sticker" onClick={() => { setStickers((l) => l.filter((s) => s.id !== selected)); setSelected(null) }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ) : <p className="mt-3 text-xs text-muted">Tap a sticker to add it, then drag it into place.</p>}
              </div>
            )}
            {tab === 'text' && (
              <div className="space-y-3">
                <Input label="Caption" optional maxLength={40} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Forever & always" />
                <Toggle checked={showNames} onChange={setShowNames} label="Couple names" />
                <Toggle checked={showDate} onChange={setShowDate} label="Date stamp" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 [&>button]:whitespace-nowrap">
            <Button size="lg" className="col-span-2" onClick={saveMemory} loading={busy === 'save'} disabled={rendering}><Heart className="h-4 w-4" /> Save to Memories</Button>
            <Button size="lg" variant="outline" onClick={shareChat} loading={busy === 'share'} disabled={rendering}><Send className="h-4 w-4" /> Send in chat</Button>
            <Button size="lg" variant="outline" onClick={download} disabled={rendering}><Download className="h-4 w-4" /> Download</Button>
          </div>
          <p className="text-center text-xs text-muted">Nothing is saved until you choose to.</p>
        </div>
      </div>
    )
  }

  /* ───────── Together (long-distance) ───────── */
  if (source === 'together') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="mb-4 flex w-full flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow mb-1">Even when you're far apart</p><h1 className="text-5xl font-semibold leading-none sm:text-6xl">Photo Booth</h1></div>
          <Segmented value={source} onChange={setSource} options={[{ value: 'solo', label: 'Solo' }, { value: 'together', label: 'Together 💞' }]} />
        </div>
        <TogetherBooth onDone={onTogether} />
      </div>
    )
  }

  /* ───────── Camera phase ───────── */
  const boxWidth = `min(100%, calc((100dvh - ${mode === 'strip' ? '21rem' : '22rem'}) * ${ratio}))`
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center">
      <div className="mb-4 flex w-full flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow mb-1">Say cheese</p><h1 className="text-5xl font-semibold leading-none sm:text-6xl">Photo Booth</h1></div>
        <div className="flex flex-wrap gap-2">
          <Segmented value={source} onChange={(v) => !running && setSource(v)} options={[{ value: 'solo', label: 'Solo' }, { value: 'together', label: 'Together 💞' }]} />
          <Segmented<BoothMode> value={mode} onChange={(m) => !running && setMode(m)} options={[{ value: 'single', label: 'Single photo' }, { value: 'strip', label: '4-shot strip' }]} />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-wine-deep shadow-lift" style={{ width: boxWidth, aspectRatio: String(ratio) }}>
        <video ref={cam.videoRef} playsInline muted autoPlay aria-label="Camera preview"
          className="absolute inset-0 h-full w-full object-cover" style={{ transform: cam.facing === 'user' ? 'scaleX(-1)' : undefined, filter: filter.css }} />
        {cam.status === 'starting' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"><Spinner className="text-white" /><p className="text-sm">Starting your camera…</p></div>}
        {cam.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-wine-deep p-6 text-center text-white" role="alert">
            <CameraOff className="h-10 w-10 text-rose" />
            <p className="font-serif text-2xl">We can't see the camera</p>
            <p className="max-w-xs text-sm text-blush/80">{cam.error}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Button variant="soft" size="sm" onClick={() => cam.start()}>Try again</Button>
              <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> Upload instead</Button>
            </div>
          </div>
        )}
        {/* Framing guides */}
        {cam.status === 'ready' && !running && <div className="pointer-events-none absolute inset-4 rounded-[1.4rem] border border-white/30" />}
        <AnimatePresence mode="wait">
          {countdown !== null && (
            <motion.div key={`${shotIdx}-${countdown}`} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[9rem] font-semibold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.45)]" aria-live="assertive">{countdown}</motion.div>
          )}
        </AnimatePresence>
        {running && mode === 'strip' && <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">Shot {Math.min(shotIdx + 1, 4)} of 4</div>}
        {flash > 0 && <div key={flash} className="pointer-events-none absolute inset-0 animate-flash bg-white" />}
        {cam.status === 'ready' && !running && (
          <button onClick={() => setTimer((t) => (t === 3 ? 5 : t === 5 ? 10 : t === 10 ? 0 : 3))} className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur" aria-label={`Timer: ${timer ? timer + ' seconds' : 'off'}`}>
            ⏱ {timer ? `${timer}s` : 'Off'}
          </button>
        )}
      </div>

      {/* Captured thumbnails during strip */}
      <div className="mt-3 flex h-12 items-center gap-2">
        {mode === 'strip' && [0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-11 w-14 overflow-hidden rounded-lg border', frames[i] ? 'border-wine' : 'border-dashed border-line bg-blush/30')}>
            {frames[i] && <motion.img initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={frames[i]} alt={`Shot ${i + 1}`} className="h-full w-full object-cover" />}
          </div>
        ))}
      </div>

      <div className="scroll-hide mb-3 flex w-full max-w-md gap-2 overflow-x-auto px-1">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilterId(f.id)} disabled={running} aria-pressed={filterId === f.id}
            className={cn('shrink-0 rounded-full border px-3 py-1 text-xs transition-colors', filterId === f.id ? 'border-wine bg-wine text-white' : 'border-line bg-surface text-muted')}>{f.name}</button>
        ))}
      </div>

      <div className="flex w-full max-w-md items-center justify-between px-4">
        <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => fileRef.current?.click()} disabled={running} aria-label="Upload photos instead"><ImagePlus className="h-5 w-5" /></Button>
        {running ? (
          <Button variant="outline" size="lg" onClick={cancel}><X className="h-4 w-4" /> Cancel</Button>
        ) : (
          <motion.button whileTap={{ scale: 0.92 }} onClick={shoot} disabled={cam.status !== 'ready'} aria-label={mode === 'strip' ? 'Start photo strip' : 'Take photo'}
            className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full border-4 border-wine bg-surface p-1 shadow-lift disabled:opacity-40">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-wine text-white">{mode === 'strip' ? <span className="font-serif text-xl font-semibold">4×</span> : <Camera className="h-6 w-6" />}</span>
          </motion.button>
        )}
        <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => cam.flip()} disabled={running || cam.status === 'starting' || !cam.canFlip} aria-label="Switch camera"><FlipHorizontal2 className="h-5 w-5" /></Button>
      </div>
      <p className="mt-4 text-center text-xs text-muted">{mode === 'strip' ? 'We’ll take four photos, three seconds apart. Strike a pose each time.' : 'Photos stay on your device until you choose to save or share them.'}</p>
      <input ref={fileRef} type="file" accept="image/*" multiple={mode === 'strip'} hidden onChange={(e) => { fromFiles(e.target.files); e.target.value = '' }} />
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-2xl bg-blush/40 px-4 py-3 text-sm">
      {label}
      <span className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-wine' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
        {checked && <Check className="absolute left-1.5 top-1.5 h-3 w-3 text-white" />}
      </span>
    </button>
  )
}

function StickerStage({ preview, rendering, stickers, setStickers, selected, setSelected, mode }: {
  preview: string | null; rendering: boolean; stickers: Sticker[]; setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>; selected: string | null; setSelected: (id: string | null) => void; mode: BoothMode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(box.current); return () => ro.disconnect()
  }, [preview])

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !box.current) return
    const r = box.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width + drag.current.dx))
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height + drag.current.dy))
    const id = drag.current.id
    setStickers((l) => l.map((s) => (s.id === id ? { ...s, x, y } : s)))
  }

  return (
    <div className={cn('relative', mode === 'strip' ? 'w-[min(100%,15rem)] sm:w-[min(100%,20rem)]' : mode === 'pair' ? 'w-[min(100%,17rem)] sm:w-[min(100%,22rem)]' : 'w-[min(100%,26rem)]')}>
      <div ref={box} className="relative touch-none select-none overflow-hidden rounded-xl shadow-lift" onPointerDown={() => setSelected(null)} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
        {preview ? <img src={preview} alt="Your photo preview" className="block w-full" draggable={false} /> : <div className="flex aspect-[3/5] items-center justify-center bg-blush/40"><Spinner /></div>}
        {rendering && preview && <div className="absolute inset-0 flex items-center justify-center bg-white/40"><Spinner /></div>}
        {stickers.map((s) => (
          <div key={s.id} role="button" tabIndex={0} aria-label={`Sticker ${s.emoji}`}
            onPointerDown={(e) => {
              e.stopPropagation(); setSelected(s.id)
              const r = box.current!.getBoundingClientRect()
              drag.current = { id: s.id, dx: s.x - (e.clientX - r.left) / r.width, dy: s.y - (e.clientY - r.top) / r.height }
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            }}
            className={cn('absolute -translate-x-1/2 -translate-y-1/2 cursor-grab leading-none active:cursor-grabbing', selected === s.id && 'rounded-xl outline outline-2 outline-dashed outline-white/90 drop-shadow-lg')}
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, fontSize: s.size * w, lineHeight: 1 }}>{s.emoji}</div>
        ))}
      </div>
    </div>
  )
}
