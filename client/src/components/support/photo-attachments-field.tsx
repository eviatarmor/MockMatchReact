import { useEffect, useId, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@mockmatch/ui/attachment"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/file-to-base64"
import type { SupportAttachment } from "@mockmatch/schemas"

export const SUPPORT_PHOTO_MAX_COUNT = 3
export const SUPPORT_PHOTO_MAX_BYTES = 2 * 1024 * 1024

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const)

type AllowedMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif"

export type LocalPhotoAttachment = {
  readonly id: string
  readonly file: File
  readonly previewUrl: string
  readonly mimeType: AllowedMime
}

interface PhotoAttachmentsFieldProps {
  readonly photos: readonly LocalPhotoAttachment[]
  readonly onChange: (photos: LocalPhotoAttachment[]) => void
  readonly disabled?: boolean
  /** i18n namespace for labels. */
  readonly ns?: "help"
  readonly size?: "default" | "sm"
  /** Stack attachments at full form width (help page). */
  readonly fullWidth?: boolean
}

function isAllowedMime(value: string): value is AllowedMime {
  return ALLOWED_MIME.has(value as AllowedMime)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PhotoAttachmentsField({
  photos,
  onChange,
  disabled = false,
  ns = "help",
  size = "sm",
  fullWidth = false,
}: PhotoAttachmentsFieldProps) {
  const { t } = useTranslation(ns)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    }
  }, [])

  const remaining = SUPPORT_PHOTO_MAX_COUNT - photos.length
  const canAdd = remaining > 0 && !disabled

  function handleFiles(fileList: FileList | null) {
    if (!fileList || !canAdd) return
    const next = [...photos]
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      if (next.length >= SUPPORT_PHOTO_MAX_COUNT) break
      if (!isAllowedMime(file.type)) {
        errors.push(t("photos.invalidType", { name: file.name }))
        continue
      }
      if (file.size > SUPPORT_PHOTO_MAX_BYTES) {
        errors.push(t("photos.tooLarge", { name: file.name }))
        continue
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        mimeType: file.type,
      })
    }

    if (errors.length > 0) {
      toast.error(errors[0])
    }
    if (next.length !== photos.length) {
      onChange(next)
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    onChange(photos.filter((p) => p.id !== id))
  }

  return (
    <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
      <AttachmentGroup
        className={cn(
          "gap-2",
          fullWidth &&
            "w-full flex-col overflow-x-visible snap-none *:data-[slot=attachment]:w-full *:data-[slot=attachment]:max-w-none"
        )}
      >
        {photos.map((photo) => (
          <Attachment
            key={photo.id}
            size={size}
            orientation="horizontal"
            state="done"
            className={cn(fullWidth && "w-full max-w-none min-w-0")}
          >
            <AttachmentMedia variant="image">
              <img src={photo.previewUrl} alt="" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{photo.file.name}</AttachmentTitle>
              <AttachmentDescription>
                {formatBytes(photo.file.size)}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                type="button"
                aria-label={t("photos.remove")}
                disabled={disabled}
                onClick={() => removePhoto(photo.id)}
                className="cursor-pointer"
              >
                <X className="size-3.5" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ))}

        {canAdd ? (
          <Attachment
            size={size}
            orientation="horizontal"
            state="idle"
            className={cn(
              fullWidth ? "w-full max-w-none min-w-0" : "min-w-36"
            )}
          >
            <AttachmentMedia variant="icon">
              <ImagePlus className="size-4" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{t("photos.add")}</AttachmentTitle>
              <AttachmentDescription>
                {t("photos.hint", { max: SUPPORT_PHOTO_MAX_COUNT })}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              type="button"
              aria-label={t("photos.add")}
              className="cursor-pointer"
              onClick={() => inputRef.current?.click()}
            />
          </Attachment>
        ) : null}
      </AttachmentGroup>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        disabled={!canAdd}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}

/** Encode local photos for the support API payload. */
export async function encodeSupportPhotos(
  photos: readonly LocalPhotoAttachment[]
): Promise<SupportAttachment[]> {
  const out: SupportAttachment[] = []
  for (const photo of photos) {
    const dataBase64 = await fileToBase64(photo.file)
    out.push({
      fileName: photo.file.name.slice(0, 200),
      mimeType: photo.mimeType,
      dataBase64,
    })
  }
  return out
}

/** Hook-friendly photo list with cleanup helpers. */
export function usePhotoAttachments() {
  const [photos, setPhotos] = useState<LocalPhotoAttachment[]>([])

  function clearPhotos() {
    for (const photo of photos) {
      URL.revokeObjectURL(photo.previewUrl)
    }
    setPhotos([])
  }

  return { photos, setPhotos, clearPhotos }
}
