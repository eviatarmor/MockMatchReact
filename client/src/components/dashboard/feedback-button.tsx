import { MessageSquarePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function FeedbackButton() {
  const { t } = useTranslation("common")

  return (
    <Button variant="secondary" size="sm" className="cursor-pointer gap-1.5">
      <MessageSquarePlus className="size-3.5" />
      <span className="hidden sm:inline">{t("navbar.feedback")}</span>
    </Button>
  )
}
