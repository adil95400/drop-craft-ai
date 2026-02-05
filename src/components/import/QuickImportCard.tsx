/**
 * Composant d'import rapide utilisant le Gateway unifié
 * Design moderne avec détection automatique de source
 */

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Link, FileSpreadsheet, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useImportGateway } from '@/hooks/useImportGateway'
import { cn } from '@/lib/utils'

interface QuickImportCardProps {
  onImportComplete?: () => void
  className?: string
}

export const QuickImportCard = memo(function QuickImportCard({
  onImportComplete,
  className
}: QuickImportCardProps) {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<'url' | 'file'>('url')
  
  const {
    isImporting,
    progress,
    status,
    importedProducts,
    error,
    importFromUrl,
    saveToDatabase,
    reset
  } = useImportGateway()

  const handleUrlImport = useCallback(async () => {
    if (!url.trim()) return
    
    const result = await importFromUrl(url.trim())
    
    if (result.success && result.products && result.products.length > 0) {
      // Auto-save to database
      await saveToDatabase(result.products)
      onImportComplete?.()
    }
  }, [url, importFromUrl, saveToDatabase, onImportComplete])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isImporting) {
      handleUrlImport()
    }
  }, [handleUrlImport, isImporting])

  const getSourceBadge = () => {
    if (!url) return null
    
    const lowUrl = url.toLowerCase()
    if (lowUrl.includes('aliexpress')) return { label: 'AliExpress', color: 'bg-orange-500' }
    if (lowUrl.includes('temu')) return { label: 'Temu', color: 'bg-orange-600' }
    if (lowUrl.includes('amazon')) return { label: 'Amazon', color: 'bg-yellow-600' }
    if (lowUrl.includes('ebay')) return { label: 'eBay', color: 'bg-blue-600' }
    if (lowUrl.includes('shopify') || lowUrl.includes('myshopify')) return { label: 'Shopify', color: 'bg-green-600' }
    if (lowUrl.includes('etsy')) return { label: 'Etsy', color: 'bg-orange-500' }
    return { label: 'Autre', color: 'bg-muted' }
  }

  const sourceBadge = getSourceBadge()

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import Rapide
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={mode === 'url' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('url')}
              className="h-7 px-2"
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={mode === 'file' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('file')}
              className="h-7 px-2"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {mode === 'url' ? (
                <div className="relative">
                  <Input
                    placeholder="Collez l'URL du produit (AliExpress, Amazon, Shopify...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isImporting}
                    className="pr-24"
                  />
                  {sourceBadge && url && (
                    <Badge 
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs",
                        sourceBadge.color
                      )}
                    >
                      {sourceBadge.label}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Glissez un fichier CSV, XML ou JSON
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUrlImport}
                  disabled={isImporting || !url.trim()}
                  className="flex-1 gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importer
                </Button>
                
                {status === 'error' && (
                  <Button variant="outline" onClick={reset}>
                    Réessayer
                  </Button>
                )}
              </div>

              {status === 'error' && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </motion.div>
          ) : status === 'processing' ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Import en cours...</span>
                <span className="ml-auto text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          ) : status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">
                    Import réussi !
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {importedProducts.length} produit(s) importé(s)
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Package className="h-3 w-3" />
                  {importedProducts.length}
                </Badge>
              </div>
              
              <Button variant="outline" onClick={reset} className="w-full">
                Nouvel import
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Quick tips */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Sources supportées : AliExpress, Temu, Amazon, eBay, Shopify, Etsy, CSV, XML
          </p>
        </div>
      </CardContent>
    </Card>
  )
})
