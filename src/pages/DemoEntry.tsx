import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FullScreenLoader } from '@/components/ui/Feedback'

export default function DemoEntry() {
  const { enterDemo } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { enterDemo(); navigate('/home', { replace: true }) }, [enterDemo, navigate])
  return <FullScreenLoader label="Opening the demo…" />
}
