import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { Badge } from "@mockmatch/ui/badge"
import { DiscoverTab } from "./components/discover-tab"
import { useDiscoverJobs } from "./hooks/use-discover-jobs"

export function DiscoverPageContent() {
  const { t } = useTranslation("common")
  const discover = useDiscoverJobs()
  const countryName = t(`discover.countries.${discover.country}`)

  return (
    <DashboardPageShell title={t("discover.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("discover.title")}
          description={t("discover.description")}
          actions={
            <Badge
              variant="secondary"
              className="h-9 gap-1.5 px-3 font-medium"
              title={t("discover.searchingIn", { country: countryName })}
            >
              <Globe className="size-3.5" />
              <span className="text-xs sm:text-sm">
                {t("discover.searchingIn", { country: countryName })}
              </span>
            </Badge>
          }
        />
        <DiscoverTab state={discover} />
      </div>
    </DashboardPageShell>
  )
}
