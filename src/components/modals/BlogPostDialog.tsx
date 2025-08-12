import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface BlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlogPostDialog = ({ open, onOpenChange }: BlogPostDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    aiGenerated: false
  });

  const handleCreate = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le titre et le contenu",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Article créé avec succès",
      description: `L'article "${formData.title}" a été ${formData.status === 'draft' ? 'sauvegardé en brouillon' : 'publié'}.`,
    });

    onOpenChange(false);
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      aiGenerated: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un Nouvel Article</DialogTitle>
          <DialogDescription>
            Rédigez un nouvel article pour votre blog
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'article</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Un titre accrocheur pour votre article"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Un court résumé de votre article..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Le contenu complet de votre article..."
              rows={8}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dropshipping">Dropshipping</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                  <SelectItem value="actualites">Actualités</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="dropshipping, marketing, ecommerce"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seoTitle">Titre SEO</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              placeholder="Titre optimisé pour les moteurs de recherche"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seoDescription">Description SEO</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              placeholder="Description optimisée pour les moteurs de recherche"
              rows={2}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="aiGenerated"
              checked={formData.aiGenerated}
              onCheckedChange={(checked) => setFormData({ ...formData, aiGenerated: checked })}
            />
            <Label htmlFor="aiGenerated">Contenu généré par IA</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate}>
            {formData.status === 'published' ? 'Publier' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};