import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import type { ResumeDocument } from "@/features/resume-editor/types"
import type { DocumentAiKind } from "../types"
import { buildCoverLetterMentionTargets } from "./mention-targets-cover-letter"
import { buildResumeMentionTargets } from "./mention-targets-resume"

/**
 * Resolve plain-text content for a block/section id (toolbar AI click)
 * so it can be staged as a selection-style attachment.
 */
export function resolveTargetAttachment(
  kind: DocumentAiKind,
  document: unknown,
  targetId: string
): { title: string; text: string } | null {
  const id = targetId.trim()
  if (!id || document == null) return null

  if (kind === "resume") {
    const targets = buildResumeMentionTargets(
      document as ResumeDocument,
      (type) => type,
      "Header"
    )
    const target = targets.find((t) => t.id === id)
    if (!target) return null
    const text = target.getContext().trim()
    if (!text) return null
    return { title: target.label, text }
  }

  const targets = buildCoverLetterMentionTargets(
    document as CoverLetterDocument,
    {
      sender: "Sender",
      recipient: "Recipient",
      labelForType: (type) => type,
    }
  )
  const target = targets.find((t) => t.id === id)
  if (!target) return null
  const text = target.getContext().trim()
  if (!text) return null
  return { title: target.label, text }
}
