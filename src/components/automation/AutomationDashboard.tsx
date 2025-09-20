import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Play, Pause, Settings, Zap, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { automationEngine, AutomationWorkflow, AutomationExecution } from "@/services/automation/AutomationEngine";
import { WorkflowBuilder } from "./WorkflowBuilder";
import { ExecutionHistory } from "./ExecutionHistory";

export function AutomationDashboard() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userId = "current-user"; // Get from auth context
      
      const [workflowsData, executionsData] = await Promise.all([
        automationEngine.getWorkflows(userId),
        automationEngine.getExecutions()
      ]);

      setWorkflows(workflowsData);
      setExecutions(executionsData);
    } catch (error) {
      console.error("Failed to load automation data:", error);
      toast.error("Failed to load automation data");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async (workflow: AutomationWorkflow) => {
    try {
      toast.info(`Executing workflow: ${workflow.name}`);
      
      const result = await automationEngine.executeWorkflow(workflow, {
        user_id: "current-user",
        trigger: 'manual'
      });
      
      toast.success(`Workflow executed successfully: ${workflow.name}`);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      toast.error("Failed to execute workflow");
    }
  };

  const handleToggleWorkflow = async (workflow: AutomationWorkflow) => {
    try {
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      
      const updatedWorkflow = { ...workflow, status: newStatus as 'active' | 'paused' | 'draft' };
      await automationEngine.updateWorkflow(updatedWorkflow);
      
      toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadData();
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
      toast.error("Failed to update workflow status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.status === 'completed').length,
    successRate: executions.length > 0 
      ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Dashboard</h1>
          <p className="text-muted-foreground">Create and manage intelligent automation workflows</p>
        </div>
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Workflow Builder</DialogTitle>
              <DialogDescription>Create a new automation workflow</DialogDescription>
            </DialogHeader>
            <WorkflowBuilder 
              workflow={selectedWorkflow}
              onSave={(workflow) => {
                setShowBuilder(false);
                loadData();
                toast.success("Workflow saved successfully");
              }}
              onCancel={() => setShowBuilder(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeWorkflows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successfulExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workflow.status)}
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    </div>
                    <Badge variant={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                  </div>
                  <CardDescription>{workflow.description || 'No description'}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Executions</p>
                      <p className="text-muted-foreground">{workflow.execution_count}</p>
                    </div>
                    <div>
                      <p className="font-medium">Success Rate</p>
                      <p className="text-muted-foreground">
                        {workflow.execution_count > 0 
                          ? Math.round((workflow.success_count / workflow.execution_count) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleExecuteWorkflow(workflow)}
                      disabled={workflow.status !== 'active'}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleWorkflow(workflow)}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setShowBuilder(true);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>View detailed execution history and results</CardDescription>
            </CardHeader>
            <CardContent>
              <ExecutionHistory executions={executions} workflows={workflows} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}