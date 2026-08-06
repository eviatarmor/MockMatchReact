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
    <section className="border-b border-border/60 py-12 sm:py-14" aria-labelledby="ideas-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2
            id="ideas-heading"
            className="mb-6 text-center text-sm font-medium text-muted-foreground"
          >
            {t("ideas.title")}
          </h2>
        </ScrollReveal>
      </div>

      <Marquee side="right" speed={35} pauseOnHover autoFill className="py-2">
        <MarqueeContent>
          {LANDING_IDEA_KEYS.map((key) => (
            <MarqueeItem key={key}>
              <div className="max-w-xs rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground shadow-sm">
                {t(key)}
              </div>
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeEdge side="left" size="sm" />
        <MarqueeEdge side="right" size="sm" />
      </Marquee>
    </section>
  )
}
