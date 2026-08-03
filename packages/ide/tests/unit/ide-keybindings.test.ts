import { describe, expect, it } from "vitest"
import { matchIdeKeybinding } from "@/ide-keybindings"

// Node env has no DOM; matchIdeKeybinding uses `instanceof Element` / HTMLElement.
if (typeof globalThis.Element === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).Element = class Element {}
}
if (typeof globalThis.HTMLElement === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).HTMLElement = class HTMLElement extends (
    globalThis as { Element: typeof Element }
  ).Element {}
}

function key(
  partial: Partial<KeyboardEvent> & Pick<KeyboardEvent, "key">
): KeyboardEvent {
  return {
    key: partial.key,
    code: partial.code ?? "",
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    altKey: partial.altKey ?? false,
    target: partial.target ?? null,
  } as KeyboardEvent
}

describe("matchIdeKeybinding", () => {
  it("maps F11 / F5 without modifiers", () => {
    expect(matchIdeKeybinding(key({ key: "F11" }))).toEqual({
      action: "toggleFullscreen",
      preventDefault: true,
    })
    expect(matchIdeKeybinding(key({ key: "F5" }))).toEqual({
      action: "run",
      preventDefault: true,
    })
  })

  it("maps common ctrl/meta shell shortcuts", () => {
    expect(matchIdeKeybinding(key({ key: "b", ctrlKey: true }))?.action).toBe(
      "toggleTree"
    )
    expect(matchIdeKeybinding(key({ key: "l", metaKey: true }))?.action).toBe(
      "toggleAi"
    )
    expect(
      matchIdeKeybinding(key({ key: "`", ctrlKey: true }))?.action
    ).toBe("toggleTerminal")
    expect(matchIdeKeybinding(key({ key: "w", ctrlKey: true }))?.action).toBe(
      "closeTab"
    )
    expect(matchIdeKeybinding(key({ key: "s", ctrlKey: true }))?.action).toBe(
      "save"
    )
  })

  it("maps split / new / tab cycle with shift variants", () => {
    expect(
      matchIdeKeybinding(key({ key: "\\", ctrlKey: true }))?.action
    ).toBe("splitRight")
    expect(
      matchIdeKeybinding(key({ key: "\\", ctrlKey: true, shiftKey: true }))
        ?.action
    ).toBe("splitDown")
    expect(matchIdeKeybinding(key({ key: "n", ctrlKey: true }))?.action).toBe(
      "newFile"
    )
    expect(
      matchIdeKeybinding(key({ key: "n", ctrlKey: true, shiftKey: true }))
        ?.action
    ).toBe("newFolder")
    expect(
      matchIdeKeybinding(key({ key: "Tab", ctrlKey: true }))?.action
    ).toBe("nextTab")
    expect(
      matchIdeKeybinding(key({ key: "Tab", ctrlKey: true, shiftKey: true }))
        ?.action
    ).toBe("prevTab")
  })

  it("maps Ctrl+Enter run and Ctrl+Shift+Enter runTests", () => {
    expect(
      matchIdeKeybinding(key({ key: "Enter", ctrlKey: true }))?.action
    ).toBe("run")
    expect(
      matchIdeKeybinding(
        key({ key: "Enter", ctrlKey: true, shiftKey: true })
      )?.action
    ).toBe("runTests")
  })

  it("ignores keys without mod (except F keys) and alt combos", () => {
    expect(matchIdeKeybinding(key({ key: "b" }))).toBeNull()
    expect(
      matchIdeKeybinding(key({ key: "b", ctrlKey: true, altKey: true }))
    ).toBeNull()
  })

  it("blocks browser stealers p/o/u", () => {
    for (const k of ["p", "o", "u"] as const) {
      expect(
        matchIdeKeybinding(key({ key: k, ctrlKey: true }))?.action
      ).toBe("blockBrowser")
    }
  })
})
