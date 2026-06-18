import { MessageSquarePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function FeedbackButton() {
  const { t } = useTranslation("common")

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
    >
      <MessageSquarePlus className="size-3.5" />
      <span className="hidden sm:inline text-xs">{t("navbar.feedback")}</span>
    </Button>
  )
}
