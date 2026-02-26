/**
 * Workflow Studio - Visual Canvas with full CRUD persistence
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Workflow, Plus, Save, History, Edit, Trash2, Play, Pause } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { VisualWorkflowCanvas, type WorkflowNode } from '@/components/workflows/VisualWorkflowCanvas';
import { NodeConfigPanel } from '@/components/workflows/NodeConfigPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSavedWorkflows, type SavedWorkflow } from '@/hooks/useSavedWorkflows';

export default function WorkflowStudioPage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { workflows, isLoading, create, update, remove, isCreating, isUpdating } = useSavedWorkflows();

  const openNew = () => {
    setNodes([]);
    setSelectedNode(null);
    setWorkflowName('');
    setEditingId(null);
    setShowEditor(true);
  };

  const openEdit = (wf: SavedWorkflow) => {
    setNodes(wf.nodes || []);
    setSelectedNode(null);
    setWorkflowName(wf.name);
    setEditingId(wf.id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (editingId) {
      await update({ id: editingId, name: workflowName, nodes });
    } else {
      await create({ name: workflowName, nodes });
    }
    setShowEditor(false);
  };

  const toggleStatus = async (wf: SavedWorkflow) => {
    await update({ id: wf.id, status: wf.status === 'active' ? 'paused' : 'active' });
  };

  const handleNodeUpdate = (updated: WorkflowNode) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setSelectedNode(updated);
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'default' : s === 'paused' ? 'secondary' : 'outline';

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
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau Workflow
          </Button>
        </div>
      }
    >
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Vos Workflows</h3>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : workflows.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Aucun workflow. Créez-en un pour commencer !</p>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Créer un workflow</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{wf.name}</CardTitle>
                    <Badge variant={statusColor(wf.status)}>{wf.status}</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {(wf.nodes?.length || 0)} étapes · {wf.run_count} exécutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => openEdit(wf)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Éditer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(wf)}>
                      {wf.status === 'active' ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                      {wf.status === 'active' ? 'Pause' : 'Activer'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(wf.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le Workflow' : 'Créer un Workflow'}</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowEditor(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!workflowName || nodes.length === 0 || isCreating || isUpdating}>
              <Save className="h-4 w-4 mr-2" /> {editingId ? 'Mettre à jour' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}
