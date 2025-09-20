/**
 * PHASE 4: Workflow Builder
 * Constructeur visuel de workflows d'automatisation
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, Plus, ArrowRight, Settings,
  Zap, Mail, Database, Calculator
} from 'lucide-react'

export const WorkflowBuilder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Constructeur de Workflow</h1>
          <p className="text-muted-foreground">
            Créez des automatisations visuellement avec des blocs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Tester
          </Button>
        </div>
      </div>

      {/* Canvas de construction */}
      <Card>
        <CardHeader>
          <CardTitle>Canvas de Workflow</CardTitle>
          <CardDescription>Glissez-déposez les blocs pour créer votre automation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-4" />
                <p>Constructeur visuel de workflows</p>
                <p className="text-sm">Interface drag & drop à implémenter</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Palette de blocs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blocs de déclenchement</CardTitle>
            <CardDescription>Événements qui démarrent le workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                { name: "Nouvelle commande", icon: Database, color: "bg-blue-500" },
                { name: "Stock faible", icon: Zap, color: "bg-orange-500" },
                { name: "Prix concurrent", icon: Calculator, color: "bg-purple-500" }
              ].map((block) => {
                const Icon = block.icon
                return (
                  <div key={block.name} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm cursor-pointer">
                    <div className={`w-8 h-8 ${block.color} rounded flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{block.name}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocs d'action</CardTitle>
            <CardDescription>Actions à exécuter dans le workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                { name: "Envoyer email", icon: Mail, color: "bg-green-500" },
                { name: "Ajuster prix", icon: Calculator, color: "bg-red-500" },
                { name: "Commander stock", icon: Database, color: "bg-indigo-500" }
              ].map((block) => {
                const Icon = block.icon
                return (
                  <div key={block.name} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm cursor-pointer">
                    <div className={`w-8 h-8 ${block.color} rounded flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{block.name}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}