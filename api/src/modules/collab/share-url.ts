import type { DocumentKind } from "@mockmatch/schemas"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Parse bank track template id `q:<uuid>` → question id. */
export function parseWorkspaceQuestionId(
  templateId: string | null | undefined
): string | null {
  if (!templateId?.startsWith("q:")) return null
  const id = templateId.slice(2)
  return UUID_RE.test(id) ? id : null
}

export type ShareUrlOptions = {
  /**
   * IDE catalog slug / terminal-lab / workspace, or bank track `q:<uuid>`.
   * Used when `kind === "workspace"`.
   */
  workspaceFormat?: string
  /**
   * Bank question this practice document belongs to.
   * When set, share links use `/simulations/:questionId?share=` only
   * (document id is resolved from the token server-side).
   */
  questionId?: string | null
}

/**
 * Build an app share URL for a collab document.
 *
 * Bank practice: `/simulations/:questionId?share=<token>` — no board/workspace id.
 * Freeform practice: dedicated path + `?share=<token>` only.
 * Resume / cover letter: document id stays in the path (`/resumes/:id?share=`).
 */
export function buildShareUrl(
  appUrl: string,
  kind: DocumentKind,
  documentId: string,
  rawToken: string,
  options: ShareUrlOptions = {}
): string {
  const questionId =
    options.questionId && UUID_RE.test(options.questionId)
      ? options.questionId
      : null

  if (kind === "workspace") {
    const format = (options.workspaceFormat ?? "workspace").trim() || "workspace"
    const bankQ = questionId ?? parseWorkspaceQuestionId(format)
    if (bankQ) {
      const url = new URL(`/simulations/${bankQ}`, appUrl)
      url.searchParams.set("share", rawToken)
      return url.toString()
    }
    // Catalog / freeform: workspace + terminal-lab dedicated; exercises under code-run.
    const path =
      format === "workspace"
        ? "/simulations/workspace"
        : format === "shell" || format === "terminal-lab"
          ? "/simulations/terminal-lab"
          : `/simulations/code-run/${format}`
    const url = new URL(path, appUrl)
    url.searchParams.set("share", rawToken)
    return url.toString()
  }

  if (kind === "whiteboard") {
    if (questionId) {
      const url = new URL(`/simulations/${questionId}`, appUrl)
      url.searchParams.set("share", rawToken)
      return url.toString()
    }
    // No freeform whiteboard route — token still resolves the board.
    const url = new URL("/simulations", appUrl)
    url.searchParams.set("share", rawToken)
    return url.toString()
  }

  if (kind === "spreadsheet") {
    if (questionId) {
      const url = new URL(`/simulations/${questionId}`, appUrl)
      url.searchParams.set("share", rawToken)
      return url.toString()
    }
    const url = new URL("/simulations/spreadsheet", appUrl)
    url.searchParams.set("share", rawToken)
    return url.toString()
  }

  if (kind === "page") {
    if (questionId) {
      const url = new URL(`/simulations/${questionId}`, appUrl)
      url.searchParams.set("share", rawToken)
      return url.toString()
    }
    const url = new URL("/simulations/page", appUrl)
    url.searchParams.set("share", rawToken)
    return url.toString()
  }

  // Resume / cover letter — document id is the path segment.
  const path =
    kind === "resume" ? `/resumes/${documentId}` : `/cover-letters/${documentId}`
  const url = new URL(path, appUrl)
  url.searchParams.set("share", rawToken)
  return url.toString()
}
