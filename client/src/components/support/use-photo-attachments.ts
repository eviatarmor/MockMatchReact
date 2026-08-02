import { useState } from "react"
import { fileToBase64 } from "@/lib/file-to-base64"
import type { SupportAttachment } from "@mockmatch/schemas"
import type { LocalPhotoAttachment } from "./photo-attachments-field"

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
