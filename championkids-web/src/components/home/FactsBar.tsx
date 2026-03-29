import { useRef, useState, useEffect } from 'react'
import { useInView } from 'framer-motion'

interface CounterProps { to: number; suffix?: string; prefix?: string }

function Counter({ to, suffix = '', prefix = '' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setVal(Math.round(eased * to))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to])

  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

const FACTS = [
  {
    component: <Counter to={85} suffix="%" />,
    label: 'of 2030 jobs don\'t exist yet — transferable skills matter',
  },
  {
    component: <Counter to={80} suffix="%" />,
    label: 'of waking hours at home — parents are the best coaches',
  },
  {
    component: <><Counter to={5} /> <span className="text-5xl font-black text-ck-primary-400">min</span></>,
    label: 'is all it takes for a life-changing coaching conversation',
  },
]

export default function FactsBar() {
  return (
    <section className="bg-ck-primary-900 py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
        {FACTS.map((fact, i) => (
          <div
            key={i}
            className={`text-center px-8 ${
              i < FACTS.length - 1 ? 'md:border-r md:border-ck-primary-800' : ''
            }`}
          >
            <div className="text-5xl font-black text-ck-primary-400">
              {fact.component}
            </div>
            <p className="mt-3 text-sm font-medium text-ck-primary-200 leading-relaxed max-w-[180px] mx-auto">
              {fact.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
