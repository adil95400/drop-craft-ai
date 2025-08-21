import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  Zap,
  Sparkles,
  MessageSquare,
  Settings,
  History,
  Download,
  RefreshCw,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  type: 'text' | 'audio' | 'file'
  metadata?: any
}

interface AIModel {
  id: string
  name: string
  description: string
  capability: string[]
  performance: number
  cost: 'low' | 'medium' | 'high'
  status: 'available' | 'training' | 'offline'
}

interface AITask {
  id: string
  type: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  created_at: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [aiTasks, setAITasks] = useState<AITask[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiModels: AIModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4 Turbo',
      description: 'Modèle de pointe pour les tâches complexes',
      capability: ['text', 'code', 'analysis', 'creative'],
      performance: 95,
      cost: 'high',
      status: 'available'
    },
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5 Turbo',
      description: 'Équilibre parfait performance/coût',
      capability: ['text', 'conversation', 'support'],
      performance: 85,
      cost: 'medium',
      status: 'available'
    },
    {
      id: 'claude-3',
      name: 'Claude 3 Sonnet',
      description: 'Excellent pour l\'analyse et la recherche',
      capability: ['analysis', 'research', 'writing'],
      performance: 90,
      cost: 'medium',
      status: 'available'
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Multimodal avec vision et audio',
      capability: ['multimodal', 'vision', 'audio'],
      performance: 88,
      cost: 'medium',
      status: 'training'
    }
  ]

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString(),
        type: 'text'
      }
    ])

    fetchAITasks()
    scrollToBottom()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchAITasks = async () => {
    // Mock AI tasks data
    const mockTasks: AITask[] = [
      {
        id: '1',
        type: 'text-generation',
        title: 'Génération de contenu blog',
        description: 'Article sur les tendances e-commerce 2024',
        status: 'completed',
        progress: 100,
        result: { word_count: 1250, readability_score: 85 },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'data-analysis',
        title: 'Analyse des ventes Q4',
        description: 'Insights et prédictions basées sur les données',
        status: 'processing',
        progress: 65,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'code-optimization',
        title: 'Optimisation algorithme recommandation',
        description: 'Amélioration des performances de 35%',
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString()
      }
    ]
    setAITasks(mockTasks)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(currentMessage),
        timestamp: new Date().toISOString(),
        type: 'text'
      }
      setMessages(prev => [...prev, aiResponse])
      setLoading(false)
    }, 1500)
  }

  const generateAIResponse = (input: string): string => {
    const responses = [
      `Excellente question ! Basé sur votre demande "${input}", voici mes recommandations...`,
      `J'ai analysé votre demande et je peux vous suggérer plusieurs approches pour "${input}".`,
      `Intéressant ! Pour "${input}", laissez-moi vous expliquer les meilleures pratiques...`,
      `Parfait ! Concernant "${input}", voici une analyse détaillée...`
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const startRecording = () => {
    setIsRecording(true)
    toast({
      title: "Enregistrement démarré",
      description: "Parlez maintenant, je vous écoute...",
    })
  }

  const stopRecording = () => {
    setIsRecording(false)
    toast({
      title: "Enregistrement terminé",
      description: "Traitement de votre message vocal...",
    })
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'pending': return 'outline'
      case 'failed': return 'destructive'
      case 'available': return 'default'
      case 'training': return 'secondary'
      case 'offline': return 'destructive'
      default: return 'outline'
    }
  }

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assistant IA</h1>
          <p className="text-muted-foreground">
            Intelligence artificielle avancée pour votre business
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            Nouvelle Conversation
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Chat IA
                </CardTitle>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((model) => (
                      <SelectItem key={model.id} value={model.id} disabled={model.status !== 'available'}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="outline" className={getCostColor(model.cost)}>
                            {model.cost}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.role === 'assistant' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-background border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">IA réfléchit...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Tapez votre message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[50px] pr-24"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <MicOff className="w-3 h-3 text-red-500" />
                      ) : (
                        <Mic className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!currentMessage.trim() || loading}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Models */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Modèles IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiModels.map((model) => (
                <div key={model.id} className="p-2 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{model.name}</span>
                    <Badge variant={getStatusColor(model.status) as any}>
                      {model.status}
                    </Badge>
                  </div>
                  <Progress value={model.performance} className="mb-2" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{model.performance}% Performance</span>
                    <span className={getCostColor(model.cost)}>{model.cost}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Brain className="w-4 h-4" />
                Analyser les Données
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Zap className="w-4 h-4" />
                Optimiser SEO
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" />
                Générer Contenu
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Star className="w-4 h-4" />
                Suggestions Pro
              </Button>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tâches Récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2 border rounded-lg">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant={getStatusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                    {task.status === 'processing' && (
                      <span className="text-xs">{task.progress}%</span>
                    )}
                  </div>
                  {task.status === 'processing' && (
                    <Progress value={task.progress} className="mt-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Tasks Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau de Bord IA</CardTitle>
          <CardDescription>
            Suivi des tâches et performances de l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="grid gap-4">
                {aiTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.status === 'processing' && (
                        <div className="w-32">
                          <Progress value={task.progress} />
                        </div>
                      )}
                      <Badge variant={getStatusColor(task.status) as any}>
                        {task.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {task.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tâches Complétées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">247</p>
                    <p className="text-xs text-muted-foreground">+12% ce mois</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Temps Moyen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">2.3s</p>
                    <p className="text-xs text-muted-foreground">-15% vs mois dernier</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Précision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">94.2%</p>
                    <p className="text-xs text-muted-foreground">+2.1% amélioration</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Historique des conversations et tâches IA</p>
                <p className="text-sm">Fonctionnalité disponible prochainement</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}