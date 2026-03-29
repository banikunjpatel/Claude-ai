export const AVATARS = [
  { id: 1, emoji: '🦊', bg: '#FAF5FC', label: 'Fox' },
  { id: 2, emoji: '🐻', bg: '#FDF2F8', label: 'Bear' },
  { id: 3, emoji: '🐬', bg: '#EFF6FF', label: 'Dolphin' },
  { id: 4, emoji: '🦋', bg: '#F0FDF4', label: 'Butterfly' },
  { id: 5, emoji: '🦁', bg: '#FFFBEB', label: 'Lion' },
  { id: 6, emoji: '🐼', bg: '#FFF7ED', label: 'Panda' },
  { id: 7, emoji: '🐙', bg: '#ECFEFF', label: 'Octopus' },
  { id: 8, emoji: '🦄', bg: '#FAF5FC', label: 'Unicorn' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']
