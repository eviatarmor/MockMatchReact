import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionShell } from "@/features/billing/right-pane/section-shell"
import { MOCK_BILLING } from "@/features/billing/constants"

export function BillingHistorySection() {
  const { t } = useTranslation("billing")
  const { invoices } = MOCK_BILLING

  return (
    <SectionShell heading={t("history.heading")} description={t("history.description")}>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("history.columns.invoice")}</TableHead>
                <TableHead>{t("history.columns.date")}</TableHead>
                <TableHead>{t("history.columns.amount")}</TableHead>
                <TableHead>{t("history.columns.status")}</TableHead>
                <TableHead className="text-right">{t("history.columns.receipt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-foreground">{invoice.id}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="tabular-nums">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        invoice.status === "paid"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }
                    >
                      {t(`history.status.${invoice.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => toast.info(t("toast.receiptDownloaded", { invoice: invoice.id }))}
                    >
                      <Download className="size-4" />
                      {t("history.download")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
