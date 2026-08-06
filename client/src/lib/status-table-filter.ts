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
