import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CSVImportWizard } from './CSVImportWizard'
import { APIImportWizard } from './APIImportWizard'
import { XMLImportWizard } from './XMLImportWizard'
import { FTPImportWizard } from './FTPImportWizard'
import { Badge } from '@/components/ui/badge'

export interface ImportSource {
  id: string
  name: string
  category: string
  logo: string
  description: string
  importType: 'csv' | 'api' | 'xml' | 'ftp' | 'excel'
}

interface SourceConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: ImportSource | null
}

// Mapping des sources vers leurs types d'import préférés
const SOURCE_IMPORT_MAPPING: Record<string, 'csv' | 'api' | 'xml' | 'ftp' | 'excel'> = {
  // Marketplaces - généralement API
  'amazon': 'api',
  'ebay': 'api',
  'aliexpress': 'api',
  'alibaba': 'api',
  'walmart': 'api',
  
  // Platforms e-commerce - API REST
  'shopify': 'api',
  'woocommerce': 'api',
  'magento': 'api',
  'prestashop': 'api',
  
  // Dropshipping - API
  'oberlo': 'api',
  'spocket': 'api',
  'modalyst': 'api',
  'printful': 'api',
  
  // Wholesalers - CSV ou API
  'wholesale2b': 'csv',
  'salehoo': 'csv',
  'doba': 'api',
  
  // Niche marketplaces
  'etsy': 'api',
  'wish': 'api',
  'cdiscount': 'api',
  'rakuten': 'api'
}

const IMPORT_TYPE_LABELS: Record<string, string> = {
  'csv': 'CSV/Excel',
  'api': 'API REST',
  'xml': 'XML',
  'ftp': 'FTP/SFTP',
  'excel': 'Excel'
}

export function SourceConfigurationDialog({ 
  open, 
  onOpenChange, 
  source 
}: SourceConfigurationDialogProps) {
  if (!source) return null

  // Déterminer le type d'import à utiliser
  const importType = SOURCE_IMPORT_MAPPING[source.id] || 'api'

  const renderImportWizard = () => {
    switch (importType) {
      case 'csv':
      case 'excel':
        return <CSVImportWizard />
      
      case 'api':
        return <APIImportWizard />
      
      case 'xml':
        return <XMLImportWizard />
      
      case 'ftp':
        return <FTPImportWizard />
      
      default:
        return (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              Configuration d'import non disponible pour ce type de source
            </p>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{source.logo}</span>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-1">
                Configuration Import - {source.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{source.category}</Badge>
                <Badge>{IMPORT_TYPE_LABELS[importType]}</Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {source.description}
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          {renderImportWizard()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
