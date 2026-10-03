import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BookHeart, CalendarHeart, Gift, Images, Mail, MessageCircleHeart, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { FloatingHearts, Reveal } from '@/components/ui/Motion'
import { useAuth } from '@/context/AuthContext'
import { placeholderImage } from '@/lib/utils'

export function PublicHeader() {
  const { status } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-paper/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="flex items-center gap-2">
          {status === 'signedIn' ? (
            <Link to="/home"><Button size="sm">Open my portal</Button></Link>
          ) : (<>
            <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link to="/signup" className="hidden sm:block"><Button size="sm">Get started</Button></Link>
          </>)}
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line/70 bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-3"><Logo /><span className="text-xs text-muted">© {new Date().getFullYear()}</span></div>
        <nav className="flex gap-6 text-sm text-muted" aria-label="Footer">
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <Link to="/contact" className="hover:text-ink">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}

const FEATURES = [
  { icon: Images, title: 'Your memories', body: 'A private gallery for photos, videos and voice notes — with an “On this day” that finds the moments you forgot you loved.', tone: 'from-rose/40' },
  { icon: MessageCircleHeart, title: 'Your conversations', body: 'A chat built for two. Reactions, replies, pinned favourites, and a hug whenever one is needed.', tone: 'from-blush' },
  { icon: Mail, title: 'Your love letters', body: 'Write letters that arrive sealed in an envelope — and stay locked until the day you choose.', tone: 'from-gold/25' },
  { icon: CalendarHeart, title: 'Your dates', body: 'Never ask “what should we do?” again. Date ideas for every budget, mood and ten-minute window.', tone: 'from-blush' },
  { icon: Gift, title: 'Your little surprises', body: 'Hide a secret message, a coupon for a cuddle, or a voice note — and watch it be unwrapped.', tone: 'from-rose/40' },
  { icon: BookHeart, title: 'Your story', body: 'From the first message to the next milestone: a timeline that grows as you do.', tone: 'from-gold/25' },
]

function DashboardPreview() {
  const { scrollYProgress } = useScroll()
  const rotate = useTransform(scrollYProgress, [0, 0.35], [10, 0])
  const y = useTransform(scrollYProgress, [0, 0.35], [0, -30])
  return (
    <motion.div style={{ rotateX: rotate, y, transformPerspective: 1400 }} className="relative mx-auto mt-14 w-full max-w-5xl">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-b from-rose/40 to-transparent blur-3xl" aria-hidden />
      <div className="overflow-hidden rounded-[2rem] border border-line bg-paper shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-line bg-surface px-4 py-3" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose" /><span className="h-2.5 w-2.5 rounded-full bg-gold/60" /><span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 rounded-full bg-paper px-3 py-0.5 text-[10px] text-muted">loveportal.app/home</span>
        </div>
        <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[11rem_1fr]" aria-hidden>
          <div className="space-y-1.5 border-r border-line bg-surface/60 p-2.5 sm:p-4">
            {['Home', 'Memories', 'Chat', 'Letters', 'Dates', 'Games'].map((l, i) => (
              <div key={l} className={`flex items-center gap-2 rounded-xl px-2 py-2 text-xs ${i === 0 ? 'bg-wine text-white' : 'text-muted'}`}>
                <span className="h-3.5 w-3.5 rounded bg-current opacity-60" /><span className="hidden sm:block">{l}</span>
              </div>
            ))}
          </div>
          <div className="p-4 text-left sm:p-7">
            <p className="eyebrow">Welcome back</p>
            <p className="font-serif text-2xl font-semibold sm:text-4xl">Adhidev &amp; Ridhika ❤️</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="rounded-3xl bg-gradient-to-br from-wine to-wine-deep p-4 text-white sm:col-span-3 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-rose">Together for</p>
                <p className="font-serif text-5xl font-semibold sm:text-7xl">482</p>
                <p className="text-xs text-blush/80">days · 1 year, 4 months</p>
              </div>
              <div className="rounded-3xl border border-line bg-surface p-4 sm:col-span-2">
                <p className="eyebrow">Ridhika feels</p>
                <p className="mt-2 text-3xl">🥰</p>
                <p className="text-xs text-muted">“Cannot stop smiling at my phone”</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {['sunset', 'coffee', 'trip'].map((s) => (
                <img key={s} src={placeholderImage(s, s, 300, 220)} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const { status } = useAuth()
  return (
    <div className="min-h-dvh bg-paper">
      <PublicHeader />
      <main id="main">
      <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center sm:pt-24">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(var(--c-blush))_0%,transparent_70%)]" aria-hidden />
        <FloatingHearts count={9} />
        <div className="relative mx-auto max-w-3xl">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow mb-5 inline-flex items-center gap-2"><Lock className="h-3 w-3" /> Private · Just for two</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-[3.4rem] font-semibold uppercase leading-[0.95] tracking-[0.04em] sm:text-8xl">
            Love <span className="italic normal-case tracking-tight text-wine">Portal</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
            className="mx-auto mt-6 max-w-xl font-serif text-2xl italic leading-snug text-ink/80 sm:text-3xl">
            “A little corner of the internet that belongs only to you two.”
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={status === 'signedIn' ? '/home' : '/signup'} className="w-full sm:w-auto"><Button size="lg" className="w-full">Create Your Love Portal <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="w-full">Login</Button></Link>
          </motion.div>
          <p className="mt-5 text-sm text-muted">Curious first? <Link to="/demo" className="font-medium text-wine underline underline-offset-4">Step inside a demo couple’s world</Link></p>
        </div>
        <div className="relative"><DashboardPreview /></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="eyebrow mb-3">Everything you share, in one place</p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-6xl">Built for the small things that make it <em className="text-wine">yours.</em></h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <motion.div whileHover={{ y: -4 }} className={`card h-full bg-gradient-to-br ${f.tone} to-surface p-7`}>
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-wine shadow-soft"><f.icon className="h-5 w-5" /></span>
                <h3 className="text-3xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-24">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-deep via-wine to-[#9b3550] px-6 py-16 text-center text-white sm:px-14">
            <FloatingHearts count={12} />
            <h2 className="relative text-4xl font-semibold leading-tight sm:text-6xl">Two accounts. <em className="text-rose">One little world.</em></h2>
            <p className="relative mx-auto mt-4 max-w-md text-blush/85">Private by design. Protected by security rules so only the two of you can ever see what’s inside.</p>
            <Link to="/signup" className="relative mt-8 inline-block"><Button size="lg" variant="soft">Create Your Love Portal</Button></Link>
          </div>
        </Reveal>
      </section>
      </main>
      <PublicFooter />
    </div>
  )
}
