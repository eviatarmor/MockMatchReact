import { LOGIN_COPY } from "@/lib/login/constants"

export function LoginFooterLinks() {
  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {LOGIN_COPY.signUpPrompt}{" "}
        <a href="#" className="font-medium text-primary hover:underline">
          {LOGIN_COPY.signUpLabel}
        </a>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {LOGIN_COPY.termsPrefix}{" "}
        <a href="#" className="underline">
          {LOGIN_COPY.termsLabel}
        </a>{" "}
        and{" "}
        <a href="#" className="underline">
          {LOGIN_COPY.privacyLabel}
        </a>
        .
      </p>
    </>
  )
}
