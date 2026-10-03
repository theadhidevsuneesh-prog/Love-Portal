import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export function CountUp({ to, duration = 1.6, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView) return
    if (reduce) { setV(to); return }
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to, duration, reduce])
  return <span ref={ref} className={className}>{v.toLocaleString()}</span>
}

/** Soft floating particles. Used sparingly (hero, connection ceremony, unlocks). */
export function FloatingHearts({ count = 10, className, symbol = '♥' }: { count?: number; className?: string; symbol?: string }) {
  const reduce = useReducedMotion()
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: (i * 97 + 13) % 100, size: 10 + ((i * 7) % 16), delay: -((i * 3.3) % 14), dur: 12 + ((i * 5) % 9), op: 0.15 + ((i % 4) * 0.08),
    })),
    [count],
  )
  if (reduce) return null
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {items.map((h, i) => (
        <span key={i} className="absolute bottom-[-10%] animate-floatUp text-rose"
          style={{ left: `${h.left}%`, fontSize: h.size, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s`, opacity: h.op }}>
          {symbol}
        </span>
      ))}
    </div>
  )
}

/** Burst of confetti-like hearts for celebrations. */
export function HeartBurst({ show }: { show: boolean }) {
  const parts = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ a: (i / 18) * Math.PI * 2, d: 90 + (i % 4) * 40, s: 12 + (i % 3) * 6 })), [])
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {parts.map((p, i) => (
        <motion.span key={i} className="absolute text-rose" style={{ fontSize: p.s }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: i * 0.015 }}>♥</motion.span>
      ))}
    </div>
  )
}
