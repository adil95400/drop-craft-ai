import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Mail, Phone, TrendingUp, Target, Search, Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useCustomersUnified } from "@/hooks/unified";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function CrmPage() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { customers, stats, isLoading, add: addCustomer, isAdding } = useCustomersUnified({ filters: { search } });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter customers by search
  const filteredCustomers = search
    ? customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  // Calculate new contacts (created this month)
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newContacts = customers.filter(c => new Date(c.created_at) >= thisMonth).length;

  const handleAddContact = async () => {
    if (!newContact.email) {
      toast({ title: "Erreur", description: "L'email est requis", variant: "destructive" });
      return;
    }
    
    addCustomer({
      name: `${newContact.first_name} ${newContact.last_name}`.trim() || newContact.email,
      email: newContact.email,
      phone: newContact.phone || undefined,
      status: 'inactive',
      total_orders: 0,
      total_spent: 0,
    });
    setNewContact({ first_name: "", last_name: "", email: "", phone: "" });
    setIsAddDialogOpen(false);
  };

  const handleDeleteContact = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['real-customers'] });
      toast({ title: "Contact supprimé", description: "Le contact a été supprimé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le contact", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestion de la relation client</p>
        </div>
        <Badge variant="secondary">Pro</Badge>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Contacts</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-lg sm:text-2xl font-bold">{stats.total.toLocaleString()}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Nouveaux</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-lg sm:text-2xl font-bold">{newContacts}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Actifs</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-lg sm:text-2xl font-bold">{stats.active}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Conversion</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-lg sm:text-2xl font-bold">
                  {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : "0"}%
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <Button onClick={handleAddContact} disabled={isAdding} className="w-full">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer le contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contacts List */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Liste des contacts</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="space-y-3">
            {filteredCustomers.slice(0, 20).map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {(customer.name?.[0] || customer.email[0]).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{customer.name || customer.email}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{customer.total_orders} commandes</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.total_spent?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <Badge variant={customer.status === 'active' ? "default" : "secondary"}>
                    {customer.status === 'active' ? "Actif" : "Prospect"}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteContact(customer.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            
            {filteredCustomers.length > 20 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Et {filteredCustomers.length - 20} autres contacts...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun contact</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter vos premiers contacts
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un contact
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
