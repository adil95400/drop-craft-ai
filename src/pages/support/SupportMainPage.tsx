/**
 * Page Support moderne - Design premium cohérent avec l'application
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Search, HelpCircle, MessageCircle, Phone, Mail, Book, Video,
  FileText, ExternalLink, Clock, CheckCircle, AlertCircle, Zap,
  LifeBuoy, Headphones, GraduationCap, ArrowRight, Sparkles,
  ThumbsUp, ThumbsDown, Plus, RefreshCw, Send, Star, TrendingUp,
  Users, Shield, Rocket, X, Bot
} from 'lucide-react';

// Hooks & Components
import { useSupportTickets, SupportTicket as DBSupportTicket } from '@/hooks/useSupportTickets';
import { useFaqFeedback } from '@/hooks/useFaqFeedback';
import { CreateTicketDialog } from '@/components/support/CreateTicketDialog';
import { TicketDetailModal } from '@/components/support/TicketDetailModal';
import { TicketsList } from '@/components/support/TicketsList';
import { SystemStatusCard } from '@/components/support/SystemStatusCard';
import { AIAssistantWidget } from '@/components/support/AIAssistantWidget';
import { SupportQuickActions } from '@/components/support/SupportQuickActions';

// Types
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

// Data
const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Comment ajouter un nouveau produit ?',
    answer: 'Pour ajouter un nouveau produit, rendez-vous dans la section "Produits" puis cliquez sur "Ajouter un produit". Remplissez les informations requises comme le nom, la description, le prix et les images.',
    category: 'Produits',
    helpful: 156
  },
  {
    id: '2',
    question: 'Comment configurer les notifications automatiques ?',
    answer: 'Les notifications automatiques se configurent dans "Paramètres > Notifications". Vous pouvez activer les alertes pour les commandes, les stocks faibles, et les erreurs système.',
    category: 'Automation',
    helpful: 124
  },
  {
    id: '3',
    question: 'Que faire si mon stock est incorrect ?',
    answer: 'Si votre stock est incorrect, vous pouvez l\'ajuster manuellement dans "Produits > [Votre produit] > Stock" ou utiliser l\'import en masse via fichier CSV.',
    category: 'Inventory',
    helpful: 89
  },
  {
    id: '4',
    question: 'Comment interpréter mes analytics ?',
    answer: 'Le dashboard analytics vous montre vos KPIs principaux : chiffre d\'affaires, nombre de commandes, taux de conversion. Utilisez les filtres de date pour analyser les tendances.',
    category: 'Analytics',
    helpful: 203
  },
  {
    id: '5',
    question: 'Comment connecter ma boutique Shopify ?',
    answer: 'Accédez à Intégrations > Shopify, cliquez sur "Connecter" et suivez les étapes d\'autorisation OAuth. La synchronisation se fera automatiquement après la connexion.',
    category: 'Intégrations',
    helpful: 178
  },
  {
    id: '6',
    question: 'Comment fonctionne le pricing automatique ?',
    answer: 'L\'IA analyse vos concurrents et ajuste vos prix selon les règles que vous définissez (marge min, compétitivité, etc.). Configurez vos règles dans Automation > Repricing.',
    category: 'Automation',
    helpful: 145
  }
];

// Static tickets removed - now using database via useSupportTickets hook

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'info';
  delay?: number;
  onClick?: () => void;
}

function StatCard({ label, value, icon: Icon, color, delay = 0, onClick }: StatCardProps) {
  const colorMap = {
    primary: {
      bg: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
      border: 'border-primary/20 hover:border-primary/40',
      icon: 'bg-primary/10 text-primary',
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'bg-emerald-500/10 text-emerald-500',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      icon: 'bg-amber-500/10 text-amber-500',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'bg-blue-500/10 text-blue-500',
    }
  };

  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn(
        "group relative overflow-hidden border transition-all duration-300 hover:shadow-lg",
        colors.bg, colors.border,
        onClick && "cursor-pointer"
      )} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={cn("p-3 rounded-xl", colors.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Support Channel Card
interface SupportChannelProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  badge?: string;
  badgeColor?: 'success' | 'warning' | 'default';
  onClick: () => void;
  delay?: number;
}

function SupportChannelCard({ icon: Icon, title, description, action, badge, badgeColor = 'default', onClick, delay = 0 }: SupportChannelProps) {
  const badgeColors = {
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    default: 'bg-primary/10 text-primary border-primary/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl group-hover:scale-110 transition-transform">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {badge && (
              <Badge variant="outline" className={cn("text-xs font-medium", badgeColors[badgeColor])}>
                {badge}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <Button 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
            onClick={onClick}
          >
            {action}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Guide Card
interface GuideCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
  delay?: number;
}

function GuideCard({ icon: Icon, title, description, badge, onClick, delay = 0 }: GuideCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card 
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30"
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">{badge}</Badge>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SupportMainPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('faq');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);

  // Hooks
  const { tickets: supportTickets, isLoadingTickets, createTicket, isCreatingTicket } = useSupportTickets();

  const categories = ['all', 'Produits', 'Automation', 'Inventory', 'Analytics', 'Intégrations'];

  const filteredFAQ = useMemo(() => {
    return faqData.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const getStatusConfig = (status: string) => {
    const configs = {
      open: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Ouvert' },
      pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'En attente' },
      resolved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Résolu' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20', label: 'Haute' },
      medium: { color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Moyenne' },
      low: { color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Basse' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  return (
    <>
      <Helmet>
        <title>Centre de Support - ShopOpti</title>
        <meta name="description" content="Support 24/7, documentation complète et réponses à toutes vos questions." />
      </Helmet>

      <ChannablePageWrapper
        title="Centre de Support"
        subtitle="Aide & Assistance"
        description="Support 24/7, documentation complète et réponses à toutes vos questions. Notre équipe est là pour vous aider."
        heroImage="support"
        badge={{ label: 'En ligne 24/7', icon: LifeBuoy }}
        actions={
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 bg-background/80 backdrop-blur-sm border-2 focus:border-primary/50 rounded-xl"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Temps de réponse" value="< 2 min" icon={Clock} color="primary" delay={0.1} />
          <StatCard label="Satisfaction" value="98%" icon={Star} color="success" delay={0.2} />
          <StatCard label="Articles d'aide" value="250+" icon={FileText} color="info" delay={0.3} />
          <StatCard label="Tickets résolus" value="1.2K" icon={CheckCircle} color="warning" delay={0.4} />
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="faq" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Headphones className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="tickets" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Mes Tickets
              </TabsTrigger>
              <TabsTrigger value="guides" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Book className="h-4 w-4 mr-2" />
                Guides
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              {/* Category Filters */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2"
              >
                {categories.map((category, index) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "rounded-full transition-all",
                      selectedCategory === category && "shadow-md"
                    )}
                  >
                    {category === 'all' ? 'Toutes les catégories' : category}
                  </Button>
                ))}
              </motion.div>

              {/* FAQ List */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Questions Fréquentes
                      </CardTitle>
                      <CardDescription>
                        {filteredFAQ.length} question{filteredFAQ.length > 1 ? 's' : ''} trouvée{filteredFAQ.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {filteredFAQ.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <AccordionItem 
                          value={item.id} 
                          className="border rounded-xl px-4 data-[state=open]:bg-muted/30 transition-colors"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full mr-4 gap-4">
                              <span className="font-medium">{item.question}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {item.helpful}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-4">
                              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                              <div className="flex items-center gap-4 pt-2 border-t">
                                <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle aidé ?</span>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30">
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    Oui
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30">
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                    Non
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SupportChannelCard
                  icon={MessageCircle}
                  title="Chat en Direct"
                  description="Discutez avec notre équipe support en temps réel"
                  action="Démarrer le chat"
                  badge="En ligne"
                  badgeColor="success"
                  onClick={() => {
                    // Ouvrir le widget de chat Crisp ou rediriger vers la page de chat
                    if (typeof window !== 'undefined' && (window as any).$crisp) {
                      (window as any).$crisp.push(['do', 'chat:open']);
                    } else {
                      navigate('/support/chat');
                    }
                  }}
                  delay={0.1}
                />
                <SupportChannelCard
                  icon={Mail}
                  title="Email Support"
                  description="Envoyez-nous un email détaillé de votre problème"
                  action="Envoyer un email"
                  badge="Réponse 24h"
                  badgeColor="default"
                  onClick={() => navigate('/contact')}
                  delay={0.2}
                />
                <SupportChannelCard
                  icon={Phone}
                  title="Support Téléphonique"
                  description="Appelez-nous directement pour un support immédiat"
                  action="Appeler maintenant"
                  badge="Lun-Ven 9h-18h"
                  badgeColor="warning"
                  onClick={() => window.location.href = 'tel:+33123456789'}
                  delay={0.3}
                />
              </div>

              {/* Quick Contact Form */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Message Rapide
                  </CardTitle>
                  <CardDescription>
                    Décrivez votre problème et nous vous répondrons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Sujet" className="h-11" />
                    <Input placeholder="Email" type="email" className="h-11" />
                  </div>
                  <textarea 
                    placeholder="Décrivez votre problème en détail..."
                    className="w-full h-32 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                  />
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-primary to-primary/80">
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Mes Tickets de Support</h2>
                  <p className="text-sm text-muted-foreground">Suivez l'état de vos demandes</p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => setIsCreateTicketOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Ticket
                </Button>
              </div>

              <div className="space-y-4">
                {supportTickets.map((ticket, index) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-2 hover:border-primary/30 transition-all hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={cn("p-2.5 rounded-xl", statusConfig.bg)}>
                                <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold truncate">{ticket.subject}</h3>
                                  <Badge variant="outline" className={cn("text-xs", priorityConfig.bg, priorityConfig.color)}>
                                    {priorityConfig.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="font-mono">#{ticket.id.slice(0, 8)}</span>
                                  <span>Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                                  <span>MAJ: {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={cn("font-medium", statusConfig.bg, statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>
                              <Button variant="outline" size="sm">
                                Voir détails
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GuideCard
                  icon={Rocket}
                  title="Guide de Démarrage"
                  description="Découvrez comment configurer votre boutique en 10 minutes"
                  badge="8 min • Vidéo"
                  onClick={() => navigate('/academy')}
                  delay={0.1}
                />
                <GuideCard
                  icon={Zap}
                  title="Automation Avancée"
                  description="Maîtrisez les règles d'automatisation puissantes"
                  badge="15 min • Guide"
                  onClick={() => navigate('/documentation')}
                  delay={0.2}
                />
                <GuideCard
                  icon={TrendingUp}
                  title="Analytics & KPIs"
                  description="Comprendre et optimiser vos métriques clés"
                  badge="12 min • Tutoriel"
                  onClick={() => navigate('/documentation')}
                  delay={0.3}
                />
                <GuideCard
                  icon={Shield}
                  title="Sécurité & API"
                  description="Documentation complète pour intégrer nos APIs"
                  badge="Documentation"
                  onClick={() => navigate('/api-documentation')}
                  delay={0.4}
                />
                <GuideCard
                  icon={Users}
                  title="Gestion d'Équipe"
                  description="Collaborez efficacement avec votre équipe"
                  badge="10 min • Guide"
                  onClick={() => navigate('/documentation')}
                  delay={0.5}
                />
                <GuideCard
                  icon={GraduationCap}
                  title="Académie Complète"
                  description="Tous les cours et certifications disponibles"
                  badge="Academy"
                  onClick={() => navigate('/academy')}
                  delay={0.6}
                />
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto">
                      <GraduationCap className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Devenez un expert ShopOpti</h3>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                      Accédez à notre académie complète avec des cours, certifications et ressources exclusives
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                      <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80" onClick={() => navigate('/academy')}>
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Accéder à l'Académie
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => navigate('/documentation')}>
                        <Book className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
      </ChannablePageWrapper>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
      />
    </>
  );
}
