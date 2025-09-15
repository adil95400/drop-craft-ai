import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, FileText, Users,
  Globe, Lock, Eye, Settings, Download, Upload, Search,
  Calendar, Target, BarChart3, Zap
} from 'lucide-react';

interface ComplianceFramework {
  id: string;
  name: string;
  acronym: string;
  jurisdiction: string;
  category: 'privacy' | 'security' | 'financial' | 'industry' | 'accessibility';
  compliance_status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  compliance_score: number;
  last_audit_date: string;
  next_audit_due: string;
  requirements_total: number;
  requirements_met: number;
  critical_gaps: number;
  auto_monitoring: boolean;
  certification_status: string;
  estimated_compliance_cost: number;
}

interface ComplianceRequirement {
  id: string;
  framework_id: string;
  requirement_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'partial' | 'non_compliant' | 'in_progress';
  implementation_status: number;
  deadline: string;
  evidence_files: string[];
  assignee: string;
  estimated_effort_hours: number;
  compliance_notes: string;
  risk_level: number;
}

interface AuditReport {
  id: string;
  framework: string;
  audit_type: 'internal' | 'external' | 'certification' | 'automated';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  auditor: string;
  scheduled_date: string;
  completion_date?: string;
  overall_score: number;
  findings_count: number;
  critical_findings: number;
  recommendations: string[];
  certification_outcome?: 'passed' | 'failed' | 'conditional';
}

interface PrivacyIncident {
  id: string;
  incident_type: 'data_breach' | 'privacy_violation' | 'access_violation' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'contained' | 'resolved';
  affected_records: number;
  data_types: string[];
  notification_requirements: string[];
  regulatory_reporting_required: boolean;
  incident_date: string;
  detection_date: string;
  containment_date?: string;
  resolution_date?: string;
  estimated_impact_cost: number;
}

