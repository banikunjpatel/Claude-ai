import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STEPS = [
  {
    num: '1',
    icon: '👶',
    title: 'Add your child',
    body: 'Enter your child\'s name and date of birth. We automatically calculate the right age band and choose activities that match their development stage.',
  },
  {
    num: '2',
    icon: '📱',
    title: 'Get today\'s activity',
    body: 'A fresh coaching conversation card is ready every morning. Each one takes 5 minutes and needs zero preparation — just read it and start talking.',
  },
  {
    num: '3',
    icon: '🌱',
    title: 'Watch them grow',
    body: 'Track skills, build streaks, earn badges together. See your child develop confidence, creativity, and resilience over time.',
  },
]

const LOCATIONS = ['🚗 In the car', '🍽️ At dinner', '🌙 Before bed', '🛁 Bath time', '🚶 On a walk']

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" className="bg-ck-neutral-50 py-20 px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="bg-ck-primary-100 text-ck-primary-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          How it works
        </span>
        <h2 className="mt-3 text-4xl font-black text-ck-neutral-900 leading-tight">
          Coaching made ridiculously simple
        </h2>
        <p className="mt-4 text-lg text-ck-neutral-500">
          No prep. No expertise. Just open the app and start talking.
        </p>
      </div>

      {/* Steps */}
      <div ref={ref} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="bg-white rounded-2xl p-8 shadow-ck-sm hover:shadow-ck-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-ck-primary-500 text-white text-xl font-black flex items-center justify-center mb-4">
              {step.num}
            </div>
            <div className="text-3xl mb-3">{step.icon}</div>
            <h3 className="text-xl font-bold text-ck-neutral-900 mb-3">{step.title}</h3>
            <p className="text-ck-neutral-500 leading-relaxed text-base">{step.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Any time, any place */}
      <div className="text-center mt-12">
        <p className="text-2xl font-black text-ck-neutral-900">Any time. Any place.</p>
        <div className="flex justify-center gap-3 flex-wrap mt-4">
          {LOCATIONS.map(loc => (
            <span
              key={loc}
              className="bg-white border border-ck-neutral-200 rounded-full px-4 py-2 text-sm font-semibold text-ck-neutral-500 shadow-ck-sm"
            >
              {loc}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
