import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { BrowserExtensionImportInterface } from '@/components/import/BrowserExtensionImportInterface'
import { productionLogger } from '@/utils/productionLogger'

interface ImportJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceType: string
  onJobCreated: () => void
}

export function ImportJobDialog({ open, onOpenChange, sourceType, onJobCreated }: ImportJobDialogProps) {
  const { createImportJob } = useUnifiedSystem()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    source_url: '',
    file_data: null,
    mapping_config: null,
    scheduled_at: ''
  })

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'csv': return 'Fichier CSV'
      case 'url': return 'URL / Scraping'
      case 'api': return 'API / EDI'
      case 'database': return 'Base de données'
      case 'extension': return 'Extension Navigateur'
      default: return type.toUpperCase()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const jobData = {
        source_type: sourceType,
        source_url: formData.source_url || null,
        file_data: formData.file_data,
        mapping_config: formData.mapping_config,
        scheduled_at: formData.scheduled_at || new Date().toISOString(),
        status: 'pending'
      }

      const { data, error } = await createImportJob(jobData)
      
      if (error) throw error

      toast({
        title: "Succès",
        description: `Job d'import ${getSourceTypeLabel(sourceType)} créé avec succès`
      })

      setFormData({
        source_url: '',
        file_data: null,
        mapping_config: null,
        scheduled_at: ''
      })
      
      onJobCreated()
      onOpenChange(false)
    } catch (error) {
      productionLogger.error('Import job creation failed', error as Error, 'ImportJobDialog');
      toast({
        title: "Erreur",
        description: "Impossible de créer le job d'import",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sourceType === 'extension' ? "max-w-7xl max-h-[90vh] overflow-y-auto" : "sm:max-w-[500px]"}>
        <DialogHeader>
          <DialogTitle>Nouvel Import {getSourceTypeLabel(sourceType)}</DialogTitle>
          {sourceType !== 'extension' && (
            <DialogDescription>
              Configurez votre import depuis {getSourceTypeLabel(sourceType).toLowerCase()}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {sourceType === 'extension' ? (
          <BrowserExtensionImportInterface />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {sourceType === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="source_url">URL Source *</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  placeholder="https://example.com/products"
                  required
                />
              </div>
            )}
            
            {sourceType === 'api' && (
              <div className="space-y-2">
                <Label htmlFor="source_url">Endpoint API *</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  placeholder="https://api.supplier.com/products"
                  required
                />
              </div>
            )}

            {sourceType === 'csv' && (
              <div className="space-y-2">
                <Label htmlFor="file">Fichier CSV</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData(prev => ({ 
                        ...prev, 
                        file_data: { name: file.name, size: file.size } as any 
                      }))
                    }
                  }}
                />
              </div>
            )}

            {sourceType === 'database' && (
              <div className="space-y-2">
                <Label htmlFor="source_url">Chaîne de connexion *</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  placeholder="postgresql://user:password@host:port/database"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Planification (optionnel)</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le job'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}