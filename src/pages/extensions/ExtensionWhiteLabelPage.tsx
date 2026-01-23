import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { Palette, Check, Sparkles, Image, Type, Layout, Globe, ArrowLeft } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

const features = [
  {
    icon: Palette,
    title: 'Couleurs personnalisées',
    description: 'Définissez votre palette de couleurs principale et secondaire'
  },
  {
    icon: Image,
    title: 'Logo personnalisé',
    description: 'Remplacez le logo par défaut par votre propre branding'
  },
  {
    icon: Type,
    title: 'Typographie',
    description: 'Choisissez vos polices pour les titres et le texte'
  },
  {
    icon: Layout,
    title: 'Mise en page',
    description: 'Personnalisez la disposition des éléments'
  },
  {
    icon: Globe,
    title: 'Domaine personnalisé',
    description: 'Utilisez votre propre nom de domaine'
  },
  {
    icon: Sparkles,
    title: 'Thèmes prédéfinis',
    description: 'Choisissez parmi nos thèmes professionnels'
  }
]

export default function ExtensionWhiteLabelPage() {
  const navigate = useNavigate()

  return (
    <ChannablePageWrapper
      title="White-Label"
      subtitle="Ultra Pro"
      description="Personnalisez entièrement l'interface à vos couleurs et votre branding."
      heroImage="extensions"
      badge={{ label: 'Ultra Pro', icon: Palette }}
      actions={
        <Button variant="outline" onClick={() => navigate('/extensions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux Extensions
        </Button>
      }
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
              Ultra Pro requis
            </Badge>
          </div>
          <CardTitle>Fonctionnalité Ultra Pro</CardTitle>
          <CardDescription>
            Le White-Label est disponible exclusivement pour les abonnés Ultra Pro.
            Passez à Ultra Pro pour débloquer cette fonctionnalité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard/subscription')}>
            Passer à Ultra Pro
          </Button>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => (
          <Card key={idx} className="border-border/50 bg-card/50">
            <CardContent className="p-6">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  )
}
