import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
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
import { SectionShell } from "@/components/layout/section-shell"
import { forceLogout } from "@/lib/auth/session-guard"
import { clearUser } from "@/lib/auth/session"
import { trpc } from "@/lib/trpc"

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
  readonly pending?: boolean
}

function ConfirmButton({
  trigger,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  pending,
}: ConfirmButtonProps) {
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
            disabled={pending}
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logoutAll = trpc.auth.logoutAll.useMutation()
  const deleteAccount = trpc.account.delete.useMutation()

  const signOut = () => {
    void forceLogout(queryClient).then(() => {
      toast.success(t("toast.signedOut"))
    })
  }

  const signOutEverywhere = () => {
    logoutAll.mutate(undefined, {
      onSuccess: () => {
        clearUser()
        queryClient.clear()
        toast.success(t("toast.signedOutEverywhere"))
        navigate("/login", { replace: true })
      },
      onError: () => {
        toast.error(t("toast.saveErrorTitle"))
      },
    })
  }

  const onDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        clearUser()
        queryClient.clear()
        toast.success(t("toast.accountDeleted"))
        navigate("/login", { replace: true })
      },
      onError: () => {
        toast.error(t("toast.saveErrorTitle"))
      },
    })
  }

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
                trigger={
                  <Button variant="outline" className="cursor-pointer" disabled={logoutAll.isPending}>
                    {t("account.signOutEverywhere.button")}
                  </Button>
                }
                title={t("account.signOutEverywhere.confirmTitle")}
                message={t("account.signOutEverywhere.confirmMessage")}
                confirmLabel={t("account.signOutEverywhere.button")}
                pending={logoutAll.isPending}
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
                trigger={
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    disabled={deleteAccount.isPending}
                  >
                    {t("account.deleteAccount.button")}
                  </Button>
                }
                title={t("account.deleteAccount.confirmTitle")}
                message={t("account.deleteAccount.confirmMessage")}
                confirmLabel={t("account.deleteAccount.button")}
                destructive
                pending={deleteAccount.isPending}
                onConfirm={onDeleteAccount}
              />
            }
          />
        </CardContent>
      </Card>
    </SectionShell>
  )
}
