import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SectionShell } from "@/features/account-settings/right-pane/section-shell"

interface ActionRowProps {
  readonly title: string
  readonly description: string
  readonly action: ReactNode
}

function ActionRow({ title, description, action }: ActionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {action}
    </div>
  )
}

interface ConfirmButtonProps {
  readonly trigger: ReactNode
  readonly title: string
  readonly message: string
  readonly confirmLabel: string
  readonly destructive?: boolean
  readonly onConfirm: () => void
}

function ConfirmButton({ trigger, title, message, confirmLabel, destructive, onConfirm }: ConfirmButtonProps) {
  const { t } = useTranslation("account-settings")
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
            {t("account.confirmCancel")}
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            className="cursor-pointer"
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AccountAccessSection() {
  const { t } = useTranslation("account-settings")

  // All stubbed — no backend wired up yet.
  const signOut = () => toast.success(t("toast.signedOut"))
  const signOutEverywhere = () => toast.success(t("toast.signedOutEverywhere"))
  const deleteAccount = () => toast.success(t("toast.accountDeleted"))

  return (
    <SectionShell heading={t("account.heading")} description={t("account.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <ActionRow
            title={t("account.signOut.title")}
            description={t("account.signOut.description")}
            action={
              <Button variant="outline" className="cursor-pointer" onClick={signOut}>
                {t("account.signOut.button")}
              </Button>
            }
          />

          <Separator />

          <ActionRow
            title={t("account.signOutEverywhere.title")}
            description={t("account.signOutEverywhere.description")}
            action={
              <ConfirmButton
                trigger={<Button variant="outline" className="cursor-pointer">{t("account.signOutEverywhere.button")}</Button>}
                title={t("account.signOutEverywhere.confirmTitle")}
                message={t("account.signOutEverywhere.confirmMessage")}
                confirmLabel={t("account.signOutEverywhere.button")}
                onConfirm={signOutEverywhere}
              />
            }
          />

          <Separator />

          <ActionRow
            title={t("account.deleteAccount.title")}
            description={t("account.deleteAccount.description")}
            action={
              <ConfirmButton
                trigger={<Button variant="destructive" className="cursor-pointer">{t("account.deleteAccount.button")}</Button>}
                title={t("account.deleteAccount.confirmTitle")}
                message={t("account.deleteAccount.confirmMessage")}
                confirmLabel={t("account.deleteAccount.button")}
                destructive
                onConfirm={deleteAccount}
              />
            }
          />
        </CardContent>
      </Card>
    </SectionShell>
  )
}
