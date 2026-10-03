import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-wine', className)} aria-label="Loading" />
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />
}

export function FullScreenLoader({ label = 'Opening your little world…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper">
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wine text-2xl text-blush shadow-lift" aria-hidden>♥</motion.div>
      <p className="font-serif text-xl italic text-muted">{label}</p>
    </div>
  )
}

export function EmptyState({ emoji = '❤️', title, body, action, className }: { emoji?: string; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center rounded-3xl border border-dashed border-rose/60 bg-blush/30 px-6 py-14 text-center', className)}
    >
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-3xl shadow-soft" aria-hidden>{emoji}</motion.div>
      <h3 className="max-w-md text-2xl font-semibold sm:text-3xl">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}

export function ErrorState({ title = "We couldn't load this", body = 'Check your connection and try again.', onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-red-200 bg-red-50/60 px-6 py-12 text-center dark:bg-red-950/20" role="alert">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-600" />
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      <Button variant="outline" className="mt-5" onClick={onRetry ?? (() => window.location.reload())}>
        <RefreshCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  )
}

export function Badge({ children, tone = 'rose', className }: { children: ReactNode; tone?: 'rose' | 'wine' | 'gold' | 'muted'; className?: string }) {
  const tones = { rose: 'bg-blush text-wine', wine: 'bg-wine text-white', gold: 'bg-gold/20 text-gold', muted: 'bg-line/60 text-muted' }
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone], className)}>{children}</span>
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('scroll-hide flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1', className)}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors', value === o.value ? 'text-white' : 'text-muted hover:text-ink')}>
          {value === o.value && <motion.span layoutId={`seg-${options.map((x) => x.value).join('')}`} className="absolute inset-0 rounded-full bg-wine" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative z-10 flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors', active ? 'border-wine bg-wine text-white' : 'border-line bg-surface text-muted hover:border-rose hover:text-ink')}>
      {children}
    </button>
  )
}
