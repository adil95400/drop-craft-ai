import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export function ProductSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramètres Produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Configuration des paramètres produits à venir...</p>
      </CardContent>
    </Card>
  )
}