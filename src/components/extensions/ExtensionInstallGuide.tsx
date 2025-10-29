import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Chrome, Download, Settings, Key } from 'lucide-react'

export const ExtensionInstallGuide = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Chrome className="w-5 h-5 text-primary" />
          <CardTitle>Guide d'installation</CardTitle>
        </div>
        <CardDescription>
          Comment installer et utiliser l'extension Chrome
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Download className="w-4 h-4" />
          <AlertDescription>
            L'extension est disponible dans le dossier <code className="px-1 py-0.5 bg-muted rounded">public/chrome-extension</code>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Ouvrir Chrome</h4>
              <p className="text-sm text-muted-foreground">
                Accédez à <code className="px-1 py-0.5 bg-muted rounded">chrome://extensions</code> dans votre navigateur
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Activer le mode développeur</h4>
              <p className="text-sm text-muted-foreground">
                Activez l'option "Mode développeur" en haut à droite
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Charger l'extension</h4>
              <p className="text-sm text-muted-foreground">
                Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier <code className="px-1 py-0.5 bg-muted rounded">public/chrome-extension</code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold mb-1">Générer un token</h4>
              <p className="text-sm text-muted-foreground">
                Utilisez l'onglet "Authentification" pour générer un token
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              5
            </div>
            <div>
              <h4 className="font-semibold mb-1">Connecter l'extension</h4>
              <p className="text-sm text-muted-foreground">
                Cliquez sur l'icône de l'extension et collez votre token pour vous connecter
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              6
            </div>
            <div>
              <h4 className="font-semibold mb-1">Commencer à scraper</h4>
              <p className="text-sm text-muted-foreground">
                Visitez Amazon, AliExpress ou eBay et cliquez sur le bouton qui apparaît pour scraper les produits
              </p>
            </div>
          </div>
        </div>

        <Alert className="mt-4">
          <Settings className="w-4 h-4" />
          <AlertDescription>
            <strong>Plateformes supportées:</strong> Amazon, AliExpress, eBay
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
