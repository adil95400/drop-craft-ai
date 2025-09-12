import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Grid3X3, Edit, Trash2, Copy, Download, Upload } from 'lucide-react'

interface ProductBulkOperationsProps {
  selectedProducts: string[]
  onClearSelection: () => void
}

export function ProductBulkOperations({ selectedProducts, onClearSelection }: ProductBulkOperationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Actions Groupées
          <Badge variant="secondary">{selectedProducts.length} sélectionnés</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Éditer en masse
        </Button>
        <Button size="sm" variant="outline">
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </Button>
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button size="sm" variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Désélectionner
        </Button>
      </CardContent>
    </Card>
  )
}