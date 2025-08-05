import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Edit, Eye, ShoppingCart } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ImportResult {
  id: string
  name: string
  price: number
  status: 'success' | 'warning' | 'error'
  issues?: string[]
  image_url?: string
  category?: string
  supplier?: string
}

interface ImportResultsProps {
  results: ImportResult[]
  onValidateAll: () => void
  onEditProduct: (id: string) => void
}

export const ImportResults = ({ results, onValidateAll, onEditProduct }: ImportResultsProps) => {
  if (results.length === 0) return null

  const successCount = results.filter(r => r.status === 'success').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Résultats de l'import</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50">
              <Check className="w-3 h-3 mr-1" />
              {successCount} Succès
            </Badge>
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50">
                ⚠️ {warningCount} Warnings
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="bg-red-50">
                <X className="w-3 h-3 mr-1" />
                {errorCount} Erreurs
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {results.length} produits traités
            </p>
            <Button onClick={onValidateAll} className="bg-primary">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Valider tous les produits
            </Button>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {result.image_url && (
                          <img 
                            src={result.image_url} 
                            alt={result.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{result.name}</div>
                          {result.category && (
                            <div className="text-sm text-muted-foreground">
                              {result.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">{result.price}€</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' :
                          result.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {result.status === 'success' && <Check className="w-3 h-3 mr-1" />}
                        {result.status === 'warning' && '⚠️'}
                        {result.status === 'error' && <X className="w-3 h-3 mr-1" />}
                        {result.status}
                      </Badge>
                      {result.issues && result.issues.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.issues.join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.supplier && (
                        <Badge variant="outline">{result.supplier}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEditProduct(result.id)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}