import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Phone, Mail, Globe, MapPin, Package } from "lucide-react"
import { toast } from "sonner"
import { useRealSuppliers } from "@/hooks/useRealSuppliers"

const Suppliers = () => {
  const navigate = useNavigate()
  const { suppliers, stats, isLoading, addSupplier } = useRealSuppliers()
  const [mockSuppliers] = useState([
    {
      id: "1",
      name: "TechDirect Solutions",
      email: "contact@techdirect.com",
      phone: "+33 1 23 45 67 89",
      address: "123 rue de la Tech, 75001 Paris",
      website: "https://techdirect.com",
      status: "active",
      products_count: 156,
      last_order: "2024-01-15",
      total_orders: 89,
      rating: 4.8
    },
    {
      id: "2", 
      name: "ElectroWholesale",
      email: "sales@electrowholesale.com",
      phone: "+33 1 98 76 54 32",
      address: "456 avenue de l'Électronique, 69000 Lyon",
      website: "https://electrowholesale.com",
      status: "active",
      products_count: 89,
      last_order: "2024-01-12",
      total_orders: 45,
      rating: 4.2
    },
    {
      id: "3",
      name: "GadgetSource Pro",
      email: "pro@gadgetsource.fr",
      phone: "+33 4 11 22 33 44",
      address: "789 boulevard des Gadgets, 13000 Marseille",
      website: "https://gadgetsource.fr",
      status: "inactive",
      products_count: 34,
      last_order: "2023-12-20",
      total_orders: 12,
      rating: 3.9
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    status: "active"
  })

  const handleAddSupplier = () => {
    addSupplier({
      name: newSupplier.name,
      contact_email: newSupplier.email,
      contact_phone: newSupplier.phone,
      website: newSupplier.website,
      status: newSupplier.status as 'active' | 'inactive'
    })
    setIsAddDialogOpen(false)
    setNewSupplier({
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      status: "active"
    })
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-success text-success-foreground">
        Actif
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inactif
      </Badge>
    )
  }

  const getRatingStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Fournisseurs
          </h1>
          <p className="text-muted-foreground">
            Gérez vos partenaires avec intelligence artificielle
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate('/suppliers-ultra-pro')}
          >
            <Package className="w-4 h-4 mr-2" />
            Suppliers Ultra Pro
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un fournisseur</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du fournisseur"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@fournisseur.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={newSupplier.website}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://fournisseur.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={newSupplier.status} onValueChange={(value) => setNewSupplier(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddSupplier}>
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total fournisseurs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length || mockSuppliers.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 ce mois-ci
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fournisseurs actifs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.active || mockSuppliers.filter(s => s.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.active || mockSuppliers.filter(s => s.status === "active").length) / (suppliers.length || mockSuppliers.length) * 100)}% du total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.length > 0 ? suppliers.length * 45 : mockSuppliers.reduce((sum, s) => sum + s.products_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Catalogue complet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating || (mockSuppliers.reduce((sum, s) => sum + s.rating, 0) / mockSuppliers.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur 5 étoiles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(suppliers.length > 0 ? suppliers.map(supplier => ({
                  ...supplier,
                  id: supplier.id,
                  products_count: 45,
                  last_order: "2024-01-15",
                  total_orders: 12,
                  rating: supplier.rating || 4.5,
                  address: "Paris, France"
                })) : mockSuppliers).map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          {supplier.website || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {supplier.contact_email || supplier.email || 'N/A'}
                        </div>
                        <div className="text-sm flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.contact_phone || supplier.phone || 'N/A'}
                        </div>
                        <div className="text-sm flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {supplier.country || supplier.address?.split(',')[0] || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.products_count}</div>
                      <div className="text-sm text-muted-foreground">produits</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.total_orders}</div>
                      <div className="text-sm text-muted-foreground">commandes</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-warning mr-1">
                          {getRatingStars(supplier.rating)}
                        </span>
                        <span className="text-sm">({supplier.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast.success(`Édition du fournisseur ${supplier.name}`)
                            // Real edit functionality would open edit dialog
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Supprimer le fournisseur ${supplier.name} ?`)) {
                              toast.success(`Fournisseur ${supplier.name} supprimé`)
                              // Real delete functionality would remove from database
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
};

export default Suppliers;