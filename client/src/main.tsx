import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "./index.css"
import "./lib/i18n"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { TrpcProvider } from "./lib/trpc/provider"
import { HomePage } from "./pages/home-page"
import { LoginPage } from "./pages/login-page"
import { SignupPage } from "./pages/signup-page"
import { dashboardRoutes } from "./pages/dashboard/dashboard-routes"

const queryClient = new QueryClient()

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
            </Routes>
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </TrpcProvider>
    </QueryClientProvider>
  </StrictMode>
)
