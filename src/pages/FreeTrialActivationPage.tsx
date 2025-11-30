import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useFreeTrial } from '@/hooks/useFreeTrial'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Check, Clock, Crown } from 'lucide-react'

export default function FreeTrialActivationPage() {
  const navigate = useNavigate()
  const { hasUsedTrial, activateTrial, isActivating } = useFreeTrial()
  
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [selectedDays, setSelectedDays] = useState('14')
  const [couponCode, setCouponCode] = useState('')

  const handleActivate = () => {
    activateTrial(
      {
        trialDays: parseInt(selectedDays),
        plan: selectedPlan,
        couponCode: couponCode || undefined,
      },
      {
        onSuccess: () => {
          navigate('/dashboard')
        },
      }
    )
  }

  if (hasUsedTrial) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Essai déjà utilisé</h2>
          <p className="text-muted-foreground mb-6">
            Vous avez déjà utilisé votre période d'essai gratuite. Découvrez nos
            offres d'abonnement.
          </p>
          <Button onClick={() => navigate('/billing')}>
            Voir les tarifs
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Essayez gratuitement</h1>
        <p className="text-lg text-muted-foreground">
          Accédez à toutes les fonctionnalités premium sans engagement
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan Pro */}
        <Card
          className={`p-6 cursor-pointer transition-all ${
            selectedPlan === 'pro'
              ? 'border-blue-500 shadow-lg shadow-blue-500/20'
              : 'border-border'
          }`}
          onClick={() => setSelectedPlan('pro')}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Plan Pro</h3>
              <p className="text-sm text-muted-foreground">
                Pour les entrepreneurs
              </p>
            </div>
            {selectedPlan === 'pro' && (
              <Check className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>10 000 produits</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Optimisation IA</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Auto-fulfillment</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>5 intégrations</span>
            </div>
          </div>
        </Card>

        {/* Plan Ultra Pro */}
        <Card
          className={`p-6 cursor-pointer transition-all ${
            selectedPlan === 'ultra_pro'
              ? 'border-purple-500 shadow-lg shadow-purple-500/20'
              : 'border-border'
          }`}
          onClick={() => setSelectedPlan('ultra_pro')}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">Plan Ultra Pro</h3>
                <Crown className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Pour les power users
              </p>
            </div>
            {selectedPlan === 'ultra_pro' && (
              <Check className="w-6 h-6 text-purple-500" />
            )}
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Produits illimités</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>IA avancée</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Fulfillment multi-fournisseurs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Intégrations illimitées</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Label className="text-base font-medium mb-3 block">
          Durée de l'essai
        </Label>
        <RadioGroup value={selectedDays} onValueChange={setSelectedDays}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="7" id="7days" />
            <Label htmlFor="7days" className="cursor-pointer">
              7 jours
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="14" id="14days" />
            <Label htmlFor="14days" className="cursor-pointer">
              14 jours (recommandé)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="30" id="30days" />
            <Label htmlFor="30days" className="cursor-pointer">
              30 jours
            </Label>
          </div>
        </RadioGroup>
      </Card>

      <Card className="p-6">
        <Label htmlFor="coupon">Code promo (optionnel)</Label>
        <Input
          id="coupon"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="CODE PROMO"
          className="font-mono mt-2"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Si vous avez reçu un code promo spécial, entrez-le ici
        </p>
      </Card>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleActivate}
          disabled={isActivating}
          className="w-full md:w-auto px-8"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isActivating
            ? 'Activation...'
            : `Activer mon essai ${selectedDays} jours`}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Aucune carte bancaire requise • Annulation possible à tout moment
      </p>
    </div>
  )
}
