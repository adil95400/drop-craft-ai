import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export function ProductTemplates() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Modèles de Produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Modèles de produits à venir...</p>
      </CardContent>
    </Card>
  )
}