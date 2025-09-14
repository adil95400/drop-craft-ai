import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileText, Globe, Database, Sparkles, Upload, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealProducts } from '@/hooks/useRealProducts'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImportMethod = 'csv' | 'url' | 'api' | 'ai'

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const { toast } = useToast()
  const { addProduct } = useRealProducts()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>('csv')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setImportProgress(i)
    }

    toast({
      title: "Import réussi !",
      description: "10 produits ont été importés avec succès"
    })
    
    setIsImporting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des Produits</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label>Fichier CSV</Label>
                  <Input type="file" accept=".csv" />
                </div>
                
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importation en cours...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Démarrer l'import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}