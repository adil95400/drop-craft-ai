import { useState } from 'react'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannablePageHero } from '@/components/channable/ChannablePageHero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFeedReports, useFeedReportDetails, useRunFeedDiagnostic, FeedReport } from '@/hooks/useFeedDiagnostics'
import { Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ShoppingBag, Store, Facebook, Package, Loader2, Wrench } from 'lucide-react'

const CHANNEL_META: Record<string, { label: string; icon: any; color: string }> = {
  google_shopping: { label: 'Google Shopping', icon: ShoppingBag, color: 'text-blue-500' },
  shopify: { label: 'Shopify', icon: Store, color: 'text-green-500' },
  facebook: { label: 'Facebook Catalog', icon: Facebook, color: 'text-indigo-500' },
  amazon: { label: 'Amazon', icon: Package, color: 'text-orange-500' },
}

export default function FeedDiagnostics() {
  const { data: reports, isLoading } = useFeedReports()
  const runDiagnostic = useRunFeedDiagnostic()
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const { data: details } = useFeedReportDetails(selectedReportId)

  // Group latest reports by channel
  const latestByChannel = (reports || []).reduce<Record<string, FeedReport>>((acc, r) => {
    if (!acc[r.channel]) acc[r.channel] = r
    return acc
  }, {})

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <ChannablePageLayout>
      <ChannablePageHero
        title="Diagnostics Feed"
        description="Analysez la qualité de votre catalogue par canal de vente"
        category="analytics"
      />

      <div className="px-6 py-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Rapports par canal</h2>
          <Button onClick={() => runDiagnostic.mutate(undefined)} disabled={runDiagnostic.isPending}>
            {runDiagnostic.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Lancer un diagnostic complet
          </Button>
        </div>

        {/* Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CHANNEL_META).map(([key, meta]) => {
            const report = latestByChannel[key]
            const Icon = meta.icon
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedReportId === report?.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => report && setSelectedReportId(report.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                      <CardTitle className="text-sm">{meta.label}</CardTitle>
                    </div>
                    {report && (
                      <span className={`text-2xl font-bold ${scoreColor(report.score)}`}>
                        {report.score}%
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {report ? (
                    <div className="space-y-2">
                      <Progress value={report.score} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{report.valid_products} OK</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" />{report.warning_products}</span>
                        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />{report.error_products}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucun rapport. Lancez un diagnostic.</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Report Details */}
        {details && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Détails — {CHANNEL_META[details.report.channel]?.label || details.report.channel}
                </CardTitle>
                <Badge variant={details.report.score >= 80 ? 'default' : details.report.score >= 50 ? 'secondary' : 'destructive'}>
                  Score : {details.report.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="errors">
                <TabsList>
                  <TabsTrigger value="errors">
                    Erreurs ({details.items.filter(i => i.severity === 'error').length})
                  </TabsTrigger>
                  <TabsTrigger value="warnings">
                    Avertissements ({details.items.filter(i => i.severity === 'warning').length})
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    Info ({details.items.filter(i => i.severity === 'info').length})
                  </TabsTrigger>
                </TabsList>

                {['errors', 'warnings', 'info'].map(tab => {
                  const sev = tab === 'errors' ? 'error' : tab === 'warnings' ? 'warning' : 'info'
                  return (
                    <TabsContent key={tab} value={tab}>
                      <div className="rounded-md border max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Règle</TableHead>
                              <TableHead>Champ</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Suggestion</TableHead>
                              <TableHead>Auto-fix</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {details.items.filter(i => i.severity === sev).length === 0 ? (
                              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun élément</TableCell></TableRow>
                            ) : details.items.filter(i => i.severity === sev).map(item => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium text-xs max-w-[150px] truncate">{item.product_title}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{item.rule_code}</Badge></TableCell>
                                <TableCell className="text-xs">{item.field_name}</TableCell>
                                <TableCell className="text-xs">{item.message}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.suggestion || '—'}</TableCell>
                                <TableCell>
                                  {item.auto_fixable ? (
                                    <Badge className="bg-green-100 text-green-700 text-xs"><Wrench className="h-3 w-3 mr-1" />Oui</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Non</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </ChannablePageLayout>
  )
}
