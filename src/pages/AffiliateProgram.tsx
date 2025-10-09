import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, DollarSign, TrendingUp, Link2, Share2, Award, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AffiliateProgram() {
  const { toast } = useToast()

  const stats = [
    {
      icon: Users,
      label: "Affiliés actifs",
      value: "45",
      change: "+12%",
      color: "text-primary"
    },
    {
      icon: DollarSign,
      label: "Commissions versées",
      value: "€8,450",
      change: "+28%",
      color: "text-success"
    },
    {
      icon: TrendingUp,
      label: "Ventes générées",
      value: "€42,250",
      change: "+35%",
      color: "text-success"
    },
    {
      icon: Award,
      label: "Top performer",
      value: "Marie L.",
      change: "€2,145",
      color: "text-warning"
    }
  ]

  const affiliates = [
    {
      id: 1,
      name: "Marie Lambert",
      email: "marie.l@email.com",
      sales: 145,
      revenue: 2145.50,
      commission: 214.55,
      status: "active",
      tier: "gold"
    },
    {
      id: 2,
      name: "Thomas Dubois",
      email: "thomas.d@email.com",
      sales: 98,
      revenue: 1580.00,
      commission: 158.00,
      status: "active",
      tier: "silver"
    },
    {
      id: 3,
      name: "Sophie Martin",
      email: "sophie.m@email.com",
      sales: 67,
      revenue: 980.50,
      commission: 98.05,
      status: "active",
      tier: "bronze"
    }
  ]

  const commissionTiers = [
    { name: "Bronze", rate: "10%", sales: "0-50" },
    { name: "Silver", rate: "12%", sales: "51-100" },
    { name: "Gold", rate: "15%", sales: "101+" }
  ]

  const handleCopyLink = () => {
    toast({
      title: "Lien copié",
      description: "Le lien d'affiliation a été copié dans le presse-papiers"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Programme d'affiliation</h1>
        <p className="text-muted-foreground">Gérez votre réseau d'affiliés et leurs commissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Affiliates Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mes affiliés</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="active">Actifs</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {affiliates.map((affiliate) => (
                  <Card key={affiliate.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{affiliate.name}</p>
                            <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">Actif</Badge>
                            <Badge variant="outline" className="capitalize">{affiliate.tier}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Ventes</p>
                            <p className="font-bold">{affiliate.sales}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CA généré</p>
                            <p className="font-bold">€{affiliate.revenue}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Commission</p>
                            <p className="font-bold text-success">€{affiliate.commission}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Niveau</p>
                            <p className="font-bold capitalize">{affiliate.tier}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Link2 className="h-4 w-4 mr-2" />
                            Lien d'affiliation
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Statistiques
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="active">
                <div className="text-center py-8 text-muted-foreground">
                  Affiliés actifs uniquement
                </div>
              </TabsContent>

              <TabsContent value="pending">
                <div className="text-center py-8 text-muted-foreground">
                  Demandes en attente d'approbation
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Settings & Tools */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Structure des commissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {commissionTiers.map((tier, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{tier.name}</p>
                    <Badge variant="secondary">{tier.rate}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.sales} ventes/mois
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Modifier les paliers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outils marketing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Lien d'inscription</p>
                <div className="flex gap-2">
                  <Input
                    value="https://votre-site.com/affiliate/signup"
                    readOnly
                    className="text-xs"
                  />
                  <Button size="sm" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Bannières & visuels
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Link2 className="h-4 w-4 mr-2" />
                Générateur de liens
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Prochain paiement</p>
                <p className="text-2xl font-bold">€1,245</p>
                <p className="text-xs text-muted-foreground">Prévu le 15 février</p>
              </div>
              <Button className="w-full">
                Traiter les paiements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
