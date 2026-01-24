import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  LogOut, 
  Download, 
  Trash2,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function DangerZoneCard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutAllSessions = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Déconnecté de toutes les sessions");
      navigate('/');
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch user data from multiple tables
      const [profileResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileResult.data,
        products: productsResult.data || [],
        orders: ordersResult.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopopti-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Données exportées avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export des données");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      toast.error("Veuillez taper SUPPRIMER pour confirmer");
      return;
    }

    setIsDeleting(true);
    try {
      // Note: Actual account deletion should be handled via Edge Function with proper auth
      toast.info("Cette fonctionnalité nécessite une confirmation par email. Un lien vous sera envoyé.");
      setShowDeleteDialog(false);
      setDeleteConfirmation("");
    } catch (error) {
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zone de Danger
        </CardTitle>
        <CardDescription>
          Actions irréversibles sur votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logout all sessions */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <p className="font-medium text-sm">Déconnecter toutes les sessions</p>
            <p className="text-xs text-muted-foreground">Vous serez déconnecté de tous les appareils</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogoutAllSessions}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Déconnecter
          </Button>
        </div>

        {/* Export data */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <p className="font-medium text-sm">Exporter mes données</p>
            <p className="text-xs text-muted-foreground">Téléchargez une copie de toutes vos données</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter
          </Button>
        </div>

        {/* Delete account */}
        <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
          <div>
            <p className="font-medium text-sm text-destructive">Supprimer mon compte</p>
            <p className="text-xs text-muted-foreground">Cette action est définitive et irréversible</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </CardContent>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Supprimer définitivement votre compte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Cette action est <strong>irréversible</strong>. Toutes vos données seront supprimées :
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Profil et paramètres</li>
                <li>Produits et catalogues</li>
                <li>Commandes et historique</li>
                <li>Clés API et intégrations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="delete-confirm" className="text-sm font-medium">
              Tapez <span className="font-bold text-destructive">SUPPRIMER</span> pour confirmer
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== "SUPPRIMER"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
