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
    <section
      className="border-y border-[var(--lp-line)] bg-white py-12 sm:py-14"
      aria-labelledby="companies-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <div className="mb-8 flex flex-col gap-1.5 text-center">
            <h2
              id="companies-heading"
              className="text-[0.8125rem] font-medium tracking-wide text-[var(--lp-faint)]"
            >
              {t("companies.title")}
            </h2>
            <p className="text-[0.75rem] text-[var(--lp-faint)]">
              {t("companies.disclaimer")}
            </p>
          </div>
        </ScrollReveal>
      </div>

      <Marquee side="left" speed={36} pauseOnHover autoFill className="py-1">
        <MarqueeContent>
          {LANDING_COMPANIES.map((company) => (
            <MarqueeItem key={company.id}>
              <div className="flex h-11 items-center gap-2.5 px-5">
                <img
                  src={company.logoSrc}
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px] object-contain opacity-50 grayscale"
                  loading="lazy"
                />
                <span className="text-sm font-medium tracking-tight text-[var(--lp-faint)]">
                  {company.name}
                </span>
              </div>
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeEdge side="left" size="lg" className="from-white" />
        <MarqueeEdge side="right" size="lg" className="from-white" />
      </Marquee>
    </section>
  )
}
