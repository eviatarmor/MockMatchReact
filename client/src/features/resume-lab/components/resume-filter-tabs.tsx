import { useTranslation } from "react-i18next"

interface ResumeFilterTabsProps {
  readonly activeTab: string
  readonly onChange: (tab: string) => void
}

export function ResumeFilterTabs({ activeTab, onChange }: ResumeFilterTabsProps) {
  const { t } = useTranslation("common")

  const tabs = [
    { id: "all", labelKey: "resumeLab.tabs.all" },
    { id: "active", labelKey: "resumeLab.tabs.active" },
    { id: "draft", labelKey: "resumeLab.tabs.drafts" },
    { id: "archived", labelKey: "resumeLab.tabs.archived" },
  ]

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors select-none ${
              isSelected
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
