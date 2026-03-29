import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

type Cycle = 'monthly' | 'annual'

const FAQS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No card required for the 7-day trial. We only ask for payment details if you choose to continue.',
  },
  {
    q: 'What ages does ChampionKids work for?',
    a: 'Ages 1 to 12. Activities automatically adapt to your child\'s age band as they grow.',
  },
  {
    q: 'How long does each activity take?',
    a: 'Every activity is designed for exactly 5 minutes — perfect for the school run, dinner table, or bedtime.',
  },
  {
    q: 'Can I use it for multiple children?',
    a: 'Pro plan supports 1 child. Upgrade to Family for up to 4 children, each with individual tracking.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes, cancel any time from your account. You keep access until the end of your billing period.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-ck-neutral-200 py-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left gap-4"
      >
        <span className="font-semibold text-ck-neutral-900">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ck-neutral-400 flex-shrink-0"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-ck-neutral-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const navigate = useNavigate()

  const proPrice    = cycle === 'annual' ? '£3.33' : '£4.99'
  const familyPrice = cycle === 'annual' ? '£6.66' : '£7.99'

  return (
    <section id="pricing" className="bg-ck-neutral-50 py-20 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="bg-ck-primary-100 text-ck-primary-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          Pricing
        </span>
        <h2 className="mt-3 text-4xl font-black text-ck-neutral-900">Simple, honest pricing</h2>
        <p className="mt-3 text-lg text-ck-neutral-500">Start free. No credit card. Cancel any time.</p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex bg-ck-neutral-200 rounded-full p-1 gap-1">
          {(['monthly', 'annual'] as Cycle[]).map(c => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${
                cycle === c
                  ? 'bg-white shadow-sm font-semibold text-ck-neutral-900'
                  : 'text-ck-neutral-500'
              }`}
            >
              {c === 'monthly' ? 'Monthly' : 'Annual'}
              {c === 'annual' && (
                <span className="ml-2 text-xs font-bold text-ck-success">Save 33%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Trial */}
        <div className="bg-white rounded-3xl p-8 border border-ck-neutral-200 shadow-ck-sm flex flex-col">
          <p className="text-ck-neutral-500 font-bold uppercase text-sm tracking-wide">Free Trial</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-5xl font-black text-ck-neutral-900">£0</span>
          </div>
          <p className="text-ck-neutral-400 text-sm mt-1">for 7 days</p>
          <ul className="mt-6 space-y-3 flex-1">
            {['Today\'s daily activity (always)', '1 child profile', '3 library activities per week'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm font-medium text-ck-neutral-700">
                <span className="text-ck-success mt-0.5">✓</span> {f}
              </li>
            ))}
            {['Full library access', 'Progress tracking', 'Badges and streaks'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ck-neutral-300">
                <span className="mt-0.5">✗</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/signup')}
            className="mt-8 w-full py-4 rounded-full border-2 border-ck-primary-500 text-ck-primary-600 font-bold hover:bg-ck-primary-50 transition-all"
          >
            Start free trial
          </button>
        </div>

        {/* Pro — featured */}
        <div className="bg-ck-primary-600 rounded-3xl p-8 shadow-ck-lg ring-4 ring-ck-primary-400 ring-offset-2 ring-offset-ck-neutral-50 relative flex flex-col">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-ck-primary-900 text-ck-primary-200 text-xs font-bold px-4 py-1.5 rounded-full border border-ck-primary-700 whitespace-nowrap">
            Most popular
          </span>
          <p className="text-ck-primary-200 font-bold uppercase text-sm tracking-wide">Pro</p>
          <div className="mt-2 flex items-end gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={proPrice}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-5xl font-black text-white"
              >
                {proPrice}
              </motion.span>
            </AnimatePresence>
            <span className="text-ck-primary-300 text-lg mb-1">/month</span>
          </div>
          {cycle === 'annual' && (
            <p className="text-ck-primary-300 text-xs font-medium mt-1">Billed £39.99/year — you save £20</p>
          )}
          <ul className="mt-6 space-y-3 flex-1">
            {['Everything in Free', 'Full activity library (200+)', 'Full progress tracking', 'Streak + badge system', 'Weekly coaching digest email', 'New activities every week'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm font-medium text-white">
                <span className="mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/signup')}
            className="mt-8 w-full py-4 rounded-full bg-white text-ck-primary-600 font-bold hover:bg-ck-primary-50 shadow-ck-sm transition-all"
          >
            Get started free →
          </button>
        </div>

        {/* Family */}
        <div className="bg-white rounded-3xl p-8 border border-ck-neutral-200 shadow-ck-sm flex flex-col">
          <p className="text-ck-neutral-500 font-bold uppercase text-sm tracking-wide">Family</p>
          <div className="mt-2 flex items-end gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={familyPrice}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-5xl font-black text-ck-neutral-900"
              >
                {familyPrice}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-ck-neutral-400 text-sm mt-1">
            {cycle === 'annual' ? 'billed £79.99/year' : 'per month'}
          </p>
          <ul className="mt-6 space-y-3 flex-1">
            {['Everything in Pro', 'Up to 4 child profiles', 'Individual progress per child', 'Family streak tracking'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm font-medium text-ck-neutral-700">
                <span className="text-ck-success mt-0.5">✓</span> {f}
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm text-ck-neutral-300">
              <span className="mt-0.5">✗</span> Community features (coming soon)
            </li>
          </ul>
          <button
            onClick={() => navigate('/signup')}
            className="mt-8 w-full py-4 rounded-full border-2 border-ck-primary-500 text-ck-primary-600 font-bold hover:bg-ck-primary-50 transition-all"
          >
            Start family trial
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <h3 className="text-xl font-bold text-ck-neutral-900 text-center mb-6">Frequently asked questions</h3>
        {FAQS.map(faq => (
          <FAQItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </section>
  )
}
