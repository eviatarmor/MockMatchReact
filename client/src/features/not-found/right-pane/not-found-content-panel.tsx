import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { RobotLost } from "@mockmatch/ui/robot-lost"
import { AppLogo } from "@/components/icons/app-logo"

export function NotFoundContentPanel() {
  const { t } = useTranslation(["not-found", "common"])
  const navigate = useNavigate()

  function handleGoBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === "number" && idx > 0) {
      navigate(-1)
      return
    }
    navigate("/", { replace: true })
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background p-1">
            <AppLogo className="size-full" />
          </span>
          <span className="text-lg font-semibold text-foreground">
            {t("common:appName")}
          </span>
        </div>

        <div className="flex justify-center">
          <RobotLost size="lg" label={t("not-found:illustrationLabel")} />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("not-found:title")}
          </h2>
          <p className="text-xs font-medium tabular-nums text-muted-foreground">
            {t("not-found:code")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("not-found:description")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full cursor-pointer"
            render={<Link to="/" />}
          >
            {t("not-found:goHome")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full cursor-pointer"
            onClick={handleGoBack}
          >
            {t("not-found:goBack")}
          </Button>
        </div>
      </div>
    </div>
  )
}
