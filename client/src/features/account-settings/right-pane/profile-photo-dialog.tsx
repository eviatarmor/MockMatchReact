import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Cropper,
  CropperArea,
  CropperImage,
  type CropperAreaData,
  type CropperPoint,
} from "@mockmatch/ui/cropper"
import { Button } from "@mockmatch/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { Label } from "@mockmatch/ui/label"
import { Spinner } from "@mockmatch/ui/spinner"
import { AVATAR_ACCEPT } from "@/features/account-settings/lib/crop-image"

const ZERO_CROP: CropperPoint = { x: 0, y: 0 }

interface ProfilePhotoDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly validateSourceFile: (file: File) => string | null
  readonly onSave: (imageSrc: string, cropPixels: CropperAreaData) => Promise<boolean>
  readonly isUploading: boolean
}

export function ProfilePhotoDialog({
  open,
  onOpenChange,
  validateSourceFile,
  onSave,
  isUploading,
}: ProfilePhotoDialogProps) {
  const { t } = useTranslation("account-settings")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropperPoint>(ZERO_CROP)
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState<CropperAreaData | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const resetEditor = useCallback(() => {
    setImageSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      return null
    })
    setCrop(ZERO_CROP)
    setZoom(1)
    setCropPixels(null)
    setFileError(null)
  }, [])

  // Revoke object URLs when dialog closes.
  useEffect(() => {
    if (!open) resetEditor()
  }, [open, resetEditor])

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc)
    }
  }, [imageSrc])

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ""
      if (!file) return

      const error = validateSourceFile(file)
      if (error) {
        setFileError(error)
        return
      }

      setFileError(null)
      setCrop(ZERO_CROP)
      setZoom(1)
      setCropPixels(null)
      setImageSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
    },
    [validateSourceFile]
  )

  const handleSave = useCallback(async () => {
    if (!imageSrc || !cropPixels) return
    const ok = await onSave(imageSrc, cropPixels)
    if (ok) onOpenChange(false)
  }, [cropPixels, imageSrc, onOpenChange, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profile.photo.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("profile.photo.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {imageSrc ? (
            <Cropper
              aspectRatio={1}
              crop={crop}
              zoom={zoom}
              shape="circle"
              objectFit="cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={(_pct, pixels) => setCropPixels(pixels)}
              onCropComplete={(_pct, pixels) => setCropPixels(pixels)}
              className="min-h-72 w-full rounded-xl bg-muted"
            >
              <CropperImage src={imageSrc} alt={t("profile.photo.cropAlt")} />
              <CropperArea />
            </Cropper>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-72 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <span className="font-medium text-foreground">
                {t("profile.photo.chooseFile")}
              </span>
              <span className="text-xs">{t("profile.photo.fileHint")}</span>
            </button>
          )}

          {fileError ? (
            <p className="text-center text-xs text-destructive" role="alert">
              {fileError}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />

          {imageSrc ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="avatar-zoom" className="text-xs text-muted-foreground">
                  {t("profile.photo.zoom")}
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {zoom.toFixed(2)}
                </span>
              </div>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isUploading}
              />
            }
          >
            {t("account.confirmCancel")}
          </DialogClose>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={!imageSrc || !cropPixels || isUploading}
            onClick={() => void handleSave()}
          >
            {isUploading ? (
              <>
                <Spinner className="size-3.5" />
                {t("profile.photo.saving")}
              </>
            ) : (
              t("profile.photo.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
