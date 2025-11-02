import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CSVImportWizard } from './CSVImportWizard'
import { APIImportWizard } from './APIImportWizard'
import { XMLImportWizard } from './XMLImportWizard'
import { FTPImportWizard } from './FTPImportWizard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Code, FileCode, Server } from 'lucide-react'

export interface ImportSource {
  id: string
  name: string
  category: string
  logo: string
  description: string
  importType?: 'csv' | 'api' | 'xml' | 'ftp'
}

interface SourceConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: ImportSource | null
}

type ImportType = 'csv' | 'api' | 'xml' | 'ftp'

const IMPORT_METHODS: Array<{
  type: ImportType
  label: string
  description: string
  icon: any
}> = [
  {
    type: 'csv',
    label: 'CSV/Excel',
    description: 'Importer depuis un fichier CSV ou Excel',
    icon: FileText
  },
  {
    type: 'api',
    label: 'API REST',
    description: 'Connexion directe via API REST',
    icon: Code
  },
  {
    type: 'xml',
    label: 'XML',
    description: 'Importer depuis un fichier XML',
    icon: FileCode
  },
  {
    type: 'ftp',
    label: 'FTP/SFTP',
    description: 'Connexion FTP ou SFTP',
    icon: Server
  }
]

export function SourceConfigurationDialog({ 
  open, 
  onOpenChange, 
  source 
}: SourceConfigurationDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<ImportType | null>(null)

  if (!source) return null

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const renderMethodSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {IMPORT_METHODS.map((method) => {
        const Icon = method.icon
        return (
          <Card 
            key={method.type}
            className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
            onClick={() => setSelectedMethod(method.type)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{method.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderImportWizard = () => {
    switch (selectedMethod) {
      case 'csv':
        return <CSVImportWizard />
      
      case 'api':
        return <APIImportWizard />
      
      case 'xml':
        return <XMLImportWizard />
      
      case 'ftp':
        return <FTPImportWizard />
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSelectedMethod(null)
      }
      onOpenChange(isOpen)
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{source.logo}</span>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-1">
                Import depuis {source.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{source.category}</Badge>
                {selectedMethod && (
                  <Badge>
                    {IMPORT_METHODS.find(m => m.type === selectedMethod)?.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {source.description}
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          {!selectedMethod ? (
            <>
              <h3 className="text-lg font-semibold mb-4 px-4">
                Choisissez votre méthode d'import
              </h3>
              {renderMethodSelection()}
            </>
          ) : (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBack}
                className="ml-4"
              >
                ← Changer de méthode
              </Button>
              {renderImportWizard()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
