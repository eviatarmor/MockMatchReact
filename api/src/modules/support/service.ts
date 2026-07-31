import { TRPCError } from "@trpc/server"
import type {
  SubmitFeedbackInput,
  SubmitHelpRequestInput,
  SupportAttachment,
  SupportSubmitResult,
} from "@mockmatch/schemas"
import { getRedis } from "../../lib/redis.js"
import { createJiraIssue } from "./jira-client.js"

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const MAX_FEEDBACK_PER_HOUR = 10
const MAX_HELP_PER_HOUR = 10

async function assertRateLimit(
  channel: "feedback" | "help",
  userId: string
): Promise<void> {
  const redis = getRedis()
  const key = `support:rl:${channel}:${userId}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }
  const max = channel === "feedback" ? MAX_FEEDBACK_PER_HOUR : MAX_HELP_PER_HOUR
  if (count > max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many support submissions. Please try again later.",
    })
  }
}

function truncateSummary(text: string, max = 80): string {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function attachmentLines(attachments: SupportAttachment[] | undefined): string[] {
  if (!attachments?.length) return []
  return [
    "",
    `Attachments (${attachments.length}):`,
    ...attachments.map(
      (a, i) =>
        `${i + 1}. ${a.fileName} (${a.mimeType}, ~${Math.round((a.dataBase64.length * 3) / 4 / 1024)} KB)`
    ),
  ]
}

/**
 * Product feedback: message + opaque context only in Jira.
 * userId used solely for rate limiting.
 */
export async function submitFeedback(
  userId: string,
  input: SubmitFeedbackInput
): Promise<SupportSubmitResult> {
  await assertRateLimit("feedback", userId)

  const lines = [
    input.message,
    "",
    "---",
    "Context (no personal identity)",
    input.path ? `Path: ${input.path}` : null,
    input.locale ? `Locale: ${input.locale}` : null,
    ...attachmentLines(input.attachments),
  ].filter((line): line is string => line !== null)

  const { key } = await createJiraIssue({
    kind: "feedback",
    summary: truncateSummary(input.message) || "Product feedback",
    description: lines.join("\n"),
    labels: ["feedback", "product"],
    attachments: input.attachments,
  })

  return { ok: true, ticketKey: key }
}

/**
 * Help request: includes identity for follow-up.
 */
export async function submitHelpRequest(
  user: { id: string; email: string },
  input: SubmitHelpRequestInput
): Promise<SupportSubmitResult> {
  await assertRateLimit("help", user.id)

  const topicLabel = input.topic
  const summary =
    input.subject?.trim() ||
    truncateSummary(`[${topicLabel}] ${input.message}`) ||
    `Help request: ${topicLabel}`

  const lines = [
    input.message,
    "",
    "---",
    `Topic: ${topicLabel}`,
    `User ID: ${user.id}`,
    `Email: ${user.email}`,
    ...attachmentLines(input.attachments),
  ]

  const { key } = await createJiraIssue({
    kind: "help",
    summary,
    description: lines.join("\n"),
    labels: ["help", topicLabel],
    attachments: input.attachments,
  })

  return { ok: true, ticketKey: key }
}
