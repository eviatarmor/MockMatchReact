import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mockmatch/ui/accordion"
import { LANDING_FAQ_ITEMS } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

export function LandingFaq() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="faq"
      className="scroll-mt-16 border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              {t("faq.eyebrow")}
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("faq.title")}
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <Accordion className="rounded-xl border border-border/60 bg-card px-4 shadow-sm">
            {LANDING_FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="py-3.5 text-base">
                  {t(item.questionKey)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
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
