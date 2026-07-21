import { titleToAvatarText } from "@/lib/title-avatar"
import type { CoverLetterItem } from "./types"

export function toCoverLetterItem(row: {
  id: string
  title: string
  company: string | null
  status: "draft" | "active" | "archived"
  updatedAt: string
}): CoverLetterItem {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    status: row.status,
    updatedAt: row.updatedAt,
    avatarText: titleToAvatarText(row.title),
  }
}
