import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Heart, Link2, LogOut, QrCode, RefreshCw, Send, X } from 'lucide-react'
import QRCode from 'qrcode'
import { Logo } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Feedback'
import { FloatingHearts } from '@/components/ui/Motion'
import { useAuth } from '@/context/AuthContext'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { acceptRequest, cancelRequest, declineRequest, lookupCode, regenerateCode, sendRequest } from '@/data/connection'
import { friendlyError } from '@/lib/errors'
import { copyText, normalizeCode } from '@/lib/utils'
import type { CodeEntry } from '@/types'

export default function Connect() {
  const { profile, signOut, isDemo, user } = useAuth()
  const { status, incoming, outgoing, partner } = useCouple()
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('code') ?? '')
  const [codeError, setCodeError] = useState('')
  const [looking, setLooking] = useState(false)
  const [found, setFound] = useState<CodeEntry | null>(null)
  const [sending, setSending] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState('')
  const [regen, setRegen] = useState(false)

  const myCode = profile?.connectionCode ?? ''
  const inviteLink = `${window.location.origin}/connect?code=${myCode}`
  const pendingIn = incoming.filter((r) => r.status === 'pending' && r.expiresAt > Date.now())
  const pendingOut = outgoing.filter((r) => r.status === 'pending' && r.expiresAt > Date.now())
  const declinedOut = outgoing.filter((r) => r.status === 'declined').slice(0, 1)

  const lookup = async (raw = code) => {
    if (!user) return
    setCodeError('')
    if (isDemo) { setCodeError('Connecting is disabled in the demo — create an account to try it for real.'); return }
    setLooking(true)
    try { setFound(await lookupCode(raw, user.uid)) }
    catch (e) { setCodeError(friendlyError(e)) }
    finally { setLooking(false) }
  }

  // Deep-link: /connect?code=LOVE-XXXX
  useEffect(() => {
    const c = params.get('code')
    if (c && user && !isDemo && status === 'none') { setCode(normalizeCode(c)); lookup(c) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, status])

  const send = async () => {
    if (!profile || !found) return
    setSending(true)
    try {
      await sendRequest(profile, found)
      toast.show(`Request sent to ${found.name} ❤️`, 'love')
      setFound(null); setCode(''); setParams({})
    } catch (e) { setCodeError(friendlyError(e)); setFound(null) }
    finally { setSending(false) }
  }

  const accept = async (id: string) => {
    const req = incoming.find((r) => r.id === id)
    if (!req || !profile) return
    setBusyId(id)
    try { await acceptRequest(req, profile) }
    catch (e) { toast.error(friendlyError(e)) }
    finally { setBusyId('') }
  }
  const decline = async (id: string) => {
    const req = incoming.find((r) => r.id === id)
    if (!req) return
    setBusyId(id)
    try { await declineRequest(req); toast.success('Request declined.') }
    catch (e) { toast.error(friendlyError(e)) } finally { setBusyId('') }
  }
  const cancel = async (id: string) => {
    const req = outgoing.find((r) => r.id === id)
    if (!req) return
    try { await cancelRequest(req) } catch (e) { toast.error(friendlyError(e)) }
  }

  const showQr = async () => {
    if (qr) return setQr(null)
    setQr(await QRCode.toDataURL(inviteLink, { margin: 1, width: 320, color: { dark: '#4a1220', light: '#fffcf8' } }))
  }
  const copy = async (text: string, label: string) => toast.show((await copyText(text)) ? `${label} copied` : "Couldn't copy — select and copy manually.", 'success')
  const doRegen = async () => {
    if (!profile) return
    setRegen(true)
    try { await regenerateCode(profile); setQr(null); toast.success('New code created. The old one no longer works.') }
    catch (e) { toast.error(friendlyError(e)) } finally { setRegen(false) }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper">
      <FloatingHearts count={8} />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo to={status === 'ready' ? '/home' : '/connect'} />
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Log out</Button>
      </header>

      <main className="relative mx-auto max-w-5xl px-5 pb-16 pt-4">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-3">Step 2 of 2</p>
          <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">Now let's find your person <span className="text-wine">❤️</span></h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">One of you shares a code, the other enters it. Once you both say yes, your little world opens.</p>
        </div>

        {status === 'ready' && (
          <div className="card mx-auto mb-8 max-w-xl p-6 text-center">
            <p className="font-serif text-2xl">You're connected{partner ? ` with ${partner.name}` : ''} ❤️</p>
            <p className="mt-1 text-sm text-muted">A user can only have one partner at a time. You can manage this in Settings.</p>
            <Button className="mt-4" onClick={() => navigate('/home')}>Go to our world</Button>
          </div>
        )}

        <AnimatePresence>
          {pendingIn.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="card mx-auto mb-6 flex max-w-xl flex-col items-center gap-4 border-rose bg-gradient-to-br from-blush/60 to-surface p-6 text-center sm:flex-row sm:text-left">
              <Avatar src={r.fromPhoto} name={r.fromName} size="lg" />
              <div className="flex-1">
                <p className="eyebrow mb-1">Connection request</p>
                <p className="font-serif text-2xl leading-tight">{r.fromName} wants to connect with you ❤️</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => accept(r.id)} loading={busyId === r.id}><Check className="h-4 w-4" /> Accept</Button>
                <Button variant="outline" onClick={() => decline(r.id)} disabled={busyId === r.id}>Decline</Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pendingOut.map((r) => (
          <div key={r.id} className="card mx-auto mb-6 flex max-w-xl items-center gap-4 p-5">
            <Avatar src={r.toPhoto} name={r.toName} />
            <div className="flex-1 text-sm"><p className="font-medium">Waiting for {r.toName} to accept…</p><p className="text-muted">We'll let you know the moment they do.</p></div>
            <Badge tone="gold">Pending</Badge>
            <Button variant="ghost" size="sm" onClick={() => cancel(r.id)}>Cancel</Button>
          </div>
        ))}
        {declinedOut.length > 0 && pendingOut.length === 0 && (
          <p className="mx-auto mb-6 max-w-xl rounded-2xl bg-line/50 px-4 py-3 text-center text-sm text-muted">{declinedOut[0].toName} declined the request. Double-check the code and try again.</p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Option 1 */}
          <section className="card flex flex-col p-6 sm:p-8">
            <Badge className="self-start">Option 1</Badge>
            <h2 className="mt-3 text-3xl font-semibold">Create invitation</h2>
            <p className="mt-1 text-sm text-muted">Share this with your person ❤️</p>
            <div className="my-6 rounded-3xl bg-gradient-to-br from-wine to-wine-deep p-6 text-center text-white shadow-lift">
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-rose">Your Love Portal code</p>
              <p className="select-all font-mono text-3xl font-semibold tracking-[0.18em] sm:text-4xl" aria-label={`Your code is ${myCode}`}>{myCode || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 [&>button]:whitespace-nowrap [&>button]:px-3">
              <Button variant="outline" onClick={() => copy(myCode, 'Code')} disabled={!myCode}><Copy className="h-4 w-4" /> Copy Code</Button>
              <Button variant="outline" onClick={showQr} disabled={!myCode}><QrCode className="h-4 w-4" /> {qr ? 'Hide QR' : 'Generate QR'}</Button>
              <Button variant="outline" className="col-span-2" onClick={() => copy(inviteLink, 'Invite link')} disabled={!myCode}><Link2 className="h-4 w-4" /> Copy Invite Link</Button>
            </div>
            <AnimatePresence>
              {qr && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-5 flex flex-col items-center rounded-3xl bg-surface p-4">
                    <img src={qr} alt={`QR code for invitation ${myCode}`} className="h-52 w-52 rounded-2xl" />
                    <p className="mt-2 text-xs text-muted">Scan with their phone camera</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={doRegen} disabled={regen || isDemo} className="mt-auto flex items-center gap-1.5 self-start pt-6 text-xs text-muted hover:text-ink disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${regen ? 'animate-spin' : ''}`} /> Generate a new code
            </button>
          </section>

          {/* Option 2 */}
          <section className="card flex flex-col p-6 sm:p-8">
            <Badge className="self-start">Option 2</Badge>
            <h2 className="mt-3 text-3xl font-semibold">Enter partner code</h2>
            <p className="mt-1 text-sm text-muted">Enter your person's Love Portal code</p>
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); lookup() }}>
              <Input label="Their code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError('') }} placeholder="LOVE-7X92"
                className="text-center font-mono text-xl tracking-[0.15em]" maxLength={10} autoCapitalize="characters" autoComplete="off" spellCheck={false} error={codeError} />
              <Button type="submit" size="lg" className="w-full" loading={looking} disabled={code.trim().length < 4}><Send className="h-4 w-4" /> Find my person</Button>
            </form>
            <p className="mt-auto pt-6 text-xs text-muted">Codes are private. Only someone with your code can send you a request, and you always get to say yes or no.</p>
          </section>
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          Just looking around? <Link to="/demo" className="font-medium text-wine hover:underline">Explore the demo couple</Link>
        </p>
      </main>

      <Modal open={!!found} onClose={() => setFound(null)} size="sm">
        {found && (
          <div className="flex flex-col items-center pb-2 text-center">
            <p className="eyebrow mb-4">Is this your person?</p>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Avatar src={found.photoURL} name={found.name} size="xl" /></motion.div>
            <p className="mt-4 font-serif text-4xl font-semibold">{found.name}</p>
            <p className="mt-1 text-sm text-muted">We'll send them a request. Your world opens once they accept.</p>
            <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row-reverse">
              <Button size="lg" className="flex-1" loading={sending} onClick={send}>Connect <Heart className="h-4 w-4 fill-current" /></Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={() => setFound(null)}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
