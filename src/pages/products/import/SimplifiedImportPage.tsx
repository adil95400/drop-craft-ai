import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedImportSource } from '@/components/import/UnifiedImportSource';
import { ImportPreview } from '@/components/import/ImportPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useOptimizedImport } from '@/hooks/useOptimizedImport';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type ImportStep = 'source' | 'upload' | 'preview' | 'importing';

export default function SimplifiedImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>('source');
  const [selectedSource, setSelectedSource] = useState<string>();
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const { importData, isImporting, progress } = useOptimizedImport();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadedFile(file);
      
      // Parse file for preview
      try {
        const text = await file.text();
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map((row, idx) => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim() || '';
          });
          return obj;
        });

        // Validate data
        const errors: Array<{ row: number; error: string }> = [];
        data.forEach((row, idx) => {
          if (!row.name) {
            errors.push({ row: idx + 1, error: 'Missing product name' });
          }
          if (!row.price || isNaN(parseFloat(row.price))) {
            errors.push({ row: idx + 1, error: 'Invalid or missing price' });
          }
        });

        setPreviewData(data);
        setPreviewErrors(errors);
        setStep('preview');
      } catch (error) {
        toast({
          title: 'Error parsing file',
          description: 'Unable to read the file. Please check the format.',
          variant: 'destructive'
        });
      }
    }
  });

  const handleSourceSelect = (sourceType: string) => {
    setSelectedSource(sourceType);
    if (sourceType === 'csv') {
      setStep('upload');
    } else {
      toast({
        title: 'Coming soon',
        description: `Import from ${sourceType} will be available soon.`
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!uploadedFile) return;

    setStep('importing');
    
    importData(uploadedFile, {
      format: 'csv',
      batchSize: 50
    });

    // Wait for import to complete
    setTimeout(() => {
      toast({
        title: 'Import complete',
        description: `Successfully imported ${previewData.length - previewErrors.length} products`
      });
      navigate('/products/import/manage');
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 'source') {
              navigate('/products/import/manage');
            } else {
              setStep('source');
              setSelectedSource(undefined);
              setPreviewData([]);
              setPreviewErrors([]);
              setUploadedFile(null);
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Import Products</h1>
        <p className="text-muted-foreground mt-2">
          Simplified workflow to import products from multiple sources
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'source' || step === 'upload' || step === 'preview' || step === 'importing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className={`h-1 w-16 ${step === 'upload' || step === 'preview' || step === 'importing' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'upload' || step === 'preview' || step === 'importing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className={`h-1 w-16 ${step === 'preview' || step === 'importing' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'preview' || step === 'importing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'source' && (
        <UnifiedImportSource
          onSelectSource={handleSourceSelect}
          selectedSource={selectedSource}
        />
      )}

      {step === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Drop your file here' : 'Upload CSV or Excel file'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop or click to select a file
              </p>
              <Button variant="outline">Choose File</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{previewData.length}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{previewData.length - previewErrors.length}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{previewErrors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Errors */}
            {previewErrors.length > 0 && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="font-medium mb-2">{previewErrors.length} errors found:</p>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {previewErrors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setPreviewData([]);
                  setPreviewErrors([]);
                  setUploadedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmImport} disabled={isImporting || (previewData.length - previewErrors.length) === 0}>
                {isImporting ? 'Importing...' : `Import ${previewData.length - previewErrors.length} Products`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Importing Products</h3>
            <p className="text-muted-foreground mb-4">Please wait while we import your products...</p>
            <div className="w-full max-w-md mx-auto bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
