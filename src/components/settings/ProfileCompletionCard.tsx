import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Mail, 
  Shield, 
  Building, 
  Globe, 
  Camera,
  ChevronRight
} from "lucide-react";

interface ProfileCompletionCardProps {
  hasAvatar: boolean;
  isEmailVerified: boolean;
  has2FA: boolean;
  hasCompany: boolean;
  hasWebsite: boolean;
  hasBio: boolean;
  onAction?: (action: string) => void;
}

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ElementType;
  actionLabel?: string;
}

export function ProfileCompletionCard({
  hasAvatar,
  isEmailVerified,
  has2FA,
  hasCompany,
  hasWebsite,
  hasBio,
  onAction
}: ProfileCompletionCardProps) {
  const items: CompletionItem[] = [
    { id: 'avatar', label: 'Photo de profil', completed: hasAvatar, icon: Camera, actionLabel: 'Ajouter' },
    { id: 'email', label: 'Email vérifié', completed: isEmailVerified, icon: Mail },
    { id: '2fa', label: 'Double authentification', completed: has2FA, icon: Shield, actionLabel: 'Activer' },
    { id: 'company', label: 'Entreprise renseignée', completed: hasCompany, icon: Building, actionLabel: 'Ajouter' },
    { id: 'website', label: 'Site web ajouté', completed: hasWebsite, icon: Globe, actionLabel: 'Ajouter' },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Complétion du profil
          </CardTitle>
          <Badge 
            variant={percentage >= 80 ? "default" : "secondary"}
            className={percentage >= 80 ? "bg-green-500" : ""}
          >
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{completedCount}/{items.length} étapes complétées</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                item.completed ? 'bg-green-500/5' : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <item.icon className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
              
              {!item.completed && item.actionLabel && onAction && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onAction(item.id)}
                >
                  {item.actionLabel}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
