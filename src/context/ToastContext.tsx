import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'error' | 'love'
interface Toast { id: number; message: string; tone: Tone }
interface ToastApi { show: (message: string, tone?: Tone) => void; error: (m: string) => void; success: (m: string) => void }

const Ctx = createContext<ToastApi | null>(null)
let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++seq
    setToasts((t) => [...t.slice(-3), { id, message, tone }])
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3800)
  }, [dismiss])
  const api = useMemo<ToastApi>(
    () => ({ show, error: (m) => show(m, 'error'), success: (m) => show(m, 'success') }),
    [show],
  )
  const Icon = { success: CheckCircle2, error: AlertCircle, love: Heart }
  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),1rem)] md:items-end md:pr-6"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const I = Icon[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                className={cn(
                  'glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-lift',
                  t.tone === 'error' && 'border-red-300/60',
                )}
              >
                <I className={cn('mt-0.5 h-5 w-5 shrink-0', t.tone === 'error' ? 'text-red-600' : 'text-wine')} />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast outside provider')
  return c
}
