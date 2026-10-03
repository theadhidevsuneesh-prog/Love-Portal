import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Brand'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <p className="mt-6 font-serif text-8xl font-semibold text-wine">404</p>
      <h1 className="text-4xl font-semibold">This page wandered off.</h1>
      <p className="max-w-sm text-muted">Even the best couples take a wrong turn sometimes. Let's get you back.</p>
      <Link to="/"><Button size="lg">Take me home</Button></Link>
    </div>
  )
}
