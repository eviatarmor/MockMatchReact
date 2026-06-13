import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/login/icons/google-icon"
import { LinkedinIcon } from "@/components/login/icons/linkedin-icon"
import type { SocialProvider } from "@/lib/login/types"

interface SocialAuthButtonsProps {
  readonly pendingProvider: SocialProvider | null
  readonly onProviderSelect: (provider: SocialProvider) => void
}

export function SocialAuthButtons({
  pendingProvider,
  onProviderSelect,
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
        Continue with Google
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
        Continue with LinkedIn
      </Button>
    </div>
  )
}
