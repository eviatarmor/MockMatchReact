import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { AssessmentStatCard } from "./components/assessment-stat-card"
import { AssessmentCard } from "./components/assessment-card"
import { MOCK_ASSESSMENTS, MOCK_STATS, ASSESSMENT_DOMAINS } from "./constants"
import type { AssessmentDomain, AssessmentDifficulty } from "./types"

type DifficultyFilter = AssessmentDifficulty | "any"
type DomainFilter = AssessmentDomain | "all"

export function AssessmentsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const [domain, setDomain] = useState<DomainFilter>("all")
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("any")

  const filtered = useMemo(
    () =>
      MOCK_ASSESSMENTS.filter((a) => {
        const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase())
        const matchesDomain = domain === "all" || a.domain === domain
        const matchesDifficulty = difficulty === "any" || a.difficulty === difficulty
        return matchesSearch && matchesDomain && matchesDifficulty
      }),
    [search, domain, difficulty]
  )

  return (
    <DashboardPageShell title={t("assessments.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("assessments.title")}
          description={t("assessments.description")}
          actions={
            <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer">
              <Shuffle className="size-4" />
              <span className="hidden sm:inline">{t("assessments.surpriseMe")}</span>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOCK_STATS.map((stat) => (
            <AssessmentStatCard key={stat.id} stat={stat} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            placeholder={t("assessments.searchPlaceholder")}
            value={search}
            onChange={setSearch}
          />
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
            <SelectTrigger className="h-8 w-auto gap-1.5 px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("assessments.filters.anyDifficulty")}</SelectItem>
              <SelectItem value="easy">{t("assessments.difficulty.easy")}</SelectItem>
              <SelectItem value="medium">{t("assessments.difficulty.medium")}</SelectItem>
              <SelectItem value="hard">{t("assessments.difficulty.hard")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={domain === "all" ? "default" : "outline"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setDomain("all")}
          >
            {t("assessments.domains.all")}
          </Button>
          {ASSESSMENT_DOMAINS.map((d) => (
            <Button
              key={d}
              variant={domain === d ? "default" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setDomain(d)}
            >
              {t(`assessments.domains.${d}`)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((assessment) => (
            <AssessmentCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      </div>
    </DashboardPageShell>
  )
}
