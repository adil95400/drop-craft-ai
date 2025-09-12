import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

export function ProductSEO() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Optimisation SEO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Outils d'optimisation SEO à venir...</p>
      </CardContent>
    </Card>
  )
}