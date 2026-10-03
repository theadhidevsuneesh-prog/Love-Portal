import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'soft' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-wine text-white shadow-soft hover:bg-wine-deep',
  soft: 'bg-blush text-wine hover:bg-rose/40',
  ghost: 'text-ink hover:bg-blush/60',
  outline: 'border border-line bg-surface text-ink hover:border-rose hover:bg-blush/40',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-13 min-h-[3.25rem] gap-2 px-7 text-base',
  icon: 'h-10 w-10 shrink-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  )
})
