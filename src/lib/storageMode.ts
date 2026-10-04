import { AppError } from './errors'

/**
 * Free-plan mode (default): photos and voice notes are stored *inside* Firestore documents as small
 * data URLs, so no Firebase Storage bucket (which needs the paid Blaze plan) is required.
 * Set VITE_STORAGE_MODE=storage once Cloud Storage is enabled to use real file storage instead.
 */
export const INLINE_MEDIA = import.meta.env.VITE_STORAGE_MODE !== 'storage'

/** Firestore documents max out at 1 MiB, so every inline file has to stay well below that. */
export const MAX_INLINE_BYTES = 700_000

export const VIDEO_UNSUPPORTED = 'Videos need Cloud Storage, which isn’t switched on. Photos and voice notes work great.'

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(new Error('read'))
    r.readAsDataURL(b)
  })
}

/** Re-encodes an image as JPEG, shrinking until it fits `maxBytes`. */
export async function fitImage(blob: Blob, maxBytes: number): Promise<Blob> {
  if (blob.size <= maxBytes && /^image\/(jpeg|webp)$/.test(blob.type)) return blob
  const bmp = await createImageBitmap(blob)
  let scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  let quality = 0.85
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(bmp.width * scale))
    c.height = Math.max(1, Math.round(bmp.height * scale))
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    const out = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', quality))
    if (out && out.size <= maxBytes) return out
    scale *= 0.8
    quality = Math.max(0.55, quality - 0.06)
  }
  throw new AppError('too-large', 'That image is too large to save. Try a smaller one.')
}

/** Turns any upload into a data URL that fits in a Firestore document. */
export async function toInlineDataUrl(blob: Blob, maxBytes = MAX_INLINE_BYTES): Promise<string> {
  if (blob.type.startsWith('video/')) throw new AppError('video-unsupported', VIDEO_UNSUPPORTED)
  if (blob.type.startsWith('image/')) return blobToDataUrl(await fitImage(blob, maxBytes))
  if (blob.size > maxBytes) throw new AppError('too-large', 'That recording is too long. Keep voice notes under about two minutes.')
  return blobToDataUrl(blob)
}
