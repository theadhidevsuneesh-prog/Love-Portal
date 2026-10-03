import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FloatingHearts } from '@/components/ui/Motion'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

/** Plays once per couple, the first time the connection becomes active on this device. */
export function ConnectionCeremony() {
  const { status, couple, me, partner } = useCouple()
  const { isDemo } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isDemo || status !== 'ready' || !couple) return
    // Only celebrate genuinely new couples (created in the last day).
    const fresh = Date.now() - couple.createdAt < 86_400_000
    let seen = true
    try { seen = localStorage.getItem(`lp_ceremony_${couple.id}`) === '1' } catch { /* ignore */ }
    if (fresh && !seen) setShow(true)
  }, [status, couple, isDemo])

  useEffect(() => {
    if (!show) return
    const t1 = setTimeout(() => setStep(1), 1800)
    const t2 = setTimeout(() => setStep(2), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [show])

  const finish = () => {
    if (couple) try { localStorage.setItem(`lp_ceremony_${couple.id}`, '1') } catch { /* ignore */ }
    setShow(false)
    navigate('/home')
  }

  return (
    <AnimatePresence>
      {show && couple && (
        <motion.div className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden bg-wine-deep px-6 text-center text-white"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} role="dialog" aria-label="Connected">
          <FloatingHearts count={18} />
          <div className="relative flex items-center">
            <motion.div initial={{ x: -140, opacity: 0 }} animate={{ x: step >= 1 ? 22 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.2 }}>
              <Avatar src={me?.photoURL} name={me?.name} size="xl" className="ring-4 ring-white/20" />
            </motion.div>
            <motion.div initial={{ x: 140, opacity: 0 }} animate={{ x: step >= 1 ? -22 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.2 }}>
              <Avatar src={partner?.photoURL} name={partner?.name} size="xl" className="ring-4 ring-white/20" />
            </motion.div>
            <AnimatePresence>
              {step >= 1 && (
                <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush text-2xl text-wine shadow-lift">♥</motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="relative mt-12 min-h-[11rem]">
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="font-serif text-5xl font-semibold leading-tight sm:text-6xl">
              Two accounts.
            </motion.h1>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 12 }} transition={{ duration: 0.8 }} className="font-serif text-5xl font-semibold italic leading-tight text-rose sm:text-6xl">
              One little world. ❤️
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 2 ? 1 : 0 }} className="mt-8">
              <p className="mb-5 text-sm text-blush/80">Couple ID · <span className="font-mono tracking-wider">{couple.id.slice(0, 10).toUpperCase()}</span></p>
              <Button size="lg" variant="soft" onClick={finish} disabled={step < 2}>Enter our world</Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
