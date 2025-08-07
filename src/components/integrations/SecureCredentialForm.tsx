import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CredentialField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
  description?: string;
}

interface SecureCredentialFormProps {
  platform: string;
  fields: CredentialField[];
  onSubmit: (credentials: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
  existingCredentials?: Record<string, string>;
}

export const SecureCredentialForm = ({
  platform,
  fields,
  onSubmit,
  isLoading = false,
  existingCredentials = {}
}: SecureCredentialFormProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>(
    existingCredentials
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !credentials[field.name]?.trim())
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Champs requis manquants",
        description: `Veuillez remplir: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate URLs
    const urlFields = fields.filter(field => field.type === 'url');
    for (const field of urlFields) {
      const value = credentials[field.name];
      if (value && !isValidUrl(value)) {
        toast({
          title: "URL invalide",
          description: `L'URL pour ${field.label} n'est pas valide`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await onSubmit(credentials);
    } catch (error) {
      console.error('Credential submission error:', error);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const maskCredential = (value: string, type: string) => {
    if (!value) return '';
    if (type === 'password') {
      return '•'.repeat(Math.min(value.length, 8));
    }
    return value;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="h-5 w-5 text-primary" />
          <CardTitle>Configuration sécurisée - {platform}</CardTitle>
        </div>
        <CardDescription>
          Vos identifiants sont chiffrés et stockés de manière sécurisée
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Toutes les données sensibles sont chiffrées avant d'être stockées. 
            Seuls les identifiants masqués sont visibles dans l'interface.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              
              <div className="relative">
                <Input
                  id={field.name}
                  type={
                    field.type === 'password' && !showPasswords[field.name] 
                      ? 'password' 
                      : 'text'
                  }
                  value={
                    existingCredentials[field.name] && !credentials[field.name]
                      ? maskCredential(existingCredentials[field.name], field.type)
                      : credentials[field.name] || ''
                  }
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    [field.name]: e.target.value
                  }))}
                  placeholder={field.placeholder || `Saisir ${field.label.toLowerCase()}`}
                  required={field.required}
                  className="pr-10"
                />
                
                {field.type === 'password' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => togglePasswordVisibility(field.name)}
                  >
                    {showPasswords[field.name] ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder les identifiants"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};