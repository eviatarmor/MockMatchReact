import { titleToAvatarText } from "@/lib/title-avatar"
import type { ResumeItem } from "./types"

export function toResumeItem(row: {
  id: string
  title: string
  targetRole: string | null
  company: string | null
  status: "draft" | "active" | "archived"
  generalScore: number | null
  updatedAt: string
}): ResumeItem {
  return {
    id: row.id,
    title: row.title,
    targetRole: row.targetRole,
    company: row.company,
    status: row.status,
    generalScore: row.generalScore,
    updatedAt: row.updatedAt,
    avatarText: titleToAvatarText(row.title),
  }
}
