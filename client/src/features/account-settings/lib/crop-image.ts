import type { CropperAreaData } from "@mockmatch/ui/cropper"

const OUTPUT_SIZE = 512
const OUTPUT_TYPE = "image/jpeg" as const
const OUTPUT_QUALITY = 0.9

/**
 * Rasterize the cropper's pixel region into a square JPEG blob (max 512px).
 */
export async function cropImageToBlob(
  imageSrc: string,
  cropPixels: CropperAreaData
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  const side = Math.max(1, Math.round(Math.min(cropPixels.width, cropPixels.height, OUTPUT_SIZE)))
  canvas.width = side
  canvas.height = side

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    side,
    side
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode cropped image"))
          return
        }
        resolve(blob)
      },
      OUTPUT_TYPE,
      OUTPUT_QUALITY
    )
  })
}

export const AVATAR_OUTPUT_CONTENT_TYPE = OUTPUT_TYPE
export const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", () => reject(new Error("Failed to load image")))
    img.src = src
  })
}
