import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useInvoiceBranding, InvoiceBranding } from '@/hooks/useInvoiceBranding';
import { useInvoices } from '@/hooks/useInvoices';
import { generateInvoicePDF, InvoiceItem, InvoiceData } from '@/lib/invoicePdfGenerator';
import {
  FileText, Send, CheckCircle2, Download, Plus, Settings,
  Palette, Building2, CreditCard, Eye, Trash2,
} from 'lucide-react';

function BrandingSettingsTab() {
  const { branding, saveBranding, isSaving } = useInvoiceBranding();
  const [form, setForm] = useState<Partial<InvoiceBranding>>(branding);

  // Sync form when branding loads
  React.useEffect(() => {
    if (branding) setForm(branding);
  }, [branding]);

  const update = (key: keyof InvoiceBranding, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => saveBranding(form);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Informations entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nom de l'entreprise</Label>
            <Input value={form.company_name || ''} onChange={e => update('company_name', e.target.value)} placeholder="Mon Entreprise SAS" />
          </div>
          <div>
            <Label>Adresse</Label>
            <Textarea value={form.company_address || ''} onChange={e => update('company_address', e.target.value)} placeholder="123 Rue du Commerce, 75001 Paris" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={form.company_email || ''} onChange={e => update('company_email', e.target.value)} placeholder="contact@entreprise.fr" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.company_phone || ''} onChange={e => update('company_phone', e.target.value)} placeholder="+33 1 23 45 67 89" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Site web</Label>
              <Input value={form.company_website || ''} onChange={e => update('company_website', e.target.value)} placeholder="www.entreprise.fr" />
            </div>
            <div>
              <Label>N° TVA / SIRET</Label>
              <Input value={form.tax_id || ''} onChange={e => update('tax_id', e.target.value)} placeholder="FR12345678901" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Style & Personnalisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL du logo</Label>
            <Input value={form.logo_url || ''} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Couleur d'accent</Label>
              <div className="flex gap-2">
                <input type="color" value={form.accent_color || '#6366f1'} onChange={e => update('accent_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.accent_color || '#6366f1'} onChange={e => update('accent_color', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={form.currency || 'EUR'} onChange={e => update('currency', e.target.value)} placeholder="EUR" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Préfixe facture</Label>
              <Input value={form.invoice_prefix || 'INV'} onChange={e => update('invoice_prefix', e.target.value)} />
            </div>
            <div>
              <Label>Prochain numéro</Label>
              <Input type="number" value={form.next_invoice_number || 1} onChange={e => update('next_invoice_number', parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Pied de page</Label>
            <Input value={form.footer_text || ''} onChange={e => update('footer_text', e.target.value)} placeholder="Merci pour votre confiance !" />
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Conditions de paiement</Label>
              <Input value={form.payment_terms || ''} onChange={e => update('payment_terms', e.target.value)} placeholder="Paiement à 30 jours" />
            </div>
            <div>
              <Label>Coordonnées bancaires</Label>
              <Textarea value={form.bank_details || ''} onChange={e => update('bank_details', e.target.value)} placeholder="IBAN: FR76... / BIC: ..." rows={2} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? 'Enregistrement...' : 'Sauvegarder le branding'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateInvoiceDialog() {
  const { branding } = useInvoiceBranding();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  const updateItem = (idx: number, key: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: value };
      if (key === 'quantity' || key === 'unit_price') {
        updated[idx].total = updated[idx].quantity * updated[idx].unit_price;
      }
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handlePreview = () => {
    const invoiceNum = `${branding.invoice_prefix || 'INV'}-${String(branding.next_invoice_number || 1).padStart(5, '0')}`;
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoiceData: InvoiceData = {
      invoice_number: invoiceNum,
      date: today.toLocaleDateString('fr-FR'),
      due_date: dueDate.toLocaleDateString('fr-FR'),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_address: customerAddress,
      items: items.filter(i => i.description),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes,
    };

    const doc = generateInvoicePDF(invoiceData, branding);
    doc.save(`${invoiceNum}.pdf`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Créer une facture</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom du client</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Client SAS" />
            </div>
            <div>
              <Label>Email client</Label>
              <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="client@email.com" />
            </div>
          </div>
          <div>
            <Label>Adresse client</Label>
            <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="456 Avenue..." />
          </div>

          <Separator />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Lignes de facture</Label>
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Ligne</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {idx === 0 && <Label className="text-xs">Description</Label>}
                    <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Produit / Service" />
                  </div>
                  <div className="w-20">
                    {idx === 0 && <Label className="text-xs">Qté</Label>}
                    <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-28">
                    {idx === 0 && <Label className="text-xs">Prix unit.</Label>}
                    <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-24 text-right">
                    {idx === 0 && <Label className="text-xs">Total</Label>}
                    <div className="h-9 flex items-center justify-end font-medium text-sm">{item.total.toFixed(2)} €</div>
                  </div>
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-9 w-9">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>TVA (%)</Label>
              <Input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1 text-right text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TVA ({taxRate}%)</span><span>{taxAmount.toFixed(2)} €</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toFixed(2)} €</span></div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes additionnelles..." rows={2} />
          </div>

          <Button onClick={handlePreview} disabled={!customerName || items.every(i => !i.description)} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Générer & Télécharger PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BrandingInvoicesHub() {
  const { getInvoices } = useInvoices();
  const { sendInvoice, markPaid } = useInvoices();
  const invoices = getInvoices.data || [];

  return (
    <ChannablePageWrapper
      title="Factures Personnalisées"
      description="Créez des factures brandées avec votre logo, couleurs et infos entreprise"
      heroImage="orders"
      badge={{ label: 'Branded Invoicing', icon: FileText }}
      actions={<CreateInvoiceDialog />}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
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
          <TabsTrigger value="invoices" className="gap-2"><FileText className="h-4 w-4" />Factures</TabsTrigger>
          <TabsTrigger value="branding" className="gap-2"><Settings className="h-4 w-4" />Branding</TabsTrigger>
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
                        <p className="font-bold text-lg">{invoice.total_amount?.toFixed(2) || invoice.amount?.toFixed(2)} {invoice.currency || 'EUR'}</p>
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
              <p className="text-muted-foreground mb-4">Configurez votre branding puis créez votre première facture</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettingsTab />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
