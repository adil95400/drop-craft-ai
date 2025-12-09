import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Chrome, Download, Settings, Zap, Play, BookOpen, BarChart3, History, Database, 
  Loader2, CheckCircle2, TrendingUp, Package, Star, Globe, Shield, Sparkles,
  ArrowRight, RefreshCw, Clock, Users, ShoppingCart, Eye, ExternalLink
} from "lucide-react";
import { ExtensionAuthManager } from "@/components/browser-extension/ExtensionAuthManager";
import { ExtensionUpdateNotification } from "@/components/extensions/ExtensionUpdateNotification";
import { ExtensionHealthMonitor } from "@/components/extensions/ExtensionHealthMonitor";
import { ExtensionInstallGuide } from "@/components/extensions/ExtensionInstallGuide";
import { toast } from "@/hooks/use-toast";
import { generateExtensionZip } from "@/utils/extensionZipGenerator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Extension() {
  const [activeTab, setActiveTab] = useState("install");
  const [isDownloading, setIsDownloading] = useState(false);
  const [stats, setStats] = useState({
    totalImports: 2847,
    todayImports: 23,
    successRate: 98.5,
    activeUsers: 1250
  });
  
  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        todayImports: prev.todayImports + Math.floor(Math.random() * 2),
        totalImports: prev.totalImports + Math.floor(Math.random() * 3)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToChrome = () => {
    setActiveTab("guide");
    toast({
      title: "Guide d'installation",
      description: "Consultez le guide complet pour installer l'extension Chrome en mode développeur"
    });
  };
  
  const handleDownloadExtension = async () => {
    setIsDownloading(true);
    try {
      await generateExtensionZip();
      toast({
        title: "✅ Téléchargement réussi",
        description: "Le fichier ZIP de l'extension a été téléchargé. Décompressez-le et chargez-le dans Chrome."
      });
    } catch (error) {
      console.error('Error generating ZIP:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewDemo = () => {
    window.open('https://www.youtube.com/watch?v=demo', '_blank');
  };

  const features = [
    {
      title: "Import en 1 clic",
      description: "Importez des produits directement depuis AliExpress, Amazon, eBay et 50+ sites",
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "Analyse IA",
      description: "Score de rentabilité, analyse des avis, détection des tendances automatique",
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Synchronisation",
      description: "Sync automatique des prix, stocks et images avec votre boutique",
      icon: RefreshCw,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Multi-fournisseurs",
      description: "Comparez les fournisseurs et trouvez les meilleures marges",
      icon: Globe,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    }
  ];

  const supportedPlatforms = [
    { name: "AliExpress", logo: "🛒", products: "10M+", popular: true },
    { name: "Amazon", logo: "📦", products: "500M+", popular: true },
    { name: "eBay", logo: "🏷️", products: "1.5B+", popular: true },
    { name: "Temu", logo: "🎯", products: "5M+", popular: true },
    { name: "Wish", logo: "⭐", products: "150M+", popular: false },
    { name: "Banggood", logo: "📱", products: "500K+", popular: false },
    { name: "DHgate", logo: "🏭", products: "30M+", popular: false },
    { name: "1688", logo: "🇨🇳", products: "100M+", popular: false },
    { name: "Taobao", logo: "🛍️", products: "800M+", popular: false },
    { name: "SHEIN", logo: "👗", products: "600K+", popular: true },
    { name: "CJ Dropshipping", logo: "📦", products: "400K+", popular: true },
    { name: "Spocket", logo: "🚀", products: "100K+", popular: false }
  ];

  const recentImports = [
    { site: "AliExpress", product: "Montre Sport Pro Max", time: "Il y a 2 min", status: "success", price: "€24.99", margin: "+65%" },
    { site: "Amazon", product: "Écouteurs Bluetooth TWS", time: "Il y a 15 min", status: "success", price: "€18.50", margin: "+72%" },
    { site: "Temu", product: "Coque iPhone 15 Pro", time: "Il y a 1h", status: "success", price: "€3.99", margin: "+85%" },
    { site: "eBay", product: "Câble USB-C 3m", time: "Il y a 2h", status: "pending", price: "€2.50", margin: "+90%" },
    { site: "SHEIN", product: "T-shirt Oversize", time: "Il y a 3h", status: "success", price: "€8.99", margin: "+55%" }
  ];

  const testimonials = [
    { name: "Marie L.", role: "Dropshipper", text: "J'ai triplé mes imports en 1 semaine!", rating: 5, avatar: "M" },
    { name: "Thomas B.", role: "E-commerçant", text: "L'analyse IA est incroyable pour trouver les produits gagnants", rating: 5, avatar: "T" },
    { name: "Sophie K.", role: "Entrepreneur", text: "Indispensable pour le sourcing rapide", rating: 5, avatar: "S" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Update Notification */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <ExtensionUpdateNotification />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Extension #1 pour le Dropshipping</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
                Importez des produits 
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> 10x plus vite</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Transformez n'importe quelle page produit en import instantané. 
                Analyse IA des marges, détection automatique des tendances, synchronisation en temps réel.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
                  onClick={handleDownloadExtension}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Chrome className="w-5 h-5 mr-2" />
                  )}
                  {isDownloading ? "Génération..." : "Installer Gratuitement"}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 text-base"
                  onClick={handleViewDemo}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Voir la Démo
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">+{stats.activeUsers.toLocaleString()} utilisateurs</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Extension Preview Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl border shadow-2xl p-6 overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" />
                
                {/* Header */}
                <div className="relative flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Chrome className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">ShopOpti+ Extension</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          v3.0.0
                        </Badge>
                        <Badge className="bg-emerald-500 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connecté
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs">Imports aujourd'hui</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats.todayImports}</div>
                    <div className="flex items-center text-xs text-emerald-600 mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% vs hier
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs">Taux de succès</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats.successRate}%</div>
                    <Progress value={stats.successRate} className="h-1.5 mt-2" />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Activité récente</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Voir tout <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  {recentImports.slice(0, 3).map((item, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                          item.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        )}>
                          {item.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[150px]">{item.product}</p>
                          <p className="text-xs text-muted-foreground">{item.site} • {item.time}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                        {item.margin}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-4 top-1/4 bg-card rounded-xl border shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">100% Sécurisé</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -right-4 bottom-1/4 bg-card rounded-xl border shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">Import &lt; 3 sec</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Produits importés", value: stats.totalImports.toLocaleString(), icon: Package, color: "text-primary" },
              { label: "Sites supportés", value: "50+", icon: Globe, color: "text-purple-500" },
              { label: "Taux de succès", value: `${stats.successRate}%`, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Utilisateurs actifs", value: stats.activeUsers.toLocaleString(), icon: Users, color: "text-amber-500" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités Puissantes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour sourcer, analyser et importer des produits gagnants
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", feature.bgColor)}>
                      <feature.icon className={cn("w-7 h-7", feature.color)} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">50+ Plateformes Supportées</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Importez depuis toutes les grandes marketplaces mondiales en un clic
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {supportedPlatforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className={cn(
                  "relative bg-card rounded-xl border p-4 text-center hover:shadow-md transition-all hover:-translate-y-1",
                  platform.popular && "border-primary/30 bg-primary/5"
                )}
              >
                {platform.popular && (
                  <Badge className="absolute -top-2 right-2 bg-primary text-xs">
                    Populaire
                  </Badge>
                )}
                <div className="text-3xl mb-2">{platform.logo}</div>
                <h3 className="font-medium text-sm">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">{platform.products} produits</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ce que disent nos utilisateurs</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={cn(
                          "w-4 h-4",
                          i <= testimonial.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                        )} />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              {[
                { value: "install", label: "Installation", icon: Download },
                { value: "guide", label: "Guide", icon: BookOpen },
                { value: "auth", label: "Authentification", icon: Shield },
                { value: "usage", label: "Utilisation", icon: Eye },
                { value: "sites", label: "Sites Supportés", icon: Globe },
                { value: "monitoring", label: "Monitoring", icon: BarChart3 },
                { value: "history", label: "Historique", icon: History },
                { value: "data", label: "Données Test", icon: Database }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="install">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Installation Rapide
                  </CardTitle>
                  <CardDescription>
                    Installez et configurez l'extension en 3 étapes simples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[
                      { step: 1, title: "Télécharger l'extension", desc: "Cliquez sur le bouton pour télécharger le fichier ZIP de l'extension", action: "Télécharger ZIP", onClick: handleDownloadExtension },
                      { step: 2, title: "Charger dans Chrome", desc: "Ouvrez chrome://extensions/, activez le mode développeur et chargez le dossier", action: "Voir le guide", onClick: () => setActiveTab("guide") },
                      { step: 3, title: "Connecter votre compte", desc: "Générez un token d'authentification pour lier l'extension à votre compte", action: "Configurer", onClick: () => setActiveTab("auth") }
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-6"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <p className="text-muted-foreground mb-4">{item.desc}</p>
                          <Button onClick={item.onClick} variant={index === 0 ? "default" : "outline"}>
                            {item.action}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide">
              <ExtensionInstallGuide />
            </TabsContent>

            <TabsContent value="auth">
              <ExtensionAuthManager />
            </TabsContent>

            <TabsContent value="usage">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Guide d'utilisation
                  </CardTitle>
                  <CardDescription>
                    Maîtrisez l'extension en quelques minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { title: "Import rapide", desc: "Cliquez sur l'icône ShopOpti dans la barre d'outils pour ouvrir le panel d'import sur n'importe quelle page produit.", icon: Zap, tip: "L'extension détecte automatiquement les informations produit" },
                      { title: "Analyse IA", desc: "L'extension calcule automatiquement le score de rentabilité, analyse les avis et détecte les tendances.", icon: Sparkles, tip: "Un score > 70 indique un produit à fort potentiel" },
                      { title: "Comparaison fournisseurs", desc: "Comparez les prix entre différents fournisseurs pour maximiser vos marges.", icon: BarChart3, tip: "Utilisez la vue multi-sources pour voir tous les fournisseurs" },
                      { title: "Synchronisation auto", desc: "Les produits importés sont automatiquement synchronisés avec votre catalogue.", icon: RefreshCw, tip: "La sync se fait en temps réel, pas besoin d'action manuelle" }
                    ].map((item, index) => (
                      <div key={index} className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{item.desc}</p>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs"><strong>💡 Astuce :</strong> {item.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sites">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Sites Supportés
                  </CardTitle>
                  <CardDescription>
                    L'extension fonctionne sur 50+ sites e-commerce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {supportedPlatforms.map((platform, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md",
                          platform.popular && "border-primary/30 bg-primary/5"
                        )}
                      >
                        <span className="text-2xl">{platform.logo}</span>
                        <div>
                          <p className="font-medium text-sm">{platform.name}</p>
                          <p className="text-xs text-muted-foreground">{platform.products}</p>
                        </div>
                        {platform.popular && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Site non listé ?</h3>
                        <p className="text-sm text-muted-foreground">
                          L'extension s'adapte automatiquement à la plupart des sites e-commerce grâce à son moteur d'extraction intelligent. 
                          Si vous rencontrez des problèmes, contactez notre support.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring">
              <ExtensionHealthMonitor />
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Historique des Imports
                  </CardTitle>
                  <CardDescription>
                    Suivez tous vos imports en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentImports.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            item.status === 'success' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                          )}>
                            {item.status === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{item.product}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.site} • {item.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{item.price}</p>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                              {item.margin}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Données de Test
                  </CardTitle>
                  <CardDescription>
                    Testez l'extension avec des données réalistes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
                    <h3 className="font-semibold mb-3">Pourquoi générer des données de test ?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Les données de test réalistes vous permettent de tester l'extension avec des produits fictifs mais réalistes.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Fournisseurs et produits variés",
                        "Clients et commandes complètes",
                        "Données d'analyse et statistiques",
                        "Historique d'imports réaliste"
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Prêt à booster vos imports ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez +1000 dropshippers qui utilisent ShopOpti+ pour sourcer des produits gagnants plus rapidement.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="h-14 px-10 text-base bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
                onClick={handleDownloadExtension}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Télécharger Gratuitement
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 text-base" onClick={() => setActiveTab("guide")}>
                <BookOpen className="w-5 h-5 mr-2" />
                Guide d'installation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
