import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  Zap,
  Star,
  Target,
  DollarSign,
  ShoppingCart,
  Award,
  Timer
} from 'lucide-react'

interface WinnerCardProps {
  product: {
    id: string
    title: string
    price: number
    originalPrice?: number
    image: string
    rating: number
    reviews: number
    trending_score: number
    profit_potential: number
    category: string
    tags: string[]
  }
  onImport: (productId: string) => void
}

const WinnerCard = ({ product, onImport }: WinnerCardProps) => {
  const discount = product.originalPrice ? 
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100' 
    return 'text-red-600 bg-red-100'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="bg-red-500 text-white">
            🔥 Hot
          </Badge>
          {discount > 0 && (
            <Badge variant="destructive">
              -{discount}%
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <Badge className={`${getScoreColor(product.trending_score)} border-0`}>
            {product.trending_score}/100
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h4>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">€{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    €{product.originalPrice}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+{product.profit_potential}% profit</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onImport(product.id)}
          >
            <Package className="h-3 w-3 mr-1" />
            Importer ce Winner
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface AIWinnersDiscoveryProps {
  onImportWinner: (productId: string) => void
}

export const AIWinnersDiscovery = ({ onImportWinner }: AIWinnersDiscoveryProps) => {
  // Données simulées de produits gagnants
  const winnersData = [
    {
      id: "w1",
      title: "Montre Connectée Sport Ultra - Étanche IP68 avec GPS",
      price: 89.99,
      originalPrice: 149.99,
      image: "/api/placeholder/300/200",
      rating: 4.8,
      reviews: 2847,
      trending_score: 95,
      profit_potential: 65,
      category: "Tech",
      tags: ["trending", "sports", "waterproof"]
    },
    {
      id: "w2", 
      title: "Kit d'Éclairage LED RGB Gaming pour Setup Gaming",
      price: 24.99,
      originalPrice: 39.99,
      image: "/api/placeholder/300/200",
      rating: 4.6,
      reviews: 1523,
      trending_score: 92,
      profit_potential: 58,
      category: "Gaming",
      tags: ["rgb", "gaming", "setup"]
    },
    {
      id: "w3",
      title: "Organisateur de Tiroir Modulable - Set de 12 Pièces",
      price: 19.99,
      originalPrice: 29.99,
      image: "/api/placeholder/300/200", 
      rating: 4.7,
      reviews: 956,
      trending_score: 88,
      profit_potential: 72,
      category: "Maison",
      tags: ["organisation", "modulable", "tiroir"]
    },
    {
      id: "w4",
      title: "Chargeur Voiture 3 Ports USB-C Charge Rapide 65W",
      price: 15.99,
      originalPrice: 24.99,
      image: "/api/placeholder/300/200",
      rating: 4.5,
      reviews: 1834,
      trending_score: 91,
      profit_potential: 60,
      category: "Auto",
      tags: ["voiture", "usb-c", "charge rapide"]
    }
  ]

  const aiInsights = [
    {
      icon: TrendingUp,
      title: "Tendances détectées", 
      value: "23 niches en croissance",
      color: "text-green-600"
    },
    {
      icon: Target,
      title: "Précision IA",
      value: "94.7% de réussite",
      color: "text-blue-600"
    },
    {
      icon: DollarSign,
      title: "Profit moyen",
      value: "+68% de marge",
      color: "text-purple-600"
    },
    {
      icon: Timer,
      title: "Mise à jour",
      value: "Il y a 5 min",
      color: "text-orange-600"
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header IA */}
      <Card className="border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Winners IA Discovery</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Produits gagnants détectés par notre intelligence artificielle
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="text-center p-3 bg-white/50 rounded-lg">
                <insight.icon className={`h-5 w-5 mx-auto mb-1 ${insight.color}`} />
                <p className="text-xs text-muted-foreground">{insight.title}</p>
                <p className="font-semibold text-sm">{insight.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default" className="cursor-pointer">🔥 Trending</Badge>
        <Badge variant="outline" className="cursor-pointer">💰 Haute marge</Badge>
        <Badge variant="outline" className="cursor-pointer">⚡ Vente rapide</Badge>
        <Badge variant="outline" className="cursor-pointer">🎯 Faible concurrence</Badge>
        <Badge variant="outline" className="cursor-pointer">📱 Tech</Badge>
        <Badge variant="outline" className="cursor-pointer">🏠 Maison</Badge>
      </div>

      {/* Grille des winners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {winnersData.map((product) => (
          <WinnerCard
            key={product.id}
            product={product}
            onImport={onImportWinner}
          />
        ))}
      </div>

      {/* Call to action */}
      <Card className="text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="py-6">
          <Award className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h4 className="font-semibold text-green-800 mb-2">
            Découvrez plus de Winners
          </h4>
          <p className="text-sm text-green-600 mb-4">
            Notre IA analyse 50,000+ produits chaque jour pour vous trouver les pépites
          </p>
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Voir tous les Winners
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}