import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Calendar } from "lucide-react";
import { AutomationExecution, AutomationWorkflow } from "@/services/automation/AutomationEngine";
import { formatDistanceToNow } from "date-fns";

interface ExecutionHistoryProps {
  executions: AutomationExecution[];
  workflows: AutomationWorkflow[];
}

export function ExecutionHistory({ executions, workflows }: ExecutionHistoryProps) {
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Unknown Workflow';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />;
      case 'skipped': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      default: return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  if (executions.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No executions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Workflow executions will appear here once you start running your automations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => {
            const successfulSteps = execution.step_results?.filter(s => s.status === 'success').length || 0;
            const totalSteps = execution.step_results?.length || 0;
            const stepProgress = totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0;

            return (
              <TableRow key={execution.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(execution.status)}
                    <Badge variant={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <p className="font-medium">{getWorkflowName(execution.workflow_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {execution.id.slice(0, 8)}...
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString()}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  <p className="text-sm">{formatDuration(execution.execution_time_ms)}</p>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{successfulSteps}/{totalSteps} completed</span>
                    </div>
                    <Progress value={stepProgress} className="h-1" />
                  </div>
                </TableCell>
                
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Execution Details</DialogTitle>
                        <DialogDescription>
                          {getWorkflowName(execution.workflow_id)} - {execution.id}
                        </DialogDescription>
                      </DialogHeader>
                      <ExecutionDetails execution={execution} />
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface ExecutionDetailsProps {
  execution: AutomationExecution;
}

function ExecutionDetails({ execution }: ExecutionDetailsProps) {
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStepStatusIcon(execution.status)}
                <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
                  {execution.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground mt-1">
                {execution.execution_time_ms ? formatDuration(execution.execution_time_ms) : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Started</p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(execution.started_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Completed</p>
              <p className="text-sm text-muted-foreground mt-1">
                {execution.completed_at 
                  ? new Date(execution.completed_at).toLocaleString()
                  : 'Not completed'
                }
              </p>
            </div>
          </div>
          
          {execution.error_message && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive">Error Message:</p>
              <p className="text-sm text-destructive mt-1">{execution.error_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Input Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
            {JSON.stringify(execution.input_data, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Step Results */}
      {execution.step_results && execution.step_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {execution.step_results.map((result, index) => (
                <Card key={result.step_id} className="border-l-4 border-l-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        {getStepStatusIcon(result.status)}
                        <CardTitle className="text-base">
                          {result.step_id}
                        </CardTitle>
                      </div>
                      <Badge variant="outline">
                        {formatDuration(result.execution_time_ms)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    {result.error && (
                      <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm font-medium text-destructive">Error:</p>
                        <p className="text-sm text-destructive">{result.error}</p>
                      </div>
                    )}
                    
                    {Object.keys(result.output).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Output:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Output Data */}
      {execution.output_data && Object.keys(execution.output_data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Output Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
              {JSON.stringify(execution.output_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}