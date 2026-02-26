import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Zap, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { UnifiedIntegration } from '@/hooks/unified'

type Integration = UnifiedIntegration

interface AutoConfigWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platformName: string
  platformType: string
  onComplete: (integration: Integration) => void
}

interface ConfigStep {
  id: string
  title: string
  description: string
  fields: ConfigField[]
  validation?: (values: Record<string, string>) => Promise<{ valid: boolean; message?: string }>
}

interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder: string
  required: boolean
  helpText?: string
  helpLink?: string
}

const platformConfigs: Record<string, ConfigStep[]> = {
  shopify: [
    {
      id: 'credentials',
      title: 'Configuration Shopify',
      description: 'Entrez les informations de connexion de votre boutique',
      fields: [
        {
          name: 'shop_domain',
          label: 'Domaine de la boutique',
          type: 'text',
          placeholder: 'monshop.myshopify.com',
          required: true,
          helpText: 'Le domaine de votre boutique Shopify',
          helpLink: 'https://help.shopify.com/fr/manual/your-account/your-domain'
        },
        {
          name: 'api_key',
          label: 'Clé API',
          type: 'password',
          placeholder: 'Votre clé API Shopify',
          required: true,
          helpText: 'Disponible dans Paramètres > Applications et canaux de vente > Développer des applications',
          helpLink: 'https://help.shopify.com/fr/manual/apps/app-types/custom-apps'
        },
        {
          name: 'access_token',
          label: "Token d'accès Admin",
          type: 'password',
          placeholder: '••••••••••••••••',
          required: true,
          helpText: "Token d'accès à l'API Admin",
          helpLink: 'https://help.shopify.com/fr/manual/apps/app-types/custom-apps'
        }
      ],
      validation: async (values) => {
        // Test de connexion basique
        if (!values.shop_domain.includes('.myshopify.com')) {
          return { valid: false, message: 'Le domaine doit se terminer par .myshopify.com' }
        }
        return { valid: true }
      }
    },
    {
      id: 'sync_settings',
      title: 'Paramètres de synchronisation',
      description: 'Configurez la fréquence et les options de synchronisation',
      fields: []
    }
  ],
  woocommerce: [
    {
      id: 'credentials',
      title: 'Configuration WooCommerce',
      description: 'Connectez votre boutique WooCommerce',
      fields: [
        {
          name: 'platform_url',
          label: 'URL de la boutique',
          type: 'url',
          placeholder: 'https://monshop.com',
          required: true,
          helpText: "L'URL complète de votre boutique WordPress",
          helpLink: 'https://woocommerce.com/document/woocommerce-rest-api/'
        },
        {
          name: 'consumer_key',
          label: 'Consumer Key',
          type: 'password',
          placeholder: '••••••••••••••••',
          required: true,
          helpText: 'Disponible dans WooCommerce > Paramètres > Avancé > REST API',
          helpLink: 'https://woocommerce.com/document/woocommerce-rest-api/'
        },
        {
          name: 'consumer_secret',
          label: 'Consumer Secret',
          type: 'password',
          placeholder: '••••••••••••••••',
          required: true,
          helpText: 'Secret associé à la clé Consumer',
          helpLink: 'https://woocommerce.com/document/woocommerce-rest-api/'
        }
      ],
      validation: async (values) => {
        try {
          const url = new URL(values.platform_url)
          if (!url.protocol.startsWith('http')) {
            return { valid: false, message: "L'URL doit commencer par http:// ou https://" }
          }
          return { valid: true }
        } catch {
          return { valid: false, message: 'URL invalide' }
        }
      }
    }
  ],
  prestashop: [
    {
      id: 'credentials',
      title: 'Configuration PrestaShop',
      description: 'Connectez votre boutique PrestaShop',
      fields: [
        {
          name: 'platform_url',
          label: 'URL de la boutique',
          type: 'url',
          placeholder: 'https://monshop.com',
          required: true,
          helpText: "L'URL complète de votre boutique PrestaShop"
        },
        {
          name: 'api_key',
          label: 'Clé API',
          type: 'password',
          placeholder: 'Votre clé Webservice PrestaShop',
          required: true,
          helpText: 'Disponible dans Paramètres avancés > Webservice',
          helpLink: 'https://devdocs.prestashop-project.org/8/webservice/'
        }
      ]
    }
  ],
  amazon: [
    {
      id: 'credentials',
      title: 'Configuration Amazon',
      description: 'Connectez votre compte Amazon Seller',
      fields: [
        {
          name: 'seller_id',
          label: 'Seller ID',
          type: 'text',
          placeholder: 'Votre identifiant vendeur',
          required: true,
          helpText: 'Votre identifiant vendeur Amazon'
        },
        {
          name: 'mws_auth_token',
          label: 'MWS Auth Token',
          type: 'password',
          placeholder: '••••••••••••••••',
          required: true,
          helpText: 'Token MWS depuis Seller Central'
        },
        {
          name: 'aws_access_key',
          label: 'AWS Access Key',
          type: 'password',
          placeholder: '••••••••••••••••',
          required: true
        },
        {
          name: 'aws_secret_key',
          label: 'AWS Secret Key',
          type: 'password',
          placeholder: 'Votre clé secrète AWS',
          required: true
        }
      ]
    }
  ]
}

