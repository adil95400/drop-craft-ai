import { Button } from "@/components/ui/button";
import { AutomationWorkflow } from "@/services/automation/AutomationEngine";

interface WorkflowBuilderProps {
  workflow?: AutomationWorkflow | null;
  onSave: (workflow: AutomationWorkflow) => void;
  onCancel: () => void;
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-muted-foreground">Workflow Builder coming soon...</p>
        <p className="text-sm text-muted-foreground mt-2">
          This will be a visual workflow designer with drag-and-drop interface
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(workflow as any)}>
            Save Mock Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}