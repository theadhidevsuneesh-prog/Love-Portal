import {
  Home, Images, Camera, MessageCircleHeart, Mail, CalendarHeart, Gamepad2, BookHeart, Gift,
  Music2, Settings, Sparkles, type LucideIcon,
} from 'lucide-react'
import type { MemoryCategory, NotificationType, SongCategory } from '@/types'

export interface NavItem { to: string; label: string; icon: LucideIcon; primary?: boolean }

export const NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home, primary: true },
  { to: '/memories', label: 'Memories', icon: Images, primary: true },
  { to: '/photo-booth', label: 'Photo Booth', icon: Camera, primary: true },
  { to: '/chat', label: 'Chat', icon: MessageCircleHeart, primary: true },
  { to: '/letters', label: 'Love Letters', icon: Mail },
  { to: '/dates', label: 'Dates', icon: CalendarHeart },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/our-story', label: 'Our Story', icon: BookHeart },
  { to: '/surprises', label: 'Surprises', icon: Gift },
  { to: '/playlist', label: 'Playlist', icon: Music2 },
  { to: '/assistant', label: 'Love Assistant', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const MOODS = [
  { id: 'loved', emoji: '❤️', label: 'Loved' },
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'romantic', emoji: '🥰', label: 'Romantic' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'annoyed', emoji: '😤', label: 'Annoyed' },
  { id: 'hug', emoji: '🫂', label: 'Need a hug' },
  { id: 'flirty', emoji: '💋', label: 'Feeling flirty' },
] as const

export const moodById = (id?: string) => MOODS.find((m) => m.id === id)

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  'First Date', 'Trips', 'Random Moments', 'Birthdays', 'Anniversaries', 'Just Us',
]

export const SONG_CATEGORIES: SongCategory[] = [
  'Our Song', 'First Date', 'Road Trips', 'Comfort Songs', 'Songs That Remind Me Of You',
]

export const EVENT_KINDS = [
  'First message', 'First meeting', 'First date', 'Official relationship', 'First trip',
  'Birthday', 'Anniversary', 'Custom',
]

export const LETTER_TEMPLATES = [
  { id: 'miss', title: 'Open when you miss me', body: '<p>My love,</p><p>If you are reading this, you are missing me — and I want you to know I am missing you right back. Close your eyes for a second and picture me next to you, stealing your fries.</p><p>Soon.</p>' },
  { id: 'sad', title: "Open when you're sad", body: "<p>Hey you,</p><p>I wish I could be there to hold you. Since I can't, here is what I want you to remember: you are loved, you are enough, and this feeling will pass. I'm not going anywhere.</p>" },
  { id: 'angry', title: "Open when you're angry", body: "<p>Okay, deep breath.</p><p>Whatever I did (and I probably did something), I'm sorry — and I love you even when we're both being ridiculous. Let's talk when you're ready. I'll bring snacks.</p>" },
  { id: 'anniversary', title: 'Open on our anniversary', body: '<p>Happy anniversary, my love.</p><p>Every day with you has been my favourite kind of ordinary. Thank you for choosing me, again and again.</p>' },
  { id: 'reminder', title: 'Open when you need a reminder that I love you', body: '<p>Consider this your reminder:</p><p>I love you. I am proud of you. You are my favourite person in the whole world, and that is not going to change.</p>' },
  { id: 'blank', title: 'A letter from the heart', body: '' },
]

export const COUPON_PRESETS = [
  { emoji: '🤗', title: 'One Free Hug' },
  { emoji: '🎬', title: 'You Choose The Movie' },
  { emoji: '🍳', title: 'Breakfast Made By Me' },
  { emoji: '🌹', title: 'Your Choice Date' },
  { emoji: '🛋️', title: 'Emergency Cuddle Pass' },
]

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  message: 'New messages',
  memory: 'New memories',
  letter: 'Love letters',
  surprise: 'Surprises',
  connection: 'Connection requests',
  anniversary: 'Upcoming anniversary',
  date: 'Upcoming dates',
}

export const MILESTONE_DEFS = [
  { id: 'd0', days: 0, title: 'First Day', blurb: 'Where it all began.' },
  { id: 'd30', days: 30, title: '1 Month', blurb: 'Thirty days of choosing each other.' },
  { id: 'd100', days: 100, title: '100 Days', blurb: 'A hundred sunrises, side by side.' },
  { id: 'd182', days: 182, title: 'Half a Year', blurb: 'Six months of us.' },
  { id: 'd365', days: 365, title: '1 Year', blurb: 'A full trip around the sun together.' },
  { id: 'd500', days: 500, title: '500 Days', blurb: 'Five hundred days and still counting.' },
  { id: 'd730', days: 730, title: '2 Years', blurb: 'Two years of home in each other.' },
  { id: 'd1000', days: 1000, title: '1000 Days', blurb: 'A thousand days. A thousand reasons.' },
  { id: 'd1461', days: 1461, title: '4 Years', blurb: 'Four years of us.' },
  { id: 'd1826', days: 1826, title: '5 Years', blurb: 'Half a decade of love.' },
]
