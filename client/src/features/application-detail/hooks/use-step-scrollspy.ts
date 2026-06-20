import { useEffect, useRef, useState } from "react"

export function useStepScrollspy(stepIds: string[]) {
  const [activeStepId, setActiveStepId] = useState(stepIds[0] ?? null)
  const stepRefs = useRef(new Map<string, HTMLDivElement>())

  const registerStepRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      stepRefs.current.set(id, el)
    } else {
      stepRefs.current.delete(id)
    }
  }

  useEffect(() => {
    const elements = stepIds
      .map((id) => stepRefs.current.get(id))
      .filter((el): el is HTMLDivElement => Boolean(el))
    if (elements.length === 0) return

    const root = elements[0].closest('[data-slot="scroll-area-viewport"]')

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = stepIds.find((stepId) => stepRefs.current.get(stepId) === visible[0].target)
          if (id) setActiveStepId(id)
        }
      },
      {
        root: root instanceof Element ? root : null,
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [stepIds])

  const scrollToStep = (id: string) => {
    stepRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return { activeStepId, registerStepRef, scrollToStep }
}
