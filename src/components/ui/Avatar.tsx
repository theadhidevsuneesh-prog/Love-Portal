import { cn, initials } from '@/lib/utils'

const sizes = { xs: 'h-7 w-7 text-xs', sm: 'h-9 w-9 text-sm', md: 'h-12 w-12 text-base', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-4xl' }

export function Avatar({ src, name, size = 'md', className, ring }: { src?: string; name?: string; size?: keyof typeof sizes; className?: string; ring?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose to-wine font-serif font-semibold text-white',
        ring && 'ring-4 ring-surface', sizes[size], className,
      )}
    >
      {src ? <img src={src} alt={name ? `${name}'s photo` : ''} className="h-full w-full object-cover" draggable={false} /> : initials(name)}
    </span>
  )
}

export function CoupleAvatars({ a, b, size = 'lg' }: { a?: { name?: string; photoURL?: string }; b?: { name?: string; photoURL?: string }; size?: keyof typeof sizes }) {
  return (
    <div className="flex items-center">
      <Avatar src={a?.photoURL} name={a?.name} size={size} ring />
      <Avatar src={b?.photoURL} name={b?.name} size={size} ring className="-ml-5" />
    </div>
  )
}
