import React from 'react'
import { usePlan } from '@/hooks/usePlan'
import { ImportHub } from '@/components/import/ImportHub'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { ImportInterface } from '@/components/import/ImportInterface'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Import() {
  const { isUltraPro, hasPlan } = usePlan()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header unifié */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Import de Produits
                {isUltraPro && <Badge variant="secondary">Ultra Pro</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isUltraPro 
                  ? "Import intelligent avec IA et automation avancée"
                  : "Import de produits depuis vos fournisseurs"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <ImportHub />
      </div>
    </div>
  )
}