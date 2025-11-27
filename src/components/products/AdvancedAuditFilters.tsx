import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface AuditFilters {
  // Qualité
  noImage: boolean
  singleImage: boolean
  noDescription: boolean
  shortDescription: boolean
  shortTitle: boolean
  longTitle: boolean
  duplicateTitle: boolean
  noMetaTitle: boolean
  noMetaDescription: boolean
  noGTIN: boolean
  noSKU: boolean
  noBrand: boolean
  
  // SEO
  seoScoreMax: number
  
  // Business
  noSalesInDays: number | null
  lowConversion: boolean
  outOfStock: boolean
  lowStock: boolean
  overstock: boolean
  
  // AI Shopping
  missingCriticalFields: boolean
}

interface AdvancedAuditFiltersProps {
  filters: AuditFilters
  onFilterChange: (filters: Partial<AuditFilters>) => void
  onReset: () => void
  activeCount: number
}

export function AdvancedAuditFilters({ filters, onFilterChange, onReset, activeCount }: AdvancedAuditFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔍 Filtres Avancés d'Audit</span>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser ({activeCount})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtres Qualité */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">📸 Qualité des Images</Label>
          <div className="space-y-2 pl-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noImage" 
                checked={filters.noImage}
                onCheckedChange={(checked) => onFilterChange({ noImage: !!checked })}
              />
              <label htmlFor="noImage" className="text-sm cursor-pointer">
                Produits sans image
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="singleImage" 
                checked={filters.singleImage}
                onCheckedChange={(checked) => onFilterChange({ singleImage: !!checked })}
              />
              <label htmlFor="singleImage" className="text-sm cursor-pointer">
                Produits avec 1 seule image
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">📝 Qualité du Contenu</Label>
          <div className="space-y-2 pl-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noDescription" 
                checked={filters.noDescription}
                onCheckedChange={(checked) => onFilterChange({ noDescription: !!checked })}
              />
              <label htmlFor="noDescription" className="text-sm cursor-pointer">
                Sans description
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="shortDescription" 
                checked={filters.shortDescription}
                onCheckedChange={(checked) => onFilterChange({ shortDescription: !!checked })}
              />
              <label htmlFor="shortDescription" className="text-sm cursor-pointer">
                Description trop courte (&lt;100 caractères)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="shortTitle" 
                checked={filters.shortTitle}
                onCheckedChange={(checked) => onFilterChange({ shortTitle: !!checked })}
              />
              <label htmlFor="shortTitle" className="text-sm cursor-pointer">
                Titre trop court (&lt;20 caractères)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="longTitle" 
                checked={filters.longTitle}
                onCheckedChange={(checked) => onFilterChange({ longTitle: !!checked })}
              />
              <label htmlFor="longTitle" className="text-sm cursor-pointer">
                Titre trop long (&gt;70 caractères)
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">🏷️ Données Produit</Label>
          <div className="space-y-2 pl-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noSKU" 
                checked={filters.noSKU}
                onCheckedChange={(checked) => onFilterChange({ noSKU: !!checked })}
              />
              <label htmlFor="noSKU" className="text-sm cursor-pointer">
                Sans SKU
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noGTIN" 
                checked={filters.noGTIN}
                onCheckedChange={(checked) => onFilterChange({ noGTIN: !!checked })}
              />
              <label htmlFor="noGTIN" className="text-sm cursor-pointer">
                Sans GTIN/EAN
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noBrand" 
                checked={filters.noBrand}
                onCheckedChange={(checked) => onFilterChange({ noBrand: !!checked })}
              />
              <label htmlFor="noBrand" className="text-sm cursor-pointer">
                Sans marque
              </label>
            </div>
          </div>
        </div>

        {/* Filtres SEO */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🎯 Filtres SEO</Label>
          <div className="space-y-3 pl-4">
            <div className="space-y-2">
              <Label htmlFor="seoScore" className="text-sm">
                Score SEO maximum: <Badge variant="secondary">{filters.seoScoreMax}</Badge>
              </Label>
              <Slider
                id="seoScore"
                min={0}
                max={100}
                step={10}
                value={[filters.seoScoreMax]}
                onValueChange={([value]) => onFilterChange({ seoScoreMax: value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noMetaTitle" 
                checked={filters.noMetaTitle}
                onCheckedChange={(checked) => onFilterChange({ noMetaTitle: !!checked })}
              />
              <label htmlFor="noMetaTitle" className="text-sm cursor-pointer">
                Sans meta title
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noMetaDescription" 
                checked={filters.noMetaDescription}
                onCheckedChange={(checked) => onFilterChange({ noMetaDescription: !!checked })}
              />
              <label htmlFor="noMetaDescription" className="text-sm cursor-pointer">
                Sans meta description
              </label>
            </div>
          </div>
        </div>

        {/* Filtres Business */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">💼 Filtres Business</Label>
          <div className="space-y-2 pl-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lowConversion" 
                checked={filters.lowConversion}
                onCheckedChange={(checked) => onFilterChange({ lowConversion: !!checked })}
              />
              <label htmlFor="lowConversion" className="text-sm cursor-pointer">
                Fort trafic, faible conversion
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="outOfStock" 
                checked={filters.outOfStock}
                onCheckedChange={(checked) => onFilterChange({ outOfStock: !!checked })}
              />
              <label htmlFor="outOfStock" className="text-sm cursor-pointer">
                En rupture de stock
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lowStock" 
                checked={filters.lowStock}
                onCheckedChange={(checked) => onFilterChange({ lowStock: !!checked })}
              />
              <label htmlFor="lowStock" className="text-sm cursor-pointer">
                Stock faible (&lt;10)
              </label>
            </div>
          </div>
        </div>

        {/* AI Shopping Readiness */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🤖 AI Shopping Readiness</Label>
          <div className="space-y-2 pl-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="missingCriticalFields" 
                checked={filters.missingCriticalFields}
                onCheckedChange={(checked) => onFilterChange({ missingCriticalFields: !!checked })}
              />
              <label htmlFor="missingCriticalFields" className="text-sm cursor-pointer">
                Champs critiques Google/ChatGPT manquants
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
