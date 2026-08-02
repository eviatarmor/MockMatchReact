import { Switch } from "@mockmatch/ui/switch"
import { Button } from "@mockmatch/ui/button"
import { Card, CardContent } from "@mockmatch/ui/card"
import { SectionShell } from "../components/section-shell"
import { AppearanceSection } from "./appearance-section"
import { useExtension } from "../state/extension-store"
import type { CoverLetterMode } from "../types"

const CL_DEFAULTS: { value: CoverLetterMode; label: string }[] = [
  { value: "skip", label: "Skip" },
  { value: "existing", label: "Existing" },
  { value: "tailor", label: "Tailor" },
]

function SettingRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none text-foreground"
        >
          {title}
        </label>
        <p className="text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  )
}

/**
 * Settings layout mirrors client account-settings right pane:
 * stacked SectionShell blocks (no left nav / scroll-spy tabs).
 */
export function SettingsScreen() {
  const { settings, updateSettings, setBanner } = useExtension()

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      <div>
        <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theme, fill behavior, and privacy for Auto Apply.
        </p>
      </div>

      <AppearanceSection />

      <SectionShell
        heading="Autofill"
        description="How Auto Apply detects forms and maps your profile into fields."
      >
        <Card>
          <CardContent className="flex flex-col gap-5">
            <SettingRow
              id="auto-detect"
              title="Auto-detect forms"
              description="Watch for application forms on supported sites."
              checked={settings.autoDetectForms}
              onCheckedChange={(v) => updateSettings({ autoDetectForms: v })}
            />
            <SettingRow
              id="auto-open"
              title="Open panel when detected"
              description="Open this side panel when a form is found."
              checked={settings.autoOpenPanelOnDetect}
              onCheckedChange={(v) =>
                updateSettings({ autoOpenPanelOnDetect: v })
              }
            />
            <SettingRow
              id="highlight"
              title="Highlight filled fields"
              description="Show a soft highlight on fields MockMatch filled."
              checked={settings.highlightFilledFields}
              onCheckedChange={(v) =>
                updateSettings({ highlightFilledFields: v })
              }
            />
            <SettingRow
              id="remember-resume"
              title="Remember last resume"
              description="Preselect the resume you used last time."
              checked={settings.rememberLastResume}
              onCheckedChange={(v) =>
                updateSettings({ rememberLastResume: v })
              }
            />
            <div className="space-y-2 border-t border-border/60 pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Default cover letter mode
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Starting choice on Apply for each new form.
                </p>
              </div>
              <div className="flex gap-1.5">
                {CL_DEFAULTS.map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    size="sm"
                    variant={
                      settings.defaultCoverLetterMode === m.value
                        ? "default"
                        : "outline"
                    }
                    className="flex-1 cursor-pointer"
                    onClick={() =>
                      updateSettings({ defaultCoverLetterMode: m.value })
                    }
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionShell>

      <SectionShell
        heading="Auto apply"
        description="Prepare applications automatically — never submits for you."
      >
        <Card>
          <CardContent className="flex flex-col gap-5">
            <SettingRow
              id="prepare"
              title="Prepare applications"
              description="Preselect docs and optionally fill when confidence is high."
              checked={settings.prepareApplications}
              onCheckedChange={(v) =>
                updateSettings({ prepareApplications: v })
              }
            />
            <SettingRow
              id="confirm-fill"
              title="Confirm before fill"
              description="Ask once before writing into the page."
              checked={settings.confirmBeforeFill}
              onCheckedChange={(v) =>
                updateSettings({ confirmBeforeFill: v })
              }
            />
            <p className="border-t border-border/60 pt-4 text-xs leading-snug text-muted-foreground">
              MockMatch never clicks the employer&apos;s Submit button. You
              always review and send the application yourself.
            </p>
          </CardContent>
        </Card>
      </SectionShell>

      <SectionShell
        heading="Privacy"
        description="Local data stored by this extension only."
      >
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() =>
                setBanner("Local cache cleared (demo — no storage yet)")
              }
            >
              Clear local cache
            </Button>
          </CardContent>
        </Card>
      </SectionShell>

      <div className="space-y-1 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">MockMatch Auto Apply</p>
        <p className="text-2xs text-muted-foreground">v0.1.0 · UI shell</p>
        <a
          href="http://localhost:5173/autofill"
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-primary hover:underline"
        >
          Open activity dashboard
        </a>
      </div>
    </div>
  )
}
