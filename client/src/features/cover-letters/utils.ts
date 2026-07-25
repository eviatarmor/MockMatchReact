import { titleToAvatarText } from "@/lib/title-avatar"
import type { CoverLetterItem } from "./types"

export function toCoverLetterItem(row: {
  id: string
  title: string
  company: string | null
  status: "draft" | "active" | "archived"
  generalScore: number | null
  updatedAt: string
}): CoverLetterItem {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    generalScore: row.generalScore,
    status: row.status,
    updatedAt: row.updatedAt,
    avatarText: titleToAvatarText(row.title),
  }
}
