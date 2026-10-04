export type Id = string

export interface UserProfile {
  uid: Id
  name: string
  nickname?: string
  email: string
  photoURL?: string
  birthday?: string
  connectionCode: string
  profileComplete: boolean
  createdAt: number
  theme?: 'ivory' | 'dusk'
  notificationPrefs?: Partial<Record<NotificationType, boolean>>
  privacy?: { showMood: boolean; showReadReceipts: boolean }
}

export interface MemberInfo {
  name: string
  nickname?: string
  photoURL?: string
  birthday?: string
}

export interface Couple {
  id: Id
  members: [Id, Id]
  memberInfo: Record<Id, MemberInfo>
  requestId: Id
  status: 'active' | 'disconnected'
  createdAt: number
  relationshipStart?: string
  firstMeeting?: string
  firstDate?: string
  anniversary?: string
  customMilestones?: { id: string; title: string; date: string }[]
}

export interface ConnectionRequest {
  id: Id
  fromUid: Id
  toUid: Id
  fromName: string
  fromPhoto?: string
  toName: string
  toPhoto?: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  coupleId?: Id
  createdAt: number
  expiresAt: number
}

export interface CodeEntry {
  code: string
  uid: Id
  name: string
  photoURL?: string
}

/** Base for every couple-owned document. */
export interface CoupleDoc {
  id: Id
  coupleId: Id
  createdAt: number
  authorId?: Id
}

export interface Message extends CoupleDoc {
  authorId: Id
  kind: 'text' | 'image' | 'voice' | 'gesture'
  text?: string
  mediaURL?: string
  replyTo?: Id
  reactions?: Record<Id, string>
  pinned?: boolean
  favoritedBy?: Id[]
  deleted?: boolean
}

export type MemoryCategory =
  | 'First Date'
  | 'Trips'
  | 'Random Moments'
  | 'Birthdays'
  | 'Anniversaries'
  | 'Just Us'

export interface Memory extends CoupleDoc {
  authorId: Id
  title: string
  description?: string
  date: string
  location?: string
  tags: string[]
  category: MemoryCategory
  mediaType: 'photo' | 'video' | 'audio' | 'none'
  mediaURL?: string
  extraPhotos?: string[]
}

export interface Letter extends CoupleDoc {
  authorId: Id
  toUid: Id
  title: string
  template?: string
  html: string
  photoURL?: string
  musicURL?: string
  unlockAt: number
  openedAt?: number
}

export interface SavedDate extends CoupleDoc {
  ideaId: string
  title: string
  description: string
  cost: string
  duration: string
  place: string
  planned?: string
  done?: boolean
}

export interface GameState extends CoupleDoc {
  game: string
  promptIdx: number
  picks: Record<Id, string>
  asker?: Id
  verdict?: string
  matches: number
  rounds: number
  [k: string]: unknown
}

export type SurpriseType = 'letter' | 'photo' | 'video' | 'voice' | 'coupon' | 'secret'
export interface Surprise extends CoupleDoc {
  authorId: Id
  toUid: Id
  type: SurpriseType
  title: string
  message?: string
  mediaURL?: string
  openedAt?: number
}

export interface Coupon extends CoupleDoc {
  authorId: Id
  toUid: Id
  title: string
  description?: string
  emoji: string
  redeemedAt?: number
}

export interface TimelineEvent extends CoupleDoc {
  authorId: Id
  title: string
  date: string
  description?: string
  location?: string
  photoURL?: string
  kind: string
}

export type SongCategory =
  | 'Our Song'
  | 'First Date'
  | 'Road Trips'
  | 'Comfort Songs'
  | 'Songs That Remind Me Of You'

export interface Song extends CoupleDoc {
  authorId: Id
  title: string
  artist: string
  coverURL?: string
  link?: string
  why?: string
  category: SongCategory
}

export interface MoodDoc extends CoupleDoc {
  uid: Id
  mood: string
  note?: string
  updatedAt: number
}

export type NotificationType =
  | 'message'
  | 'memory'
  | 'letter'
  | 'surprise'
  | 'connection'
  | 'anniversary'
  | 'date'

export interface AppNotification extends CoupleDoc {
  toUid: Id
  fromUid: Id
  type: NotificationType
  title: string
  body?: string
  link?: string
  read: boolean
}

export type FlowerType = 'rose' | 'tulip' | 'sunflower' | 'daisy' | 'lily' | 'peony' | 'blossom' | 'lavender'
export interface BouquetStem { type: FlowerType; color: string; count: number }
export interface BouquetSpec {
  stems: BouquetStem[]
  greenery: 'none' | 'eucalyptus' | 'fern' | 'gypsophila'
  wrap: 'none' | 'kraft' | 'tissue' | 'cone' | 'floral'
  wrapColor: string
  ribbon: string
}
export interface Bouquet extends CoupleDoc {
  authorId: Id
  toUid: Id
  title: string
  message?: string
  spec: BouquetSpec
  openedAt?: number
}

/** A public, unlisted link to a single letter or bouquet. The document id is the (unguessable) token. */
export interface Share extends CoupleDoc {
  authorId: Id
  kind: 'letter' | 'bouquet'
  sourceId: Id
  title: string
  fromName: string
  html?: string
  photoURL?: string
  message?: string
  spec?: BouquetSpec
}

/** Live "together" photo-booth session: one document per couple. Per-user keys: seen_<uid>, ready_<uid>. */
export interface BoothSession extends CoupleDoc {
  phase: 'lobby' | 'shooting'
  sessionId?: string
  startedBy?: Id
  [k: string]: unknown
}
export interface BoothFrames extends CoupleDoc {
  sessionId: string
  uid: Id
  frames: string[]
}
