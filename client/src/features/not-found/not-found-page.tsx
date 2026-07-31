import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { RobotLost } from "@mockmatch/ui/robot-lost"

export function NotFoundPageContent() {
  const { t } = useTranslation("not-found")

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <RobotLost size="lg" label={t("illustrationLabel")} />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            {t("code")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">{t("description")}</p>
        </div>

        <Button
          size="lg"
          className="cursor-pointer"
          render={<Link to="/" />}
        >
          {t("goHome")}
        </Button>
      </div>
    </main>
  )
}
