import { BTSWholesalerTestConnection } from '@/components/suppliers/BTSWholesalerTestConnection'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BTSWholesalerTest() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/suppliers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Test Connexion BTSWholesaler</h1>
          <p className="text-muted-foreground">
            Testez votre connexion API et importez les produits
          </p>
        </div>
      </div>

      <BTSWholesalerTestConnection />

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Comment obtenir votre JWT Token ?</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Connectez-vous à votre compte BTSWholesaler</li>
          <li>Allez dans la section <strong>API</strong></li>
          <li>Cliquez sur <strong>"Créer Service de Compte"</strong></li>
          <li>Copiez le <strong>JWT Token</strong> généré</li>
          <li>Collez-le dans le champ ci-dessus et cliquez sur "Tester et Importer"</li>
        </ol>

        <div className="mt-4 p-4 bg-background rounded border">
          <h3 className="font-semibold mb-2">Fonctionnalités v2.0 :</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>✅ Pagination automatique (max 500 produits/page)</li>
            <li>✅ Support de tous les formats (JSON, XML, CSV)</li>
            <li>✅ Support multi-langues (FR, EN, ES, IT, DE)</li>
            <li>✅ Import par batch de 100 produits</li>
            <li>✅ Gestion complète des métadonnées (EAN, brand, catégories)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
