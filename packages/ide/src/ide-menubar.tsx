import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@mockmatch/ui/menubar"
import { Kbd, KbdGroup } from "@mockmatch/ui/kbd"
import { cn } from "@mockmatch/ui/utils"

import type {
  IdeLabels,
  IdeSettings,
  IdeSplitDirection,
} from "./types"

export type IdeMenubarProps = {
  settings: IdeSettings
  onPatchSettings: (patch: Partial<IdeSettings>) => void
  showTree?: boolean
  onToggleTree?: () => void
  treeToggleable?: boolean
  showTerminal?: boolean
  onToggleTerminal?: () => void
  showAi?: boolean
  onToggleAi?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  onCreateFile?: () => void
  onCreateFolder?: () => void
  onSplit?: (direction: IdeSplitDirection) => void
  onUnsplit?: () => void
  isSplit?: boolean
  onRun?: () => void
  onRunTests?: () => void
  runBusy?: boolean
  runTestsBusy?: boolean
  runDisabled?: boolean
  runTestsDisabled?: boolean
  hideRunMenu?: boolean
  labels?: IdeLabels
  className?: string
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const
const TAB_SIZES = [2, 4, 8] as const

export function IdeMenubar({
  settings,
  onPatchSettings,
  showTree,
  onToggleTree,
  treeToggleable = false,
  showTerminal,
  onToggleTerminal,
  showAi,
  onToggleAi,
  fullscreen = false,
  onToggleFullscreen,
  onCreateFile,
  onCreateFolder,
  onSplit,
  onUnsplit,
  isSplit,
  onRun,
  onRunTests,
  runBusy = false,
  runTestsBusy = false,
  runDisabled = false,
  runTestsDisabled = false,
  /** Hide Run menu when host centers buttons in the page chrome. */
  hideRunMenu = false,
  labels = {},
  className,
}: IdeMenubarProps) {
  const hasRunMenu = !hideRunMenu && Boolean(onRun || onRunTests)

  return (
    <Menubar
      className={cn(
        "h-8 border-0 bg-transparent p-0 shadow-none",
        className
      )}
    >
      {(onCreateFile || onCreateFolder) && (
        <MenubarMenu>
          <MenubarTrigger className="h-7 px-2 text-xs font-medium">
            {labels.fileMenu ?? "File"}
          </MenubarTrigger>
          <MenubarContent>
            {onCreateFile ? (
              <MenubarItem onClick={onCreateFile}>
                {labels.newFile ?? "New File"}
                <KbdGroup className="ml-auto">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>N</Kbd>
                </KbdGroup>
              </MenubarItem>
            ) : null}
            {onCreateFolder ? (
              <MenubarItem onClick={onCreateFolder}>
                {labels.newFolder ?? "New Folder"}
                <KbdGroup className="ml-auto">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>Shift</Kbd>
                  <Kbd>N</Kbd>
                </KbdGroup>
              </MenubarItem>
            ) : null}
          </MenubarContent>
        </MenubarMenu>
      )}

      {hasRunMenu ? (
        <MenubarMenu>
          <MenubarTrigger className="h-7 px-2 text-xs font-medium">
            {labels.runMenu ?? "Run"}
          </MenubarTrigger>
          <MenubarContent>
            {onRun ? (
              <MenubarItem
                disabled={runDisabled || runBusy}
                onClick={onRun}
              >
                {labels.run ?? "Run"}
                <Kbd className="ml-auto">F5</Kbd>
              </MenubarItem>
            ) : null}
            {onRunTests ? (
              <MenubarItem
                disabled={runTestsDisabled || runTestsBusy}
                onClick={onRunTests}
              >
                {labels.runTests ?? "Run tests"}
                <KbdGroup className="ml-auto">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>Shift</Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              </MenubarItem>
            ) : null}
          </MenubarContent>
        </MenubarMenu>
      ) : null}

      <MenubarMenu>
        <MenubarTrigger className="h-7 px-2 text-xs font-medium">
          {labels.viewMenu ?? "View"}
        </MenubarTrigger>
        <MenubarContent>
          {treeToggleable && onToggleTree ? (
            <MenubarCheckboxItem
              checked={Boolean(showTree)}
              onCheckedChange={() => onToggleTree()}
            >
              {labels.toggleTree ?? "File tree"}
              <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>B</Kbd>
              </KbdGroup>
            </MenubarCheckboxItem>
          ) : null}

          {onToggleTerminal ? (
            <MenubarCheckboxItem
              checked={Boolean(showTerminal)}
              onCheckedChange={() => onToggleTerminal()}
            >
              {labels.toggleTerminal ?? "Terminal"}
              <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>`</Kbd>
              </KbdGroup>
            </MenubarCheckboxItem>
          ) : null}

          {onToggleAi ? (
            <MenubarCheckboxItem
              checked={Boolean(showAi)}
              onCheckedChange={() => onToggleAi()}
            >
              {labels.toggleAi ?? "AI Assistant"}
              <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>L</Kbd>
              </KbdGroup>
            </MenubarCheckboxItem>
          ) : null}

          {(treeToggleable || onToggleTerminal || onToggleAi) && (
            <MenubarSeparator />
          )}

          {onSplit ? (
            <>
              <MenubarSub>
                <MenubarSubTrigger>
                  {labels.splitMenu ?? "Split editor"}
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => onSplit("right")}>
                    {labels.splitRight ?? "Right"}
                    <KbdGroup className="ml-auto">
                      <Kbd>Ctrl</Kbd>
                      <Kbd>\</Kbd>
                    </KbdGroup>
                  </MenubarItem>
                  <MenubarItem onClick={() => onSplit("left")}>
                    {labels.splitLeft ?? "Left"}
                  </MenubarItem>
                  <MenubarItem onClick={() => onSplit("down")}>
                    {labels.splitDown ?? "Down"}
                    <KbdGroup className="ml-auto">
                      <Kbd>Ctrl</Kbd>
                      <Kbd>Shift</Kbd>
                      <Kbd>\</Kbd>
                    </KbdGroup>
                  </MenubarItem>
                  <MenubarItem onClick={() => onSplit("up")}>
                    {labels.splitUp ?? "Up"}
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              {isSplit && onUnsplit ? (
                <MenubarItem onClick={onUnsplit}>
                  {labels.unsplit ?? "Close split"}
                </MenubarItem>
              ) : null}
              <MenubarSeparator />
            </>
          ) : null}

          {onToggleFullscreen ? (
            <>
              <MenubarItem onClick={onToggleFullscreen}>
                {fullscreen
                  ? (labels.exitFullscreen ?? "Exit Full Screen")
                  : (labels.fullscreen ?? "Full Screen")}
                <Kbd className="ml-auto">F11</Kbd>
              </MenubarItem>
              <MenubarSeparator />
            </>
          ) : null}

          <MenubarCheckboxItem
            checked={settings.wordWrap !== "off"}
            onCheckedChange={(checked) =>
              onPatchSettings({ wordWrap: checked ? "on" : "off" })
            }
          >
            {labels.wordWrap ?? "Word wrap"}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={settings.minimap}
            onCheckedChange={(checked) =>
              onPatchSettings({ minimap: Boolean(checked) })
            }
          >
            {labels.minimap ?? "Minimap"}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={settings.lineNumbers !== "off"}
            onCheckedChange={(checked) =>
              onPatchSettings({ lineNumbers: checked ? "on" : "off" })
            }
          >
            {labels.lineNumbers ?? "Line numbers"}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={settings.bracketPairColorization}
            onCheckedChange={(checked) =>
              onPatchSettings({
                bracketPairColorization: Boolean(checked),
              })
            }
          >
            {labels.bracketColors ?? "Bracket pair colorization"}
          </MenubarCheckboxItem>

          <MenubarSeparator />

          <MenubarSub>
            <MenubarSubTrigger>
              {labels.fontSize ?? "Font size"}
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={String(settings.fontSize)}
                onValueChange={(v) => {
                  const n = Number(v)
                  if (Number.isFinite(n)) onPatchSettings({ fontSize: n })
                }}
              >
                {FONT_SIZES.map((size) => (
                  <MenubarRadioItem key={size} value={String(size)}>
                    {size}px
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>
              {labels.tabSize ?? "Tab size"}
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={String(settings.tabSize)}
                onValueChange={(v) => {
                  const n = Number(v)
                  if (TAB_SIZES.includes(n as (typeof TAB_SIZES)[number])) {
                    onPatchSettings({ tabSize: n })
                  }
                }}
              >
                {TAB_SIZES.map((size) => (
                  <MenubarRadioItem key={size} value={String(size)}>
                    {size}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarCheckboxItem
            checked={settings.ligatures}
            onCheckedChange={(checked) =>
              onPatchSettings({ ligatures: Boolean(checked) })
            }
          >
            {labels.ligatures ?? "Font ligatures"}
          </MenubarCheckboxItem>

          <MenubarSub>
            <MenubarSubTrigger>
              {labels.whitespace ?? "Whitespace"}
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={settings.renderWhitespace}
                onValueChange={(v) => {
                  if (
                    v === "none" ||
                    v === "boundary" ||
                    v === "selection" ||
                    v === "trailing" ||
                    v === "all"
                  ) {
                    onPatchSettings({ renderWhitespace: v })
                  }
                }}
              >
                {(
                  [
                    "none",
                    "boundary",
                    "selection",
                    "trailing",
                    "all",
                  ] as const
                ).map((mode) => (
                  <MenubarRadioItem key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>

        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
