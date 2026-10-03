import { useCallback, useEffect, useRef, useState } from 'react'

/** Microphone recording with MediaRecorder. Audio never leaves the device until the caller uploads it. */
export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number>()
  const stream = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    window.clearInterval(timer.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setRecording(false)
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw Object.assign(new Error('unsupported'), { name: 'NotFoundError' })
    }
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    const r = new MediaRecorder(stream.current)
    chunks.current = []
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
    r.start()
    rec.current = r
    setSeconds(0)
    setRecording(true)
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [])

  const stop = useCallback(() => new Promise<Blob | null>((resolve) => {
    const r = rec.current
    if (!r || r.state === 'inactive') { cleanup(); resolve(null); return }
    r.onstop = () => {
      const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' })
      cleanup()
      resolve(blob.size ? blob : null)
    }
    r.stop()
  }), [cleanup])

  const cancel = useCallback(() => {
    const r = rec.current
    if (r && r.state !== 'inactive') { r.onstop = null; r.stop() }
    cleanup()
  }, [cleanup])

  return { recording, seconds, start, stop, cancel }
}

export function fmtSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
