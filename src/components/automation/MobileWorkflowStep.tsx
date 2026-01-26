import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  step_type: string;
  step_config: Record<string, any>;
  position: number;
}

interface StepTypeInfo {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description: string;
}

interface MobileWorkflowStepProps {
  step: WorkflowStep;
  stepType: StepTypeInfo | undefined;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onConfigure: () => void;
}

export function MobileWorkflowStep({
  step,
  stepType,
  index,
  isSelected,
  onSelect,
  onRemove,
  onConfigure,
}: MobileWorkflowStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = stepType?.icon || Settings;

  // Haptic feedback on drag start
  const handleDragStart = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative touch-manipulation select-none',
        isDragging && 'z-50'
      )}
      {...attributes}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-3 border rounded-lg bg-card transition-all duration-200',
          isSelected && 'border-primary bg-primary/5 shadow-md',
          isDragging && 'shadow-xl scale-[1.02] opacity-95 border-primary',
          !isSelected && !isDragging && 'hover:border-muted-foreground/30'
        )}
      >
        {/* Drag Handle - Large touch target */}
        <div
          {...listeners}
          onTouchStart={handleDragStart}
          className="flex items-center justify-center w-12 h-12 -ml-1 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Glisser pour réordonner"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Step Content - Clickable area */}
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 flex items-center gap-3 min-h-[44px] text-left"
        >
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            isSelected ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              isSelected ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {stepType?.label || step.step_type}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {index + 1}
              </Badge>
            </div>
            {stepType?.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {stepType.description}
              </p>
            )}
          </div>
        </button>

        {/* Action Buttons - Touch-friendly */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            aria-label="Configurer"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(5);
              onRemove();
            }}
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
