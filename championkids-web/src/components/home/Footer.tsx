import { Link } from 'react-router-dom'

const PRODUCT_LINKS  = ['How it works', 'Skills', 'Pricing', "What's new"]
const COMPANY_LINKS  = ['About', 'Blog', 'Careers', 'Press']
const SUPPORT_LINKS  = ['Help centre', 'Privacy policy', 'Terms of service', 'Contact us']

export default function Footer() {
  return (
    <footer className="bg-ck-neutral-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 w-fit">
              <div className="w-9 h-9 bg-ck-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">CK</span>
              </div>
              <span className="font-bold text-white text-base">ChampionKids</span>
            </Link>
            <p className="text-ck-neutral-400 text-sm mt-2">Champion conversations. Every day.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-white text-ck-neutral-900 font-semibold rounded-lg px-4 py-2 text-xs cursor-pointer hover:bg-ck-neutral-100 transition-colors">
                📱 App Store
              </span>
              <span className="bg-white text-ck-neutral-900 font-semibold rounded-lg px-4 py-2 text-xs cursor-pointer hover:bg-ck-neutral-100 transition-colors">
                🤖 Google Play
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ck-neutral-400 mb-3">Product</p>
            {PRODUCT_LINKS.map(l => (
              <span key={l} className="text-ck-neutral-500 text-sm hover:text-white block mb-2 cursor-pointer transition-colors">
                {l}
              </span>
            ))}
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ck-neutral-400 mb-3">Company</p>
            {COMPANY_LINKS.map(l => (
              <span key={l} className="text-ck-neutral-500 text-sm hover:text-white block mb-2 cursor-pointer transition-colors">
                {l}
              </span>
            ))}
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ck-neutral-400 mb-3">Support</p>
            {SUPPORT_LINKS.map(l => (
              <span key={l} className="text-ck-neutral-500 text-sm hover:text-white block mb-2 cursor-pointer transition-colors">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ck-neutral-800 pt-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-ck-neutral-500 text-sm">
            © 2026 ChampionKids Ltd. All rights reserved.
          </p>
          <p className="text-ck-neutral-500 text-xs">
            🔒 GDPR compliant · COPPA safe · UK ICO registered
          </p>
        </div>
      </div>
    </footer>
  )
}
