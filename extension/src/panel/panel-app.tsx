import { PanelHeader } from "../components/panel-header"
import { Banner } from "../components/banner"
import { DevScenarioBar } from "../components/dev-scenario-bar"
import { LoggedOutScreen } from "../screens/logged-out-screen"
import { ApplyScreen } from "../screens/apply-screen"
import { SettingsScreen } from "../screens/settings-screen"
import { AccountScreen } from "../screens/account-screen"
import { useExtension } from "../state/extension-store"

export function PanelApp() {
  const { signedIn, route } = useExtension()

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <PanelHeader />
      <Banner />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {!signedIn ? (
          <LoggedOutScreen />
        ) : route === "settings" ? (
          <SettingsScreen />
        ) : route === "account" ? (
          <AccountScreen />
        ) : (
          <ApplyScreen />
        )}
      </main>
      <DevScenarioBar />
    </div>
  )
}
