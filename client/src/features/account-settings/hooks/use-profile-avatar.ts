import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { CropperAreaData } from "@mockmatch/ui/cropper"
import {
  AVATAR_MAX_SOURCE_BYTES,
  AVATAR_OUTPUT_CONTENT_TYPE,
  cropImageToBlob,
} from "@/features/account-settings/lib/crop-image"
import { trpc } from "@/lib/trpc"

export interface UseProfileAvatarResult {
  readonly avatarUrl: string | null
  readonly isUploading: boolean
  readonly isRemoving: boolean
  readonly uploadCropped: (imageSrc: string, cropPixels: CropperAreaData) => Promise<boolean>
  readonly remove: () => Promise<boolean>
  readonly validateSourceFile: (file: File) => string | null
}

export function useProfileAvatar(
  avatarUrlFromAccount: string | null | undefined
): UseProfileAvatarResult {
  const { t } = useTranslation("account-settings")
  const utils = trpc.useUtils()
  const [isUploading, setIsUploading] = useState(false)

  const requestUpload = trpc.account.requestAvatarUpload.useMutation()
  const confirmUpload = trpc.account.confirmAvatarUpload.useMutation()
  const removeAvatar = trpc.account.removeAvatar.useMutation()

  const writeAvatarCaches = useCallback(
    (account: {
      id: string
      email: string
      fullName: string | null
      avatarUrl: string | null
      preferences?: unknown
    }) => {
      // Full replace so avatarUrl never sticks to a stale signed path.
      utils.account.get.setData(undefined, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          avatarUrl: account.avatarUrl,
        }
      })
      utils.auth.me.setData(undefined, {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl,
      })
    },
    [utils.account.get, utils.auth.me]
  )

  const invalidateAvatarCaches = useCallback(async () => {
    await Promise.all([
      utils.account.get.invalidate(undefined, { refetchType: "active" }),
      utils.auth.me.invalidate(undefined, { refetchType: "active" }),
    ])
  }, [utils.account.get, utils.auth.me])

  const validateSourceFile = useCallback(
    (file: File): string | null => {
      const allowed = new Set(["image/jpeg", "image/png", "image/webp"])
      if (!allowed.has(file.type)) {
        return t("profile.photo.errors.invalidType")
      }
      if (file.size > AVATAR_MAX_SOURCE_BYTES) {
        return t("profile.photo.errors.tooLarge")
      }
      return null
    },
    [t]
  )

  const uploadCropped = useCallback(
    async (imageSrc: string, cropPixels: CropperAreaData): Promise<boolean> => {
      setIsUploading(true)
      try {
        const blob = await cropImageToBlob(imageSrc, cropPixels)
        const { uploadUrl, key, contentType } = await requestUpload.mutateAsync({
          contentType: AVATAR_OUTPUT_CONTENT_TYPE,
        })

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: blob,
        })
        if (!putRes.ok) {
          throw new Error(`S3 PUT failed: ${putRes.status}`)
        }

        const account = await confirmUpload.mutateAsync({ key })
        writeAvatarCaches(account)
        toast.success(t("profile.photo.toast.uploaded"), { id: "avatar-uploaded" })
        void invalidateAvatarCaches()
        return true
      } catch {
        toast.error(t("profile.photo.toast.uploadErrorTitle"), {
          id: "avatar-upload-error",
          description: t("profile.photo.toast.uploadErrorDescription"),
        })
        return false
      } finally {
        setIsUploading(false)
      }
    },
    [
      confirmUpload,
      invalidateAvatarCaches,
      requestUpload,
      t,
      writeAvatarCaches,
    ]
  )

  const remove = useCallback(async (): Promise<boolean> => {
    try {
      const account = await removeAvatar.mutateAsync()
      writeAvatarCaches(account)
      toast.success(t("profile.photo.toast.removed"), { id: "avatar-removed" })
      void invalidateAvatarCaches()
      return true
    } catch {
      toast.error(t("profile.photo.toast.removeErrorTitle"), {
        id: "avatar-remove-error",
        description: t("profile.photo.toast.removeErrorDescription"),
      })
      return false
    }
  }, [invalidateAvatarCaches, removeAvatar, t, writeAvatarCaches])

  return {
    avatarUrl: avatarUrlFromAccount ?? null,
    isUploading,
    isRemoving: removeAvatar.isPending,
    uploadCropped,
    remove,
    validateSourceFile,
  }
}
