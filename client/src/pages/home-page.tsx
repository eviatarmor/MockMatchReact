import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { LandingPageContent } from "@/features/landing/landing-page"

/** Public marketing landing at `/`. Auth lives at `/login` / `/signup`. */
export function HomePage() {
  const { t } = useTranslation("landing")
  useDocumentTitle(t("documentTitle"))

  return <LandingPageContent />
}
