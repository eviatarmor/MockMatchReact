import { useCallback, useMemo, useState } from "react"

import {
  DEFAULT_IDE_SETTINGS,
  type IdeSettings,
} from "./types"

function mergeSettings(
  base: IdeSettings,
  partial?: Partial<IdeSettings>
): IdeSettings {
  // IDE theme is always app-linked (auto) — no user override.
  const merged = partial ? { ...base, ...partial } : { ...base }
  merged.editorTheme = "auto"
  return merged
}

export type UseIdeSettingsOptions = {
  settings?: Partial<IdeSettings>
  defaultSettings?: Partial<IdeSettings>
  onSettingsChange?: (settings: IdeSettings) => void
}

export type UseIdeSettingsReturn = {
  settings: IdeSettings
  patchSettings: (patch: Partial<IdeSettings>) => void
  setSettings: (next: IdeSettings) => void
}

export function useIdeSettings({
  settings: controlledPartial,
  defaultSettings,
  onSettingsChange,
}: UseIdeSettingsOptions = {}): UseIdeSettingsReturn {
  const isControlled = controlledPartial !== undefined && onSettingsChange !== undefined

  const [internal, setInternal] = useState<IdeSettings>(() =>
    mergeSettings(DEFAULT_IDE_SETTINGS, defaultSettings)
  )

  const settings = useMemo(() => {
    if (isControlled) {
      return mergeSettings(DEFAULT_IDE_SETTINGS, {
        ...defaultSettings,
        ...controlledPartial,
      })
    }
    return internal
  }, [isControlled, controlledPartial, defaultSettings, internal])

  const setSettings = useCallback(
    (next: IdeSettings) => {
      if (isControlled) {
        onSettingsChange?.(next)
      } else {
        setInternal(next)
        onSettingsChange?.(next)
      }
    },
    [isControlled, onSettingsChange]
  )

  const patchSettings = useCallback(
    (patch: Partial<IdeSettings>) => {
      const { editorTheme: _ignored, ...rest } = patch
      setSettings({ ...settings, ...rest, editorTheme: "auto" })
    },
    [setSettings, settings]
  )

  const setSettingsForced = useCallback(
    (next: IdeSettings) => {
      setSettings({ ...next, editorTheme: "auto" })
    },
    [setSettings]
  )

  return { settings, patchSettings, setSettings: setSettingsForced }
}
