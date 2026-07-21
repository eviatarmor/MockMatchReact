import { useTranslation } from "react-i18next"
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
import { SectionShell } from "@/components/layout/section-shell"
import { formatInvoiceDate } from "@/features/billing/types"
import { useBillingInvoices } from "@/features/billing/hooks/use-billing"

export function BillingHistorySection() {
  const { t } = useTranslation("billing")
  const invoicesQuery = useBillingInvoices()
  const invoices = invoicesQuery.data ?? []

  return (
    <SectionShell heading={t("history.heading")} description={t("history.description")}>
      <Card>
        <CardContent>
          {invoicesQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
          ) : invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("history.empty")}
            </p>
          ) : (
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
                    <TableCell className="text-muted-foreground">
                      {formatInvoiceDate(invoice.date)}
                    </TableCell>
                    <TableCell className="tabular-nums">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                        {t(`history.status.${invoice.status}`, {
                          defaultValue: invoice.status,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.receiptUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => {
                            window.open(invoice.receiptUrl ?? undefined, "_blank", "noopener,noreferrer")
                          }}
                        >
                          <Download className="size-4" />
                          {t("history.download")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}
