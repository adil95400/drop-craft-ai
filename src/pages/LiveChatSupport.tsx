import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Clock, CheckCircle, User, Send, Bot, Settings } from 'lucide-react'

export default function LiveChatSupport() {
  const [message, setMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState<number | null>(null)

  const activeChats = [
    {
      id: 1,
      customer: "Jean Dupont",
      avatar: "/placeholder.svg",
      lastMessage: "Quand mon colis sera-t-il livré ?",
      time: "Il y a 2 min",
      unread: 3,
      status: "active",
      order: "#ORD-2024-1234"
    },
    {
      id: 2,
      customer: "Marie Martin",
      avatar: "/placeholder.svg",
      lastMessage: "Je voudrais retourner un produit",
      time: "Il y a 5 min",
      unread: 1,
      status: "active",
      order: "#ORD-2024-1235"
    },
    {
      id: 3,
      customer: "Pierre Durant",
      avatar: "/placeholder.svg",
      lastMessage: "Le produit ne correspond pas",
      time: "Il y a 10 min",
      unread: 2,
      status: "waiting",
      order: "#ORD-2024-1236"
    }
  ]

  const messages = selectedChat ? [
    {
      id: 1,
      sender: "customer",
      text: "Bonjour, j'ai passé commande hier et je n'ai pas reçu de confirmation",
      time: "14:30",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      sender: "agent",
      text: "Bonjour ! Je vérifie cela immédiatement pour vous.",
      time: "14:31",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      sender: "agent",
      text: "Votre commande #ORD-2024-1234 a bien été confirmée. Un email de confirmation a été envoyé à votre adresse.",
      time: "14:32",
      avatar: "/placeholder.svg"
    },
    {
      id: 4,
      sender: "customer",
      text: "Merci ! Quand mon colis sera-t-il livré ?",
      time: "14:33",
      avatar: "/placeholder.svg"
    }
  ] : []

  const stats = [
    {
      icon: MessageSquare,
      label: "Conversations actives",
      value: "12",
      color: "text-primary"
    },
    {
      icon: Clock,
      label: "Temps de réponse moyen",
      value: "1.2 min",
      color: "text-success"
    },
    {
      icon: CheckCircle,
      label: "Taux de satisfaction",
      value: "98%",
      color: "text-success"
    },
    {
      icon: User,
      label: "En attente",
      value: "3",
      color: "text-warning"
    }
  ]

  const aiSuggestions = [
    "Votre commande est en cours de préparation et sera expédiée dans 24h.",
    "Je peux vous aider à suivre votre colis. Quel est votre numéro de commande ?",
    "Pour un retour, vous avez 30 jours à partir de la réception du colis."
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // Envoyer le message
      setMessage('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Client Live</h1>
        <p className="text-muted-foreground">Chat en temps réel avec vos clients</p>
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
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge>{activeChats.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="active">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">Actives</TabsTrigger>
                <TabsTrigger value="waiting" className="flex-1">En attente</TabsTrigger>
                <TabsTrigger value="closed" className="flex-1">Fermées</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="m-0">
                <ScrollArea className="h-[600px]">
                  {activeChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChat === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={chat.avatar} />
                          <AvatarFallback>{chat.customer[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">{chat.customer}</p>
                            {chat.unread > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {chat.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{chat.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {chat.order}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="waiting" className="m-0">
                <div className="p-8 text-center text-muted-foreground">
                  Aucune conversation en attente
                </div>
              </TabsContent>
              <TabsContent value="closed" className="m-0">
                <div className="p-8 text-center text-muted-foreground">
                  Historique des conversations
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedChat ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Jean Dupont</p>
                      <p className="text-sm text-muted-foreground">
                        Commande: #ORD-2024-1234
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.sender === 'agent' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback>
                            {msg.sender === 'agent' ? 'A' : 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 max-w-[70%] ${
                            msg.sender === 'agent'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* AI Suggestions */}
                <div className="p-4 border-t border-b bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Suggestions IA</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setMessage(suggestion)}
                      >
                        {suggestion.substring(0, 40)}...
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 flex gap-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Sélectionnez une conversation pour commencer
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
