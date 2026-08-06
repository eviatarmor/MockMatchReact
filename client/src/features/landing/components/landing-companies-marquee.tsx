import { useTranslation } from "react-i18next"
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "@mockmatch/ui/marquee"
import { LANDING_COMPANIES } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

export function LandingCompaniesMarquee() {
  const { t } = useTranslation("landing")

  return (
    <section className="border-b border-border/60 py-10 sm:py-12" aria-labelledby="companies-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-6 flex flex-col gap-1 text-center">
            <h2
              id="companies-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("companies.title")}
            </h2>
            <p className="text-xs text-muted-foreground/80">
              {t("companies.disclaimer")}
            </p>
          </div>
        </ScrollReveal>
      </div>

      <Marquee side="left" speed={40} pauseOnHover autoFill className="py-2">
        <MarqueeContent>
          {LANDING_COMPANIES.map((company) => (
            <MarqueeItem key={company.id}>
              <div className="flex h-12 items-center gap-2.5 rounded-lg border border-border/60 bg-card px-4 py-2 shadow-sm">
                <img
                  src={company.logoSrc}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 object-contain opacity-80 grayscale"
                  loading="lazy"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {company.name}
                </span>
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
