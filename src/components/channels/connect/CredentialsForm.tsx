/**
 * Credentials Form - Channable Premium Design
 * Secure API credentials input with validation
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { 
  Key, Loader2, Zap, CheckCircle2, AlertCircle, 
  HelpCircle, ExternalLink, Eye, EyeOff, Shield 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlatformConfig } from './PlatformCard'

interface CredentialsFormProps {
  platform: PlatformConfig
  credentials: Record<string, string>
  setCredentials: (fn: (prev: Record<string, string>) => Record<string, string>) => void
  isTestingConnection: boolean
  connectionTestResult: 'success' | 'error' | null
  testDetails: { shopInfo?: any; error?: string } | null
  onTestConnection: () => void
  canProceed: boolean
}

export function CredentialsForm({
  platform,
  credentials,
  setCredentials,
  isTestingConnection,
  connectionTestResult,
  testDetails,
  onTestConnection,
  canProceed
}: CredentialsFormProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {/* Platform Header with glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-card/80 border border-border/50 p-6"
      >
        {/* Gradient background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${platform.color}20, transparent 60%)`
          }}
        />
        
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2.5 ring-1 ring-border/50">
            <PlatformLogo platform={platform.id} size="xl" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{platform.name}</h2>
              <Badge variant="outline" className="text-xs capitalize">
                {platform.category}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {platform.longDescription}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {platform.features.map(feature => (
                <Badge 
                  key={feature} 
                  variant="secondary" 
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Credentials Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden">
          {/* Card header with gradient */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Identifiants API</h3>
                <p className="text-xs text-muted-foreground">Informations sécurisées et chiffrées</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-5">
            {platform.fields.map((field, index) => (
              <motion.div 
                key={field.key} 
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Label htmlFor={field.key} className="flex items-center gap-2 text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                  {field.secret && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      <Shield className="h-2.5 w-2.5 mr-0.5" />
                      Chiffré
                    </Badge>
                  )}
                </Label>
                
                {field.multiline ? (
                  <textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={cn(
                      "w-full min-h-[100px] p-3 rounded-xl border bg-background/50 text-sm font-mono resize-y",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all",
                      "placeholder:text-muted-foreground/50"
                    )}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={cn(
                        "font-mono pr-10 bg-background/50",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      )}
                    />
                    {field.secret && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => toggleSecretVisibility(field.key)}
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Test Connection Section */}
            <div className="pt-5 border-t space-y-4">
              <Button
                variant="outline"
                onClick={onTestConnection}
                disabled={isTestingConnection || !canProceed}
                className={cn(
                  "w-full h-11 font-medium transition-all",
                  connectionTestResult === 'success' && "border-emerald-500/50 bg-emerald-500/5"
                )}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : connectionTestResult === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                    Connexion vérifiée
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Tester la connexion
                  </>
                )}
              </Button>

              {/* Test Result */}
              {connectionTestResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className={cn(
                    "p-4 rounded-xl flex items-start gap-3",
                    connectionTestResult === 'success' 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  )}
                >
                  {connectionTestResult === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {connectionTestResult === 'success' ? 'Connexion réussie !' : 'Échec de la connexion'}
                    </p>
                    {testDetails?.shopInfo?.name && (
                      <p className="text-sm opacity-80 mt-0.5">Boutique: {testDetails.shopInfo.name}</p>
                    )}
                    {testDetails?.error && (
                      <p className="text-sm opacity-80 mt-0.5">{testDetails.error}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Help Link */}
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
              <a href={platform.helpUrl} target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Comment obtenir ces identifiants ?
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
