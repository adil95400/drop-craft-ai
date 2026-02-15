/**
 * FreelanceMarketplacePage — Marketplace de freelances pour optimisation fiches produit
 * + Service client intégré (Chat/FAQ)
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Helmet } from 'react-helmet-async'
import {
  Users, Star, MessageSquare, Search, Filter,
  CheckCircle2, Clock, Globe, Briefcase, Award,
  MessageCircle, HelpCircle, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const FREELANCERS = [
  { id: '1', name: 'Marie D.', specialty: 'SEO e-commerce', rating: 4.9, reviews: 127, price: '15€/fiche', avatar: '👩‍💼', languages: ['FR', 'EN'], availability: 'Disponible', deliveryTime: '24h', skills: ['SEO', 'Copywriting', 'A/B Testing'] },
  { id: '2', name: 'Thomas L.', specialty: 'Copywriting produit', rating: 4.8, reviews: 89, price: '12€/fiche', avatar: '👨‍💻', languages: ['FR', 'DE'], availability: 'Disponible', deliveryTime: '48h', skills: ['Copywriting', 'Traduction', 'Branding'] },
  { id: '3', name: 'Sarah K.', specialty: 'Traduction multilingue', rating: 4.7, reviews: 203, price: '8€/fiche', avatar: '👩‍🎓', languages: ['FR', 'EN', 'ES', 'IT'], availability: 'Occupée', deliveryTime: '72h', skills: ['Traduction', 'Localisation', 'SEO'] },
  { id: '4', name: 'Alex M.', specialty: 'Photo produit & retouche', rating: 4.9, reviews: 156, price: '20€/fiche', avatar: '📸', languages: ['FR', 'EN'], availability: 'Disponible', deliveryTime: '24h', skills: ['Photographie', 'Retouche', 'Lifestyle'] },
  { id: '5', name: 'Julie R.', specialty: 'Data entry & catégorisation', rating: 4.6, reviews: 312, price: '5€/fiche', avatar: '📊', languages: ['FR'], availability: 'Disponible', deliveryTime: '12h', skills: ['Data Entry', 'Catégorisation', 'Enrichissement'] },
]

const FAQ_ITEMS = [
  { q: 'Comment importer mes produits ?', a: 'Allez dans Catalogue > Importer. Vous pouvez coller des URLs, uploader un CSV ou connecter directement un fournisseur.' },
  { q: 'Comment optimiser le SEO de mes fiches ?', a: 'Utilisez le module SEO Manager (Performance > SEO). L\'IA analyse et optimise automatiquement vos titres, descriptions et métadonnées.' },
  { q: 'Comment configurer le fulfillment automatique ?', a: 'Dans Ventes > Auto-Fulfillment, activez les règles pour chaque fournisseur. Les commandes seront transmises automatiquement.' },
  { q: 'Comment fonctionne le repricing ?', a: 'Le module de repricing (Catalogue > Repricing) surveille les prix concurrents et ajuste automatiquement vos prix selon vos règles.' },
  { q: 'Quels sont les plans disponibles ?', a: 'Nous proposons 4 plans : Basic (gratuit), Pro (29€/mois), Advanced (79€/mois) et Ultra Pro (199€/mois). Chaque plan débloque plus de fonctionnalités.' },
  { q: 'Comment connecter ma boutique Shopify ?', a: 'Dans Intégrations > Boutiques, cliquez "Ajouter" et suivez le wizard de connexion Shopify. L\'API synchronise automatiquement vos produits.' },
]

export default function FreelanceMarketplacePage() {
  const [search, setSearch] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const { toast } = useToast()

  const filteredFreelancers = FREELANCERS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.specialty.toLowerCase().includes(search.toLowerCase()) ||
    f.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const { data } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('ai-support-chat', {
        body: { message: chatInput, history: chatMessages.slice(-8) }
      })
      setChatMessages(prev => [...prev, { role: 'assistant', content: data?.response || 'Je suis là pour vous aider !' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez ou créez un ticket de support.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Services & Support — Marketplace Freelances | ShopOpti</title>
        <meta name="description" content="Trouvez des experts pour optimiser vos fiches produit et accédez au support intégré." />
      </Helmet>

      <ChannablePageWrapper
        title="Services & Support"
        description="Marketplace de freelances, chat en direct et FAQ"
        heroImage="support"
        badge={{ label: 'Services', icon: Users }}
      >
        <Tabs defaultValue="marketplace" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="marketplace" className="gap-1.5"><Briefcase className="h-4 w-4" />Freelances</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5"><MessageCircle className="h-4 w-4" />Chat Support</TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5"><HelpCircle className="h-4 w-4" />FAQ</TabsTrigger>
          </TabsList>

          {/* Marketplace */}
          <TabsContent value="marketplace">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher par compétence, nom..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredFreelancers.map(f => (
                <Card key={f.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{f.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{f.name}</h3>
                          <Badge variant={f.availability === 'Disponible' ? 'default' : 'secondary'} className="text-[10px]">
                            {f.availability}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{f.specialty}</p>
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />{f.rating}</span>
                          <span className="text-muted-foreground">({f.reviews} avis)</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{f.deliveryTime}</span>
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{f.languages.join(', ')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {f.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">{f.price}</span>
                          <Button size="sm" className="h-7 text-xs" onClick={() => toast({ title: 'Demande envoyée', description: `Votre demande a été envoyée à ${f.name}` })}>
                            <MessageSquare className="h-3 w-3 mr-1" />Contacter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Chat Support */}
          <TabsContent value="chat">
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />Support ShopOpti
                  <Badge variant="outline" className="text-[10px]">IA + Humain</Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Posez votre question, notre IA vous répond instantanément</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Votre question..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  disabled={chatLoading}
                />
                <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <Card key={i} className="cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{item.q}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{expandedFaq === i ? '−' : '+'}</Badge>
                    </div>
                    {expandedFaq === i && (
                      <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{item.a}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
