import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ className, to = '/', light }: { className?: string; to?: string; light?: boolean }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Love Portal home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine text-base text-blush shadow-soft" aria-hidden>♥</span>
      <span className={cn('font-serif text-[1.65rem] font-semibold leading-none tracking-tight', light ? 'text-white' : 'text-ink')}>
        Love Portal
      </span>
    </Link>
  )
}
