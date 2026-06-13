import { Rocket } from "lucide-react"
import { SignupFormPanel } from "@/features/signup/right-pane/signup-form-panel"
import { SignupSocialProof } from "@/features/signup/left-pane/signup-social-proof"
import { GetStartedStepList } from "@/features/signup/left-pane/get-started-step-list"
import { GET_STARTED_STEPS } from "@/features/signup/constants"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"

export function SignupPageContent() {
  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel
        eyebrowIcon={Rocket}
        eyebrowKey="signup:heroHeadline.eyebrow"
        titleKey="signup:heroHeadline.title"
        descriptionKey="signup:heroHeadline.description"
        middleSlot={<GetStartedStepList steps={GET_STARTED_STEPS} />}
        bottomSlot={<SignupSocialProof />}
      />
      <SignupFormPanel />
    </div>
  )
}
