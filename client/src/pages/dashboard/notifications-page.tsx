import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { NotificationsPageContent } from "@/features/notifications/notifications-page"

export function NotificationsPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("notifications.documentTitle"))

  return <NotificationsPageContent />
}
