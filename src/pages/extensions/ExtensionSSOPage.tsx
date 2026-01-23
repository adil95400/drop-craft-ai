import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { Shield, Check, Users, Key, Lock, Globe, Building2, ArrowLeft } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

const features = [
  {
    icon: Key,
    title: 'Single Sign-On',
    description: 'Connexion unique pour toute votre équipe'
  },
  {
    icon: Users,
    title: 'Gestion des utilisateurs',
    description: 'Gérez les accès et permissions de votre équipe'
  },
  {
    icon: Lock,
    title: 'Authentification sécurisée',
    description: 'Protocoles SAML 2.0 et OAuth 2.0'
  },
  {
    icon: Building2,
    title: 'Fournisseurs d\'identité',
    description: 'Compatible Okta, Azure AD, Google Workspace'
  },
  {
    icon: Globe,
    title: 'Multi-domaines',
    description: 'Support de plusieurs domaines d\'entreprise'
  },
  {
    icon: Shield,
    title: 'Audit & Logs',
    description: 'Traçabilité complète des connexions'
  }
]

export default function ExtensionSSOPage() {
  const navigate = useNavigate()

  return (
    <ChannablePageWrapper
      title="Enterprise SSO"
      subtitle="Ultra Pro"
      description="Authentification unique pour votre équipe avec les protocoles d'entreprise."
      heroImage="extensions"
      badge={{ label: 'Ultra Pro', icon: Shield }}
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
            L'Enterprise SSO est disponible exclusivement pour les abonnés Ultra Pro.
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
