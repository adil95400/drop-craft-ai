import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Gift, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BlogNewsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');
    
    toast({
      title: "Inscription réussie !",
      description: "Vous recevrez bientôt notre newsletter avec les dernières actualités e-commerce.",
    });
  };

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            Merci pour votre inscription !
          </h3>
          <p className="text-green-600 mb-4">
            Vérifiez votre boîte mail pour confirmer votre abonnement.
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Gift className="w-4 h-4 mr-1" />
            Guide gratuit en cours d'envoi
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Newsletter E-commerce Pro
        </CardTitle>
        <CardDescription className="text-base">
          Recevez chaque semaine nos meilleures stratégies, outils et actualités du dropshipping
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Tendances Hebdo</h4>
              <p className="text-xs text-muted-foreground">Produits gagnants</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Stratégies IA</h4>
              <p className="text-xs text-muted-foreground">Avant-première</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Bonus Exclusifs</h4>
              <p className="text-xs text-muted-foreground">Outils gratuits</p>
            </div>
          </div>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-6"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "S'abonner"
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Déjà <span className="font-semibold text-primary">12,500+</span> entrepreneurs nous font confiance.
            <br />
            Désabonnement en un clic. Pas de spam.
          </p>
        </form>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">12,500+</span>
            <span className="text-muted-foreground">abonnés</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">95%</span>
            <span className="text-muted-foreground">satisfaction</span>
          </div>
        </div>

        {/* Free Guide CTA */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 text-center">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-2">
            <Gift className="w-4 h-4 mr-1" />
            Cadeau de bienvenue
          </Badge>
          <h4 className="font-semibold text-amber-800 mb-1">
            Guide gratuit : "100 Produits Gagnants 2024"
          </h4>
          <p className="text-sm text-amber-600">
            Offert lors de votre inscription (valeur 47€)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}