import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const AVATARS = [
  { initials: 'SM', bg: 'bg-ck-primary-100' },
  { initials: 'JT', bg: 'bg-ck-primary-200' },
  { initials: 'PK', bg: 'bg-ck-primary-300' },
  { initials: 'AR', bg: 'bg-ck-primary-400' },
  { initials: 'LB', bg: 'bg-ck-primary-500' },
]

const fadeUp = (delay = 0) => ({
  initial:   { opacity: 0, y: 20 },
  animate:   { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

const floatAnim = (delay = 0) => ({
  animate:    { y: [0, -8, 0] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const, delay },
})

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="bg-white pt-24 pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 800, height: 800,
          background: 'radial-gradient(circle, #FAF5FC 0%, transparent 70%)',
          top: -200, left: '50%', transform: 'translateX(-50%)',
        }}
      />
      <div className="absolute w-72 h-72 bg-ck-primary-100 rounded-full -top-20 -left-20 blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute w-64 h-64 bg-ck-primary-200 rounded-full -bottom-10 -right-16 blur-3xl opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Announcement badge */}
        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 bg-ck-primary-50 border border-ck-primary-200 rounded-full px-4 py-2 mb-6">
          <motion.span
            className="w-2 h-2 bg-ck-primary-500 rounded-full block"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-ck-primary-700">New activities added every week</span>
          <span className="text-ck-primary-400">→</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl md:text-6xl font-black leading-[1.05] text-ck-neutral-900 mb-4"
        >
          Raise a{' '}
          <span className="bg-gradient-to-r from-ck-primary-500 to-ck-primary-300 bg-clip-text text-transparent">
            champion
          </span>
          {' '}through conversation
        </motion.h1>

        {/* Subheading */}
        <motion.p {...fadeUp(0.2)} className="text-xl text-ck-neutral-500 leading-relaxed max-w-xl mx-auto mb-8">
          Daily 5-minute coaching activities that build the skills your child needs to thrive — at dinner, in the car, or before bedtime.
        </motion.p>

        {/* CTA buttons */}
        <motion.div {...fadeUp(0.3)} className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate('/signup')}
            className="bg-ck-primary-500 text-white font-bold text-base px-8 py-4 rounded-full hover:bg-ck-primary-600 hover:-translate-y-0.5 active:scale-[0.98] shadow-ck-md hover:shadow-ck-lg transition-all duration-200"
          >
            Start free — 7 days, no card →
          </button>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 bg-white text-ck-neutral-700 font-semibold text-base px-8 py-4 rounded-full border-2 border-ck-neutral-200 hover:border-ck-primary-300 hover:text-ck-primary-600 transition-all duration-200"
          >
            ▶ See how it works
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div {...fadeUp(0.4)} className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex -space-x-2">
            {AVATARS.map((a) => (
              <div
                key={a.initials}
                className={`w-8 h-8 rounded-full border-2 border-white ${a.bg} flex items-center justify-center text-xs font-bold text-ck-primary-700`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold text-ck-neutral-500">Trusted by 10,000+ families</span>
          <span className="text-ck-neutral-300">·</span>
          <span className="text-amber-400 text-sm">★★★★★</span>
          <span className="text-sm text-ck-neutral-500">4.9 on App Store</span>
        </motion.div>

        {/* Hero card mockup */}
        <motion.div {...fadeUp(0.5)} className="mt-16 max-w-lg mx-auto relative">
          {/* Main card */}
          <div className="bg-white rounded-3xl shadow-ck-lg p-6 border border-ck-neutral-100 text-left">
            <div className="flex items-center justify-between">
              <span className="bg-ck-primary-100 text-ck-primary-700 text-xs font-bold px-3 py-1.5 rounded-full">
                Critical Thinking
              </span>
              <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ⏱ 5 min
              </span>
            </div>
            <h3 className="mt-3 text-xl font-extrabold text-ck-neutral-900">
              The Desert Island Choice
            </h3>
            <p className="mt-2 text-sm text-ck-neutral-500 leading-relaxed">
              Tell your child: "You're stuck on a desert island and can only bring 3 things. What would you choose and why?"
            </p>
            <div className="mt-4 flex gap-3">
              <button className="flex-1 bg-ck-primary-500 text-white font-bold text-sm py-3 rounded-full hover:bg-ck-primary-600 transition-all">
                Let's do this! →
              </button>
              <button className="px-4 border border-ck-neutral-200 text-ck-neutral-500 font-semibold text-sm rounded-full hover:border-ck-primary-300 transition-all">
                Try another
              </button>
            </div>
          </div>

          {/* Floating badge 1 */}
          <motion.div
            {...floatAnim(0)}
            className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-ck-md px-4 py-3 border border-ck-neutral-100 flex items-center gap-2"
          >
            <span className="text-xl">🔥</span>
            <div>
              <p className="font-bold text-ck-neutral-900 text-sm">5 day streak!</p>
              <p className="text-xs text-ck-neutral-500">Keep it up!</p>
            </div>
          </motion.div>

          {/* Floating badge 2 */}
          <motion.div
            {...floatAnim(1.5)}
            className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-ck-md px-4 py-3 border border-ck-neutral-100 flex items-center gap-2"
          >
            <span className="text-xl">⭐</span>
            <div>
              <p className="font-bold text-ck-neutral-900 text-sm">Badge earned!</p>
              <p className="text-xs text-ck-primary-600 font-semibold">Week Warrior</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
