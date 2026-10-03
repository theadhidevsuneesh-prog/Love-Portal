import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return (
    <AnimatePresence>
      {!online && (
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-wine-deep px-4 py-2 text-sm text-white" role="alert">
          <WifiOff className="h-4 w-4" /> You're offline. We'll sync everything when you're back.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
