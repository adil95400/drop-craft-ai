import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

interface ImportFromCSVProps {
  onPreview: (data: any) => void;
}

export function ImportFromCSV({ onPreview }: ImportFromCSVProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handlePreview = () => {
    if (!file) return;

    // Simuler le parsing du CSV et preview
    const previewData = {
      source: 'csv',
      filename: file.name,
      products: [
        {
          id: '1',
          title: 'Produit CSV 1',
          price: 19.99,
          supplier: 'Import CSV',
          image: '/placeholder.svg',
          stock: 'En stock',
          errors: []
        },
        {
          id: '2',
          title: 'Produit CSV 2',
          price: 29.99,
          supplier: 'Import CSV',
          image: '/placeholder.svg',
          stock: 'En stock',
          errors: ['Prix manquant']
        }
      ],
      summary: {
        total: 2,
        valid: 1,
        errors: 1,
        warnings: 0
      }
    };

    onPreview(previewData);
  };

  const handleDownloadTemplate = () => {
    // Créer un CSV template
    const csvContent = `title,description,price,sku,stock,supplier,image_url
"Exemple Produit 1","Description du produit",29.99,SKU-001,100,"Fournisseur A","https://example.com/image1.jpg"
"Exemple Produit 2","Description du produit",39.99,SKU-002,50,"Fournisseur B","https://example.com/image2.jpg"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "📥 Template téléchargé",
      description: "Utilisez ce fichier comme modèle pour vos imports"
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Fichier CSV ou Excel</Label>
        
        <div
          {...getRootProps()}
          className={`mt-1.5 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            {file ? (
              <>
                <FileSpreadsheet className="w-12 h-12 text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground" />
                <p className="font-medium">
                  {isDragActive
                    ? 'Déposez le fichier ici'
                    : 'Glissez-déposez un fichier ou cliquez pour sélectionner'}
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, XLS ou XLSX (max 20MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Télécharger template
        </Button>

        <Button
          onClick={handlePreview}
          disabled={!file}
        >
          <Eye className="w-4 h-4 mr-2" />
          Prévisualiser
        </Button>
      </div>

      <Alert>
        <AlertDescription className="text-xs space-y-2">
          <p><strong>Format attendu :</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Colonnes: title, description, price, sku, stock, supplier, image_url</li>
            <li>Une ligne par produit</li>
            <li>Prix au format décimal (ex: 29.99)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
