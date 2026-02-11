import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Users, 
  MessageCircle, 
  Mic, 
  Volume2, 
  Zap, 
  Globe,
  Phone,
  Settings
} from 'lucide-react'
import { RealtimeChatInterface } from '@/components/realtime/RealtimeChatInterface'
import { RealtimePresence } from '@/components/realtime/RealtimePresence'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

const RealtimeChat: React.FC = () => {
  return (
    <ChannablePageWrapper
      title="Chat IA Temps Réel"
      description="Communiquez avec l'assistant IA par voix ou texte en temps réel"
      heroImage="ai"
      badge={{ label: 'Ultra Pro', icon: Zap }}
    >
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">GPT-4o</div>
                <p className="text-xs text-muted-foreground">Modèle IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">24kHz</div>
                <p className="text-xs text-muted-foreground">Audio HD</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">Alloy</div>
                <p className="text-xs text-muted-foreground">Voix IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">&lt;100ms</div>
                <p className="text-xs text-muted-foreground">Latence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="presence" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <RealtimeChatInterface />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Fonctionnalités</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Audio Bidirectionnel</p>
                      <p className="text-xs text-muted-foreground">Parlez et écoutez en temps réel</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">IA Contextuelle</p>
                      <p className="text-xs text-muted-foreground">Comprend Shopopti Pro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Fonctions Avancées</p>
                      <p className="text-xs text-muted-foreground">Recherche produits, stats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Commandes Vocales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">• "Recherche des produits électronique"</p>
                    <p className="text-sm font-medium">• "Montre-moi mes statistiques d'import"</p>
                    <p className="text-sm font-medium">• "Comment optimiser mon SEO ?"</p>
                    <p className="text-sm font-medium">• "Aide-moi avec les commandes"</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="presence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealtimePresence channelName="global" showCurrentPage={true} />
            <Card>
              <CardHeader>
                <CardTitle>Activité Globale</CardTitle>
                <CardDescription>Statistiques d'utilisation en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">15</div>
                    <p className="text-sm text-muted-foreground">Sessions actives</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">247</div>
                    <p className="text-sm text-muted-foreground">Messages aujourd'hui</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Pages populaires</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Dashboard</span>
                      <Badge variant="outline">8 utilisateurs</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Import</span>
                      <Badge variant="outline">5 utilisateurs</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Catalogue</span>
                      <Badge variant="outline">3 utilisateurs</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Audio</CardTitle>
                <CardDescription>Configuration de l'audio et du microphone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qualité Audio</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>HD (24kHz) - Recommandé</option>
                    <option>Standard (16kHz)</option>
                    <option>Économique (8kHz)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Suppression du bruit</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Activer la suppression du bruit</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrôle automatique du gain</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Ajuster automatiquement le volume</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Paramètres IA</CardTitle>
                <CardDescription>Configuration de l'assistant intelligent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voix de l'assistant</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Alloy (Recommandé)</option>
                    <option>Echo</option>
                    <option>Shimmer</option>
                    <option>Nova</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Détection de fin de parole</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Automatique (VAD)</option>
                    <option>Manuel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contexte Shopopti</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Accès aux données de la plateforme</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}

export default RealtimeChat
