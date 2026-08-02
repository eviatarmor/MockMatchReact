import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../index.css"
import { ExtensionProvider } from "../state/extension-store"
import { ChipApp } from "./chip-app"
import { DevScenarioBar } from "../components/dev-scenario-bar"

function ChipPreviewShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <ChipApp standalone />
      </div>
      <div className="mx-auto w-full max-w-md">
        <DevScenarioBar />
      </div>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExtensionProvider initialSignedIn>
      <ChipPreviewShell />
    </ExtensionProvider>
  </StrictMode>,
)
