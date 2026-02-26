import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, ArrowLeft, TestTube } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

const shopifySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  shop_domain: z.string().min(1, 'Le domaine est requis'),
  access_token: z.string().min(1, 'Le token est requis'),
  domain: z.string().optional()
})

type ShopifyFormData = z.infer<typeof shopifySchema>

interface PlatformConnectionFormProps {
  platform: string
  onConnect: (data: any) => void
  onCancel: () => void
}

export function PlatformConnectionForm({ platform, onConnect, onCancel }: PlatformConnectionFormProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const form = useForm<ShopifyFormData>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      name: '',
      shop_domain: '',
      access_token: '',
      domain: ''
    }
  })

  const testConnection = async () => {
    const values = form.getValues()
    
    if (!values.shop_domain || !values.access_token) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir le domaine et le token d'accès",
        variant: "destructive"
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('shopify-operations', {
        body: {
          operation: 'test_connection',
          platform: 'shopify',
          credentials: {
            shop_domain: values.shop_domain.replace('.myshopify.com', ''),
            access_token: values.access_token
          }
        }
      })

      if (error) {
        throw error
      }

      if (data?.success) {
        const shopName = data.shop?.name || 'Boutique Shopify'
        const successMessage = `✅ Connexion réussie à ${shopName}`
        setTestResult({ success: true, message: successMessage })
        toast({
          title: "✅ Test réussi",
          description: successMessage,
          duration: 5000
        })
      } else {
        const errorMessage = data?.error || 'Test de connexion échoué'
        setTestResult({ success: false, message: errorMessage })
        toast({
          title: "❌ Test échoué",
          description: errorMessage,
          variant: "destructive",
          duration: 8000
        })
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      
      // Enhanced error messages based on the error type
      let errorMessage = 'Une erreur inattendue s\'est produite'
      if (error instanceof Error) {
        if (error.message.includes('non-2xx status code')) {
          errorMessage = '🔧 Erreur de serveur. Vérifiez le format de votre domaine (sans https://)'
        } else if (error.message.includes('Network')) {
          errorMessage = '🌐 Problème de réseau. Vérifiez votre connexion internet.'
        } else if (error.message.includes('Token d\'accès invalide')) {
          errorMessage = '🔑 Token d\'accès invalide. Générez un nouveau token dans votre admin Shopify.'
        } else if (error.message.includes('Boutique introuvable')) {
          errorMessage = '🏪 Boutique introuvable. Vérifiez le domaine de votre boutique.'
        } else {
          errorMessage = error.message
        }
      }
      
      setTestResult({ success: false, message: errorMessage })
      toast({
        title: "❌ Erreur de test",
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      })
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: ShopifyFormData) => {
    setIsConnecting(true)
    
    try {
      const connectionData = {
        name: data.name,
        platform,
        domain: data.domain || `${data.shop_domain.replace('.myshopify.com', '')}.myshopify.com`,
        credentials: {
          shop_domain: data.shop_domain.replace('.myshopify.com', ''),
          access_token: data.access_token
        }
      }

      await onConnect(connectionData)
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (platform === 'shopify') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="text-xl font-semibold">Configuration Shopify</h3>
            <p className="text-muted-foreground">
              Connectez votre boutique Shopify en utilisant votre API privée
            </p>
          </div>
        </div>

        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            Pour connecter Shopify, créez une application privée dans votre admin Shopify.{' '}
            <a 
              href="https://help.shopify.com/en/manual/apps/private-apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Voir le guide →
            </a>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de connexion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la boutique</FormLabel>
                      <FormControl>
                        <Input placeholder="Ma Boutique Shopify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop_domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domaine Shopify</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="mon-magasin.myshopify.com" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="access_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token d'accès privé</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="••••••••••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domaine personnalisé (optionnel)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="monboutique.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {testResult && (
                  <Alert variant={testResult.success ? 'default' : 'destructive'}>
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTesting || isConnecting}
                    className="gap-2"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        Tester la connexion
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isConnecting || isTesting}
                    className="gap-2 flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      'Connecter la boutique'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        La configuration pour {platform} sera bientôt disponible
      </p>
      <Button variant="outline" onClick={onCancel} className="mt-4">
        Retour
      </Button>
    </div>
  )
}