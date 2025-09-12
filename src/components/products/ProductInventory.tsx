import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Warehouse } from 'lucide-react'

export function ProductInventory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Gestion des Stocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Gestion avancée des stocks à venir...</p>
      </CardContent>
    </Card>
  )
}