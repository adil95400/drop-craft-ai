import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, Check, ChevronDown, ChevronUp, Package, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useMultiStoreImport, MultiStoreImportProgress } from '@/hooks/useMultiStoreImport'
import { Store as StoreType } from '@/hooks/useUnifiedStores'

interface MultiStoreImportSelectorProps {
  className?: string
  showProgress?: boolean
  compact?: boolean
  onSelectionChange?: (storeIds: string[]) => void
}

const platformIcons: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🛒',
  prestashop: '🏪',
  magento: '🔶',
  bigcommerce: '📦',
  squarespace: '⬛',
  wix: '✨',
  etsy: '🎨',
  amazon: '📦',
  ebay: '🏷️'
}

function getPlatformIcon(platform: string): string {
  return platformIcons[platform?.toLowerCase()] || '🏪'
}

function StoreItem({ 
  store, 
  isSelected, 
  onToggle,
  isImporting,
  result
}: { 
  store: StoreType
  isSelected: boolean
  onToggle: () => void
  isImporting?: boolean
  result?: { success: boolean; error?: string }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        !store.is_active && "opacity-50"
      )}
      onClick={() => store.is_active && onToggle()}
    >
      <Checkbox 
        checked={isSelected} 
        disabled={!store.is_active || isImporting}
        className="pointer-events-none"
      />
      
      <Avatar className="h-8 w-8">
        <AvatarImage src={store.logo_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-lg">
          {getPlatformIcon(store.settings?.platform || store.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{store.name}</span>
          {store.is_main && (
            <Badge variant="secondary" className="text-xs">Principal</Badge>
          )}
        </div>
        {store.domain && (
          <span className="text-xs text-muted-foreground truncate block">
            {store.domain}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!store.is_active ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Inactif
          </Badge>
        ) : result ? (
          result.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )
        ) : isImporting ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Badge variant="outline" className="text-xs">
            {store.currency || 'EUR'}
          </Badge>
        )}
      </div>
    </motion.div>
  )
}

function ImportProgress({ progress }: { progress: MultiStoreImportProgress }) {
  if (progress.total === 0) return null

  const percentage = Math.round((progress.completed / progress.total) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 p-4 bg-muted/50 rounded-lg"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Import en cours...</span>
        <span className="text-muted-foreground">
          {progress.completed}/{progress.total}
        </span>
      </div>
      
      <Progress value={percentage} className="h-2" />
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>{progress.successful} réussi(s)</span>
        </div>
        {progress.failed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-destructive" />
            <span>{progress.failed} échec(s)</span>
          </div>
        )}
      </div>

      {progress.results.length > 0 && (
        <ScrollArea className="h-24">
          <div className="space-y-1">
            {progress.results.map((result, idx) => (
              <div 
                key={idx}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  result.success ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"
                )}
              >
                {result.storeName}: {result.success ? 'Importé' : result.error}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )
}

export function MultiStoreImportSelector({
  className,
  showProgress = true,
  compact = false,
  onSelectionChange
}: MultiStoreImportSelectorProps) {
  const [isOpen, setIsOpen] = useState(!compact)
  
  const {
    stores,
    selectedStoreIds,
    toggleStore,
    selectAllStores,
    deselectAllStores,
    isImporting,
    progress,
    selectedCount
  } = useMultiStoreImport()

  const activeStores = stores.filter(s => s.is_active)

  const handleToggle = (storeId: string) => {
    toggleStore(storeId)
    onSelectionChange?.(
      selectedStoreIds.includes(storeId)
        ? selectedStoreIds.filter(id => id !== storeId)
        : [...selectedStoreIds, storeId]
    )
  }

  const handleSelectAll = () => {
    selectAllStores()
    onSelectionChange?.(activeStores.map(s => s.id))
  }

  const handleDeselectAll = () => {
    deselectAllStores()
    onSelectionChange?.([])
  }

  if (stores.length === 0) {
    return (
      <div className={cn("p-4 border rounded-lg bg-muted/30", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Store className="h-5 w-5" />
          <div>
            <p className="font-medium">Aucune boutique connectée</p>
            <p className="text-sm">Connectez une boutique pour activer l'import multi-boutiques</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Import Multi-Boutiques</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCount > 0 
                    ? `${selectedCount} boutique(s) sélectionnée(s)` 
                    : 'Sélectionnez les boutiques cibles'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Badge variant="default">{selectedCount}</Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Quick actions */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {activeStores.length} boutique(s) disponible(s)
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isImporting}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Tout
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={isImporting}
                >
                  Aucun
                </Button>
              </div>
            </div>

            {/* Store list */}
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-4">
                <AnimatePresence>
                  {stores.map((store) => {
                    const result = progress.results.find(r => r.storeId === store.id)
                    return (
                      <StoreItem
                        key={store.id}
                        store={store}
                        isSelected={selectedStoreIds.includes(store.id)}
                        onToggle={() => handleToggle(store.id)}
                        isImporting={isImporting && selectedStoreIds.includes(store.id) && !result}
                        result={result}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Progress indicator */}
            {showProgress && (
              <AnimatePresence>
                {isImporting && <ImportProgress progress={progress} />}
              </AnimatePresence>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default MultiStoreImportSelector
