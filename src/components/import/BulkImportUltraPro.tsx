/**
 * Composant Import en Masse Ultra Pro
 * Interface complète pour importer des centaines de produits via URLs
 */

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database, Clock, CheckCircle, Target, Link, Sparkles,
  AlertCircle, Trash2, Play, Pause, X, Package,
  ShoppingBag, Store, Globe, Zap, Eye, ArrowRight
} from 'lucide-react'
import { useBulkImport } from '@/hooks/useBulkImport'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BulkImportUltraProProps {
  onSuccess?: () => void
}

interface ParsedUrl {
  url: string
  platform: string
  isValid: boolean
  productId?: string
}

const platformConfigs: Record<string, { name: string; icon: any; color: string; pattern: RegExp }> = {
  aliexpress: {
    name: 'AliExpress',
    icon: ShoppingBag,
    color: 'text-orange-500',
    pattern: /aliexpress\.com/i
  },
  amazon: {
    name: 'Amazon',
    icon: Package,
    color: 'text-amber-500',
    pattern: /amazon\.(com|fr|de|co\.uk|es|it)/i
  },
  ebay: {
    name: 'eBay',
    icon: Store,
    color: 'text-blue-500',
    pattern: /ebay\.(com|fr|de|co\.uk)/i
  },
  temu: {
    name: 'Temu',
    icon: ShoppingBag,
    color: 'text-orange-600',
    pattern: /temu\.com/i
  },
  cjdropshipping: {
    name: 'CJ Dropshipping',
    icon: Package,
    color: 'text-purple-500',
    pattern: /cjdropshipping\.com/i
  },
  banggood: {
    name: 'Banggood',
    icon: Store,
    color: 'text-red-500',
    pattern: /banggood\.com/i
  },
  wish: {
    name: 'Wish',
    icon: ShoppingBag,
    color: 'text-cyan-500',
    pattern: /wish\.com/i
  },
  other: {
    name: 'Autre',
    icon: Globe,
    color: 'text-gray-500',
    pattern: /.*/
  }
}

const detectPlatform = (url: string): string => {
  for (const [key, config] of Object.entries(platformConfigs)) {
    if (key !== 'other' && config.pattern.test(url)) {
      return key
    }
  }
  return 'other'
}

