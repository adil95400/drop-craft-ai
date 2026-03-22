import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Headphones, MessageSquare, RotateCcw, Star, Send,
  Clock, CheckCircle, XCircle, AlertCircle, Plus,
  Mail, TrendingUp, Users, BarChart3, Bell, ArrowRight, Ticket
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useCustomerServiceHub } from '@/hooks/useCustomerServiceHub';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CustomerServiceHubPage() {
  const navigate = useNavigate();
  const {
    tickets, surveys, reminders, refunds, stats,
    isLoadingTickets, isLoadingSurveys, isLoadingRefunds,
    createSurvey, createRefund, updateRefundStatus, scheduleReminder,
    isCreatingSurvey, isCreatingRefund,
  } = useCustomerServiceHub();

  const [refundDialog, setRefundDialog] = useState(false);
  const [surveyDialog, setSurveyDialog] = useState(false);
  const [reminderDialog, setReminderDialog] = useState(false);
  const [refundForm, setRefundForm] = useState({ customer_email: '', customer_name: '', amount: '', reason: '', reason_category: 'other' });
  const [surveyForm, setSurveyForm] = useState({ customer_email: '', survey_type: 'post_purchase' });
  const [reminderForm, setReminderForm] = useState({ customer_email: '', customer_name: '', scheduled_at: '' });

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-orange-100 text-orange-700">Ouvert</Badge>;
      case 'in_progress': return <Badge className="bg-info/10 text-blue-700">En cours</Badge>;
      case 'resolved': return <Badge className="bg-success/10 text-success">Résolu</Badge>;
      case 'closed': return <Badge variant="secondary">Fermé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-warning border-orange-300">En attente</Badge>;
      case 'approved': return <Badge className="bg-info/10 text-blue-700">Approuvé</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      case 'refunded': return <Badge className="bg-success/10 text-success">Remboursé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Service Client — Drop-Craft AI</title>
        <meta name="description" content="Gérez vos tickets, enquêtes de satisfaction, remboursements et rappels d'avis." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('serviceClient.title')}
        description="Gérez vos tickets, enquêtes de satisfaction, remboursements et rappels d'avis"
        heroImage="customers"
        badge={{ label: "Support", icon: Headphones }}
      >
        {/* Quick Access Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { title: 'Chat en direct', desc: 'Messagerie temps réel avec vos clients', icon: MessageSquare, path: '/customer-service/live-chat', color: 'text-success' },
            { title: 'Tickets avancés', desc: 'Suivi SLA, priorités et assignation', icon: Ticket, path: '/customer-service/tickets', color: 'text-info' },
            { title: 'Retours & Réclamations', desc: 'Gestion RMA et remboursements automatisés', icon: RotateCcw, path: '/customer-service/returns', color: 'text-warning' },
          ].map((mod, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(mod.path)}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <mod.icon className={`h-5 w-5 ${mod.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Tickets ouverts</p>
                <p className="text-2xl font-bold">{stats.openTickets}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
                <p className="text-2xl font-bold">{stats.avgRating}/5</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Remboursements en attente</p>
                <p className="text-2xl font-bold">{stats.pendingRefunds}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Rappels planifiés</p>
                <p className="text-2xl font-bold">{stats.scheduledReminders}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="tickets">Tickets ({stats.totalTickets})</TabsTrigger>
            <TabsTrigger value="refunds">Remboursements ({refunds.length})</TabsTrigger>
            <TabsTrigger value="surveys">Satisfaction ({surveys.length})</TabsTrigger>
            <TabsTrigger value="reminders">Rappels Avis ({reminders.length})</TabsTrigger>
          </TabsList>

          {/* === TICKETS === */}
          <TabsContent value="tickets" className="mt-6 space-y-3">
            {isLoadingTickets ? (
              <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="p-6 animate-pulse"><div className="h-5 bg-muted rounded w-1/3 mb-2" /><div className="h-4 bg-muted rounded w-2/3" /></Card>)}</div>
            ) : tickets.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun ticket</p>
                <p className="text-muted-foreground">Les demandes de support apparaîtront ici</p>
              </Card>
            ) : (
              tickets.map((ticket: any) => (
                <Card key={ticket.id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        {getTicketStatusBadge(ticket.status)}
                        {ticket.priority && <Badge variant="outline" className="capitalize">{ticket.priority}</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{ticket.email}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* === REFUNDS === */}
          <TabsContent value="refunds" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Nouveau remboursement</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Demande de remboursement</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Email client</Label><Input value={refundForm.customer_email} onChange={e => setRefundForm({...refundForm, customer_email: e.target.value})} /></div>
                    <div><Label>Nom</Label><Input value={refundForm.customer_name} onChange={e => setRefundForm({...refundForm, customer_name: e.target.value})} /></div>
                    <div><Label>Montant (€)</Label><Input type="number" value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: e.target.value})} /></div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={refundForm.reason_category} onValueChange={v => setRefundForm({...refundForm, reason_category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="defective">Produit défectueux</SelectItem>
                          <SelectItem value="wrong_item">Mauvais article</SelectItem>
                          <SelectItem value="not_received">Non reçu</SelectItem>
                          <SelectItem value="not_as_described">Non conforme</SelectItem>
                          <SelectItem value="changed_mind">Changement d'avis</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Raison</Label><Textarea value={refundForm.reason} onChange={e => setRefundForm({...refundForm, reason: e.target.value})} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isCreatingRefund || !refundForm.customer_email || !refundForm.amount || !refundForm.reason} onClick={() => {
                      createRefund({ customer_email: refundForm.customer_email, customer_name: refundForm.customer_name, amount: parseFloat(refundForm.amount), reason: refundForm.reason, reason_category: refundForm.reason_category });
                      setRefundForm({ customer_email: '', customer_name: '', amount: '', reason: '', reason_category: 'other' });
                      setRefundDialog(false);
                    }}>Créer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {refunds.length === 0 ? (
              <Card className="p-12 text-center">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune demande de remboursement</p>
              </Card>
            ) : (
              refunds.map(refund => (
                <Card key={refund.id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{refund.customer_name || refund.customer_email}</h3>
                        {getRefundStatusBadge(refund.status)}
                        {refund.auto_approved && <Badge variant="outline" className="text-success">Auto-approuvé</Badge>}
                        <Badge variant="outline" className="capitalize">{refund.reason_category?.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{refund.reason}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{Number(refund.amount).toLocaleString('fr-FR')}€</span>
                        <span>{formatDistanceToNow(new Date(refund.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                    {refund.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateRefundStatus({ id: refund.id, status: 'approved' })}>
                          <CheckCircle className="h-3 w-3 mr-1" />Approuver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateRefundStatus({ id: refund.id, status: 'rejected' })}>
                          <XCircle className="h-3 w-3 mr-1" />Rejeter
                        </Button>
                      </div>
                    )}
                    {refund.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updateRefundStatus({ id: refund.id, status: 'refunded' })}>
                        Marquer remboursé
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* === SATISFACTION SURVEYS === */}
          <TabsContent value="surveys" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={surveyDialog} onOpenChange={setSurveyDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Envoyer une enquête</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Enquête de satisfaction</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type d'enquête</Label>
                      <Select value={surveyForm.survey_type} onValueChange={v => setSurveyForm({...surveyForm, survey_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post_purchase">Post-achat</SelectItem>
                          <SelectItem value="nps">NPS (Net Promoter Score)</SelectItem>
                          <SelectItem value="csat">CSAT (Satisfaction)</SelectItem>
                          <SelectItem value="ces">CES (Effort client)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isCreatingSurvey} onClick={() => {
                      createSurvey({ survey_type: surveyForm.survey_type });
                      setSurveyDialog(false);
                    }}>Envoyer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-warning">{stats.avgRating}</p>
                  <p className="text-sm text-muted-foreground mt-1">Note moyenne</p>
                  <div className="flex justify-center mt-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= Number(stats.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-4xl font-bold text-primary">{stats.surveyResponseRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Taux de réponse</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-4xl font-bold text-success">{stats.reviewsReceived}</p>
                <p className="text-sm text-muted-foreground mt-1">Avis reçus</p>
              </Card>
            </div>

            {surveys.length > 0 && (
              <div className="space-y-3">
                {surveys.map(survey => (
                  <Card key={survey.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{survey.survey_type.replace('_', ' ')}</Badge>
                        <Badge variant={survey.status === 'responded' ? 'default' : 'secondary'}>
                          {survey.status === 'responded' ? 'Répondu' : survey.status === 'sent' ? 'Envoyé' : 'En attente'}
                        </Badge>
                        {survey.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            {survey.rating}/5
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(survey.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    {survey.feedback && <p className="text-sm mt-2 text-muted-foreground">{survey.feedback}</p>}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* === REVIEW REMINDERS === */}
          <TabsContent value="reminders" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={reminderDialog} onOpenChange={setReminderDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Planifier un rappel</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Rappel d'avis client</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Email client</Label><Input value={reminderForm.customer_email} onChange={e => setReminderForm({...reminderForm, customer_email: e.target.value})} /></div>
                    <div><Label>Nom (optionnel)</Label><Input value={reminderForm.customer_name} onChange={e => setReminderForm({...reminderForm, customer_name: e.target.value})} /></div>
                    <div><Label>Date d'envoi</Label><Input type="datetime-local" value={reminderForm.scheduled_at} onChange={e => setReminderForm({...reminderForm, scheduled_at: e.target.value})} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={!reminderForm.customer_email} onClick={() => {
                      scheduleReminder({
                        customer_email: reminderForm.customer_email,
                        customer_name: reminderForm.customer_name || null,
                        scheduled_at: reminderForm.scheduled_at ? new Date(reminderForm.scheduled_at).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
                      });
                      setReminderForm({ customer_email: '', customer_name: '', scheduled_at: '' });
                      setReminderDialog(false);
                    }}>Planifier</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {reminders.length === 0 ? (
              <Card className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun rappel planifié</p>
                <p className="text-muted-foreground">Programmez des rappels pour collecter des avis clients</p>
              </Card>
            ) : (
              reminders.map(reminder => (
                <Card key={reminder.id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{reminder.customer_name || reminder.customer_email}</h3>
                        <Badge variant={reminder.status === 'scheduled' ? 'outline' : reminder.review_received ? 'default' : 'secondary'}>
                          {reminder.review_received ? '✓ Avis reçu' : reminder.status === 'sent' ? 'Envoyé' : 'Planifié'}
                        </Badge>
                        {reminder.review_rating && (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            {reminder.review_rating}/5
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span><Mail className="h-3 w-3 inline mr-1" />{reminder.customer_email}</span>
                        <span><Clock className="h-3 w-3 inline mr-1" />
                          {new Date(reminder.scheduled_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{reminder.reminder_count}/{reminder.max_reminders} envois</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
