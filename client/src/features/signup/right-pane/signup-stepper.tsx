import { AnimatePresence, motion } from "motion/react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Stepper, StepperContent } from "@/components/ui/stepper"
import { AuthCodeStep } from "@/components/auth/auth-code-step"
import { SignupFooterLinks } from "@/features/signup/right-pane/signup-footer-links"
import { useSignupForm } from "@/features/signup/hooks/use-signup-form"

const STEP_TRANSITION = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.2, ease: "easeOut" as const },
}

export function SignupStepper() {
  const { t } = useTranslation("signup")
  const { form, step, email, isSendingCode, onSubmitDetails, onBackToDetails, otp } = useSignupForm()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const agreeToTerms = watch("agreeToTerms")

  return (
    <Stepper value={step} nonInteractive className="gap-6">
      <AnimatePresence mode="wait">
        {step === "details" ? (
          <motion.div key="details" {...STEP_TRANSITION}>
            <StepperContent value="details" forceMount className="flex flex-col gap-6">
              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitDetails)}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder={t("fullNamePlaceholder")}
                    aria-invalid={!!errors.fullName}
                    {...register("fullName")}
                  />
                  {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{t("emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreeToTerms"
                      className="mt-0.5 cursor-pointer"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setValue("agreeToTerms", checked === true)}
                      aria-invalid={!!errors.agreeToTerms}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm font-normal text-muted-foreground">
                      <Trans
                        i18nKey="signup:agreeToTermsLabel"
                        components={{
                          terms: <a href="#" className="underline" />,
                          privacy: <a href="#" className="underline" />,
                        }}
                      />
                    </Label>
                  </div>
                  {errors.agreeToTerms ? (
                    <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
                  ) : null}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSendingCode}>
                  {isSendingCode ? t("sendingCodeLabel") : t("continueLabel")}
                </Button>
              </form>

              <SignupFooterLinks />
            </StepperContent>
          </motion.div>
        ) : (
          <motion.div key="code" {...STEP_TRANSITION}>
            <StepperContent value="code" forceMount>
              <AuthCodeStep namespace="signup" email={email} onUseDifferentEmail={onBackToDetails} {...otp} />
            </StepperContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Stepper>
  )
}
