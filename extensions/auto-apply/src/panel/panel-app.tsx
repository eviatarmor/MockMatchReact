import { ScrollArea } from "@mockmatch/ui/scroll-area"
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
        <ScrollArea className="min-h-0 flex-1">
          <LoggedOutScreen />
        </ScrollArea>
      ) : route === "settings" ? (
        <ScrollArea className="min-h-0 flex-1">
          <SettingsScreen />
        </ScrollArea>
      ) : (
        <ApplyScreen />
      )}
    </div>
  )
}
