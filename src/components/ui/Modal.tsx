import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

/** Bottom sheet on mobile, centered dialog on larger screens. */
export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-wine-deep/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-4xl bg-surface shadow-lift outline-none sm:rounded-4xl',
              widths[size], className,
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
              <div>
                {title && <h2 className="text-3xl font-semibold leading-tight">{title}</h2>}
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 pt-2 sm:px-8 sm:pb-8" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  body: ReactNode
  confirmLabel: string
  loading?: boolean
  danger?: boolean
  children?: ReactNode
  confirmDisabled?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, loading, danger = true, children, confirmDisabled }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-sm leading-relaxed text-muted">{body}</div>
        {children}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
