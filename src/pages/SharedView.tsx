import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { Logo } from '@/components/layout/Brand'
import { BouquetArt } from '@/components/bouquet/BouquetArt'
import { Button } from '@/components/ui/Button'
import { FloatingHearts, HeartBurst } from '@/components/ui/Motion'
import { Skeleton } from '@/components/ui/Feedback'
import { db } from '@/lib/firebase'
import { sanitizeHtml } from '@/lib/sanitize'
import { sanitizeSpec, describeBouquet } from '@/data/bouquet'
import type { Share } from '@/types'

const hashSeed = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

/** Public page for a share link (/s/:token). No login. Content comes from one unlisted document. */
export default function SharedView() {
  const { token = '' } = useParams()
  const [share, setShare] = useState<Share | null | undefined>(undefined)

  useEffect(() => {
    if (!db || !/^[A-Za-z0-9]{10,40}$/.test(token)) { setShare(null); return }
    getDoc(doc(db, 'shares', token)).then((s) => setShare(s.exists() ? ({ ...(s.data() as object), id: s.id } as Share) : null)).catch(() => setShare(null))
  }, [token])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper">
      <FloatingHearts count={8} />
      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-5 py-5"><Logo /><Link to="/signup"><Button size="sm" variant="soft">Make your own</Button></Link></header>
      <main className="relative mx-auto max-w-xl px-5 pb-20 pt-4 text-center">
        {share === undefined ? (
          <div className="space-y-4"><Skeleton className="mx-auto h-8 w-2/3" /><Skeleton className="h-80" /></div>
        ) : share === null ? (
          <div className="py-16"><p className="text-6xl" aria-hidden>🥀</p><h1 className="mt-4 text-4xl font-semibold">This link isn't available.</h1>
            <p className="mt-2 text-muted">It may have been turned off by the person who sent it, or the address is mistyped.</p></div>
        ) : share.kind === 'bouquet' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">A bouquet from {share.fromName}</p>
            <h1 className="text-5xl font-semibold leading-tight">{share.title}</h1>
            <BouquetArt spec={sanitizeSpec(share.spec)} seed={hashSeed(share.id)} animate className="mx-auto mt-2 h-[26rem] w-auto max-w-full" />
            <p className="text-xs text-muted">{describeBouquet(sanitizeSpec(share.spec))}</p>
            {share.message && <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-rose/60 bg-[#fffaf2] p-5 text-left dark:bg-blush/20"><p className="whitespace-pre-wrap font-serif text-2xl leading-snug">{share.message.slice(0, 600)}</p><p className="mt-3 text-right font-script text-3xl text-wine">— {share.fromName}</p></div>}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} className="relative">
            <HeartBurst show />
            <div className="rounded-3xl bg-[#fffaf2] p-7 text-left text-[#3a2229] shadow-lift sm:p-10" style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 31px, rgb(0 0 0 / 0.04) 31px 32px)' }}>
              <p className="eyebrow">A letter from {share.fromName}</p>
              <h1 className="mt-1 text-4xl font-semibold leading-tight">{share.title}</h1>
              {share.photoURL?.startsWith('data:image/') || share.photoURL?.startsWith('https://') ? <img src={share.photoURL} alt="" className="mt-5 max-h-72 w-full rounded-2xl object-cover" /> : null}
              <div className="rich-content mt-5 font-serif text-xl leading-[2rem]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(share.html ?? '') }} />
              <p className="mt-6 text-right font-script text-3xl text-wine">— {share.fromName}</p>
            </div>
          </motion.div>
        )}
        <p className="mt-10 text-sm text-muted">Sent with <Link to="/" className="font-medium text-wine underline underline-offset-2">Love Portal</Link> — a little corner of the internet for two.</p>
      </main>
    </div>
  )
}
