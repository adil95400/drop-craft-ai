import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  ArrowRight,
  RotateCcw,
  Package,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react'
import { ProductHistoryService, type ProductHistoryEntry } from '@/services/ProductHistoryService'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ProductHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  onRestore?: (snapshot: any) => void
}

export function ProductHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onRestore,
}: ProductHistoryDialogProps) {
  const [history, setHistory] = useState<ProductHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open, productId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const data = await ProductHistoryService.getProductHistory(user.id, productId)
      setHistory(data)
    } catch (error) {
      console.error('Failed to load history:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (entry: ProductHistoryEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const restoredProduct = await ProductHistoryService.restoreVersion(user.id, entry)
      
      toast({
        title: 'Version restaurée',
        description: 'Le produit a été restauré avec succès',
      })

      if (onRestore) {
        onRestore(restoredProduct)
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to restore:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer cette version',
        variant: 'destructive',
      })
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Plus className="h-4 w-4" />
      case 'updated':
        return <Edit className="h-4 w-4" />
      case 'deleted':
        return <Trash2 className="h-4 w-4" />
      case 'restored':
        return <RotateCcw className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'updated':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'deleted':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'restored':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getChangeLabel = (type: string) => {
    switch (type) {
      case 'created':
        return 'Créé'
      case 'updated':
        return 'Modifié'
      case 'deleted':
        return 'Supprimé'
      case 'restored':
        return 'Restauré'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique de {productName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-20" />
              <p>Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`${getChangeColor(entry.change_type)} flex items-center gap-1`}
                      >
                        {getChangeIcon(entry.change_type)}
                        {getChangeLabel(entry.change_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'PPp', { locale: getDateFnsLocale() })}
                      </span>
                    </div>

                    {index > 0 && entry.change_type !== 'deleted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(entry)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </Button>
                    )}
                  </div>

                  {entry.changed_fields.length > 0 && entry.changed_fields[0] !== 'all' && (
                    <div className="space-y-2">
                      {entry.changed_fields.map((field) => (
                        <div
                          key={field}
                          className="bg-muted/50 rounded p-3 text-sm"
                        >
                          <div className="font-medium mb-1 text-foreground">
                            {ProductHistoryService.formatFieldLabel(field)}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {entry.previous_values?.[field] !== undefined && (
                              <>
                                <span className="line-through opacity-70">
                                  {ProductHistoryService.formatValue(
                                    field,
                                    entry.previous_values[field]
                                  )}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                            <span className="text-foreground font-medium">
                              {ProductHistoryService.formatValue(
                                field,
                                entry.new_values?.[field]
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.change_type === 'created' && (
                    <div className="text-sm text-muted-foreground">
                      Produit créé avec tous les champs initiaux
                    </div>
                  )}

                  {entry.changed_by_email && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Par {entry.changed_by_email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
