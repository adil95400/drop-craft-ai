import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { unifiedImportService } from '@/services/UnifiedImportService'
import { Loader2 } from 'lucide-react'

interface ImportConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  method: {
    id: string
    title: string
    description: string
  }
}

export const ImportConfigModal = ({ open, onOpenChange, method }: ImportConfigModalProps) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    url: '',
    autoOptimize: true,
    extractImages: true,
    generateSeo: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!config.url) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      await unifiedImportService.startImport({
        source_type: method.id as any,
        source_url: config.url,
        configuration: {
          auto_optimize: config.autoOptimize,
          extract_images: config.extractImages,
          generate_seo: config.generateSeo
        }
      })

      toast({
        title: "Import démarré",
        description: "L'import a été lancé avec succès"
      })
      
      onOpenChange(false)
      setConfig({ url: '', autoOptimize: true, extractImages: true, generateSeo: false })
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Erreur",
        description: error.message || "Échec du démarrage de l'import",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{method.title}</DialogTitle>
            <DialogDescription>{method.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL source *</Label>
              <Input
                id="url"
                placeholder="https://example.com/product"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Optimisation automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Optimise les prix et descriptions
                  </p>
                </div>
                <Switch
                  checked={config.autoOptimize}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, autoOptimize: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Extraire les images</Label>
                  <p className="text-xs text-muted-foreground">
                    Télécharge toutes les images produit
                  </p>
                </div>
                <Switch
                  checked={config.extractImages}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, extractImages: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Générer SEO</Label>
                  <p className="text-xs text-muted-foreground">
                    Crée meta descriptions optimisées
                  </p>
                </div>
                <Switch
                  checked={config.generateSeo}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, generateSeo: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Démarrer l'import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
