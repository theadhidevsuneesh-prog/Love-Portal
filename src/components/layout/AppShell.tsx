import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LayoutGrid, Sparkles } from 'lucide-react'
import { NAV } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Logo } from './Brand'
import { NotificationBell } from './NotificationCenter'
import { Avatar, CoupleAvatars } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { PageTransition } from '@/components/ui/Motion'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'

export function AppShell() {
  const { me, partner, status } = useCouple()
  const { isDemo, profile } = useAuth()
  const loc = useLocation()
  const [more, setMore] = useState(false)
  const hasCouple = status === 'ready'
  const items = hasCouple ? NAV : NAV.filter((n) => n.to === '/settings')
  const primary = items.filter((n) => n.primary)
  const rest = items.filter((n) => !n.primary)
  const fullBleed = loc.pathname === '/chat'

  return (
    <div className="min-h-dvh md:pl-72">
      {isDemo && (
        <div className={cn('relative z-30 bg-wine-deep px-4 py-2 text-center text-xs text-blush md:pl-72', fullBleed && 'hidden md:block')}>
          You're exploring the <strong>demo</strong> — sample data only, nothing is saved. <Link to="/signup" className="ml-1 underline underline-offset-2">Create your own portal</Link>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-line/70 bg-surface/60 px-5 py-6 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <Logo to="/home" />
          <NotificationBell />
        </div>
        <nav className="scroll-hide -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1" aria-label="Main">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) => cn('group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] transition-colors', isActive ? 'bg-wine text-white shadow-soft' : 'text-muted hover:bg-blush/60 hover:text-ink')}>
              <n.icon className="h-[18px] w-[18px]" />
              {n.label}
              {n.to === '/assistant' && <Sparkles className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blush/50 p-3">
          {hasCouple ? <CoupleAvatars a={me ?? undefined} b={partner ?? undefined} size="sm" /> : <Avatar src={profile?.photoURL} name={profile?.name} size="sm" />}
          <div className="min-w-0 text-sm leading-tight">
            <p className="truncate font-medium">{hasCouple ? `${me?.name} & ${partner?.name}` : profile?.name}</p>
            <p className="text-xs text-muted">{hasCouple ? 'Your little world' : 'Find your person'}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      {!fullBleed && (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-paper/80 px-4 py-2.5 backdrop-blur-xl md:hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.625rem)' }}>
          <Logo to="/home" />
          <NotificationBell />
        </header>
      )}

      <main className={cn('overflow-x-clip', fullBleed ? 'md:px-10 md:py-8' : 'px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-12 md:pt-10')}>
        <div className={cn('mx-auto', fullBleed ? 'max-w-5xl' : 'max-w-6xl')}>
          <AnimatePresence mode="wait">
            <PageTransition key={loc.pathname}><Outlet /></PageTransition>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/90 backdrop-blur-xl md:hidden" aria-label="Main">
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
          {primary.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink to={n.to} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-medium', isActive ? 'text-wine' : 'text-muted')}>
                {({ isActive }) => (<>
                  <span className={cn('flex h-8 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-blush')}><n.icon className="h-[22px] w-[22px]" /></span>
                  {n.label === 'Photo Booth' ? 'Booth' : n.label}
                </>)}
              </NavLink>
            </li>
          ))}
          {rest.length > 0 && (
            <li className="flex-1">
              <button onClick={() => setMore(true)} className="flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-medium text-muted" aria-label="More">
                <span className="flex h-8 w-12 items-center justify-center rounded-full"><LayoutGrid className="h-[22px] w-[22px]" /></span>More
              </button>
            </li>
          )}
        </ul>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="Explore" size="sm">
        <div className="grid grid-cols-3 gap-3">
          {rest.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMore(false)}
              className="flex flex-col items-center gap-2 rounded-3xl bg-blush/50 px-2 py-4 text-center text-xs font-medium text-ink active:scale-95">
              <n.icon className="h-6 w-6 text-wine" />{n.label}
            </NavLink>
          ))}
        </div>
      </Modal>
    </div>
  )
}
