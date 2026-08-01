import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { NotFoundContentPanel } from "@/features/not-found/right-pane/not-found-content-panel"

export function NotFoundPageContent() {
  const { t } = useTranslation("not-found")

  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel
        titleKey="not-found:hero.title"
        descriptionKey="not-found:hero.description"
        middleSlot={null}
        bottomSlot={
          <p className="flex items-center gap-1.5 text-sm text-primary-foreground/70">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {t("footerMessage")}
          </p>
        }
      />
      <NotFoundContentPanel />
    </div>
  )
}
