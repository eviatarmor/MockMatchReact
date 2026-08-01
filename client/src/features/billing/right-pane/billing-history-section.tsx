import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { Card, CardContent } from "@mockmatch/ui/card"
import { Skeleton } from "@mockmatch/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mockmatch/ui/table"
import { SectionShell } from "@/components/layout/section-shell"
import { formatInvoiceDate } from "@/features/billing/types"
import { useBillingInvoices } from "@/features/billing/hooks/use-billing"
import { useRegionPreferences } from "@/hooks/use-region-preferences"

export function BillingHistorySection() {
  const { t } = useTranslation("billing")
  const { dateFormat } = useRegionPreferences()
  const invoicesQuery = useBillingInvoices()
  const invoices = invoicesQuery.data ?? []

  return (
    <SectionShell heading={t("history.heading")} description={t("history.description")}>
      <Card>
        <CardContent>
          {invoicesQuery.isLoading ? (
            <div className="flex flex-col gap-3 py-2" aria-hidden>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
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
                    <TableCell className="font-mono text-sm font-medium text-foreground">{invoice.id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatInvoiceDate(invoice.date, dateFormat)}
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
