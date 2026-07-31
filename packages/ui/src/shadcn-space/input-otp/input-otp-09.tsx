"use client"

import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "motion/react"
import React, { useEffect, useState, useRef } from "react"
import { OTPInput, OTPInputContext } from "input-otp"

type AnimatedOTPProps = {
  value?: string
  onChange?: (value: string) => void
  maxLength?: number
}

// Transform/opacity only — no layoutId (forced reflow) or filter:blur (expensive paint)
const CHAR_TRANSITION = {
  duration: 0.15,
  ease: "easeOut" as const,
}

const CustomOTPSlot = ({ index }: { index: number }) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  // Track the typed character to trigger pulse animation on change
  const [pulseKey, setPulseKey] = useState(0)
  const prevCharRef = useRef(char)

  useEffect(() => {
    if (char && char !== prevCharRef.current) {
      setPulseKey((prev) => prev + 1)
    }
    prevCharRef.current = char
  }, [char])

  return (
    <div
      className={cn(
        "relative flex h-12 w-10 items-center justify-center rounded-lg border border-input text-foreground transition-[border-color,box-shadow] duration-150",
        "bg-linear-to-br from-muted/30 to-background dark:from-muted/10 dark:to-card/50",
        "shadow-xs select-none",
        isActive &&
          "border-primary/60 shadow-[inset_0_0_12px_color-mix(in_srgb,var(--primary)_40%,transparent),0_0_8px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
      )}
    >
      {/* Typed character animation */}
      <AnimatePresence mode="popLayout">
        {char ? (
          <motion.span
            key={`char-${char}`}
            initial={{ opacity: 0, scale: 0.5, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -4 }}
            transition={CHAR_TRANSITION}
            className="absolute font-mono text-lg font-bold text-foreground"
          >
            {char}
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* Pulse ring on type — opacity + scale only (no blur) */}
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.div
            key={pulseKey}
            className="pointer-events-none absolute inset-0 rounded-lg border border-primary"
            initial={{ opacity: 0.7, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Active underline — CSS, no layout projection */}
      {isActive && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 bottom-2 h-px bg-primary"
        />
      )}

      {/* Fake caret — CSS blink avoids perpetual JS animation frames */}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-[2px] animate-pulse bg-primary" />
        </div>
      )}
    </div>
  )
}

// Reusable Animated OTP Component
export const AnimatedOTP = ({
  value,
  onChange,
  maxLength = 6,
}: AnimatedOTPProps) => {
  return (
    <OTPInput
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      containerClassName="group flex items-center justify-center gap-3"
    >
      <div className="flex items-center gap-3">
        {Array.from({ length: maxLength }).map((_, idx) => (
          <CustomOTPSlot key={idx} index={idx} />
        ))}
      </div>
    </OTPInput>
  )
}

// Default export wrapper containing the demo code
export default function InputOTPDemo() {
  const [value, setValue] = useState("")

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4",
        "h-36 w-full max-w-sm rounded-xl border border-border",
        "bg-card text-card-foreground p-5"
      )}
    >
      <AnimatedOTP value={value} onChange={setValue} />

      <div className="text-xs text-muted-foreground select-none">
        {value ? (
          <>
            Entered Code:{" "}
            <span className="font-mono font-semibold tracking-wider text-foreground">
              {value}
            </span>
          </>
        ) : (
          "Type to see the entered code"
        )}
      </div>
    </div>
  )
}
