import type { ReactNode } from "react"
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti"
import confetti from "canvas-confetti"

import { Button } from "./button"

type Api = {
  fire: (options?: ConfettiOptions) => void
}

type Props = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
  children?: ReactNode
}

export type ConfettiRef = Api | null

const ConfettiContext = createContext<Api>({} as Api)

// Define component first
const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    ...rest
  } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        })
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset()
          instanceRef.current = null
        }
      }
    },
    [globalOptions]
  )

  const fire = useCallback(
    async (opts = {}) => {
      try {
        await instanceRef.current?.({ ...options, ...opts })
      } catch (error) {
        console.error("Confetti error:", error)
      }
    },
    [options]
  )

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire]
  )

  useImperativeHandle(ref, () => api, [api])

  useEffect(() => {
    if (!manualstart) {
      ;(async () => {
        try {
          await fire()
        } catch (error) {
          console.error("Confetti effect error:", error)
        }
      })()
    }
  }, [manualstart, fire])

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  )
})

// Set display name immediately
ConfettiComponent.displayName = "Confetti"

// Export as Confetti
export const Confetti = ConfettiComponent

interface ConfettiButtonProps extends React.ComponentProps<"button"> {
  options?: ConfettiOptions &
    ConfettiGlobalOptions & { canvas?: HTMLCanvasElement }
}

const ConfettiButtonComponent = ({
  options,
  children,
  ...props
}: ConfettiButtonProps) => {
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      await confetti({
        ...options,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      })
    } catch (error) {
      console.error("Confetti button error:", error)
    }
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}

ConfettiButtonComponent.displayName = "ConfettiButton"

export const ConfettiButton = ConfettiButtonComponent

/** Shared celebration burst (IDE all-tests-pass, MCQ perfect set, …). */
export type CelebrationConfettiOrigin = {
  readonly x?: number
  readonly y?: number
}

export type FireCelebrationConfettiOptions = ConfettiOptions & {
  /** Viewport-normalized origin (0–1). Overrides `element` when both set. */
  readonly origin?: CelebrationConfettiOrigin
  /** Prefer button/rect center (e.g. Run tests control that was pressed). */
  readonly element?: Element | null
}

/**
 * Fire the product celebration confetti.
 * When `element` is set, origin matches {@link ConfettiButton} (click center).
 */
export function fireCelebrationConfetti(
  options: FireCelebrationConfettiOptions = {}
): Promise<null> | null {
  const { element, origin: originOpt, ...rest } = options

  let origin: { x: number; y: number } = {
    x: 0.5,
    y: 0.65,
  }

  if (element && typeof window !== "undefined") {
    const rect = element.getBoundingClientRect()
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    }
  }

  if (originOpt?.x != null) origin.x = originOpt.x
  if (originOpt?.y != null) origin.y = originOpt.y

  try {
    void confetti({
      particleCount: 100,
      spread: 70,
      startVelocity: 35,
      origin,
      zIndex: 200,
      disableForReducedMotion: true,
      ...rest,
    })
    return null
  } catch (error) {
    console.error("Celebration confetti error:", error)
    return null
  }
}

/** Resolve a celebration origin from a DOM element (button center). */
export function celebrationOriginFromElement(
  element: Element | null | undefined
): CelebrationConfettiOrigin | undefined {
  if (!element || typeof window === "undefined") return undefined
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return undefined
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  }
}
