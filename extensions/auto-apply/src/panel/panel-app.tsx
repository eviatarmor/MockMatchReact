import { PanelHeader } from "../components/panel-header"
import { Banner } from "../components/banner"
import { LoggedOutScreen } from "../screens/logged-out-screen"
import { ApplyScreen } from "../screens/apply-screen"
import { SettingsScreen } from "../screens/settings-screen"
import { useExtension } from "../state/extension-store"

export function PanelApp() {
  const { signedIn, route } = useExtension()

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted text-foreground">
      <PanelHeader />
      <Banner />
      {!signedIn ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LoggedOutScreen />
        </div>
      ) : route === "settings" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SettingsScreen />
        </div>
      ) : (
        <ApplyScreen />
      )}
    </div>
  )
}
