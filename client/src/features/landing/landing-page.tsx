import { LandingHeader } from "./components/landing-header"
import { LandingHero } from "./components/landing-hero"
import { LandingCompaniesMarquee } from "./components/landing-companies-marquee"
import { LandingBento } from "./components/landing-bento"
import { LandingIntegrations } from "./components/landing-integrations"
import { LandingIdeasMarquee } from "./components/landing-ideas-marquee"
import { LandingChangelog } from "./components/landing-changelog"
import { LandingFaq } from "./components/landing-faq"
import { LandingCta } from "./components/landing-cta"
import { LandingFooter } from "./components/landing-footer"

export function LandingPageContent() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingCompaniesMarquee />
        <LandingBento />
        <LandingIntegrations />
        <LandingIdeasMarquee />
        <LandingChangelog />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
