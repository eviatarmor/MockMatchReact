import { DocumentEditorWelcomeDialog } from "@/components/onboarding/document-editor-welcome-dialog"
import { DocumentEditorTour } from "@/components/onboarding/document-editor-tour"
import { useDocumentEditorOnboarding } from "@/hooks/use-document-editor-onboarding"

/**
 * First-open welcome + tour for the shared document editor chrome.
 * Mount once on desktop resume / cover-letter editor shells.
 */
export function DocumentEditorOnboarding() {
  const {
    welcomeOpen,
    tourOpen,
    startTour,
    skipWelcome,
    setTourOpen,
  } = useDocumentEditorOnboarding()

  return (
    <>
      <DocumentEditorWelcomeDialog
        open={welcomeOpen}
        onStartTour={startTour}
        onSkip={skipWelcome}
      />
      <DocumentEditorTour open={tourOpen} onOpenChange={setTourOpen} />
    </>
  )
}
