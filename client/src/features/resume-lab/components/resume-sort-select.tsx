import { ArrowUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface ResumeSortSelectProps {
  readonly sortBy: "lastEdited" | "title" | "atsScore"
  readonly onChange: (sortBy: "lastEdited" | "title" | "atsScore") => void
}

export function ResumeSortSelect({ sortBy, onChange }: ResumeSortSelectProps) {
  const { t } = useTranslation("common")

  const sortOptions = [
    { id: "lastEdited", labelKey: "resumeLab.sort.lastEdited" },
    { id: "title", label: "Title" },
    { id: "atsScore", label: "ATS Score" },
  ] as const

  const activeOption = sortOptions.find((opt) => opt.id === sortBy)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 gap-1.5 px-3 select-none cursor-pointer">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <span>
            {activeOption
              ? "labelKey" in activeOption
                ? t(activeOption.labelKey)
                : activeOption.label
              : t("resumeLab.sort.lastEdited")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="cursor-pointer"
          >
            {"labelKey" in opt ? t(opt.labelKey) : opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
