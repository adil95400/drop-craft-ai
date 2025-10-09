import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Plus } from "lucide-react";
import { useInternationalization } from "@/hooks/useInternationalization";

export const TranslationJobsTab = () => {
  const { useTranslationJobs } = useInternationalization();
  const { data: jobs, isLoading } = useTranslationJobs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Jobs de Traduction
        </CardTitle>
        <CardDescription>
          Suivez vos traductions en masse et leur progression
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {jobs?.length || 0} jobs de traduction
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau job
          </Button>
        </div>

        {isLoading ? (
          <div className="border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job: any) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{job.job_name}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>De: {job.source_locale} → Vers: {job.target_locales?.join(', ')}</p>
                  <p>Progression: {job.progress}% ({job.completed_items}/{job.total_items})</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun job de traduction</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};