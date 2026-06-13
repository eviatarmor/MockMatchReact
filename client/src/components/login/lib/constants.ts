import type { FeatureHighlight, ReadinessSummary } from "@/components/login/lib/types"

export const APP_NAME = "MockMatch"

export const HERO_HEADLINE = {
  eyebrow: "Interview prep, end to end",
  title: "Practice like it's the real interview.",
  description:
    "Sharpen your resume, run AI mock interviews, and track every application — all in one calm, focused workspace.",
} as const

export const FEATURE_HIGHLIGHTS: readonly FeatureHighlight[] = [
  { id: "resume", label: "ATS-scored resumes with fix-it guidance", icon: "resume" },
  { id: "interview", label: "Role-specific AI mock interviews", icon: "interview" },
  { id: "readiness", label: "A readiness score that tells you what's next", icon: "readiness" },
]

export const READINESS_SUMMARY: ReadinessSummary = {
  maxScore: 100,
  updates: [
    { score: 82, message: "Add the two missing keywords on your resume to reach 90+." },
    { score: 88, message: "Tailor your summary to the target role to climb higher." },
    { score: 95, message: "Run a mock interview to lock in your readiness score." },
  ],
}

export const TRUST_MESSAGE =
  "Trusted by candidates prepping across software, consulting, and healthcare."

export const LOGIN_COPY = {
  title: "Sign in to MockMatch",
  subtitle: "Welcome back — pick up your prep where you left off.",
  dividerLabel: "or continue with email",
  forgotPasswordLabel: "Forgot password?",
  submitLabel: "Sign in",
  signUpPrompt: "New to MockMatch?",
  signUpLabel: "Create an account",
  termsPrefix: "By continuing you agree to our",
  termsLabel: "Terms",
  privacyLabel: "Privacy Policy",
} as const
