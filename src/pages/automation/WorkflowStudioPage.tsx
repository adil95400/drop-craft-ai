/**
 * Workflow Studio - Enhanced with Visual Canvas + Node Config
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Workflow, Plus, Save, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { VisualWorkflowCanvas, type WorkflowNode } from '@/components/workflows/VisualWorkflowCanvas';
import { NodeConfigPanel } from '@/components/workflows/NodeConfigPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/integrations/supabase/types';

export default function WorkflowStudioPage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['studio-workflows'],
    queryFn: async () => {
      const { data } = await supabase.from('automation_workflows').select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('automation_workflows').insert({
        name: workflowName,
        description: `${nodes.length} étapes`,
        steps: nodes as unknown as Json,
        trigger_type: nodes.find(n => n.type === 'trigger')?.name || 'manual',
        is_active: false,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Workflow sauvegardé' });
      queryClient.invalidateQueries({ queryKey: ['studio-workflows'] });
      setShowCreate(false);
      setNodes([]);
      setWorkflowName('');
      setSelectedNode(null);
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const handleNodeUpdate = (updated: WorkflowNode) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setSelectedNode(updated);
  };

  return (
    <ChannablePageWrapper
      title="Workflow Studio"
      subtitle="Automatisation visuelle"
      description="Créez des workflows d'automatisation avec un builder visuel drag & drop"
      heroImage="automation"
      badge={{ label: 'Studio', icon: Workflow }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/automation/history"><History className="h-4 w-4 mr-2" /> Historique</Link>
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau Workflow
          </Button>
        </div>
      }
    >
      {/* Existing workflows */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Vos Workflows</h3>
        {workflows.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun workflow. Créez-en un pour commencer !</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{wf.name}</CardTitle>
                    <Badge variant={wf.is_active ? 'default' : 'secondary'}>{wf.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <CardDescription className="text-xs">{wf.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{wf.execution_count || 0} exécutions</span>
                    <span>Trigger: {wf.trigger_type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog with Visual Canvas */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Workflow</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nom du workflow" value={workflowName} onChange={e => setWorkflowName(e.target.value)} className="mb-4" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
            <div className="lg:col-span-2">
              <VisualWorkflowCanvas
                nodes={nodes}
                onNodesChange={setNodes}
                onNodeSelect={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
            </div>
            <div>
              {selectedNode ? (
                <NodeConfigPanel
                  node={selectedNode}
                  onUpdate={handleNodeUpdate}
                  onClose={() => setSelectedNode(null)}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground text-sm py-8">
                    Sélectionnez une étape pour la configurer
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!workflowName || nodes.length === 0 || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}
