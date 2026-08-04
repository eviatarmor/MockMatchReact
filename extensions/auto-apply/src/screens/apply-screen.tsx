import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { Card, CardContent } from "@mockmatch/ui/card"
import { Textarea } from "@mockmatch/ui/textarea"
import { Label } from "@mockmatch/ui/label"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import { Spinner } from "@mockmatch/ui/spinner"
import { cn } from "@mockmatch/ui/utils"
import { SiteChip } from "../components/site-chip"
import { DocumentSelect } from "../components/document-select"
import { useExtension } from "../state/extension-store"
import type { CoverLetterMode } from "../types"

const CL_MODES: { value: CoverLetterMode; label: string }[] = [
  { value: "skip", label: "Skip" },
  { value: "existing", label: "Existing" },
  { value: "tailor", label: "Tailor" },
]

export function ApplyScreen() {
  const {
    form,
    resumes,
    coverLetters,
    selectedResumeId,
    selectedCoverLetterId,
    coverLetterMode,
    tailorDraft,
    tailorLoading,
    fillPhase,
    reviewFields,
    selectResume,
    selectCoverLetter,
    setCoverLetterMode,
    setTailorDraft,
    generateTailorDraft,
    startFill,
    clearFill,
  } = useExtension()

  const canFill =
    form.status === "detected" &&
    Boolean(selectedResumeId) &&
    fillPhase !== "filling"
  const needsReviewCount = reviewFields.filter((f) => f.needsReview).length
  const filledCount = reviewFields.filter((f) => f.value).length
  const showReview = fillPhase === "review" || fillPhase === "done"

  if (resumes.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <RobotLoader size="md" label="No resumes" />
          <div>
            <p className="text-sm font-medium text-foreground">No resumes yet</p>
            <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
              Create a resume in MockMatch, then come back to fill applications.
            </p>
          </div>
          <a
            href="http://localhost:5173/resumes"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Open Resume Lab
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 pb-2">
          <SiteChip />

          <Card size="sm">
            <CardContent className="flex flex-col gap-4">
              <DocumentSelect
                id="resume"
                label="Resume"
                value={selectedResumeId}
                options={resumes}
                placeholder="Choose a resume"
                onChange={selectResume}
                emptyHint="Create a resume in MockMatch."
              />
              <a
                href="http://localhost:5173/resumes"
                target="_blank"
                rel="noreferrer"
                className="-mt-2 inline-flex items-center gap-1 text-2xs text-primary hover:underline"
              >
                Manage resumes
                <ExternalLink className="size-3" />
              </a>

              <div className="space-y-1.5 border-t border-border/60 pt-4">
                <Label>Cover letter</Label>
                <div className="flex gap-1.5">
                  {CL_MODES.map((m) => (
                    <Button
                      key={m.value}
                      type="button"
                      size="sm"
                      variant={
                        coverLetterMode === m.value ? "default" : "outline"
                      }
                      className="flex-1 cursor-pointer"
                      onClick={() => setCoverLetterMode(m.value)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>

              {coverLetterMode === "existing" ? (
                <>
                  <DocumentSelect
                    id="cover-letter"
                    label="Which cover letter"
                    value={selectedCoverLetterId}
                    options={coverLetters}
                    placeholder="Choose a cover letter"
                    onChange={selectCoverLetter}
                    emptyHint="Create a cover letter in MockMatch."
                  />
                  <a
                    href="http://localhost:5173/cover-letters"
                    target="_blank"
                    rel="noreferrer"
                    className="-mt-2 inline-flex items-center gap-1 text-2xs text-primary hover:underline"
                  >
                    Manage cover letters
                    <ExternalLink className="size-3" />
                  </a>
                </>
              ) : null}

              {coverLetterMode === "tailor" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      AI draft for this job — short edit only
                    </p>
                    <Button
                      type="button"
                      size="xs"
                      className="cursor-pointer"
                      disabled={tailorLoading}
                      onClick={generateTailorDraft}
                    >
                      {tailorLoading ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Generate
                    </Button>
                  </div>
                  {tailorLoading ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <RobotLoader size="sm" label="Generating cover letter" />
                      <p className="text-xs text-muted-foreground">
                        Writing draft…
                      </p>
                    </div>
                  ) : (
                    <Textarea
                      value={tailorDraft}
                      onChange={(e) => setTailorDraft(e.target.value)}
                      placeholder="Generate a tailored draft, then edit lightly…"
                      className="min-h-28 resize-y text-sm"
                    />
                  )}
                  <a
                    href="http://localhost:5173/cover-letters"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-2xs text-primary hover:underline"
                  >
                    Edit fully in MockMatch
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              ) : null}

              {coverLetterMode === "skip" ? (
                <p className="text-xs text-muted-foreground">
                  No cover letter will be attached or pasted.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {showReview ? (
            <Card size="sm">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Filled {filledCount} fields
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Review before you submit on the site. MockMatch never
                      submits for you.
                    </p>
                  </div>
                </div>

                {needsReviewCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {needsReviewCount} need your attention
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
                  <div className="h-40 w-full overflow-y-auto">
                    <ul className="divide-y divide-border/60">
                      {reviewFields.map((f) => (
                        <li
                          key={f.id}
                          className={cn(
                            "flex items-start justify-between gap-3 px-3 py-2.5 text-xs",
                            f.needsReview && "bg-destructive/5",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "font-medium",
                                f.needsReview
                                  ? "text-destructive"
                                  : "text-foreground",
                              )}
                            >
                              {f.label}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 truncate",
                                f.needsReview
                                  ? "text-destructive/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {f.value || "Empty — fill manually"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-2xs capitalize"
                          >
                            {f.confidence}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer"
                  onClick={clearFill}
                >
                  Clear fill state
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border/60 bg-muted px-4 pt-3 pb-3">
        <Button
          type="button"
          className="w-full cursor-pointer"
          disabled={!canFill}
          onClick={startFill}
        >
          {fillPhase === "filling" ? (
            <>
              <Spinner className="size-4" />
              Filling…
            </>
          ) : showReview ? (
            "Fill again"
          ) : (
            "Fill application"
          )}
        </Button>
        {!selectedResumeId ? (
          <p className="text-center text-2xs text-muted-foreground">
            Choose a resume to enable fill
          </p>
        ) : form.status !== "detected" ? (
          <p className="text-center text-2xs text-muted-foreground">
            Open a supported application form first
          </p>
        ) : (
          <p className="text-center text-2xs text-muted-foreground">
            You always submit on the employer site
          </p>
        )}
      </div>

      {fillPhase === "filling" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-muted/80 backdrop-blur-[2px]">
          <RobotLoader size="md" label="Filling application" />
          <p className="text-sm text-muted-foreground">Filling fields…</p>
        </div>
      ) : null}
    </div>
  )
}
