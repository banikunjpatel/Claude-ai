import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Skills',       id: 'skills' },
  { label: 'Pricing',      id: 'pricing' },
  { label: 'About',        id: 'about' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-ck-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ck-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">CK</span>
            </div>
            <span className="font-bold text-ck-primary-800 text-base hidden sm:block">ChampionKids</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-semibold text-ck-neutral-500 hover:text-ck-primary-600 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-ck-neutral-500 hover:text-ck-primary-600 px-4 py-2 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-ck-primary-500 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-ck-primary-600 transition-all duration-150"
            >
              Start free →
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-ck-neutral-700"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-xl font-bold text-ck-neutral-900 py-4 border-b border-ck-neutral-100 text-left"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => { setMenuOpen(false); navigate('/signup') }}
                className="bg-ck-primary-500 text-white font-bold py-4 rounded-full hover:bg-ck-primary-600 transition-all"
              >
                Start free — 7 days, no card
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate('/login') }}
                className="border-2 border-ck-neutral-200 text-ck-neutral-700 font-semibold py-4 rounded-full hover:border-ck-primary-300 transition-all"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
