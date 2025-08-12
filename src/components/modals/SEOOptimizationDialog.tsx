import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SEOOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}

export const SEOOptimizationDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  productName = "Produit" 
}: SEOOptimizationDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keywords: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    optimizationLevel: "basic"
  });

  const handleOptimize = () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le titre et la description",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "SEO optimisé avec succès",
      description: `Les métadonnées SEO de "${productName}" ont été mises à jour.`,
    });

    onOpenChange(false);
    setFormData({
      title: "",
      description: "",
      keywords: "",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      optimizationLevel: "basic"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Optimisation SEO</DialogTitle>
          <DialogDescription>
            Optimisez le référencement pour "{productName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="optimizationLevel">Niveau d'optimisation</Label>
            <Select value={formData.optimizationLevel} onValueChange={(value) => setFormData({ ...formData, optimizationLevel: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basique</SelectItem>
                <SelectItem value="advanced">Avancé</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Titre SEO</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre optimisé pour le SEO (max 60 caractères)"
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">{formData.title.length}/60 caractères</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description SEO</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optimisée pour le SEO (max 160 caractères)"
              maxLength={160}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">{formData.description.length}/160 caractères</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">Mots-clés</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="mot-clé1, mot-clé2, mot-clé3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-optimisee-seo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title (Avancé)</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="Titre spécifique pour les balises meta"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description (Avancé)</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              placeholder="Description spécifique pour les balises meta"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleOptimize}>
            Optimiser SEO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};