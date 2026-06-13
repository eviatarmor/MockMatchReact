import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage, AvatarGroupCount } from "@/components/ui/avatar"
import { NumberTicker } from "@/components/shadcn-space/number-ticker/number-ticker-01"

export function SignupSocialProof() {
  const { t } = useTranslation("signup")

  return (
    <div className="flex items-center gap-3 text-sm text-white/70">
      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
        <Avatar>
          <AvatarImage src="https://images.shadcnspace.com/assets/profiles/user-1.jpg" alt="user" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://images.shadcnspace.com/assets/profiles/user-2.jpg" alt="user" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://images.shadcnspace.com/assets/profiles/user-3.jpg" alt="user" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
        <AvatarGroupCount className="text-card-foreground font-medium">+4</AvatarGroupCount>
      </div>
      <span>
        {t("socialProofPrefix")}{" "}
        <NumberTicker end={40000} duration={1.5} suffix="+" formatNumber className="font-semibold text-white" />{" "}
        {t("socialProofSuffix")}
      </span>
    </div>
  )
}
