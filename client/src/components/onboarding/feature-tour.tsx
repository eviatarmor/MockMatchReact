import {
  Tour,
  TourArrow,
  TourClose,
  TourDescription,
  TourFooter,
  TourHeader,
  TourNext,
  TourPortal,
  TourPrev,
  TourSkip,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourStepCounter,
  TourTitle,
} from "@mockmatch/ui/tour"

export interface FeatureTourStep {
  readonly target: string
  readonly title: string
  readonly description: string
  readonly side?: "top" | "right" | "bottom" | "left"
  readonly align?: "start" | "center" | "end"
}

interface FeatureTourProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly steps: readonly FeatureTourStep[]
}

export function FeatureTour({ open, onOpenChange, steps }: FeatureTourProps) {
  return (
    <Tour
      open={open}
      onOpenChange={onOpenChange}
      onComplete={() => onOpenChange(false)}
      onSkip={() => onOpenChange(false)}
      sideOffset={12}
      spotlightPadding={8}
    >
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing className="rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background" />

        {steps.map((step, index) => {
          const isFirst = index === 0

          return (
            <TourStep
              key={step.target}
              target={step.target}
              side={step.side ?? "bottom"}
              align={step.align ?? "center"}
            >
              <TourArrow />
              <TourClose />
              <TourHeader>
                <TourTitle>{step.title}</TourTitle>
                <TourDescription>{step.description}</TourDescription>
              </TourHeader>
              <TourFooter>
                <TourStepCounter />
                <div className="flex items-center gap-2">
                  {isFirst ? (
                    <TourSkip variant="ghost" size="sm" />
                  ) : (
                    <TourPrev variant="outline" size="sm" />
                  )}
                  <TourNext size="sm" />
                </div>
              </TourFooter>
            </TourStep>
          )
        })}
      </TourPortal>
    </Tour>
  )
}
