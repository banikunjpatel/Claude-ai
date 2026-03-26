export const Colors = {
  brand: '#9C51B6',
  primary: {
    50:  '#FAF5FC',
    100: '#F2E5F7',
    200: '#E4CBF0',
    300: '#CE9EE0',
    400: '#B871CF',
    500: '#9C51B6',
    600: '#7E3D96',
    700: '#612E75',
    800: '#452054',
    900: '#2C1436',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAFA',
    100: '#F5F5F5',
    200: '#E8E8E8',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    700: '#404040',
    900: '#171717',
  },
  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',
  info:    '#2563EB',
} as const

export const Skill = {
  'communication':           { color: '#9C51B6', bg: '#FAF5FC', text: '#612E75' },
  'leadership':              { color: '#D97706', bg: '#FFFBEB', text: '#92400E' },
  'critical-thinking':       { color: '#2563EB', bg: '#EFF6FF', text: '#1E40AF' },
  'creativity':              { color: '#DB2777', bg: '#FDF2F8', text: '#9D174D' },
  'resilience':              { color: '#16A34A', bg: '#F0FDF4', text: '#14532D' },
  'social-skills':           { color: '#EA580C', bg: '#FFF7ED', text: '#9A3412' },
  'emotional-intelligence':  { color: '#0891B2', bg: '#ECFEFF', text: '#155E75' },
} as const

export type SkillSlug = keyof typeof Skill

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
} as const

export const Shadow = {
  sm: {
    shadowColor: '#9C51B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#9C51B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: '#9C51B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const

export const Typography = {
  xs:    { fontSize: 12, lineHeight: 18 },
  sm:    { fontSize: 14, lineHeight: 21 },
  base:  { fontSize: 16, lineHeight: 25 },
  lg:    { fontSize: 18, lineHeight: 27 },
  xl:    { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 31 },
  '3xl': { fontSize: 30, lineHeight: 36 },
} as const
