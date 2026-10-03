import { z } from 'zod'

const name = z
  .string()
  .trim()
  .min(1, 'Please tell us your name')
  .max(40, 'Names can be at most 40 characters')

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'That password is too long')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number')

const email = z.string().trim().min(1, 'Please enter your email').email('That email looks a little off')

export const signupSchema = z
  .object({ name, email, password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: "Passwords don't match" })

export const loginSchema = z.object({ email, password: z.string().min(1, 'Please enter your password') })
export const forgotSchema = z.object({ email })
export const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Enter your current password'), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: "Passwords don't match" })

export const profileSchema = z.object({
  name,
  nickname: z.string().trim().max(24, 'Nicknames can be at most 24 characters').optional(),
  birthday: z
    .string()
    .optional()
    .refine((v) => !v || (new Date(v) < new Date() && new Date(v).getFullYear() > 1900), {
      message: 'Please enter a valid birthday',
    }),
})

export const memorySchema = z.object({
  title: z.string().trim().min(1, 'Give this memory a title').max(80, 'Keep the title under 80 characters'),
  description: z.string().trim().max(1500, 'That is a little long — 1500 characters max').optional(),
  location: z.string().trim().max(80).optional(),
  date: z.string().min(1, 'When did this happen?'),
})

export const letterSchema = z.object({
  title: z.string().trim().min(1, 'Give your letter a title').max(100),
})

export const songSchema = z.object({
  title: z.string().trim().min(1, 'What is the song called?').max(100),
  artist: z.string().trim().min(1, 'Who is it by?').max(100),
  link: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Links should start with https://'),
  why: z.string().trim().max(500).optional(),
})

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Give this moment a title').max(80),
  date: z.string().min(1, 'Pick a date'),
  description: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(80).optional(),
})

export const couponSchema = z.object({
  title: z.string().trim().min(1, 'What is this coupon for?').max(60),
  description: z.string().trim().max(200).optional(),
})

export const surpriseSchema = z.object({
  title: z.string().trim().min(1, 'Give your surprise a title').max(80),
  message: z.string().trim().max(2000).optional(),
})

export type FieldErrors = Record<string, string>
export function zodErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024

export function validateFile(file: File, kind: 'image' | 'video' | 'audio'): string | null {
  const limits = { image: MAX_IMAGE_BYTES, video: MAX_VIDEO_BYTES, audio: MAX_AUDIO_BYTES }
  if (!file.type.startsWith(`${kind}/`)) return `That doesn't look like ${kind === 'image' ? 'an image' : `a ${kind} file`}.`
  if (file.size > limits[kind]) return `That file is too large (max ${Math.round(limits[kind] / 1048576)} MB).`
  return null
}
