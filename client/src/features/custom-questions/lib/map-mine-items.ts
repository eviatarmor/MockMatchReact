import type { CustomQuestionRow } from "../types"

/** Map listMine API rows → table row model. */
export function mapMineItems(
  items: readonly {
    id: string
    title: string
    domain: CustomQuestionRow["domain"]
    difficulty: CustomQuestionRow["difficulty"]
    format: CustomQuestionRow["format"]
    publishStatus: CustomQuestionRow["publishStatus"]
    company: string | null
    language: string | null
    updatedAt: string
  }[]
): CustomQuestionRow[] {
  return items.map((q) => ({
    id: q.id,
    title: q.title,
    domain: q.domain,
    difficulty: q.difficulty,
    format: q.format,
    publishStatus: q.publishStatus,
    company: q.company,
    language: q.language,
    updatedAt: q.updatedAt,
  }))
}