export const ComplianceManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('frameworks');
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [incidents, setIncidents] = useState<PrivacyIncident[]>([]);

  useEffect(() => {
    const loadComplianceData = () => {
      setTimeout(() => {
        setFrameworks([
          {
            id: '1',
            name: 'General Data Protection Regulation',
            acronym: 'GDPR',
            jurisdiction: 'European Union',
            category: 'privacy',
            compliance_status: 'compliant',
            compliance_score: 92,
            last_audit_date: '2023-12-15',
            next_audit_due: '2024-06-15',
            requirements_total: 47,
            requirements_met: 43,
            critical_gaps: 0,
            auto_monitoring: true,
            certification_status: 'ISO 27001 Certified',
            estimated_compliance_cost: 45000
          },
          {
            id: '2',
            name: 'California Consumer Privacy Act',
            acronym: 'CCPA',
            jurisdiction: 'California, USA',
            category: 'privacy',
            compliance_status: 'partial',
            compliance_score: 78,
            last_audit_date: '2024-01-10',
            next_audit_due: '2024-07-10',
            requirements_total: 32,
            requirements_met: 25,
            critical_gaps: 2,
            auto_monitoring: true,
            certification_status: 'In Progress',
            estimated_compliance_cost: 28000
          },
          {
            id: '3',
            name: 'Sarbanes-Oxley Act',
            acronym: 'SOX',
            jurisdiction: 'United States',
            category: 'financial',
            compliance_status: 'compliant',
            compliance_score: 96,
            last_audit_date: '2023-11-30',
            next_audit_due: '2024-05-30',
            requirements_total: 28,
            requirements_met: 27,
            critical_gaps: 0,
            auto_monitoring: false,
            certification_status: 'Certified',
            estimated_compliance_cost: 35000
          },
          {
            id: '4',
            name: 'Health Insurance Portability and Accountability Act',
            acronym: 'HIPAA',
            jurisdiction: 'United States',
            category: 'privacy',
            compliance_status: 'non_compliant',
            compliance_score: 45,
            last_audit_date: '2024-01-05',
            next_audit_due: '2024-03-15',
            requirements_total: 38,
            requirements_met: 17,
            critical_gaps: 8,
            auto_monitoring: true,
            certification_status: 'Not Certified',
            estimated_compliance_cost: 52000
          }
        ]);

        setRequirements([
          {
            id: '1',
            framework_id: '1',
            requirement_id: 'GDPR-7.1',
            title: 'Data Processing Records',
            description: 'Maintain comprehensive records of all data processing activities',
            priority: 'high',
            status: 'compliant',
            implementation_status: 100,
            deadline: '2024-05-25',
            evidence_files: ['data_processing_register.pdf', 'privacy_impact_assessment.pdf'],
            assignee: 'Data Protection Officer',
            estimated_effort_hours: 40,
            compliance_notes: 'Complete documentation maintained and regularly updated',
            risk_level: 2
          },
          {
            id: '2',
            framework_id: '2',
            requirement_id: 'CCPA-1798.100',
            title: 'Consumer Right to Know',
            description: 'Provide consumers with the right to know what personal information is collected',
            priority: 'critical',
            status: 'partial',
            implementation_status: 65,
            deadline: '2024-03-01',
            evidence_files: ['privacy_policy_v2.pdf'],
            assignee: 'Legal Team',
            estimated_effort_hours: 24,
            compliance_notes: 'Privacy policy updated, consumer portal in development',
            risk_level: 7
          }
        ]);

        setAuditReports([
          {
            id: '1',
            framework: 'GDPR',
            audit_type: 'external',
            status: 'completed',
            auditor: 'Ernst & Young',
            scheduled_date: '2023-12-01',
            completion_date: '2023-12-15',
            overall_score: 92,
            findings_count: 8,
            critical_findings: 0,
            recommendations: [
              'Enhance data retention policy documentation',
              'Implement additional access controls for sensitive data',
              'Improve incident response procedures'
            ],
            certification_outcome: 'passed'
          },
          {
            id: '2',
            framework: 'SOX',
            audit_type: 'certification',
            status: 'scheduled',
            auditor: 'PwC',
            scheduled_date: '2024-02-15',
            overall_score: 0,
            findings_count: 0,
            critical_findings: 0,
            recommendations: []
          }
        ]);

        setIncidents([
          {
            id: '1',
            incident_type: 'data_breach',
            severity: 'medium',
            status: 'resolved',
            affected_records: 1250,
            data_types: ['email', 'name', 'phone'],
            notification_requirements: ['Data Protection Authority', 'Affected Individuals'],
            regulatory_reporting_required: true,
            incident_date: '2024-01-10T14:30:00Z',
            detection_date: '2024-01-10T16:45:00Z',
            containment_date: '2024-01-10T18:00:00Z',
            resolution_date: '2024-01-12T10:00:00Z',
            estimated_impact_cost: 25000
          }
        ]);

        setLoading(false);
      }, 1000);
    };

    loadComplianceData();
  }, []);

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_applicable': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'privacy': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'security': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'financial': return 'bg-green-100 text-green-800 border-green-200';
      case 'industry': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'accessibility': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleAutoMonitoring = (frameworkId: string) => {
    setFrameworks(frameworks.map(f => 
      f.id === frameworkId 
        ? { ...f, auto_monitoring: !f.auto_monitoring }
        : f
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Compliance Manager</h1>
            <p className="text-muted-foreground">
              Multi-jurisdiction compliance tracking and automated reporting
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            3 Frameworks Compliant
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            2 Action Items
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="frameworks" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Frameworks</span>
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Audits</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid gap-6">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-3">
                        <span>{framework.name}</span>
                        <Badge className={getComplianceStatusColor(framework.compliance_status)}>
                          {framework.compliance_status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getCategoryColor(framework.category)}>
                          {framework.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {framework.jurisdiction} • Score: {framework.compliance_score}/100
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={framework.auto_monitoring}
                        onCheckedChange={() => toggleAutoMonitoring(framework.id)}
                      />
                      <span className="text-xs text-muted-foreground">Auto Monitor</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Requirements Met</p>
                      <p className="text-xl font-bold text-green-600">
                        {framework.requirements_met}/{framework.requirements_total}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Critical Gaps</p>
                      <p className="text-xl font-bold text-red-600">{framework.critical_gaps}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Compliance Score</p>
                      <p className="text-xl font-bold text-blue-600">{framework.compliance_score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Est. Cost</p>
                      <p className="text-xl font-bold text-purple-600">
                        ${framework.estimated_compliance_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Compliance Progress</span>
                      <span>{Math.round((framework.requirements_met / framework.requirements_total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(framework.requirements_met / framework.requirements_total) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Last Audit</p>
                      <p className="text-muted-foreground">
                        {new Date(framework.last_audit_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Next Audit Due</p>
                      <p className="text-muted-foreground">
                        {new Date(framework.next_audit_due).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Certification Status</p>
                      <p className="text-muted-foreground">{framework.certification_status}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Auto Monitoring</p>
                      <p className="text-muted-foreground">
                        {framework.auto_monitoring ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Export Report
                    </Button>
                    <Button variant="outline" size="sm">
                      View Requirements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <div className="grid gap-4">
            {requirements.map((requirement) => (
              <Card key={requirement.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{requirement.title}</span>
                        <Badge className={getComplianceStatusColor(requirement.status)}>
                          {requirement.status}
                        </Badge>
                        <Badge className={getPriorityColor(requirement.priority)}>
                          {requirement.priority}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {requirement.requirement_id} • Due: {new Date(requirement.deadline).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Risk: {requirement.risk_level}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{requirement.description}</p>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Implementation Progress</span>
                      <span>{requirement.implementation_status}%</span>
                    </div>
                    <Progress value={requirement.implementation_status} className="h-2" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Assignee</p>
                      <p className="text-muted-foreground">{requirement.assignee}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Estimated Effort</p>
                      <p className="text-muted-foreground">{requirement.estimated_effort_hours} hours</p>
                    </div>
                  </div>

                  {requirement.evidence_files.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 text-sm mb-2">Evidence Files</p>
                      <div className="flex flex-wrap gap-2">
                        {requirement.evidence_files.map((file, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-700 text-sm mb-1">Compliance Notes</p>
                    <p className="text-sm text-gray-600">{requirement.compliance_notes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          <div className="grid gap-4">
            {auditReports.map((report) => (
              <Card key={report.id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{report.framework} Audit</span>
                        <Badge className={getComplianceStatusColor(report.status)}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {report.audit_type}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Auditor: {report.auditor} • Scheduled: {new Date(report.scheduled_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {report.overall_score > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">Score</p>
                        <p className="text-2xl font-bold text-green-600">{report.overall_score}/100</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.status === 'completed' && (
                    <>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Total Findings</p>
                          <p className="text-xl font-bold text-blue-600">{report.findings_count}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Critical</p>
                          <p className="text-xl font-bold text-red-600">{report.critical_findings}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Outcome</p>
                          <Badge className={report.certification_outcome === 'passed' ? 
                            'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {report.certification_outcome}
                          </Badge>
                        </div>
                      </div>

                      {report.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {report.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                                <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Scheduled: {new Date(report.scheduled_date).toLocaleString()}</span>
                    {report.completion_date && (
                      <span>Completed: {new Date(report.completion_date).toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid gap-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{incident.incident_type.replace('_', ' ').toUpperCase()}</span>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getComplianceStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Affected Records: {incident.affected_records.toLocaleString()} • 
                        Impact: ${incident.estimated_impact_cost.toLocaleString()}
                      </CardDescription>
                    </div>
                    {incident.regulatory_reporting_required && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        Regulatory Report Required
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Data Types Affected</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {incident.data_types.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Notification Requirements</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {incident.notification_requirements.map((req, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="font-medium text-gray-700">Incident Date</p>
                      <p className="text-muted-foreground">
                        {new Date(incident.incident_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Detection</p>
                      <p className="text-muted-foreground">
                        {new Date(incident.detection_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Containment</p>
                      <p className="text-muted-foreground">
                        {incident.containment_date ? 
                          new Date(incident.containment_date).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Resolution</p>
                      <p className="text-muted-foreground">
                        {incident.resolution_date ? 
                          new Date(incident.resolution_date).toLocaleString() : 'In Progress'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      View Timeline
                    </Button>
                    <Button variant="outline" size="sm">
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Reporting Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              Generate comprehensive compliance reports, audit summaries, and regulatory filings.
            </p>
            <Button>
              Open Reporting Dashboard
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};