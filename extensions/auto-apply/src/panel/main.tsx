import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../index.css"
import { ExtensionProvider } from "../state/extension-store"
import { PanelApp } from "./panel-app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExtensionProvider>
      <PanelApp />
    </ExtensionProvider>
  </StrictMode>,
)
