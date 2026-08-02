import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../index.css"
import { ExtensionProvider } from "../state/extension-store"
import { ChipApp } from "./chip-app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExtensionProvider initialSignedIn>
      <ChipApp standalone />
    </ExtensionProvider>
  </StrictMode>,
)
