import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mockmatch/ui/accordion"
import { LANDING_FAQ_ITEMS } from "../constants"
import { ScrollReveal } from "./scroll-reveal"
import { SectionHeading } from "./section-heading"

export function LandingFaq() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="faq"
      className="lp-section scroll-mt-20 bg-[var(--lp-canvas)]"
      aria-labelledby="faq-heading"
    >
      <div className="lp-container max-w-3xl">
        <ScrollReveal>
          <SectionHeading
            eyebrow={t("faq.eyebrow")}
            title={t("faq.title")}
            description=""
            titleId="faq-heading"
            align="center"
            className="mb-10 sm:mb-12"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <Accordion className="lp-card divide-y divide-[var(--lp-line)] overflow-hidden px-1">
            {LANDING_FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-0 px-4 not-last:border-0"
              >
                <AccordionTrigger className="py-5 text-[0.9375rem] font-medium tracking-tight text-[var(--lp-ink)] hover:no-underline">
                  {t(item.questionKey)}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[0.9375rem] leading-relaxed text-[var(--lp-muted)]">
                  <p>{t(item.answerKey)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  )
}
