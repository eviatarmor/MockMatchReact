interface DashboardPageHeaderProps {
  readonly title: string
  readonly description?: string
}

export function DashboardPageHeader({ title, description }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
