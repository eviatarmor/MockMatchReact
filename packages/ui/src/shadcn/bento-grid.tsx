import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className?: string
  background?: ReactNode
  Icon: React.ElementType
  description: string
  href?: string
  cta?: string
}

function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[18rem] grid-cols-1 gap-4 sm:auto-rows-[20rem] sm:grid-cols-2 lg:auto-rows-[22rem] lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        "transform-gpu dark:bg-background dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {background}
      </div>
      <div className="relative z-10 mt-auto p-4">
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-8">
          <Icon className="size-10 origin-left transform-gpu text-foreground/80 transition-all duration-300 ease-in-out group-hover:scale-75 sm:size-12" />
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            {name}
          </h3>
          <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        </div>

        {href && cta ? (
          <>
            <div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center pt-2 transition-all duration-300 lg:hidden">
              <Button
                variant="link"
                size="sm"
                className="pointer-events-auto h-auto p-0"
                nativeButton={false}
                render={<a href={href} />}
              >
                {cta}
                <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
              </Button>
            </div>
            <div
              className={cn(
                "pointer-events-none absolute bottom-0 hidden w-full translate-y-8 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
              )}
            >
              <Button
                variant="link"
                size="sm"
                className="pointer-events-auto h-auto p-0"
                nativeButton={false}
                render={<a href={href} />}
              >
                {cta}
                <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.03] group-hover:dark:bg-neutral-800/10" />
    </div>
  )
}

export { BentoCard, BentoGrid }
export type { BentoCardProps, BentoGridProps }
