import { Component, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/Feedback'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e: unknown) { if (import.meta.env.DEV) console.error(e) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center p-6">
        <ErrorState title="Something slipped" body="That wasn't supposed to happen. Reloading usually fixes it." onRetry={() => window.location.assign('/home')} />
      </div>
    )
  }
}
