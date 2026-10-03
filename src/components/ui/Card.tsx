import type { HTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card p-5 sm:p-6', className)} {...rest} />
}

export function HoverCard({ className, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn('card p-5 transition-shadow hover:shadow-lift sm:p-6', className)}
      {...rest}
    />
  )
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold leading-none sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}
