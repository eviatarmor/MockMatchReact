import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"

import "./index.css"
import "./lib/i18n"
import { queryClient } from "./lib/query-client"
import { ThemeProvider } from "./components/theme-provider"
import { ThemedToaster } from "./components/themed-toaster"
import { TrpcProvider } from "./lib/trpc/provider"
import { HomePage } from "./pages/home-page"
import { LoginPage } from "./pages/login-page"
import { SignupPage } from "./pages/signup-page"
import { NotFoundPage } from "./pages/not-found-page"
import { dashboardRoutes } from "./pages/dashboard/dashboard-routes"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TrpcProvider queryClient={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="mockmatch-theme">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              {dashboardRoutes()}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ThemedToaster />
          </BrowserRouter>
        </ThemeProvider>
      </TrpcProvider>
    </QueryClientProvider>
  </StrictMode>
)
