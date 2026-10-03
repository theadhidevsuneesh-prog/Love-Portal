import { useEffect, useRef } from 'react'
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

const tools = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'h2', icon: Heading2, label: 'Heading' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'quote', icon: Quote, label: 'Quote' },
]

/** Lightweight rich-text editor. Output is always sanitized by the caller before saving. */
export function RichEditor({ value, onChange, placeholder, className }: { value: string; onChange: (html: string) => void; placeholder?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  // Only push external value changes (e.g. template swap) into the DOM.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = sanitizeHtml(value)
  }, [value])

  const run = (cmd: string) => {
    ref.current?.focus()
    if (cmd === 'h2') document.execCommand('formatBlock', false, 'h2')
    else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote')
    else document.execCommand(cmd)
    onChange(ref.current?.innerHTML ?? '')
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-surface focus-within:border-rose focus-within:shadow-glow', className)}>
      <div className="flex flex-wrap gap-0.5 border-b border-line/70 bg-blush/30 p-1.5" role="toolbar" aria-label="Formatting">
        {tools.map((t) => (
          <button key={t.cmd} type="button" aria-label={t.label} title={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => run(t.cmd)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-wine"><t.icon className="h-4 w-4" /></button>
        ))}
      </div>
      <div
        ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Letter body" data-placeholder={placeholder}
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
        className="rich-content min-h-[220px] max-h-[50dvh] overflow-y-auto px-4 py-3 text-[16px] leading-relaxed focus:outline-none empty:before:text-muted/70 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
