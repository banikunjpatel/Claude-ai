import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Skill {
  slug: string
  name: string
  icon: string
  bg: string
  color: string
  text: string
  definition: string
  sample: string
}

const SKILLS: Skill[] = [
  {
    slug: 'communication',
    name: 'Communication',
    icon: '💬',
    bg: '#FAF5FC',
    color: '#9C51B6',
    text: '#612E75',
    definition: 'The ability to express thoughts clearly, listen actively, and adapt to any audience.',
    sample: '"Tell me about your favourite thing using only 3 words."',
  },
  {
    slug: 'leadership',
    name: 'Leadership',
    icon: '🦁',
    bg: '#FFFBEB',
    color: '#D97706',
    text: '#92400E',
    definition: 'Taking initiative, motivating others, and making decisions with confidence.',
    sample: '"If you were headteacher for a day, what one rule would you change?"',
  },
  {
    slug: 'critical-thinking',
    name: 'Critical Thinking',
    icon: '🧠',
    bg: '#EFF6FF',
    color: '#2563EB',
    text: '#1E40AF',
    definition: 'Analysing information, questioning assumptions, and solving problems systematically.',
    sample: '"Why do you think the sky is blue? What if it was red — what would change?"',
  },
  {
    slug: 'creativity',
    name: 'Creativity',
    icon: '🎨',
    bg: '#FDF2F8',
    color: '#DB2777',
    text: '#9D174D',
    definition: 'Generating original ideas, thinking divergently, and approaching problems with imagination.',
    sample: '"Invent a new sport using only things in this room."',
  },
  {
    slug: 'resilience',
    name: 'Resilience',
    icon: '💪',
    bg: '#F0FDF4',
    color: '#16A34A',
    text: '#14532D',
    definition: 'Managing setbacks, regulating emotions, and persisting through difficulty.',
    sample: '"Tell me about a time something was hard. What did you do?"',
  },
  {
    slug: 'social-skills',
    name: 'Social Skills',
    icon: '🤝',
    bg: '#FFF7ED',
    color: '#EA580C',
    text: '#9A3412',
    definition: 'Building relationships, empathising, collaborating, and navigating social situations.',
    sample: '"If a new child joined your class today, how would you help them feel welcome?"',
  },
  {
    slug: 'emotional-intelligence',
    name: 'Emotional Intelligence',
    icon: '❤️',
    bg: '#ECFEFF',
    color: '#0891B2',
    text: '#155E75',
    definition: 'Identifying, understanding, and managing emotions in self and others.',
    sample: '"What does it feel like in your body when you\'re nervous? Where do you feel it?"',
  },
]

const AGE_BANDS = ['Ages 1–2', '3–4', '5–6', '7–8', '9–10', '11–12']

export default function SkillsSection() {
  const [active, setActive] = useState<Skill>(SKILLS[0])

  return (
    <section id="skills" className="bg-white py-20 px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="bg-ck-primary-100 text-ck-primary-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          7 skills
        </span>
        <h2 className="mt-3 text-4xl font-black text-ck-neutral-900 leading-tight">
          Skills that matter in 2030 and beyond
        </h2>
        <p className="mt-4 text-lg text-ck-neutral-500">
          Every activity is mapped to one of seven 21st century skills, tailored to your child's exact age.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: skill cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
          {SKILLS.map(skill => {
            const isActive = skill.slug === active.slug
            return (
              <button
                key={skill.slug}
                onClick={() => setActive(skill)}
                className="rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: isActive ? skill.bg : '#FAFAFA',
                  outline: isActive ? `2px solid ${skill.color}` : '2px solid transparent',
                }}
              >
                <div className="text-3xl mb-3">{skill.icon}</div>
                <p className="text-sm font-bold" style={{ color: isActive ? skill.text : '#404040' }}>
                  {skill.name}
                </p>
              </button>
            )
          })}
        </div>

        {/* Right: detail panel */}
        <div className="relative overflow-hidden rounded-3xl p-8 min-h-[400px]" style={{ backgroundColor: active.bg }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.slug}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full"
            >
              <div className="text-5xl">{active.icon}</div>
              <h3 className="text-2xl font-black mt-3" style={{ color: active.text }}>
                {active.name}
              </h3>
              <span
                className="mt-2 inline-block text-xs font-bold px-3 py-1 rounded-full w-fit"
                style={{ backgroundColor: `${active.color}20`, color: active.text }}
              >
                For ages 1–12
              </span>

              <p className="mt-4 text-base leading-relaxed" style={{ color: active.text, opacity: 0.8 }}>
                {active.definition}
              </p>

              {/* Age bands */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: active.text }}>
                  How it grows
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AGE_BANDS.map(band => (
                    <span
                      key={band}
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: active.text }}
                    >
                      {band}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample activity */}
              <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                <p className="text-xs font-bold uppercase mb-2" style={{ color: active.text }}>
                  Sample activity
                </p>
                <p className="text-sm font-semibold" style={{ color: active.text }}>
                  {active.sample}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
