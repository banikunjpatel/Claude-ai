import Navbar            from '../components/home/Navbar'
import HeroSection       from '../components/home/HeroSection'
import FactsBar          from '../components/home/FactsBar'
import HowItWorks        from '../components/home/HowItWorks'
import SkillsSection     from '../components/home/SkillsSection'
import TestimonialsSection from '../components/home/TestimonialsSection'
import PricingSection    from '../components/home/PricingSection'
import CtaSection        from '../components/home/CtaSection'
import Footer            from '../components/home/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FactsBar />
        <HowItWorks />
        <SkillsSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
