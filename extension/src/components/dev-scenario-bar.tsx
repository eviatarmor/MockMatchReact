import { Button } from "@mockmatch/ui/button"
import { useExtension } from "../state/extension-store"

/** Dev-only strip to walk UI states without extension logic. */
export function DevScenarioBar() {
  if (!import.meta.env.DEV) return null

  const {
    signedIn,
    signIn,
    signOut,
    setFormScenario,
    setEmptyDocs,
    setAuthError,
    clearFill,
    startFill,
    setRoute,
  } = useExtension()

  return (
    <div className="border-t border-dashed border-border/80 bg-muted/30 px-2 py-1.5">
      <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        Dev scenarios
      </p>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => (signedIn ? signOut() : signIn())}
        >
          {signedIn ? "Sign out" : "Sign in"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() =>
            setFormScenario({
              status: "detected",
              site: "Greenhouse",
              company: "Linear",
              role: "Senior Product Designer",
              fieldCount: 22,
            })
          }
        >
          Form
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setFormScenario({ status: "none" })}
        >
          No form
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setEmptyDocs(true)}
        >
          Empty docs
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setEmptyDocs(false)}
        >
          Restock docs
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => {
            clearFill()
            startFill()
          }}
        >
          Run fill
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setAuthError("Session expired. Sign in again.")}
        >
          Auth error
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setRoute("settings")}
        >
          Settings
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setRoute("apply")}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
