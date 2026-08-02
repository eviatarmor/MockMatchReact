import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  DEFAULT_SETTINGS,
  MOCK_COVER_LETTERS,
  MOCK_PROFILE,
  MOCK_RESUMES,
  MOCK_REVIEW_FIELDS,
  MOCK_USER,
  TAILOR_DRAFT_SAMPLE,
} from "../mock/data"
import type {
  ChipState,
  CoverLetterMode,
  ExtensionSettings,
  ExtensionState,
  FillPhase,
  FormDetection,
  PanelRoute,
  ThemePreference,
} from "../types"

type ExtensionStore = ExtensionState & {
  setRoute: (route: PanelRoute) => void
  signIn: () => void
  signOut: () => void
  setFormScenario: (form: FormDetection) => void
  selectResume: (id: string | null) => void
  selectCoverLetter: (id: string | null) => void
  setCoverLetterMode: (mode: CoverLetterMode) => void
  setTailorDraft: (text: string) => void
  generateTailorDraft: () => void
  startFill: () => void
  clearFill: () => void
  updateSettings: (patch: Partial<ExtensionSettings>) => void
  setTheme: (theme: ThemePreference) => void
  setBanner: (message: string | null) => void
  setEmptyDocs: (empty: boolean) => void
  setAuthError: (message: string | null) => void
}

const ExtensionContext = createContext<ExtensionStore | null>(null)

const DETECTED_FORM: FormDetection = {
  status: "detected",
  site: "Greenhouse",
  company: "Linear",
  role: "Senior Product Designer",
  fieldCount: 22,
}

function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** Match client ThemeProvider — class is `light` or `dark` on <html>. */
function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
}

