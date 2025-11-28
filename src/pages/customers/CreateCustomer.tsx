import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, Users, Mail, Phone, MapPin, Building2,
  Tag, Plus, X, UserCircle2, Globe, Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Address {
  id: string;
  type: 'billing' | 'shipping';
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', type: 'billing', address: '', city: '', postalCode: '', country: 'France', isDefault: true }
  ]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'individual',
    language: 'fr',
    taxId: '',
    website: '',
    notes: '',
    acceptsMarketing: false,
    tags: [] as string[],
    segment: '',
    source: '',
    birthday: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  const addAddress = () => {
    setAddresses([...addresses, {
      id: Date.now().toString(),
      type: 'shipping',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      isDefault: false
    }]);
  };

  const updateAddress = (id: string, field: keyof Address, value: any) => {
    setAddresses(addresses.map(addr => addr.id === id ? { ...addr, [field]: value } : addr));
  };

  const removeAddress = (id: string) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const setDefaultAddress = (id: string, type: 'billing' | 'shipping') => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id && addr.type === type ? true : (addr.type === type ? false : addr.isDefault)
    })));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Prénom, nom et email sont requis');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      // Préparer les adresses
      const addressData = addresses.reduce((acc, addr) => {
        const key = addr.type === 'billing' ? 'billing_address' : 'shipping_address';
        if (addr.isDefault) {
          acc[key] = {
            street: addr.address,
            city: addr.city,
            postal_code: addr.postalCode,
            country: addr.country
          };
        }
        return acc;
      }, {} as any);

      // Insertion dans la base de données
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          status: 'active',
          address: addressData,
          tags: formData.tags,
          total_orders: 0,
          total_spent: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Client créé avec succès');
      navigate('/customers');
    } catch (error) {
      console.error('Erreur création client:', error);
      toast.error('Erreur lors de la création du client');
    }
  };

  const getInitials = () => {
    return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>Créer un Client - ShopOpti</title>
        <meta name="description" content="Ajoutez un nouveau client avec profil complet et historique" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/customers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => toast.info('Brouillon sauvegardé')}>
                Sauvegarder
              </Button>
              <Button onClick={handleSubmit}>
                Créer le client
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle2 className="h-5 w-5 text-primary" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="text-2xl">
                            {getInitials() || <UserCircle2 className="h-12 w-12" />}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                          <Plus className="h-4 w-4" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Photo du profil client
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG ou GIF • Max 2MB
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerType">Type de client</Label>
                      <Select value={formData.customerType} onValueChange={(value) => setFormData({ ...formData, customerType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Particulier
                            </div>
                          </SelectItem>
                          <SelectItem value="business">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Professionnel / Entreprise
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Jean"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Dupont"
                          required
                        />
                      </div>
                    </div>

                    {formData.customerType === 'business' && (
                      <div className="space-y-2">
                        <Label htmlFor="company">Entreprise</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jean.dupont@email.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.customerType === 'business' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxId">Numéro TVA</Label>
                          <Input
                            id="taxId"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            placeholder="FR12345678901"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Site web</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              type="url"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              placeholder="https://example.com"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Langue préférée</Label>
                        <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthday">Date de naissance</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="birthday"
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Adresses
                        </CardTitle>
                        <CardDescription>
                          Adresses de facturation et de livraison
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Select 
                              value={address.type} 
                              onValueChange={(value: 'billing' | 'shipping') => updateAddress(address.id, 'type', value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="billing">Facturation</SelectItem>
                                <SelectItem value="shipping">Livraison</SelectItem>
                              </SelectContent>
                            </Select>
                            {address.isDefault && (
                              <Badge variant="secondary">Par défaut</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!address.isDefault && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultAddress(address.id, address.type)}
                              >
                                Définir par défaut
                              </Button>
                            )}
                            {addresses.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAddress(address.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Adresse</Label>
                          <Input
                            value={address.address}
                            onChange={(e) => updateAddress(address.id, 'address', e.target.value)}
                            placeholder="123 rue de la République"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Ville</Label>
                            <Input
                              value={address.city}
                              onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                              placeholder="Paris"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Code postal</Label>
                            <Input
                              value={address.postalCode}
                              onChange={(e) => updateAddress(address.id, 'postalCode', e.target.value)}
                              placeholder="75001"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Pays</Label>
                            <Select 
                              value={address.country} 
                              onValueChange={(value) => updateAddress(address.id, 'country', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="Belgium">Belgique</SelectItem>
                                <SelectItem value="Switzerland">Suisse</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes et informations complémentaires</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ajoutez des notes sur ce client..."
                        rows={4}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Accepte le marketing</Label>
                        <p className="text-sm text-muted-foreground">
                          Le client accepte de recevoir des emails marketing
                        </p>
                      </div>
                      <Switch
                        checked={formData.acceptsMarketing}
                        onCheckedChange={(checked) => setFormData({ ...formData, acceptsMarketing: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="segment">Segment client</Label>
                      <Select value={formData.segment} onValueChange={(value) => setFormData({ ...formData, segment: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="regular">Régulier</SelectItem>
                          <SelectItem value="new">Nouveau</SelectItem>
                          <SelectItem value="at-risk">À risque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source">Source d'acquisition</Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Site web</SelectItem>
                          <SelectItem value="social">Réseaux sociaux</SelectItem>
                          <SelectItem value="referral">Parrainage</SelectItem>
                          <SelectItem value="advertising">Publicité</SelectItem>
                          <SelectItem value="store">Magasin physique</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Tags personnalisés</Label>
                      <div className="flex gap-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="Ajouter un tag"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" size="icon" variant="outline" onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Suggestions: Premium, Fidèle, B2B, VIP
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                        <UserCircle2 className="h-5 w-5" />
                        <p className="font-medium">Profil complet</p>
                      </div>
                      <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Informations de contact</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Au moins une adresse</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-300" />
                          <span>Tags et segmentation (optionnel)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
