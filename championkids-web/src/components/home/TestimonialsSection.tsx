const TESTIMONIALS = [
  {
    quote:  'I was sceptical at first — how much can a 5-minute chat really do? But after 3 weeks I genuinely noticed my 7-year-old asking "why" more. She\'s thinking differently.',
    name:   'Sarah M.',
    role:   'Parent of Mia (age 7)',
    initials: 'SM',
    bg:     'bg-ck-primary-500',
  },
  {
    quote:  'The car ride to school used to be silent. Now it\'s our favourite part of the day. My son actually asks "what\'s the question today?" before I even open the app.',
    name:   'James T.',
    role:   'Parent of Oliver (age 9)',
    initials: 'JT',
    bg:     'bg-ck-primary-400',
  },
  {
    quote:  'As a parent who reads all the parenting books but never has time — this app is everything. Simple, fast, and it actually works. Our streak is at 47 days!',
    name:   'Priya K.',
    role:   'Parent of Arun (age 6)',
    initials: 'PK',
    bg:     'bg-ck-primary-300',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="bg-ck-primary-900 py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-white">What parents are saying</h2>
        <p className="text-ck-primary-300 mt-3 text-lg">Real families. Real conversations. Real champions.</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-ck-primary-800 rounded-2xl p-6 flex flex-col">
            <div className="text-amber-400 text-lg mb-4">★★★★★</div>
            <p className="text-white/90 text-base leading-relaxed italic mb-6 flex-1">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white ${t.bg}`}>
                {t.initials}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-ck-primary-300 text-xs">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
