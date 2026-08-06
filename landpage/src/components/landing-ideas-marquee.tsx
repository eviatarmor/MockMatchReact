import { useTranslation } from "react-i18next"
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "@mockmatch/ui/marquee"
import { LANDING_IDEA_KEYS } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

export function LandingIdeasMarquee() {
  const { t } = useTranslation("landing")

  return (
    <section
      className="border-y border-[var(--lp-line)] bg-[var(--lp-canvas)] py-14 sm:py-16"
      aria-labelledby="ideas-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <h2
            id="ideas-heading"
            className="mb-8 text-center text-[0.8125rem] font-medium tracking-wide text-[var(--lp-faint)]"
          >
            {t("ideas.title")}
          </h2>
        </ScrollReveal>
      </div>

      <Marquee side="right" speed={32} pauseOnHover autoFill className="py-1">
        <MarqueeContent>
          {LANDING_IDEA_KEYS.map((key) => (
            <MarqueeItem key={key}>
              <div className="max-w-xs rounded-full border border-[var(--lp-line)] bg-white px-5 py-2.5 text-[0.8125rem] font-medium tracking-tight text-[var(--lp-ink)] shadow-[var(--lp-shadow-sm)]">
                {t(key)}
              </div>
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeEdge side="left" size="lg" className="from-[var(--lp-canvas)]" />
        <MarqueeEdge side="right" size="lg" className="from-[var(--lp-canvas)]" />
      </Marquee>
    </section>
  )
}
