/** Status field accessor for table chrome multi-filters. */
export function statusFieldValue(
  item: { readonly status: string },
  fieldId: string
): string | null {
  if (fieldId === "status") return item.status
  return null
}

export function buildStatusFilterField(
  label: string,
  options: readonly { readonly value: string; readonly label: string }[]
) {
  return {
    id: "status",
    label,
    options,
  }
}

/** Map status enum values to filter menu options with translated labels. */
export function statusFilterOptions(
  statuses: readonly string[],
  labelFor: (value: string) => string
): readonly { readonly value: string; readonly label: string }[] {
  return statuses.map((value) => ({ value, label: labelFor(value) }))
}

/** Single-field status filter definition used by list table chrome. */
export function buildLabeledStatusFilterField(
  label: string,
  statuses: readonly string[],
  labelFor: (value: string) => string
) {
  return buildStatusFilterField(label, statusFilterOptions(statuses, labelFor))
}