const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const BulkImportUltraPro: React.FC<BulkImportUltraProProps> = ({ onSuccess }) => {
  const { startBulkImport, isImporting, progress, cancelImport } = useBulkImport()
  
  const [urlsText, setUrlsText] = useState('')
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([])
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [autoPublish, setAutoPublish] = useState(false)
  const [targetStore, setTargetStore] = useState('default')
  const [showPreview, setShowPreview] = useState(false)

  const parseUrls = useCallback((text: string): ParsedUrl[] => {
    const lines = text.split(/[\n,;]+/).map(line => line.trim()).filter(Boolean)
    const urls: ParsedUrl[] = []
    
    for (const line of lines) {
      const isValid = validateUrl(line)
      const platform = isValid ? detectPlatform(line) : 'other'
      
      urls.push({
        url: line,
        platform,
        isValid,
        productId: isValid ? line.split('/').pop()?.split('?')[0] : undefined
      })
    }
    
    return urls
  }, [])

  const handleUrlsChange = (text: string) => {
    setUrlsText(text)
    const parsed = parseUrls(text)
    setParsedUrls(parsed)
    setShowPreview(parsed.length > 0)
  }

  const handleClearUrls = () => {
    setUrlsText('')
    setParsedUrls([])
    setShowPreview(false)
  }

  const handleRemoveUrl = (index: number) => {
    const newParsed = [...parsedUrls]
    newParsed.splice(index, 1)
    setParsedUrls(newParsed)
    setUrlsText(newParsed.map(u => u.url).join('\n'))
  }

  const handleBulkImport = async () => {
    const validUrls = parsedUrls.filter(u => u.isValid)
    
    if (validUrls.length === 0) {
      toast.error('Aucune URL valide à importer')
      return
    }

    try {
      // Convert URLs to products format for the hook
      const products = validUrls.map(u => ({
        source_url: u.url,
        platform: u.platform,
      }))

      await startBulkImport(products, 'url', {
        auto_optimize: autoOptimize,
        auto_publish: autoPublish,
        target_store: targetStore
      })
      
      // Reset form after starting import
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const validCount = parsedUrls.filter(u => u.isValid).length
  const invalidCount = parsedUrls.filter(u => !u.isValid).length
  const platformStats = parsedUrls.reduce((acc, u) => {
    if (u.isValid) {
      acc[u.platform] = (acc[u.platform] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Progress indicator when importing */}
      {isImporting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Database className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">Import en cours...</p>
                      <p className="text-sm text-muted-foreground">
                        {validCount} produits en cours de traitement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {Math.round(progress)}%
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelImport}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Import Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Importer des produits par URL
          </CardTitle>
          <CardDescription>
            Collez jusqu'à 500 URLs de produits (une par ligne ou séparées par des virgules)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="urls-input">URLs des produits</Label>
              {parsedUrls.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearUrls}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Effacer tout
                </Button>
              )}
            </div>
            <Textarea
              id="urls-input"
              value={urlsText}
              onChange={(e) => handleUrlsChange(e.target.value)}
              placeholder={`https://www.aliexpress.com/item/123456789.html
https://www.amazon.fr/dp/B08XYZ1234
https://www.ebay.com/itm/987654321
...`}
              className="min-h-[200px] font-mono text-sm resize-y"
              disabled={isImporting}
            />
            <div className="flex items-center gap-4 text-sm">
              {parsedUrls.length > 0 && (
                <>
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    {validCount} URL{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''}
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {invalidCount} invalide{invalidCount > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Platform Stats */}
          {showPreview && validCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <Label>Plateformes détectées</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformStats).map(([platform, count]) => {
                  const config = platformConfigs[platform]
                  return (
                    <Badge 
                      key={platform} 
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1"
                    >
                      <config.icon className={cn("w-4 h-4", config.color)} />
                      {config.name}
                      <span className="ml-1 px-1.5 py-0.5 bg-background/50 rounded text-xs">
                        {count}
                      </span>
                    </Badge>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Options d'import
              </h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-optimize">Auto-optimisation IA</Label>
                  <p className="text-xs text-muted-foreground">
                    Optimise automatiquement les titres et descriptions
                  </p>
                </div>
                <Switch
                  id="auto-optimize"
                  checked={autoOptimize}
                  onCheckedChange={setAutoOptimize}
                  disabled={isImporting}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-publish">Publication automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Publie les produits dès qu'ils sont importés
                  </p>
                </div>
                <Switch
                  id="auto-publish"
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                  disabled={isImporting}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Destination
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="target-store">Boutique cible</Label>
                <Select value={targetStore} onValueChange={setTargetStore} disabled={isImporting}>
                  <SelectTrigger id="target-store">
                    <SelectValue placeholder="Sélectionner une boutique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Boutique par défaut</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && validCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <Label>Aperçu ({Math.min(validCount, 5)} sur {validCount})</Label>
                {validCount > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{validCount - 5} autres
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {parsedUrls.filter(u => u.isValid).slice(0, 5).map((parsed, idx) => {
                  const config = platformConfigs[parsed.platform]
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                    >
                      <div className={cn("p-1.5 rounded", `bg-${config.color.split('-')[1]}-500/10`)}>
                        <config.icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{parsed.url}</p>
                        <p className="text-xs text-muted-foreground">{config.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveUrl(parsedUrls.indexOf(parsed))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleBulkImport}
              disabled={isImporting || validCount === 0}
              className="flex-1"
              size="lg"
            >
              {isImporting ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Import en cours... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Importer {validCount > 0 ? `${validCount} produit${validCount > 1 ? 's' : ''}` : 'les produits'}
                </>
              )}
            </Button>
            
            {validCount > 0 && !isImporting && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-5 h-5 mr-2" />
                {showPreview ? 'Masquer' : 'Aperçu'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
