import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { useAskPanel } from "@/features/ask/ask-context"

export function NavbarAskButton() {
  const { t } = useTranslation("common")
  const { togglePanel, open } = useAskPanel()

  return (
    <Button
      type="button"
      variant={open ? "secondary" : "outline"}
      size="sm"
      className="cursor-pointer gap-1.5"
      aria-label={t("navbar.ask")}
      aria-pressed={open}
      onClick={togglePanel}
    >
      <Sparkles className="size-3.5" />
      <span className="hidden sm:inline">{t("navbar.ask")}</span>
    </Button>
  )
}
