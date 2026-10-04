import type { Couple, CoupleDoc, UserProfile } from '@/types'
import { placeholderImage, toDayString } from '@/lib/utils'
import type { CollectionName } from './store'

export const DEMO_COUPLE_ID = 'demo_couple'
export const DEMO_ME = 'demo_adhidev'
export const DEMO_PARTNER = 'demo_ridhika'

const DAY = 86_400_000
const daysAgo = (n: number) => toDayString(new Date(Date.now() - n * DAY))
const agoMs = (mins: number) => Date.now() - mins * 60_000

export const demoProfile: UserProfile = {
  uid: DEMO_ME,
  name: 'Adhidev',
  nickname: 'Adhi',
  email: 'demo@loveportal.app',
  birthday: '1998-03-14',
  connectionCode: 'LOVE-7X92',
  profileComplete: true,
  createdAt: Date.now() - 500 * DAY,
}

export function buildDemoCouple(): Couple {
  const anniversaryBase = new Date(Date.now() - 482 * DAY)
  return {
    id: DEMO_COUPLE_ID,
    members: [DEMO_ME, DEMO_PARTNER],
    requestId: 'demo_req',
    status: 'active',
    createdAt: Date.now() - 482 * DAY,
    relationshipStart: toDayString(anniversaryBase),
    firstMeeting: daysAgo(540),
    firstDate: daysAgo(500),
    anniversary: toDayString(anniversaryBase),
    memberInfo: {
      [DEMO_ME]: { name: 'Adhidev', nickname: 'Adhi', birthday: '1998-03-14', photoURL: placeholderImage('adhidev', 'A', 300, 300) },
      [DEMO_PARTNER]: { name: 'Ridhika', nickname: 'Ridz', birthday: '1999-07-02', photoURL: placeholderImage('ridhika', 'R', 300, 300) },
    },
    customMilestones: [{ id: 'cm1', title: 'Our first road trip', date: daysAgo(300) }],
  }
}

type Row = CoupleDoc & Record<string, unknown>
const base = (id: string, createdAt: number) => ({ id, coupleId: DEMO_COUPLE_ID, createdAt })

