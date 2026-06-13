export interface ResetPasswordChecklistItem {
  id: string
  icon: "lock" | "case" | "hash"
  labelKey: string
}

export interface ResetPasswordLocationState {
  readonly email?: string
}
