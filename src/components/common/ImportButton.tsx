import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, FileText, FileSpreadsheet, Link, Loader2, Zap } from "lucide-react";
import { ActionHelpers } from "@/utils/actionHelpers";
import { toast } from "sonner";
import { ActionModal } from "./ActionModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CSVImportWizard } from "@/components/import/CSVImportWizard";

interface ImportButtonProps {
  onImport?: (data: any[], source: 'file' | 'url') => void;
  onFileSelect?: (file: File) => void;
  onUrlImport?: (url: string) => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  acceptedFileTypes?: string[];
}

export function ImportButton({
  onImport,
  onFileSelect,
  onUrlImport,
  disabled = false,
  variant = "outline",
  size = "sm",
  acceptedFileTypes = ['.csv', '.json', '.xlsx']
}: ImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showCSVWizard, setShowCSVWizard] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      if (onFileSelect) {
        onFileSelect(file);
      } else if (onImport) {
        await ActionHelpers.importData(file, (data) => {
          onImport(data, 'file');
        });
      }
    } catch (error) {
      toast.error("Erreur lors de l'import du fichier");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toast.error("Veuillez saisir une URL valide");
      return;
    }

    setIsImporting(true);
    
    try {
      if (onUrlImport) {
        onUrlImport(importUrl);
      } else {
        // Simulation d'import URL
        toast.success("Import depuis URL lancé");
        setTimeout(() => {
          toast.success("Import URL terminé");
          if (onImport) {
            onImport([{ url: importUrl, imported_at: new Date().toISOString() }], 'url');
          }
        }, 2000);
      }
      
      setShowUrlModal(false);
      setImportUrl("");
    } catch (error) {
      toast.error("Erreur lors de l'import depuis l'URL");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            disabled={disabled || isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleFileImport}>
            <FileText className="w-4 h-4 mr-2" />
            Import Simple CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCSVWizard(true)}>
            <Zap className="w-4 h-4 mr-2" />
            Assistant CSV Avancé
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFileImport}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Fichier Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowUrlModal(true)}>
            <Link className="w-4 h-4 mr-2" />
            Depuis URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedFileTypes.join(',')}
        style={{ display: 'none' }}
      />

      {/* Modal import URL */}
      <ActionModal
        open={showUrlModal}
        onOpenChange={setShowUrlModal}
        title="Import depuis URL"
        description="Importez des données depuis une URL externe"
        onConfirm={handleUrlImport}
        confirmText="Importer"
        loading={isImporting}
        disabled={!importUrl.trim()}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="import-url">URL des données</Label>
            <Input
              id="import-url"
              placeholder="https://example.com/data.csv"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
          </div>
        </div>
      </ActionModal>

      {/* CSV Import Wizard */}
      <Dialog open={showCSVWizard} onOpenChange={setShowCSVWizard}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assistant d'Import CSV Avancé</DialogTitle>
          </DialogHeader>
          <CSVImportWizard />
        </DialogContent>
      </Dialog>
    </>
  );
}