import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useSuppliersUnified } from '@/hooks/unified'
import { supplierSchema, type SupplierFormData } from '@/lib/validation/supplierSchema'
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Package,
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react'

export default function CreateSupplier() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refetch, isLoading: isAdding } = useSuppliersUnified()
  const [contacts, setContacts] = useState<Array<{ name: string; email: string; phone: string; role: string }>>([])
  const [documents, setDocuments] = useState<Array<{ name: string; type: string; url: string }>>([])
  const [logo, setLogo] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      isActive: true,
      isPreferred: false,
      category: 'other',
      paymentTerms: 'net30'
    }
  })

  const category = watch('category')
  const paymentTerms = watch('paymentTerms')
  const isActive = watch('isActive')
  const isPreferred = watch('isPreferred')

  const onSubmit = async (data: SupplierFormData) => {
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await (await import('@/integrations/supabase/client')).supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: data.companyName,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          country: data.country || null,
          supplier_type: 'api',
          status: data.isActive ? 'active' : 'inactive',
          notes: data.address ? `${data.address}, ${data.city || ''} ${data.postalCode || ''}`.trim() : null,
          rating: data.isPreferred ? 5 : null,
          metadata: {
            category: data.category,
            payment_terms: data.paymentTerms,
            tax_id: data.taxId,
            city: data.city,
            postal_code: data.postalCode,
            is_preferred: data.isPreferred,
            contacts,
            documents
          }
        })

      if (error) throw error

      toast({
        title: "Fournisseur créé",
        description: `${data.companyName} a été ajouté avec succès`,
      })
      refetch()
      navigate('/suppliers')
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le fournisseur",
        variant: "destructive"
      })
    }
  }

  const addContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '', role: '' }])
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const categories = [
    { value: 'electronics', label: 'Électronique' },
    { value: 'clothing', label: 'Vêtements' },
    { value: 'food', label: 'Alimentation' },
    { value: 'beauty', label: 'Beauté' },
    { value: 'home', label: 'Maison' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Autre' }
  ]

  const paymentTermsOptions = [
    { value: 'immediate', label: 'Immédiat' },
    { value: 'net15', label: 'Net 15 jours' },
    { value: 'net30', label: 'Net 30 jours' },
    { value: 'net60', label: 'Net 60 jours' },
    { value: 'prepayment', label: 'Prépaiement' }
  ]

  return (
    <>
      <Helmet>
        <title>Nouveau Fournisseur - ShopOpti</title>
        <meta name="description" content="Ajoutez un nouveau fournisseur à votre réseau" />
      </Helmet>

      <ChannablePageWrapper
        title="Nouveau Fournisseur"
        description="Ajoutez un nouveau partenaire à votre réseau de fournisseurs"
        heroImage="suppliers"
        badge={{ label: 'Fournisseurs', icon: Building2 }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/suppliers')}>
              Annuler
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isAdding}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isAdding ? 'Création...' : 'Créer le fournisseur'}
            </Button>
          </div>
        }
      >

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="commercial">Commercial</TabsTrigger>
              <TabsTrigger value="logistics">Logistique</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Général */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informations Générales
                  </CardTitle>
                  <CardDescription>
                    Informations de base sur le fournisseur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Logo de l'entreprise</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        {logo ? (
                          <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <Button type="button" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger un logo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG jusqu'à 2MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom de l'entreprise */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Nom de l'entreprise <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        {...register('companyName')}
                        placeholder="Ex: Tech Wholesale Ltd"
                      />
                      {errors.companyName && (
                        <p className="text-sm text-destructive">{errors.companyName.message}</p>
                      )}
                    </div>

                    {/* Nom du contact */}
                    <div className="space-y-2">
                      <Label htmlFor="contactName">
                        Contact principal <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        {...register('contactName')}
                        placeholder="Ex: Jean Dupont"
                      />
                      {errors.contactName && (
                        <p className="text-sm text-destructive">{errors.contactName.message}</p>
                      )}
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select
                        value={category}
                        onValueChange={(value) => setValue('category', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Site web */}
                    <div className="space-y-2">
                      <Label htmlFor="website">Site web</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          {...register('website')}
                          placeholder="https://example.com"
                          className="pl-9"
                        />
                      </div>
                      {errors.website && (
                        <p className="text-sm text-destructive">{errors.website.message}</p>
                      )}
                    </div>

                    {/* Numéro de TVA */}
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Numéro de TVA</Label>
                      <Input
                        id="taxId"
                        {...register('taxId')}
                        placeholder="Ex: FR12345678901"
                      />
                      {errors.taxId && (
                        <p className="text-sm text-destructive">{errors.taxId.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Statuts */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Fournisseur actif</Label>
                        <p className="text-sm text-muted-foreground">
                          Activer ce fournisseur pour passer des commandes
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => setValue('isActive', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Fournisseur préféré</Label>
                        <p className="text-sm text-muted-foreground">
                          Marquer comme fournisseur privilégié
                        </p>
                      </div>
                      <Switch
                        checked={isPreferred}
                        onCheckedChange={(checked) => setValue('isPreferred', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Coordonnées
                  </CardTitle>
                  <CardDescription>
                    Informations de contact et adresse
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="contact@example.com"
                          className="pl-9"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          {...register('phone')}
                          placeholder="+33 1 23 45 67 89"
                          className="pl-9"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="123 Rue du Commerce"
                        className="pl-9"
                        rows={2}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ville */}
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        {...register('city')}
                        placeholder="Paris"
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city.message}</p>
                      )}
                    </div>

                    {/* Code postal */}
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        {...register('postalCode')}
                        placeholder="75001"
                      />
                      {errors.postalCode && (
                        <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                      )}
                    </div>

                    {/* Pays */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        {...register('country')}
                        placeholder="France"
                      />
                      {errors.country && (
                        <p className="text-sm text-destructive">{errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Contacts supplémentaires */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Contacts supplémentaires</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addContact}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un contact
                      </Button>
                    </div>

                    {contacts.map((contact, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <Input
                                placeholder="Nom"
                                value={contact.name}
                                onChange={(e) => {
                                  const newContacts = [...contacts]
                                  newContacts[index].name = e.target.value
                                  setContacts(newContacts)
                                }}
                              />
                              <Input
                                placeholder="Rôle"
                                value={contact.role}
                                onChange={(e) => {
                                  const newContacts = [...contacts]
                                  newContacts[index].role = e.target.value
                                  setContacts(newContacts)
                                }}
                              />
                              <Input
                                type="email"
                                placeholder="Email"
                                value={contact.email}
                                onChange={(e) => {
                                  const newContacts = [...contacts]
                                  newContacts[index].email = e.target.value
                                  setContacts(newContacts)
                                }}
                              />
                              <Input
                                placeholder="Téléphone"
                                value={contact.phone}
                                onChange={(e) => {
                                  const newContacts = [...contacts]
                                  newContacts[index].phone = e.target.value
                                  setContacts(newContacts)
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeContact(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commercial */}
            <TabsContent value="commercial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Conditions Commerciales
                  </CardTitle>
                  <CardDescription>
                    Termes de paiement et commandes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Conditions de paiement */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                      <Select
                        value={paymentTerms}
                        onValueChange={(value) => setValue('paymentTerms', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTermsOptions.map((term) => (
                            <SelectItem key={term.value} value={term.value}>
                              {term.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Commande minimum */}
                    <div className="space-y-2">
                      <Label htmlFor="minimumOrder">Commande minimum (€)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="minimumOrder"
                          type="number"
                          step="0.01"
                          {...register('minimumOrder', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="pl-9"
                        />
                      </div>
                      {errors.minimumOrder && (
                        <p className="text-sm text-destructive">{errors.minimumOrder.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes commerciales</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Informations importantes sur les conditions commerciales..."
                      rows={4}
                    />
                    {errors.notes && (
                      <p className="text-sm text-destructive">{errors.notes.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logistique */}
            <TabsContent value="logistics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations Logistiques
                  </CardTitle>
                  <CardDescription>
                    Délais et conditions de livraison
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Délai de livraison (jours)</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deliveryTime"
                        type="number"
                        {...register('deliveryTime', { valueAsNumber: true })}
                        placeholder="7"
                        className="pl-9"
                      />
                    </div>
                    {errors.deliveryTime && (
                      <p className="text-sm text-destructive">{errors.deliveryTime.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Délai moyen entre la commande et la livraison
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Conseils logistiques</p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• Négociez les délais de livraison pour optimiser votre stock</li>
                          <li>• Définissez des conditions de livraison claires (Incoterms)</li>
                          <li>• Prévoyez des alternatives en cas de retards</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents & Certifications
                  </CardTitle>
                  <CardDescription>
                    Contrats, certifications et documents administratifs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                      Glissez-déposez vos documents ici
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      ou cliquez pour parcourir
                    </p>
                    <Button type="button" variant="outline">
                      Parcourir les fichiers
                    </Button>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <Label>Documents téléchargés</Label>
                      <div className="space-y-2">
                        {documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.type}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Documents recommandés :</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Contrat de fourniture</li>
                      <li>• Certificat d'assurance</li>
                      <li>• Certifications qualité (ISO, etc.)</li>
                      <li>• Conditions générales de vente</li>
                      <li>• Extrait Kbis ou document équivalent</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </ChannablePageWrapper>
    </>
  )
}
