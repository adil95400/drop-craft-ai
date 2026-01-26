/**
 * CustomerImportMenu - Menu d'import multi-canaux
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Download, 
  Store, 
  FileSpreadsheet, 
  Upload,
  ChevronDown,
  ShoppingBag,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntegrationsUnified } from '@/hooks/unified/useIntegrationsUnified'

// Platform icons/colors
const platformConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  shopify: { 
    icon: <ShoppingBag className="h-4 w-4" />, 
    color: 'text-green-600',
    label: 'Shopify'
  },
  woocommerce: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-purple-600',
    label: 'WooCommerce'
  },
  prestashop: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-pink-600',
    label: 'PrestaShop'
  },
  magento: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-orange-600',
    label: 'Magento'
  },
  default: { 
    icon: <Globe className="h-4 w-4" />, 
    color: 'text-blue-600',
    label: 'Boutique'
  }
}

interface CustomerImportMenuProps {
  onImportFromShopify: () => void
  onImportFromCSV?: () => void
  onManualImport?: () => void
}

export function CustomerImportMenu({
  onImportFromShopify,
  onImportFromCSV,
  onManualImport
}: CustomerImportMenuProps) {
  const { connectedIntegrations } = useIntegrationsUnified()
  const [open, setOpen] = useState(false)

  const handleSelectPlatform = (platform: string) => {
    if (platform === 'shopify') {
      onImportFromShopify()
    }
    // Add other platform handlers as needed
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 backdrop-blur-sm bg-background/50 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Download className="h-4 w-4" />
          Importer
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Importer des clients</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Connected stores */}
        {connectedIntegrations.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Boutiques connectées
            </DropdownMenuLabel>
            {connectedIntegrations.map((integration) => {
              const config = platformConfig[integration.platform?.toLowerCase()] || platformConfig.default
              return (
                <DropdownMenuItem 
                  key={integration.id}
                  onClick={() => handleSelectPlatform(integration.platform)}
                  className="gap-2 cursor-pointer"
                >
                  <span className={config.color}>{config.icon}</span>
                  {integration.platform_name || config.label}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Manual options */}
        <DropdownMenuItem 
          onClick={onImportFromCSV}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          Importer depuis CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onManualImport}
          className="gap-2 cursor-pointer"
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          Import manuel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