export function AutoConfigWizard({ open, onOpenChange, platformName, platformType, onComplete }: AutoConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const steps = platformConfigs[platformName] || []
  const currentStepConfig = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setFormData({})
      setValidationResult(null)
    }
  }, [open])

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    setValidationResult(null)
  }

  const validateCurrentStep = async () => {
    if (!currentStepConfig.validation) return true

    setIsValidating(true)
    try {
      const result = await currentStepConfig.validation(formData)
      setValidationResult(result)
      return result.valid
    } catch (error) {
      setValidationResult({ valid: false, message: 'Erreur de validation' })
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleNext = async () => {
    // Validate required fields
    const requiredFields = currentStepConfig.fields.filter(f => f.required)
    const missingFields = requiredFields.filter(f => !formData[f.name])
    
    if (missingFields.length > 0) {
      toast({
        title: 'Champs requis manquants',
        description: `Veuillez remplir: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    // Run custom validation
    const isValid = await validateCurrentStep()
    if (!isValid) return

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setValidationResult(null)
    }
  }

  const handleComplete = async () => {
    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Separate credentials from integration data
      const credentials: Record<string, string> = {}
      const integrationData: any = {
        user_id: user.id,
        platform_name: platformName,
        platform_type: platformType,
        connection_status: 'disconnected',
        is_active: false,
        sync_frequency: 'daily'
      }

      // Sort fields into credentials vs integration data
      currentStepConfig.fields.forEach(field => {
        const value = formData[field.name]
        if (value) {
          if (field.type === 'password' || field.name.includes('key') || field.name.includes('token')) {
            credentials[field.name] = value
          } else {
            integrationData[field.name] = value
          }
        }
      })

      // Create integration
      const { data: integration, error: insertError } = await supabase
        .from('integrations')
        .insert([integrationData])
        .select()
        .single()

      if (insertError) throw insertError

      // Store encrypted credentials if any
      if (Object.keys(credentials).length > 0) {
        const { error: credError } = await supabase.functions.invoke('secure-credentials', {
          body: {
            integrationId: integration.id,
            credentials,
            action: 'create'
          }
        })
        
        if (credError) {
          console.error('Failed to store credentials:', credError)
        }
      }

      toast({
        title: '✅ Configuration réussie',
        description: `${platformName} a été configuré avec succès`
      })

      onComplete(integration as unknown as Integration)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erreur de configuration',
        description: error.message || 'Impossible de créer l\'intégration',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!currentStepConfig) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration non disponible</DialogTitle>
            <DialogDescription>
              La configuration automatique n'est pas encore disponible pour cette plateforme.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Configuration automatique - {platformName}
          </DialogTitle>
          <DialogDescription>
            Étape {currentStep + 1} sur {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complété
            </p>
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{currentStepConfig.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepConfig.description}</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {currentStepConfig.fields.map(field => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                  {field.helpText && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{field.helpText}</span>
                      {field.helpLink && (
                        <a 
                          href={field.helpLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Aide <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                {validationResult.valid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <AlertDescription>
                  {validationResult.message || (validationResult.valid ? 'Validation réussie' : 'Validation échouée')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isValidating || isCreating}
          >
            Précédent
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isValidating || isCreating}
            >
              Annuler
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isValidating || isCreating}
            >
              {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentStep < steps.length - 1 ? 'Suivant' : 'Terminer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
