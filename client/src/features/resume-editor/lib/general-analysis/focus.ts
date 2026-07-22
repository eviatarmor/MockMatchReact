/**
 * Scroll the resume canvas field matching `data-analysis-target` into view and focus it.
 * No-op when target missing or not in the DOM.
 */
export function focusAnalysisTarget(target: string | undefined): void {
  if (!target || typeof document === "undefined") return

  const el = document.querySelector<HTMLElement>(
    `[data-analysis-target="${CSS.escape(target)}"]`
  )
  if (!el) return

  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

  const focusable =
    el.matches("input, textarea, [contenteditable='true']")
      ? el
      : el.querySelector<HTMLElement>("input, textarea, [contenteditable='true']")

  window.requestAnimationFrame(() => {
    focusable?.focus({ preventScroll: true })
  })
}
