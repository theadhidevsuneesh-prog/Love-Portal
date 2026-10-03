import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Brand'
import { FloatingHearts } from '@/components/ui/Motion'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-wine-deep via-wine to-[#9b3550] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <FloatingHearts count={14} />
        <Logo light />
        <div className="relative max-w-md">
          <p className="eyebrow mb-4 text-rose">Private by design</p>
          <p className="font-serif text-5xl font-medium leading-[1.05]">A little corner of the internet that belongs only to <em className="text-rose">you two.</em></p>
          <p className="mt-6 text-sm text-blush/80">Memories, messages, letters and little surprises — locked away from everyone else.</p>
        </div>
        <p className="relative text-xs text-blush/60">© {new Date().getFullYear()} Love Portal</p>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="mb-8 lg:hidden"><Logo /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        </div>
        <p className="text-center text-xs text-muted">
          <Link to="/privacy" className="hover:text-ink">Privacy</Link> · <Link to="/terms" className="hover:text-ink">Terms</Link> · <Link to="/" className="hover:text-ink">Home</Link>
        </p>
      </main>
    </div>
  )
}

export function ConfigNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
      <p className="font-medium">Firebase isn't connected yet.</p>
      <p className="mt-1 text-muted">Add your keys to <code className="rounded bg-line/60 px-1">.env</code> to create real accounts — or <Link to="/demo" className="font-medium text-wine underline underline-offset-2">explore the demo</Link>.</p>
    </div>
  )
}
