import { useTranslation } from "react-i18next"

interface DashboardPlaceholderPageProps {
  readonly title: string
}

export function DashboardPlaceholderPage({ title }: DashboardPlaceholderPageProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
      <h1 className="text-lg font-semibold text-muted-foreground">{title}</h1>
    </div>
  )
}

export function DashboardRoutePage({ titleKey }: { readonly titleKey: string }) {
  const { t } = useTranslation("common")

  return <DashboardPlaceholderPage title={t(titleKey)} />
}
