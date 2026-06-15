import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Sparkles, FileText, Link2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddJobDialogProps {
  readonly trigger: React.ReactElement
}

export function AddJobDialog({ trigger }: AddJobDialogProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [link, setLink] = useState("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("jobTracker.addJob.title")}</DialogTitle>
          <DialogDescription>{t("jobTracker.addJob.description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste">
          <TabsList variant="line">
            <TabsTrigger value="paste" className="gap-1.5 cursor-pointer">
              <FileText className="size-4" />
              {t("jobTracker.addJob.tabs.paste")}
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1.5 cursor-pointer">
              <Link2 className="size-4" />
              {t("jobTracker.addJob.tabs.link")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="pt-3">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("jobTracker.addJob.pastePlaceholder")}
              className="min-h-40 resize-none"
            />
          </TabsContent>
          <TabsContent value="link" className="pt-3">
            <Input
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder={t("jobTracker.addJob.linkPlaceholder")}
            />
          </TabsContent>
        </Tabs>

        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-3 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {t("jobTracker.addJob.matchNote")}
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              {t("jobTracker.addJob.cancel")}
            </DialogClose>
            <Button className="gap-1.5 cursor-pointer" onClick={() => setOpen(false)}>
              <Plus className="size-4" />
              {t("jobTracker.addJob.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
