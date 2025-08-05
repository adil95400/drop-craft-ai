import { Plus, FileSpreadsheet, Globe, Image, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ImportHeaderProps {
  importCount: number
  onQuickImport: () => void
}

export const ImportHeader = ({ importCount, onQuickImport }: ImportHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import Produits</h1>
        <p className="text-muted-foreground mt-2">
          Importez vos produits depuis n'importe quelle source avec l'IA
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="bg-primary/10">
            <Zap className="w-3 h-3 mr-1" />
            IA Intégrée
          </Badge>
          <Badge variant="outline" className="bg-secondary/10">
            {importCount} produits importés
          </Badge>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Template CSV
        </Button>
        <Button onClick={onQuickImport} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Import Rapide
        </Button>
      </div>
    </div>
  )
}