export function buildDemoSeed(): Partial<Record<CollectionName, Row[]>> {
  const messages: Row[] = [
    { ...base('m1', agoMs(240)), authorId: DEMO_PARTNER, kind: 'text', text: 'Good morning, my favourite human ☀️' },
    { ...base('m2', agoMs(236)), authorId: DEMO_ME, kind: 'text', text: 'Morning, love. Did you sleep okay?', reactions: { [DEMO_PARTNER]: '❤️' } },
    { ...base('m3', agoMs(230)), authorId: DEMO_PARTNER, kind: 'text', text: "Like a log. I dreamt we were back in Pondicherry.", pinned: true },
    { ...base('m4', agoMs(226)), authorId: DEMO_ME, kind: 'text', text: 'Take me there again. Soon?', replyTo: 'm3' },
    { ...base('m5', agoMs(120)), authorId: DEMO_PARTNER, kind: 'gesture', text: 'sent you a hug 🫂' },
    { ...base('m6', agoMs(95)), authorId: DEMO_ME, kind: 'text', text: 'I saved the playlist you wanted — the road trip one 🎶', favoritedBy: [DEMO_PARTNER] },
    { ...base('m7', agoMs(60)), authorId: DEMO_PARTNER, kind: 'text', text: "You're the best. Dinner at 8?" },
    { ...base('m8', agoMs(48)), authorId: DEMO_ME, kind: 'text', text: "It's a date. I'll bring the good dessert 🍰" },
    { ...base('m9', agoMs(12)), authorId: DEMO_PARTNER, kind: 'gesture', text: "is thinking of you ❤️" },
  ]
  const mem = (id: string, title: string, d: number, category: string, location: string, description: string, tags: string[]) => ({
    ...base(id, Date.now() - d * DAY),
    authorId: id.length % 2 ? DEMO_ME : DEMO_PARTNER,
    title, description, date: daysAgo(d), location, tags, category, mediaType: 'photo',
    mediaURL: placeholderImage(id + title, title, 800, id === 'mem2' || id === 'mem5' ? 1000 : 640),
  })
  const memories: Row[] = [
    mem('mem1', 'The very first coffee', 500, 'First Date', 'Brew & Co.', 'We said "just an hour". It was five.', ['coffee', 'nerves']),
    mem('mem2', 'Sunset at the pier', 410, 'Trips', 'Pondicherry', 'You made me stop walking just to watch the sky go orange.', ['sunset', 'trip']),
    mem('mem3', 'Pancake disaster', 330, 'Random Moments', 'Home', 'We do not talk about the flip.', ['funny', 'food']),
    mem('mem4', 'Ridhika’s birthday surprise', 245, 'Birthdays', 'The rooftop', 'Fairy lights, her favourite cake, and one very teary smile.', ['birthday']),
    mem('mem5', 'Rainy day in', 190, 'Just Us', 'Home', 'Blankets, old films, and absolutely no plans.', ['cozy']),
    mem('mem6', 'One year of us', 117, 'Anniversaries', 'Our spot', 'A year. It felt like both a moment and forever.', ['anniversary']),
    mem('mem7', 'Mountain road trip', 60, 'Trips', 'Coorg', 'Wrong turn, best view of the whole trip.', ['roadtrip']),
    // lands on "On this day" (exactly one year ago)
    { ...base('mem8', Date.now() - 365 * DAY), authorId: DEMO_ME, title: 'Late night walk', description: 'Midnight street food and long talks.', date: daysAgo(365), location: 'Old town', tags: ['night'], category: 'Just Us', mediaType: 'photo', mediaURL: placeholderImage('walk', 'Late night walk') },
  ]
  const letters: Row[] = [
    { ...base('l1', Date.now() - 20 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'Open when you miss me', template: 'miss', html: '<p>My Adhi,</p><p>If you are reading this, you are missing me — and I am missing you right back. Close your eyes and picture me next to you, stealing your fries.</p><p>Soon, always soon.</p><p><em>— Ridz</em></p>', unlockAt: Date.now() - 18 * DAY, openedAt: Date.now() - 17 * DAY },
    { ...base('l2', Date.now() - 2 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'Open on our anniversary', template: 'anniversary', html: '<p>Happy anniversary, my love.</p><p>Every day with you is my favourite kind of ordinary.</p>', unlockAt: Date.now() + 14 * DAY },
    { ...base('l3', Date.now() - 1 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: "Open when you're stressed", template: 'sad', html: '<p>Breathe. You are doing better than you think.</p><p>I am so proud of you — and dinner is on me tonight.</p>', unlockAt: Date.now() - 1000 },
    { ...base('l4', Date.now() - 6 * DAY), authorId: DEMO_ME, toUid: DEMO_PARTNER, title: 'For the days you doubt yourself', html: '<p>You are the bravest person I know.</p>', unlockAt: Date.now() - 5 * DAY },
  ]
  const dateIdeas: Row[] = [
    { ...base('d1', Date.now() - 3 * DAY), ideaId: 'home-pizza', title: 'Make-your-own pizza night', description: 'Dough, toppings, a playlist, and zero judgement.', cost: '₹', duration: '2 hrs', place: 'At home', planned: daysAgo(-3) },
    { ...base('d2', Date.now() - 9 * DAY), ideaId: 'out-sunset', title: 'Chase a sunset', description: 'Pick a high spot, pack chai, watch the sky.', cost: 'Free', duration: '1.5 hrs', place: 'Outside' },
  ]
  const surprises: Row[] = [
    { ...base('s1', agoMs(180)), authorId: DEMO_PARTNER, toUid: DEMO_ME, type: 'secret', title: 'A small something', message: "I hid a note in your jacket pocket. Go look. 🎁" },
    { ...base('s2', Date.now() - 12 * DAY), authorId: DEMO_ME, toUid: DEMO_PARTNER, type: 'photo', title: 'Remember this?', message: 'Our first sunset.', mediaURL: placeholderImage('sun', 'Our first sunset'), openedAt: Date.now() - 11 * DAY },
  ]
  const coupons: Row[] = [
    { ...base('c1', Date.now() - 30 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'One Free Hug', emoji: '🤗', description: 'Redeemable anytime, no questions asked.' },
    { ...base('c2', Date.now() - 30 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'You Choose The Movie', emoji: '🎬', description: 'Yes, even that one.' },
    { ...base('c3', Date.now() - 30 * DAY), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'Emergency Cuddle Pass', emoji: '🛋️', redeemedAt: Date.now() - 10 * DAY },
    { ...base('c4', Date.now() - 8 * DAY), authorId: DEMO_ME, toUid: DEMO_PARTNER, title: 'Breakfast Made By Me', emoji: '🍳', description: 'Pancakes (non-flipped).' },
  ]
  const ev = (id: string, title: string, d: number, kind: string, description: string, location: string, seed?: string) => ({
    ...base(id, Date.now() - d * DAY), authorId: DEMO_ME, title, date: daysAgo(d), kind, description, location,
    photoURL: seed ? placeholderImage(seed, title, 800, 500) : undefined,
  })
  const timelineEvents: Row[] = [
    ev('t1', 'The first message', 540, 'First message', '"Hey, is this the book club?" — it was not.', 'Online'),
    ev('t2', 'We finally met', 520, 'First meeting', 'Nervous hands, matching smiles.', 'Central Park', 'meet'),
    ev('t3', 'First date', 500, 'First date', 'A one-hour coffee that became five.', 'Brew & Co.', 'date'),
    ev('t4', 'Officially us', 482, 'Official relationship', 'The question. The yes. The grin that lasted a week.', 'Rooftop', 'official'),
    ev('t5', 'First trip together', 410, 'First trip', 'Seven days, one suitcase too many.', 'Pondicherry', 'trip'),
    ev('t6', 'One year of us', 117, 'Anniversary', 'Letters, cake and a long walk home.', 'Our spot', 'year'),
  ]
  const song = (id: string, title: string, artist: string, category: string, why: string, link: string) => ({
    ...base(id, Date.now() - 50 * DAY), authorId: id.length % 2 ? DEMO_ME : DEMO_PARTNER,
    title, artist, category, why, link, coverURL: placeholderImage(title, '♪', 400, 400),
  })
  const playlist: Row[] = [
    song('p1', 'Tum Hi Ho', 'Arijit Singh', 'Our Song', 'Playing in the cafe when we first held hands.', 'https://open.spotify.com/'),
    song('p2', 'Better Together', 'Jack Johnson', 'Comfort Songs', 'Sunday morning, coffee, nothing else.', 'https://music.youtube.com/'),
    song('p3', 'Sunflower', 'Post Malone', 'Road Trips', 'We have sung this off-key on every highway.', 'https://open.spotify.com/'),
    song('p4', 'Kun Faya Kun', 'A. R. Rahman', 'Songs That Remind Me Of You', 'Because you make everything feel possible.', 'https://music.youtube.com/'),
    song('p5', 'Yellow', 'Coldplay', 'First Date', 'The playlist on our walk home.', 'https://open.spotify.com/'),
  ]
  const moods: Row[] = [
    { ...base(`${DEMO_COUPLE_ID}_${DEMO_ME}`, agoMs(300)), uid: DEMO_ME, mood: 'happy', note: 'Good coffee, good day.', updatedAt: agoMs(300) },
    { ...base(`${DEMO_COUPLE_ID}_${DEMO_PARTNER}`, agoMs(35)), uid: DEMO_PARTNER, mood: 'romantic', note: 'Cannot stop smiling at my phone 🥰', updatedAt: agoMs(35) },
  ]
  const notifications: Row[] = [
    { ...base('n1', agoMs(12)), toUid: DEMO_ME, fromUid: DEMO_PARTNER, type: 'message', title: 'Ridhika is thinking of you ❤️', link: '/chat', read: false },
    { ...base('n2', agoMs(180)), toUid: DEMO_ME, fromUid: DEMO_PARTNER, type: 'surprise', title: 'You have a surprise from your person 🎁', link: '/surprises', read: false },
    { ...base('n3', Date.now() - 1 * DAY), toUid: DEMO_ME, fromUid: DEMO_PARTNER, type: 'letter', title: 'A new love letter is waiting', link: '/letters', read: true },
  ]
  const bouquets: Row[] = [
    { ...base('b1', agoMs(90)), authorId: DEMO_PARTNER, toUid: DEMO_ME, title: 'Just because', message: 'Seven roses for the seven things I love most about today. Come home soon.', spec: { stems: [{ type: 'rose', color: '#c0213f', count: 7 }, { type: 'peony', color: '#f19ab0', count: 3 }, { type: 'daisy', color: '#ffffff', count: 4 }], greenery: 'eucalyptus', wrap: 'kraft', wrapColor: '#c9a27a', ribbon: '#6b1d2e' } },
    { ...base('b2', Date.now() - 20 * DAY), authorId: DEMO_ME, toUid: DEMO_PARTNER, title: 'Sunshine for you', message: 'You make every day brighter.', spec: { stems: [{ type: 'sunflower', color: '#f6c21b', count: 5 }, { type: 'lavender', color: '#9b7fd1', count: 4 }], greenery: 'gypsophila', wrap: 'tissue', wrapColor: '#fbf1e6', ribbon: '#2f4a3a' }, openedAt: Date.now() - 19 * DAY },
  ]
  return { bouquets, messages, memories, letters, dateIdeas, surprises, coupons, timelineEvents, playlist, moods, notifications }
}
