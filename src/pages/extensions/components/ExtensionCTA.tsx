/**
 * Call-to-action section for extensions
 */
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Chrome, FileText, Play, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const benefits = [
  'Installation en 30 secondes',
  'Aucune carte bancaire requise',
  'Support 7j/7',
  'Mises à jour automatiques'
]

interface ExtensionCTAProps {
  className?: string
}

export function ExtensionCTA({ className }: ExtensionCTAProps) {
  const navigate = useNavigate()
  
  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 overflow-hidden relative",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="p-8 md:p-12 relative">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            100% Gratuit • Aucun engagement
          </div>
          
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Prêt à booster votre dropshipping?
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Téléchargez gratuitement l'extension Chrome ShopOpti+ et commencez à importer des produits en quelques secondes.
          </p>
          
          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {benefit}
              </div>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/extensions/chrome')}
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 gap-2 group"
            >
              <Chrome className="w-5 h-5" />
              Télécharger l'Extension
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/extensions/tutorials')}
              className="gap-2"
            >
              <Play className="w-5 h-5" />
              Voir les Tutoriels
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
