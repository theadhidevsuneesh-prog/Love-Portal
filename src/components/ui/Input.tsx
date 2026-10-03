import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full rounded-2xl border bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 transition-shadow focus:border-rose focus:shadow-glow focus:outline-none disabled:opacity-60'

interface FieldProps { label?: string; error?: string; hint?: string; icon?: ReactNode; optional?: boolean }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, error, hint, icon, optional, className, id, ...rest }, ref,
) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
          {label}
          {optional && <span className="text-xs font-normal text-muted">optional</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          ref={ref} id={fid}
          aria-invalid={!!error} aria-describedby={error ? `${fid}-e` : undefined}
          className={cn(base, 'h-12', icon && 'pl-11', error ? 'border-red-400' : 'border-line', className)}
          {...rest}
        />
      </div>
      {error ? <p id={`${fid}-e`} role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
        : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(function Textarea(
  { label, error, hint, optional, className, id, ...rest }, ref,
) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
          {label}
          {optional && <span className="text-xs font-normal text-muted">optional</span>}
        </label>
      )}
      <textarea
        ref={ref} id={fid} aria-invalid={!!error}
        className={cn(base, 'min-h-[110px] resize-y py-3 leading-relaxed', error ? 'border-red-400' : 'border-line', className)}
        {...rest}
      />
      {error ? <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
        : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
})

export function Select({ label, error, className, children, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className="w-full">
      {label && <label htmlFor={fid} className="mb-1.5 block text-sm font-medium">{label}</label>}
      <select id={fid} className={cn(base, 'h-12 appearance-none bg-no-repeat pr-10', error ? 'border-red-400' : 'border-line', className)}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237a6268' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: 'right 1rem center' }}
        {...rest}>
        {children}
      </select>
      {error && <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
