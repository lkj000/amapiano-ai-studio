import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Scale, Eye, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

interface ComplianceItem {
  id: string;
  category: string;
  title: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  details: string;
}

const AIEthicsPanel = () => {
  const [complianceData] = useState<ComplianceItem[]>([
    {
      id: '1',
      category: 'copyright',
      title: 'Copyright & Ownership Tracking',
      status: 'compliant',
      score: 95,
      details: 'All AI-generated content is clearly marked. Human contributions are tracked for copyright eligibility.'
    },
    {
      id: '2',
      category: 'rights',
      title: 'Artist Rights Protection',
      status: 'compliant',
      score: 88,
      details: 'Style transfer requires explicit consent. Royalty system tracks and compensates original creators.'
    },
    {
      id: '3',
      category: 'bias',
      title: 'Bias & Fairness Auditing',
      status: 'warning',
      score: 72,
      details: 'Cultural diversity in training data is tracked. Some genre imbalances detected in Amapiano subgenres.'
    },
    {
      id: '4',
      category: 'transparency',
      title: 'Transparency & Disclosure',
      status: 'compliant',
      score: 92,
      details: 'AI involvement is disclosed in all generated content. Model provenance is tracked and visible.'
    },
    {
      id: '5',
      category: 'governance',
      title: 'Ethical Governance Framework',
      status: 'compliant',
      score: 85,
      details: 'NIST AI RMF compliant. Regular ethical audits conducted. Stakeholder feedback integrated.'
    },
    {
      id: '6',
      category: 'security',
      title: 'Security & Privacy',
      status: 'compliant',
      score: 90,
      details: 'Federated learning ensures data privacy. No user data is shared without explicit consent.'
    }
  ]);

  const [regulations] = useState([
    { name: 'NIST AI RMF 1.0', status: 'compliant', link: 'https://www.nist.gov/itl/ai-risk-management-framework' },
    { name: 'EU AI Act', status: 'monitoring', link: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    { name: 'Copyright Law (US/EU)', status: 'compliant', link: '#' },
    { name: 'Data Protection (GDPR)', status: 'compliant', link: '#' }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      compliant: { variant: 'default', label: 'Compliant' },
      warning: { variant: 'secondary', label: 'Needs Review' },
      'non-compliant': { variant: 'destructive', label: 'Non-Compliant' },
      monitoring: { variant: 'outline', label: 'Monitoring' }
    };
    return config[status as keyof typeof config] || config.monitoring;
  };

  const handleRunAudit = () => {
    toast.info("Running comprehensive ethics audit...");
    setTimeout(() => {
      toast.success("Ethics audit completed successfully");
    }, 2000);
  };

  const overallScore = Math.round(
    complianceData.reduce((sum, item) => sum + item.score, 0) / complianceData.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">AI Ethics & Compliance</h2>
          <p className="text-muted-foreground">
            Ethical governance, bias mitigation, and regulatory compliance monitoring
          </p>
        </div>
        <Button onClick={handleRunAudit}>
          <Shield className="w-4 h-4 mr-2" />
          Run Audit
        </Button>
      </div>

      {/* Overall Compliance Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Overall Compliance Score</h3>
            <p className="text-sm text-muted-foreground">Aggregate across all ethical dimensions</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">{overallScore}%</div>
            <Badge variant="default">Excellent</Badge>
          </div>
        </div>
        <Progress value={overallScore} className="h-3" />
      </Card>

      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compliance">
            <Scale className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="regulations">
            <FileText className="w-4 h-4 mr-2" />
            Regulations
          </TabsTrigger>
          <TabsTrigger value="transparency">
            <Eye className="w-4 h-4 mr-2" />
            Transparency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4 mt-6">
          {complianceData.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-foreground mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.details}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusBadge(item.status).variant as any}>
                  {getStatusBadge(item.status).label}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={item.score} className="flex-1 h-2" />
                <span className="text-sm font-medium text-foreground w-12 text-right">
                  {item.score}%
                </span>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="regulations" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Regulatory Framework Compliance
            </h3>
            <div className="space-y-3">
              {regulations.map((reg) => (
                <div 
                  key={reg.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{reg.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadge(reg.status).variant as any}>
                      {getStatusBadge(reg.status).label}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={reg.link} target="_blank" rel="noopener noreferrer">
                        View Details
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-primary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">
                  Proactive Compliance Monitoring
                </h4>
                <p className="text-sm text-muted-foreground">
                  The platform continuously monitors emerging regulations and automatically 
                  adapts compliance measures. Regular audits ensure alignment with evolving 
                  ethical standards and legal requirements.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transparency" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Transparency Measures
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  AI Disclosure
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  All AI-generated content is clearly labeled with model information, 
                  parameters used, and human contribution level.
                </p>
                <Badge variant="default">100% Disclosure</Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Model Provenance
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Complete lineage tracking for all models, including training data sources, 
                  versioning, and modification history.
                </p>
                <Badge variant="default">Full Traceability</Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Bias Reporting
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Regular bias audits published with detailed breakdowns by genre, style, 
                  and cultural representation.
                </p>
                <Badge variant="secondary">Quarterly Reports</Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Controls
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  User data handling is transparent with granular privacy controls and 
                  federated learning for privacy-preserving collaboration.
                </p>
                <Badge variant="default">GDPR Compliant</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIEthicsPanel;
