import type { SupportAttachment } from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"

export type JiraIssueDraft = {
  readonly summary: string
  readonly description: string
  readonly labels: readonly string[]
  readonly kind: "feedback" | "help"
  /** Screenshots for later Jira attach API. Stub only logs count. */
  readonly attachments?: readonly SupportAttachment[]
}

export type JiraIssueResult = {
  readonly key: string
}

function isJiraConfigured(): boolean {
  return (
    env.JIRA_BASE_URL !== "" &&
    env.JIRA_EMAIL !== "" &&
    env.JIRA_API_TOKEN !== "" &&
    env.JIRA_PROJECT_KEY !== ""
  )
}

/**
 * Create a Jira issue. When Jira env is empty, logs and returns a stub key
 * so the product flow works offline. Wire real REST here later:
 * POST `{JIRA_BASE_URL}/rest/api/3/issue` with Basic auth (email:apiToken).
 */
export async function createJiraIssue(
  draft: JiraIssueDraft
): Promise<JiraIssueResult> {
  if (!isJiraConfigured()) {
    const key = `STUB-${Date.now().toString(36).toUpperCase()}`
    logger.info(
      {
        jira: "stub",
        key,
        kind: draft.kind,
        summary: draft.summary,
        labels: draft.labels,
        attachmentCount: draft.attachments?.length ?? 0,
        descriptionPreview: draft.description.slice(0, 200),
      },
      "support ticket accepted (Jira not configured)"
    )
    return { key }
  }

  // TODO: Wire Jira Cloud REST when credentials are set.
  // const issueType =
  //   draft.kind === "feedback"
  //     ? env.JIRA_ISSUE_TYPE_FEEDBACK
  //     : env.JIRA_ISSUE_TYPE_HELP
  // POST `${env.JIRA_BASE_URL}/rest/api/3/issue`
  // Authorization: Basic base64(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`)
  // body.fields.project.key = env.JIRA_PROJECT_KEY
  // body.fields.summary / description (ADF) / labels / issuetype.name
  logger.warn(
    { kind: draft.kind, project: env.JIRA_PROJECT_KEY },
    "Jira env set but REST client not implemented yet — returning stub key"
  )
  const key = `STUB-${Date.now().toString(36).toUpperCase()}`
  return { key }
}
