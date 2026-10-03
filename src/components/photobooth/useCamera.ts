import { useCallback, useEffect, useRef, useState } from 'react'
import { cameraErrorMessage } from '@/lib/errors'

export type Facing = 'user' | 'environment'

/** Camera access. The stream is only ever attached to a <video>; frames are copied out on explicit capture. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [facing, setFacing] = useState<Facing>('user')
  const [canFlip, setCanFlip] = useState(true)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(async (face: Facing = facing) => {
    stop()
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext ? "This browser can't access a camera." : 'The camera needs a secure (https) connection.')
      setStatus('error')
      return
    }
    setStatus('starting'); setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: face }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      setFacing(face)
      const v = videoRef.current
      if (v) { v.srcObject = stream; await v.play().catch(() => undefined) }
      setStatus('ready')
      navigator.mediaDevices.enumerateDevices().then((d) => setCanFlip(d.filter((x) => x.kind === 'videoinput').length > 1)).catch(() => undefined)
    } catch (e) {
      setError(cameraErrorMessage(e))
      setStatus('error')
    }
  }, [facing, stop])

  const flip = useCallback(() => start(facing === 'user' ? 'environment' : 'user'), [facing, start])
  useEffect(() => stop, [stop])

  /** Copy the current frame, center-cropped to `ratio` (w/h), mirrored for the front camera. */
  const grab = useCallback((ratio: number, maxW = 1400): string | null => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const vr = v.videoWidth / v.videoHeight
    let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0
    if (vr > ratio) { sw = v.videoHeight * ratio; sx = (v.videoWidth - sw) / 2 } else { sh = v.videoWidth / ratio; sy = (v.videoHeight - sh) / 2 }
    const scale = Math.min(1, maxW / sw)
    const c = document.createElement('canvas')
    c.width = Math.round(sw * scale); c.height = Math.round(sh * scale)
    const ctx = c.getContext('2d')!
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.92)
  }, [facing])

  return { videoRef, status, error, facing, canFlip, start, stop, flip, grab }
}
