/**
 * VS Code-ish workbench shortcuts for the IDE shell.
 * Editor text editing stays with Monaco / monaco-vim.
 */

export type IdeKeyAction =
  | "closeTab"
  | "toggleTerminal"
  | "toggleTree"
  | "toggleFullscreen"
  | "newFile"
  | "newFolder"
  | "splitRight"
  | "splitDown"
  | "nextTab"
  | "prevTab"
  | "save"
  | "blockBrowser"

export type IdeKeyMatch = {
  action: IdeKeyAction
  /** Always stop browser default when matched. */
  preventDefault: boolean
}

function isEditableField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"))
}

/** xterm / terminal panel — don't steal shell line editing (e.g. Ctrl+W). */
export function isIdeTerminalTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('[data-slot="ide-terminal"]') ||
      target.closest('[data-slot="ide-terminal-panel"]') ||
      target.closest(".xterm")
  )
}

export function isMonacoTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('[data-slot="monaco-editor"]') ||
      target.closest(".monaco-editor") ||
      target.closest(".monaco-menu") ||
      target.closest(".context-view")
  )
}

/**
 * Map a keydown to a shell action. Returns null when the shell should ignore.
 * Callers decide which actions are available (handlers registered).
 */
export function matchIdeKeybinding(
  e: KeyboardEvent
): IdeKeyMatch | null {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
  const mod = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const alt = e.altKey

  // Fullscreen — no mod
  if (!mod && !alt && !shift && e.key === "F11") {
    return { action: "toggleFullscreen", preventDefault: true }
  }

  if (!mod || alt) return null

  // Ctrl+` — terminal (Backquote)
  if (!shift && (key === "`" || e.code === "Backquote")) {
    return { action: "toggleTerminal", preventDefault: true }
  }

  // Ctrl+B — toggle tree
  if (!shift && key === "b") {
    return { action: "toggleTree", preventDefault: true }
  }

  // Ctrl+W — close editor tab (not when typing in terminal)
  if (!shift && key === "w") {
    if (isIdeTerminalTarget(e.target)) {
      // Still block browser close; xterm eats the key for delete-word
      return { action: "blockBrowser", preventDefault: true }
    }
    return { action: "closeTab", preventDefault: true }
  }

  // Ctrl+\ — split right; Ctrl+Shift+\ — split down
  if (key === "\\" || e.code === "Backslash") {
    return {
      action: shift ? "splitDown" : "splitRight",
      preventDefault: true,
    }
  }

  // Ctrl+N / Ctrl+Shift+N — new file / folder
  if (key === "n") {
    return {
      action: shift ? "newFolder" : "newFile",
      preventDefault: true,
    }
  }

  // Ctrl+Tab / Ctrl+Shift+Tab — cycle tabs
  if (key === "Tab") {
    return {
      action: shift ? "prevTab" : "nextTab",
      preventDefault: true,
    }
  }

  // Ctrl+PageDown / PageUp
  if (e.key === "PageDown" && !shift) {
    return { action: "nextTab", preventDefault: true }
  }
  if (e.key === "PageUp" && !shift) {
    return { action: "prevTab", preventDefault: true }
  }

  // Browser-stealing shortcuts — always swallow inside IDE
  if (!shift && (key === "s" || key === "p" || key === "o" || key === "u")) {
    if (key === "s") {
      // Allow native save prompt nowhere; host can listen later
      if (isEditableField(e.target) && !isMonacoTarget(e.target)) {
        // rename inputs etc. — still block browser save
      }
      return { action: "save", preventDefault: true }
    }
    return { action: "blockBrowser", preventDefault: true }
  }

  return null
}
