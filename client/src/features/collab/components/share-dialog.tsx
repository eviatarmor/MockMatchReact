import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useCopyToClipboard } from "@uidotdev/usehooks"
import { Link as LinkIcon, Loader2, Copy, Check, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import type { CollabRole, DocumentKind } from "@mockmatch/schemas"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditsGate } from "@/features/billing/components/credits-gate"
import { trpc } from "@/lib/trpc"
import { formatDateTime } from "@/lib/format-datetime"
import { useRegionPreferences } from "@/hooks/use-region-preferences"

interface ShareDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly kind: DocumentKind
  readonly documentId: string
  readonly canShare: boolean
  readonly isOwner: boolean
  readonly isPaidOwner: boolean
  /** Optional doc title shown in the dialog header (Google-style). */
  readonly documentTitle?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

export function ShareDialog({
  open,
  onOpenChange,
  kind,
  documentId,
  canShare,
  isOwner,
  isPaidOwner,
  documentTitle,
}: ShareDialogProps) {
  const { t } = useTranslation("collab")
  const { dateFormat, timeFormat } = useRegionPreferences()
  const utils = trpc.useUtils()
  const [role, setRole] = useState<CollabRole>("edit")
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  /** URL only available right after create (token never re-readable). */
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const copied = Boolean(copiedText && lastUrl && copiedText === lastUrl)

  const create = trpc.collab.createShareLink.useMutation({
    onSuccess: (data) => {
      setLastUrl(data.url)
      utils.collab.listShareLinks.invalidate({ kind, id: documentId }).catch(() => {})
    },
    onError: (err) => {
      toast.error(err.message || t("share.createError"))
    },
  })

  const revoke = trpc.collab.revokeShareLink.useMutation({
    onSuccess: () => {
      utils.collab.listShareLinks.invalidate({ kind, id: documentId }).catch(() => {})
      toast.success(t("share.revoked"))
    },
  })

  const updateRole = trpc.collab.updateCollaboratorRole.useMutation({
    onSuccess: () => {
      utils.collab.listCollaborators.invalidate({ kind, id: documentId }).catch(() => {})
    },
  })

  const remove = trpc.collab.removeCollaborator.useMutation({
    onSuccess: () => {
      utils.collab.listCollaborators.invalidate({ kind, id: documentId }).catch(() => {})
      toast.success(t("share.removed"))
    },
  })

  const links = trpc.collab.listShareLinks.useQuery(
    { kind, id: documentId },
    { enabled: open && canShare }
  )
  const collabs = trpc.collab.listCollaborators.useQuery(
    { kind, id: documentId },
    { enabled: open && canShare }
  )

  const onCopyUrl = (url: string) => {
    copyToClipboard(url)
    toast.success(t("share.copied"))
  }

  /** Create link if needed, then copy — Google "Copy link" one-shot. */
  const onCopyLink = async () => {
    if (lastUrl) {
      onCopyUrl(lastUrl)
      return
    }
    try {
      const data = await create.mutateAsync({ kind, id: documentId, role })
      onCopyUrl(data.url)
    } catch {
      // toast from mutation
    }
  }

  const title = documentTitle
    ? t("share.titleNamed", { name: documentTitle })
    : t("share.title")

  return (
    <CreditsGate
      open={open}
      onOpenChange={onOpenChange}
      when={isOwner}
      allowed={isPaidOwner && canShare}
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,36rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 space-y-1 border-b px-5 py-4 pr-12">
            <DialogTitle className="truncate text-base">{title}</DialogTitle>
            <DialogDescription>{t("share.description")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {!isOwner ? (
              <p className="text-sm text-muted-foreground">{t("share.ownerOnly")}</p>
            ) : (
              <>
                {/* People with access — Google-style list */}
                <section className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("share.collaborators")}
                  </p>
                  {collabs.isLoading ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                    </div>
                  ) : !collabs.data?.items.length ? (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        <UserRound className="size-4" />
                      </div>
                      <span>{t("share.noCollaborators")}</span>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {collabs.data.items.map((c) => {
                        const label = c.fullName || c.email
                        return (
                          <li
                            key={c.userId}
                            className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/50"
                          >
                            <Avatar size="default" className="size-9">
                              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                                {initials(label)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{label}</p>
                              {c.fullName && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {c.email}
                                </p>
                              )}
                            </div>
                            <Select
                              value={c.role}
                              onValueChange={(v) => {
                                if (!v) return
                                updateRole.mutate({
                                  kind,
                                  id: documentId,
                                  userId: c.userId,
                                  role: v as CollabRole,
                                })
                              }}
                            >
                              <SelectTrigger className="h-8 w-[5.75rem] shrink-0 border-0 bg-transparent text-xs shadow-none hover:bg-muted">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="view">{t("roles.view")}</SelectItem>
                                <SelectItem value="edit">{t("roles.edit")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 shrink-0 text-muted-foreground"
                              onClick={() =>
                                remove.mutate({
                                  kind,
                                  id: documentId,
                                  userId: c.userId,
                                })
                              }
                              aria-label={t("share.remove")}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>

                {/* General access / link — Google bottom block */}
                <section className="space-y-3 rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background border">
                      <LinkIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium">{t("share.generalAccess")}</p>
                      <p className="text-xs text-muted-foreground">{t("share.linkHint")}</p>
                    </div>
                    <Select
                      value={role}
                      onValueChange={(v) => setRole((v as CollabRole) ?? "edit")}
                    >
                      <SelectTrigger className="h-8 w-[5.75rem] shrink-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">{t("roles.view")}</SelectItem>
                        <SelectItem value="edit">{t("roles.edit")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="h-9 w-full cursor-pointer gap-2"
                    disabled={create.isPending}
                    onClick={() => void onCopyLink()}
                  >
                    {create.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? t("share.copied") : t("share.copyLink")}
                  </Button>
                </section>

                {links.data && links.data.items.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("share.activeLinks")}
                    </p>
                    <ul className="space-y-1">
                      {links.data.items.map((link) => (
                        <li
                          key={link.id}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-lg px-1 py-1 text-xs"
                        >
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {t(`roles.${link.role}`)} ·{" "}
                            {t("share.expires", {
                              time: formatDateTime(
                                link.expiresAt,
                                dateFormat,
                                timeFormat
                              ),
                            })}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0 cursor-pointer"
                            disabled={revoke.isPending}
                            onClick={() => revoke.mutate({ shareId: link.id })}
                            aria-label={t("share.revoke")}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </CreditsGate>
  )
}
