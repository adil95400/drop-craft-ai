import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowRight, Check, X, AlertTriangle } from 'lucide-react'
import type { RuleExecutionResult } from '@/lib/rules/ruleEngine'

interface RulePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: RuleExecutionResult[]
  ruleName: string
}

export function RulePreviewDialog({ 
  open, 
  onOpenChange, 
  results,
  ruleName 
}: RulePreviewDialogProps) {
  const matchedCount = results.filter(r => r.appliedRules.length > 0).length
  const excludedCount = results.filter(r => r.excluded).length
  const changedCount = results.filter(r => r.changes.length > 0).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Prévisualisation : {ruleName}
          </DialogTitle>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{results.length}</div>
              <div className="text-sm text-muted-foreground">Produits testés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{matchedCount}</div>
              <div className="text-sm text-muted-foreground">Correspondances</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{changedCount}</div>
              <div className="text-sm text-muted-foreground">Modifiés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{excludedCount}</div>
              <div className="text-sm text-muted-foreground">Exclus</div>
            </CardContent>
          </Card>
        </div>

        {/* Results table */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Modifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[150px]" title={result.productId}>
                      {result.productId}
                    </div>
                  </TableCell>
                  <TableCell>
                    {result.excluded ? (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" />
                        Exclu
                      </Badge>
                    ) : result.appliedRules.length > 0 ? (
                      <Badge variant="default" className="gap-1 bg-green-500">
                        <Check className="h-3 w-3" />
                        Modifié
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Non affecté
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.changes.length > 0 ? (
                      <div className="space-y-1">
                        {result.changes.map((change, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="shrink-0">
                              {change.field}
                            </Badge>
                            <span className="text-muted-foreground truncate max-w-[120px]" title={String(change.before)}>
                              {String(change.before || '(vide)').substring(0, 20)}
                            </span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate max-w-[120px]" title={String(change.after)}>
                              {String(change.after || '(vide)').substring(0, 20)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : result.excluded ? (
                      <span className="text-sm text-muted-foreground">
                        Produit exclu du feed
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Aucune modification
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun produit disponible pour la prévisualisation</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
