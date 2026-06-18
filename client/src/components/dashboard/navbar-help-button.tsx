import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function NavbarHelpButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Help"
          />
        }
      >
        <HelpCircle className="size-4" />
      </TooltipTrigger>
      <TooltipContent>Help & docs</TooltipContent>
    </Tooltip>
  )
}
