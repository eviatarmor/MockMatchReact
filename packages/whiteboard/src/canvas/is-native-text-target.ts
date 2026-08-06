/** Whether a pointer/keyboard target is native text chrome that owns input. */
export function isNativeTextTarget(
  target: EventTarget | null,
  editingLabelId: string | null,
  selectedIds: readonly string[]
): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (editingLabelId) {
    if (
      target.isContentEditable ||
      target.closest("[data-shape-label-editor]") ||
      target.closest('[contenteditable="true"]')
    ) {
      return true
    }
  }
  const tag = target.tagName
  if (tag === "TEXTAREA" || tag === "INPUT") {
    const elId = target.closest("[data-el-id]")?.getAttribute("data-el-id")
    if (selectedIds.length === 0) return true
    if (selectedIds.length === 1 && elId && selectedIds[0] === elId) return true
    return false
  }
  if (target.isContentEditable) return true
  return false
}
