import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stepper, StepperContent } from "@/components/ui/stepper"
import { AuthCodeStep } from "@/components/auth/auth-code-step"
import { LoginFooterLinks } from "@/features/login/right-pane/login-footer-links"
import { useLoginForm } from "@/features/login/hooks/use-login-form"

const STEP_TRANSITION = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.2, ease: "easeOut" as const },
}

export function LoginStepper() {
  const { t } = useTranslation("login")
  const { form, step, email, isSendingCode, onSubmitEmail, onBackToEmail, otp } = useLoginForm()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <Stepper value={step} nonInteractive className="gap-6">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div key="email" {...STEP_TRANSITION}>
            <StepperContent value="email" forceMount className="flex flex-col gap-6">
              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitEmail)}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{t("emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSendingCode}>
                  {isSendingCode ? t("sendingCodeLabel") : t("continueLabel")}
                </Button>
              </form>

              <LoginFooterLinks />
            </StepperContent>
          </motion.div>
        ) : (
          <motion.div key="code" {...STEP_TRANSITION}>
            <StepperContent value="code" forceMount>
              <AuthCodeStep namespace="login" email={email} onUseDifferentEmail={onBackToEmail} {...otp} />
            </StepperContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Stepper>
  )
}
