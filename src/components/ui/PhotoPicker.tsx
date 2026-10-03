import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Avatar } from './Avatar'
import { squareAvatar } from '@/lib/image'
import { validateFile } from '@/lib/validation'

export function PhotoPicker({ name, value, onChange, onError }: { name?: string; value?: string; onChange: (blob: Blob, preview: string) => void; onError?: (m: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => input.current?.click()} className="group relative rounded-full" aria-label="Choose profile photo">
        <Avatar src={value} name={name} size="xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-wine-deep/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-6 w-6 text-white" />
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-wine text-white shadow-soft"><Camera className="h-4 w-4" /></span>
      </button>
      <div className="text-sm">
        <p className="font-medium">{busy ? 'Preparing…' : 'Profile photo'}</p>
        <p className="text-muted">A clear photo of you. JPG or PNG.</p>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        const err = validateFile(f, 'image')
        if (err) { onError?.(err); return }
        setBusy(true)
        try {
          const blob = await squareAvatar(f)
          onChange(blob, URL.createObjectURL(blob))
        } catch { onError?.("We couldn't read that image. Try another one.") }
        finally { setBusy(false) }
      }} />
    </div>
  )
}
