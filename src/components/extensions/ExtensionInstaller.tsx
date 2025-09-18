import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  X,
  Star,
  Users,
  Calendar,
  HardDrive
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ExtensionDetails {
  id: string
  name: string
  description: string
  short_description: string
  category: string
  developer_name: string
  developer_verified: boolean
  version: string
  rating: number
  reviews_count: number
  downloads_count: number
  price: number
  screenshots: string[]
  features: string[]
  permissions: string[]
  compatibility: string[]
  size_mb: number
  trending: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

interface ExtensionInstallerProps {
  extension: ExtensionDetails
  onClose: () => void
  onInstallComplete?: () => void
}

interface InstallationStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  description: string
}

export const ExtensionInstaller: React.FC<ExtensionInstallerProps> = ({
  extension,
  onClose,
  onInstallComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [acceptedPermissions, setAcceptedPermissions] = useState(false)
  const [installationProgress, setInstallationProgress] = useState(0)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installationSteps] = useState<InstallationStep[]>([
    {
      id: '1',
      name: 'Vérification des permissions',
      status: 'pending',
      progress: 0,
      description: 'Validation des permissions requises'
    },
    {
      id: '2', 
      name: 'Téléchargement',
      status: 'pending',
      progress: 0,
      description: 'Téléchargement des fichiers d\'extension'
    },
    {
      id: '3',
      name: 'Installation',
      status: 'pending', 
      progress: 0,
      description: 'Installation et configuration'
    },
    {
      id: '4',
      name: 'Activation',
      status: 'pending',
      progress: 0,
      description: 'Activation de l\'extension'
    }
  ])
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Install extension mutation
  const installExtensionMutation = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Check if extension is already installed
      const { data: existing } = await supabase
        .from('user_extensions')
        .select('id')
        .eq('extension_id', extension.id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        throw new Error('Extension déjà installée')
      }

      // Create purchase record if paid extension
      if (extension.price > 0) {
        const { error: purchaseError } = await supabase
          .from('extension_purchases')
          .insert({
            user_id: user.id,
            extension_id: extension.id,
            price: extension.price,
            currency: 'EUR',
            status: 'completed',
            commission_rate: 30,
            commission_amount: extension.price * 0.3,
            developer_amount: extension.price * 0.7,
            completed_at: new Date().toISOString()
          })

        if (purchaseError) throw purchaseError
      }

      // Install extension
      const { data, error } = await supabase
        .from('user_extensions')
        .insert({
          user_id: user.id,
          extension_id: extension.id,
          version: extension.version,
          status: 'active',
          configuration: {},
          installed_at: new Date().toISOString(),
          usage_count: 0
        })
        .select()
        .single()

      if (error) throw error

      // Update download count using marketplace_extensions table
      const { data: extensionData } = await supabase
        .from('marketplace_extensions')
        .select('downloads_count')
        .eq('id', extension.id)
        .single()

      if (extensionData) {
        await supabase
          .from('marketplace_extensions')
          .update({
            downloads_count: (extensionData.downloads_count || 0) + 1
          })
          .eq('id', extension.id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-extensions'] })
      queryClient.invalidateQueries({ queryKey: ['extension-marketplace'] })
      toast({
        title: "Extension installée",
        description: `${extension.name} a été installée avec succès`
      })
      onInstallComplete?.()
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'installation",
        description: error.message || "Impossible d'installer l'extension",
        variant: "destructive"
      })
      setIsInstalling(false)
    }
  })

  const simulateInstallation = async () => {
    if (!acceptedPermissions) {
      toast({
        title: "Permissions requises",
        description: "Veuillez accepter les permissions pour continuer",
        variant: "destructive"
      })
      return
    }

    setIsInstalling(true)
    setInstallationProgress(0)

    // Simulate installation steps
    for (let i = 0; i < installationSteps.length; i++) {
      setCurrentStep(i)
      
      // Simulate step progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setInstallationProgress((i * 100 + progress) / installationSteps.length)
      }
    }

    // Actually install the extension
    await installExtensionMutation.mutateAsync()
    setIsInstalling(false)
  }

  const getRiskLevel = (permissions: string[]) => {
    const highRiskPerms = ['System access', 'Network monitoring', 'Full store access']
    const hasHighRisk = permissions.some(p => highRiskPerms.includes(p))
    
    if (hasHighRisk) return { level: 'Élevé', color: 'text-red-600', icon: AlertTriangle }
    if (permissions.length > 3) return { level: 'Moyen', color: 'text-yellow-600', icon: Shield }
    return { level: 'Faible', color: 'text-green-600', icon: CheckCircle }
  }

  const risk = getRiskLevel(extension.permissions)
  const RiskIcon = risk.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{extension.name}</CardTitle>
                <CardDescription className="text-base">{extension.short_description}</CardDescription>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{extension.rating}</span>
                    <span className="text-muted-foreground">({extension.reviews_count} avis)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{extension.downloads_count.toLocaleString()} téléchargements</span>
                  </div>
                  {extension.developer_verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {!isInstalling ? (
            <>
              {/* Extension Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <p className="font-medium">v{extension.version}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Catégorie:</span>
                        <p className="font-medium">{extension.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Développeur:</span>
                        <p className="font-medium">{extension.developer_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taille:</span>
                        <p className="font-medium">{extension.size_mb} MB</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prix:</span>
                        <p className="font-medium">
                          {extension.price === 0 ? 'Gratuit' : `${extension.price}€`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mise à jour:</span>
                        <p className="font-medium">
                          {new Date(extension.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-medium mb-2">Fonctionnalités</h4>
                    <div className="space-y-2">
                      {extension.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compatibility */}
                  <div>
                    <h4 className="font-medium mb-2">Compatibilité</h4>
                    <div className="flex flex-wrap gap-2">
                      {extension.compatibility.map((platform, index) => (
                        <Badge key={index} variant="outline">{platform}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Permissions & Security */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Permissions et sécurité</h3>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-muted/50">
                      <RiskIcon className={`w-5 h-5 ${risk.color}`} />
                      <div>
                        <p className="font-medium">Niveau de risque: <span className={risk.color}>{risk.level}</span></p>
                        <p className="text-sm text-muted-foreground">
                          Basé sur les permissions demandées
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Permissions requises:</h4>
                      {extension.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded bg-muted/30">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{permission}</p>
                            <p className="text-xs text-muted-foreground">
                              Cette extension aura accès à {permission.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox 
                      id="accept-permissions"
                      checked={acceptedPermissions}
                      onCheckedChange={(checked) => setAcceptedPermissions(checked as boolean)}
                    />
                    <label htmlFor="accept-permissions" className="text-sm cursor-pointer">
                      J'accepte les permissions requises et les conditions d'utilisation
                    </label>
                  </div>
                </div>
              </div>

              {/* Install Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <HardDrive className="w-4 h-4" />
                  <span>Espace requis: {extension.size_mb} MB</span>
                </div>
                
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={simulateInstallation}
                    disabled={!acceptedPermissions || installExtensionMutation.isPending}
                    className="min-w-32"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {extension.price === 0 ? 'Installer gratuitement' : `Acheter ${extension.price}€`}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Installation Progress */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Installation en cours...</h3>
                <p className="text-muted-foreground">
                  {installationSteps[currentStep]?.name || 'Préparation...'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{Math.round(installationProgress)}%</div>
                  <Progress value={installationProgress} className="h-3" />
                </div>

                <div className="space-y-3">
                  {installationSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < currentStep ? 'bg-green-500 text-white' :
                        index === currentStep ? 'bg-blue-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ExtensionInstaller