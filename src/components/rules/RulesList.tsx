import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  GripVertical, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Play,
  Zap,
  ArrowRight,
  Clock,
  Hash
} from 'lucide-react'
import type { FeedRule } from '@/lib/rules/ruleTypes'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface RulesListProps {
  rules: FeedRule[]
  onEdit: (rule: FeedRule) => void
  onDuplicate: (rule: FeedRule) => void
  onDelete: (ruleId: string) => void
  onToggle: (rule: FeedRule) => void
  onPreview?: (rule: FeedRule) => void
  onReorder?: (rules: FeedRule[]) => void
}

export function RulesList({ 
  rules, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggle,
  onPreview,
  onReorder 
}: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune règle configurée</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Créez des règles IF/THEN pour transformer automatiquement vos produits avant de les exporter vers les marketplaces.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <Card 
          key={rule.id} 
          className={`transition-all ${!rule.isActive ? 'opacity-60' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Drag handle */}
              <div className="flex items-center text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Priority badge */}
              <Badge variant="outline" className="shrink-0">
                #{rules.length - index}
              </Badge>

              {/* Rule info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{rule.name}</h4>
                  {!rule.isActive && (
                    <Badge variant="secondary" className="shrink-0">
                      Inactif
                    </Badge>
                  )}
                </div>
                {rule.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {rule.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>{rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}</span>
                </div>
                {rule.appliedCount !== undefined && rule.appliedCount > 0 && (
                  <div className="flex items-center gap-1.5" title="Nombre d'applications">
                    <Hash className="h-3.5 w-3.5" />
                    <span>{rule.appliedCount.toLocaleString()}</span>
                  </div>
                )}
                {rule.lastAppliedAt && (
                  <div className="flex items-center gap-1.5" title="Dernière application">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(rule.lastAppliedAt), { 
                        addSuffix: true,
                        locale: getDateFnsLocale() 
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <Switch
                checked={rule.isActive}
                onCheckedChange={() => onToggle(rule)}
                aria-label={rule.isActive ? 'Désactiver la règle' : 'Activer la règle'}
              />

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(rule)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  {onPreview && (
                    <DropdownMenuItem onClick={() => onPreview(rule)}>
                      <Play className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(rule.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
