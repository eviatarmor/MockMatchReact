/** A single suggestion row from an O\*NET-derived list. */
export interface OnetSuggestion {
  readonly value: string
  /** Optional category for future grouped UI. */
  readonly category?: string
}

export type OnetDatasetId = "skills"
