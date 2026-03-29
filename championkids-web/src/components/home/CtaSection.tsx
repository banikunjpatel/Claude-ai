import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function CtaSection() {
  const navigate = useNavigate()

  return (
    <section className="bg-ck-primary-900 py-24 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute w-96 h-96 bg-ck-primary-700/30 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-ck-primary-500/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-ck-primary-300 text-sm font-semibold uppercase tracking-widest mb-4"
        >
          Start your journey
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight mb-4"
        >
          Start raising a<br />champion today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-ck-primary-200 text-lg leading-relaxed mb-8"
        >
          Join 10,000+ families building 21st century skills through daily 5-minute conversations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-ck-primary-600 font-bold text-base px-10 py-5 rounded-full hover:bg-ck-primary-50 shadow-ck-lg transition-all duration-200"
          >
            Start free — 7 days, no card →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-ck-primary-300 font-semibold text-base px-8 py-5 border border-ck-primary-700 rounded-full hover:border-ck-primary-500 hover:text-white transition-all"
          >
            Sign in
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex items-center justify-center gap-6 flex-wrap"
        >
          {['✓ No credit card', '✓ Cancel any time', '✓ iOS · Android · Web'].map(badge => (
            <span key={badge} className="text-ck-primary-300 text-sm">{badge}</span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
