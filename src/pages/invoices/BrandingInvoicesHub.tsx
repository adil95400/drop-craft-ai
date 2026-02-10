import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Send, CheckCircle2, Download, Plus } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function BrandingInvoicesHub() {
  const [customerName, setCustomerName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const { generateInvoice, sendInvoice, markPaid, getInvoices, getTemplates } = useInvoices();

  const invoices = getInvoices.data || [];
  const templates = getTemplates.data || [];

  const handleGenerate = () => {
    const template = templates[0] as any;
    generateInvoice.mutate({
      invoiceData: { customer_name: customerName, customer_email: 'client@example.com', total_amount: parseFloat(totalAmount) },
      templateId: template?.id
    });
  };

  return (
    <ChannablePageWrapper
      title="Factures Personnalisées"
      description="Générez et gérez vos factures avec branding personnalisé"
      heroImage="orders"
      badge={{ label: 'Factures', icon: FileText }}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Générer une facture</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nom du client" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input type="number" placeholder="Montant total" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              <Button onClick={handleGenerate} disabled={!customerName || !totalAmount || generateInvoice.isPending} className="w-full">Générer la facture</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total factures</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Envoyées</p>
              <p className="text-2xl font-bold">{invoices.filter((i: any) => i.status === 'sent' || i.status === 'paid').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Payées</p>
              <p className="text-2xl font-bold">{invoices.filter((i: any) => i.status === 'paid').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{invoices.filter((i: any) => i.status === 'draft' || i.status === 'sent').length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="packaging">Messages packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice: any) => (
                <Card key={invoice.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{invoice.total_amount?.toFixed(2)} {invoice.currency}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'sent' ? 'secondary' : 'outline'}>{invoice.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {invoice.status === 'draft' && <Button size="sm" onClick={() => sendInvoice.mutate(invoice.id)}><Send className="h-4 w-4" /></Button>}
                        {invoice.status === 'sent' && <Button size="sm" onClick={() => markPaid.mutate(invoice.id)}><CheckCircle2 className="h-4 w-4" /></Button>}
                        <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune facture</h3>
              <p className="text-muted-foreground">Créez votre première facture personnalisée</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template: any) => (
              <Card key={template.id} className="p-6">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4" />
                <h3 className="font-bold mb-2">{template.template_name}</h3>
                <Badge variant={template.is_default ? 'default' : 'outline'}>{template.is_default ? 'Par défaut' : 'Personnalisé'}</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packaging">
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Configurez vos messages personnalisés pour les colis ici</p>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
