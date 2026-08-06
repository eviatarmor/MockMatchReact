import type { PageEditorLabels } from "../types"

export type LinkDialogResolvedLabels = {
  readonly title: string
  readonly description: string
  readonly urlLabel: string
  readonly applyLabel: string
  readonly removeLabel: string
  readonly cancelLabel: string
}

function pickLabel(value: string | undefined, fallback: string): string {
  return value ?? fallback
}

function resolveLinkDialogCopy(labels: PageEditorLabels) {
  return {
    title: pickLabel(labels.linkDialogTitle, labels.link),
    description: pickLabel(labels.linkDialogDescription, labels.linkPrompt),
    urlLabel: pickLabel(labels.linkUrlLabel, labels.linkPrompt),
  }
}

function resolveLinkDialogActions(labels: PageEditorLabels) {
  return {
    applyLabel: pickLabel(labels.linkApply, "Apply"),
    removeLabel: pickLabel(labels.linkRemove, "Remove"),
    cancelLabel: pickLabel(labels.linkCancel, "Cancel"),
  }
}

export function resolveLinkDialogLabels(
  labels: PageEditorLabels
): LinkDialogResolvedLabels {
  return {
    ...resolveLinkDialogCopy(labels),
    ...resolveLinkDialogActions(labels),
  }
}

/** URL to show when the dialog opens. */
export function linkUrlForOpen(initialUrl: string): string {
  return initialUrl || "https://"
}

export function trimmedLinkUrl(url: string): string {
  return url.trim()
}

export function canApplyLinkUrl(url: string): boolean {
  return trimmedLinkUrl(url).length > 0
}
