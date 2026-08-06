import { useEffect, useState, type ReactNode } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { ProductChrome } from "./product-chrome"

interface DemoMediaProps {
  readonly title: string
  /** Paths under `/demos/` without extension, e.g. `resume` → tries .webm then .mp4 */
  readonly videoBase?: string
  readonly children: ReactNode
  readonly className?: string
  readonly toolbar?: ReactNode
}

async function probeDemoVideo(
  videoBase: string
): Promise<string | null> {
  const candidates = [`/demos/${videoBase}.webm`, `/demos/${videoBase}.mp4`]
  for (const src of candidates) {
    try {
      const res = await fetch(src, { method: "HEAD" })
      if (res.ok) return src
    } catch {
      // try next candidate
    }
  }
  return null
}

/**
 * Prefers real product video when present at `/demos/{base}.webm|.mp4`.
 * Falls back to Motion UI mock children. Respects prefers-reduced-motion.
 */
export function DemoMedia({
  title,
  videoBase,
  children,
  className,
  toolbar,
}: DemoMediaProps) {
  const reduced = usePrefersReducedMotion()
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!videoBase || reduced) {
      setVideoSrc(null)
      return
    }

    let cancelled = false
    void probeDemoVideo(videoBase).then((src) => {
      if (!cancelled) setVideoSrc(src)
    })

    return () => {
      cancelled = true
    }
  }, [videoBase, reduced])

  return (
    <ProductChrome title={title} className={className} toolbar={toolbar}>
      {videoSrc ? (
        <video
          className="aspect-[16/10] w-full object-cover object-top"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          src={videoSrc}
        />
      ) : (
        <div className="aspect-[16/10] w-full overflow-hidden">{children}</div>
      )}
    </ProductChrome>
  )
}
