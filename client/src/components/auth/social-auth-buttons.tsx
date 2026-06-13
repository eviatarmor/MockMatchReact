import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/google-icon"
import { LinkedinIcon } from "@/components/icons/linkedin-icon"
import type { SocialProvider } from "@/components/auth/types"

interface SocialAuthButtonsProps {
  readonly pendingProvider: SocialProvider | null
  readonly onProviderSelect: (provider: SocialProvider) => void
  readonly googleLabel: string
  readonly linkedinLabel: string
}

export function SocialAuthButtons({
  pendingProvider,
  onProviderSelect,
  googleLabel,
  linkedinLabel,
}: SocialAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full justify-center font-normal"
        disabled={pendingProvider !== null}
        onClick={() => onProviderSelect("google")}
      >
        <GoogleIcon className="size-4" />
        {googleLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full justify-center font-normal"
        disabled={pendingProvider !== null}
        onClick={() => onProviderSelect("linkedin")}
      >
        <LinkedinIcon className="size-4" />
        {linkedinLabel}
      </Button>
    </div>
  )
}
