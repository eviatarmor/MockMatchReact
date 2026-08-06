import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "./lib/i18n"
import { LandingPage } from "./landing-page"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>
)