export function ExtensionProvider({
  children,
  initialSignedIn = false,
}: {
  children: ReactNode
  initialSignedIn?: boolean
}) {
  const [signedIn, setSignedIn] = useState(initialSignedIn)
  const [user, setUser] = useState(initialSignedIn ? MOCK_USER : null)
  const [route, setRoute] = useState<PanelRoute>("apply")
  const [form, setForm] = useState<FormDetection>(
    initialSignedIn ? DETECTED_FORM : { status: "none" },
  )
  const [resumes, setResumes] = useState(MOCK_RESUMES)
  const [coverLetters, setCoverLetters] = useState(MOCK_COVER_LETTERS)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
    initialSignedIn ? "r1" : null,
  )
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<
    string | null
  >(initialSignedIn ? "c1" : null)
  const [coverLetterMode, setCoverLetterMode] =
    useState<CoverLetterMode>("existing")
  const [tailorDraft, setTailorDraft] = useState("")
  const [tailorLoading, setTailorLoading] = useState(false)
  const [profile, setProfile] = useState(initialSignedIn ? MOCK_PROFILE : null)
  const [fillPhase, setFillPhase] = useState<FillPhase>("idle")
  const [chipState, setChipState] = useState<ChipState>(
    initialSignedIn ? "ready" : "idle",
  )
  const [reviewFields, setReviewFields] = useState(MOCK_REVIEW_FIELDS)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [authError, setAuthError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const resolvedTheme = resolveTheme(settings.theme)

  useEffect(() => {
    applyThemeClass(resolvedTheme)
    if (settings.theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyThemeClass(resolveTheme("system"))
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [settings.theme, resolvedTheme])

  useEffect(() => {
    if (!signedIn) {
      setChipState("idle")
      return
    }
    if (fillPhase === "filling") {
      setChipState("filling")
      return
    }
    if (fillPhase === "review" || fillPhase === "done") {
      setChipState("review")
      return
    }
    if (form.status === "detected") {
      setChipState("ready")
      return
    }
    setChipState("idle")
  }, [signedIn, form, fillPhase])

  const signIn = useCallback(() => {
    setAuthError(null)
    setBanner("Opening MockMatch to sign in… (demo: signed in)")
    window.setTimeout(() => {
      setSignedIn(true)
      setUser(MOCK_USER)
      setProfile(MOCK_PROFILE)
      setResumes(MOCK_RESUMES)
      setCoverLetters(MOCK_COVER_LETTERS)
      setSelectedResumeId("r1")
      setSelectedCoverLetterId("c1")
      setForm(DETECTED_FORM)
      setRoute("apply")
      setBanner(null)
    }, 600)
  }, [])

  const signOut = useCallback(() => {
    setSignedIn(false)
    setUser(null)
    setProfile(null)
    setSelectedResumeId(null)
    setSelectedCoverLetterId(null)
    setFillPhase("idle")
    setForm({ status: "none" })
    setRoute("apply")
    setBanner(null)
    setAuthError(null)
  }, [])

  const setFormScenario = useCallback((next: FormDetection) => {
    setForm(next)
    setFillPhase("idle")
  }, [])

  const generateTailorDraft = useCallback(() => {
    setTailorLoading(true)
    setCoverLetterMode("tailor")
    window.setTimeout(() => {
      setTailorDraft(TAILOR_DRAFT_SAMPLE)
      setTailorLoading(false)
    }, 900)
  }, [])

  const startFill = useCallback(() => {
    if (!selectedResumeId) {
      setBanner("Choose a resume before filling")
      return
    }
    if (settings.confirmBeforeFill) {
      // UI shell: proceed after a beat to show filling state
    }
    setFillPhase("filling")
    setBanner(null)
    window.setTimeout(() => {
      setReviewFields(MOCK_REVIEW_FIELDS)
      setFillPhase("review")
    }, 1200)
  }, [selectedResumeId, settings.confirmBeforeFill])

  const clearFill = useCallback(() => {
    setFillPhase("idle")
  }, [])

  const updateSettings = useCallback((patch: Partial<ExtensionSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const setTheme = useCallback((theme: ThemePreference) => {
    // Sync class before React paint (view transitions + navbar toggle).
    applyThemeClass(resolveTheme(theme))
    setSettings((prev) => ({ ...prev, theme }))
  }, [])

  const setEmptyDocs = useCallback((empty: boolean) => {
    if (empty) {
      setResumes([])
      setCoverLetters([])
      setSelectedResumeId(null)
      setSelectedCoverLetterId(null)
    } else {
      setResumes(MOCK_RESUMES)
      setCoverLetters(MOCK_COVER_LETTERS)
      setSelectedResumeId("r1")
      setSelectedCoverLetterId("c1")
    }
  }, [])

  const value = useMemo<ExtensionStore>(
    () => ({
      signedIn,
      user,
      route,
      form,
      resumes,
      coverLetters,
      selectedResumeId,
      selectedCoverLetterId,
      coverLetterMode,
      tailorDraft,
      tailorLoading,
      profile,
      fillPhase,
      chipState,
      reviewFields,
      settings,
      resolvedTheme,
      authError,
      banner,
      setRoute,
      signIn,
      signOut,
      setFormScenario,
      selectResume: setSelectedResumeId,
      selectCoverLetter: setSelectedCoverLetterId,
      setCoverLetterMode,
      setTailorDraft,
      generateTailorDraft,
      startFill,
      clearFill,
      updateSettings,
      setTheme,
      setBanner,
      setEmptyDocs,
      setAuthError,
    }),
    [
      signedIn,
      user,
      route,
      form,
      resumes,
      coverLetters,
      selectedResumeId,
      selectedCoverLetterId,
      coverLetterMode,
      tailorDraft,
      tailorLoading,
      profile,
      fillPhase,
      chipState,
      reviewFields,
      settings,
      resolvedTheme,
      authError,
      banner,
      signIn,
      signOut,
      setFormScenario,
      generateTailorDraft,
      startFill,
      clearFill,
      updateSettings,
      setTheme,
      setEmptyDocs,
    ],
  )

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  )
}

export function useExtension() {
  const ctx = useContext(ExtensionContext)
  if (!ctx) throw new Error("useExtension must be used within ExtensionProvider")
  return ctx
}
