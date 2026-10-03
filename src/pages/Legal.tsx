import { useState, type FormEvent } from 'react'
import { PublicHeader, PublicFooter } from './Landing'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'

const COPY = {
  privacy: {
    title: 'Privacy',
    updated: 'Your privacy is the whole point.',
    sections: [
      ['What we store', 'Your profile (name, photo, birthday), and the content you and your partner choose to share: messages, memories, letters, playlists and so on. Camera images from the Photo Booth are never stored unless you press Save.'],
      ['Who can see it', "Only the two members of your couple. Access is enforced by database and storage security rules, not just by the app's interface. Other couples — and other users — cannot read your data."],
      ['Your controls', 'You can disconnect from your partner, delete your couple data, or delete your account at any time from Settings. Deleting couple data removes it for both of you.'],
      ['The Love Assistant', 'When you use the Love Assistant, the text you type is sent to an AI provider through our server to generate a reply. Do not share anything you would not want processed this way.'],
      ['Cookies & analytics', 'We use only what is needed to keep you signed in. No advertising trackers.'],
    ],
  },
  terms: {
    title: 'Terms',
    updated: 'The short, human version.',
    sections: [
      ['Be kind', 'Love Portal is for two consenting adults to share a private space. Do not use it to harass, impersonate, or monitor anyone.'],
      ['Your content', 'You own what you upload. You are responsible for having the right to share it. We never sell it.'],
      ['Accounts', 'Keep your password safe. You can only be connected to one partner at a time.'],
      ['No guarantees', 'We work hard to keep your memories safe, but please keep your own backups of anything irreplaceable.'],
    ],
  },
}

export default function Legal({ kind }: { kind: 'privacy' | 'terms' | 'contact' }) {
  const toast = useToast()
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const f = new FormData(e.target as HTMLFormElement)
    const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')}`)
    window.location.href = `mailto:hello@loveportal.app?subject=${encodeURIComponent('Love Portal — hello')}&body=${body}`
    setSent(true); toast.success('Opening your email app…')
  }
  return (
    <div className="min-h-dvh bg-paper">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        {kind === 'contact' ? (
          <>
            <p className="eyebrow mb-2">Say hello</p>
            <h1 className="text-5xl font-semibold">Contact</h1>
            <p className="mt-3 text-muted">Questions, ideas, or a love story to share? We'd love to hear from you.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Input label="Your name" name="name" required maxLength={60} />
              <Textarea label="Message" name="message" required maxLength={1500} />
              <Button type="submit" size="lg">{sent ? 'Sent ❤️' : 'Send message'}</Button>
            </form>
          </>
        ) : (
          <>
            <p className="eyebrow mb-2">{COPY[kind].updated}</p>
            <h1 className="text-5xl font-semibold">{COPY[kind].title}</h1>
            <div className="mt-8 space-y-7">
              {COPY[kind].sections.map(([h, p]) => (
                <section key={h}><h2 className="text-2xl font-semibold">{h}</h2><p className="mt-1.5 leading-relaxed text-muted">{p}</p></section>
              ))}
            </div>
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
