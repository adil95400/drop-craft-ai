import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannelSegmentationAnalytics } from '@/components/analytics/ChannelSegmentationAnalytics'
import { CohortAnalysisPanel } from '@/components/analytics/CohortAnalysisPanel'
import { AdvancedFiltersBI } from '@/components/analytics/AdvancedFiltersBI'
import { RealDataExport } from '@/components/analytics/RealDataExport'
import { GoogleDataStudioConnector } from '@/components/analytics/GoogleDataStudioConnector'
import { CustomReportsBuilder } from '@/components/analytics/CustomReportsBuilder'
import { 
  BarChart3, 
  Users, 
  Filter, 
  Download, 
  ExternalLink,
  FileText
} from 'lucide-react'

export default function AnalyticsBIDashboard() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          Analytics & Business Intelligence
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Dashboard BI avancé avec segmentation, cohortes, exports et intégrations
        </p>
      </div>

      <Tabs defaultValue="channels" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 sm:max-w-4xl">
            <TabsTrigger value="channels" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Canaux</span>
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cohortes</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filtres</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="datastudio" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Looker</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Rapports</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="channels">
          <ChannelSegmentationAnalytics />
        </TabsContent>

        <TabsContent value="cohorts">
          <CohortAnalysisPanel />
        </TabsContent>

        <TabsContent value="filters">
          <AdvancedFiltersBI />
        </TabsContent>

        <TabsContent value="export">
          <RealDataExport />
        </TabsContent>

        <TabsContent value="datastudio">
          <GoogleDataStudioConnector />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportsBuilder />
        </TabsContent>
      </Tabs>
    </div>
  )
}
