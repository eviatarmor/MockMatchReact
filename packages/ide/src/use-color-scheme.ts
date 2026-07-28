import { useEffect, useState } from "react"

import type { IdeColorScheme, IdeEditorTheme } from "./types"

export type ResolvedColorScheme = "light" | "dark"

function readDocumentScheme(): ResolvedColorScheme {
  if (typeof document === "undefined") {
    return "light"
  }
  const root = document.documentElement
  if (root.classList.contains("dark")) {
    return "dark"
  }
  if (root.classList.contains("light")) {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** Resolve light/dark for Monaco theme. `auto` tracks `<html class="dark|light">`. */
export function useColorScheme(
  colorScheme: IdeColorScheme = "auto"
): ResolvedColorScheme {
  const [autoScheme, setAutoScheme] = useState<ResolvedColorScheme>(() =>
    readDocumentScheme()
  )

  useEffect(() => {
    if (colorScheme !== "auto") {
      return
    }

    setAutoScheme(readDocumentScheme())

    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setAutoScheme(readDocumentScheme())
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onMq = () => setAutoScheme(readDocumentScheme())
    mq.addEventListener("change", onMq)

    return () => {
      observer.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [colorScheme])

  if (colorScheme === "light" || colorScheme === "dark") {
    return colorScheme
  }
  return autoScheme
}

export function monacoThemeForScheme(scheme: ResolvedColorScheme): string {
  return scheme === "dark" ? "vs-dark" : "vs"
}

/** Resolve Monaco theme id from settings + app scheme. */
export function resolveMonacoTheme(
  editorTheme: IdeEditorTheme | undefined,
  scheme: ResolvedColorScheme
): string {
  if (!editorTheme || editorTheme === "auto") {
    return monacoThemeForScheme(scheme)
  }
  return editorTheme
}
