import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const LiveChatSupportPage: React.FC = () => {
  const [message, setMessage] = useState('');

  const conversations = [
    {
      id: 1,
      customer: 'Marie Dupont',
      status: 'active',
      lastMessage: 'Bonjour, j\'ai un problème avec ma commande',
      timestamp: '2 min',
      unread: 2,
    },
    {
      id: 2,
      customer: 'Jean Martin',
      status: 'waiting',
      lastMessage: 'Puis-je modifier mon adresse de livraison?',
      timestamp: '5 min',
      unread: 1,
    },
    {
      id: 3,
      customer: 'Sophie Leblanc',
      status: 'resolved',
      lastMessage: 'Merci pour votre aide!',
      timestamp: '15 min',
      unread: 0,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'customer',
      text: 'Bonjour, j\'ai un problème avec ma commande #12345',
      time: '14:30',
    },
    {
      id: 2,
      sender: 'agent',
      text: 'Bonjour! Je suis là pour vous aider. Pouvez-vous me donner plus de détails sur le problème?',
      time: '14:31',
    },
    {
      id: 3,
      sender: 'customer',
      text: 'Le produit reçu ne correspond pas à celui commandé',
      time: '14:32',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">En cours</Badge>;
      case 'waiting':
        return <Badge variant="secondary">En attente</Badge>;
      case 'resolved':
        return <Badge variant="outline">Résolu</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Support Client en Direct</h1>
          <p className="text-muted-foreground">
            Gérez vos conversations avec les clients en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            2 actifs
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            1 en attente
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations actives</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 agents en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 min</div>
            <p className="text-xs text-muted-foreground">Moyenne aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5</div>
            <p className="text-xs text-muted-foreground">89 évaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus aujourd'hui</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+8 vs hier</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Liste des discussions clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {conv.customer.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{conv.customer}</p>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(conv.status)}
                            <span className="text-xs text-muted-foreground">
                              {conv.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(conv.status)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>MD</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Marie Dupont</CardTitle>
                  <CardDescription>Commande #12345</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Voir commande
                </Button>
                <Button variant="outline" size="sm">
                  Transférer
                </Button>
                <Button size="sm">Résoudre</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'agent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Tapez votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setMessage('')}
              />
              <Button onClick={() => setMessage('')}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Réponses rapides
              </Button>
              <Button variant="outline" size="sm">
                Joindre un fichier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveChatSupportPage;
