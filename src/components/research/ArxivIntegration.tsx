import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ArxivIntegrationProps {
  paperContent?: string;
  paperTitle?: string;
  paperAbstract?: string;
}

export const ArxivIntegration = ({ paperContent, paperTitle, paperAbstract }: ArxivIntegrationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedArxivId, setSubmittedArxivId] = useState<string | null>(null);
  const [arxivMetadata, setArxivMetadata] = useState({
    category: "cs.SD",
    authors: "",
    comments: ""
  });

  const savePaperToDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save papers");
        return null;
      }

      const { data, error } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: paperTitle || "Untitled Research Paper",
          abstract: paperAbstract || "",
          content: paperContent || "",
          latex_source: paperContent || "",
          keywords: "AI, Music Generation, Amapiano",
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving paper:", error);
      toast.error("Failed to save paper to database");
      return null;
    }
  };

  const prepareArxivSubmission = async () => {
    setIsSubmitting(true);
    try {
      // Save to database first
      const paper = await savePaperToDatabase();
      if (!paper) {
        setIsSubmitting(false);
        return;
      }

      // Simulate arXiv API call (in production, this would use the actual arXiv API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock arXiv ID
      const mockArxivId = `2025.${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      
      // Update paper with arXiv ID
      const { error } = await supabase
        .from('papers')
        .update({
          arxiv_id: mockArxivId,
          status: 'submitted',
          submission_date: new Date().toISOString()
        })
        .eq('id', paper.id);

      if (error) throw error;

      setSubmittedArxivId(mockArxivId);
      toast.success("Paper prepared for arXiv submission!", {
        description: `arXiv ID: ${mockArxivId}`
      });
    } catch (error) {
      console.error("Error preparing submission:", error);
      toast.error("Failed to prepare arXiv submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-semibold text-foreground">arXiv Integration</h3>
          <p className="text-sm text-muted-foreground">
            Prepare and submit your research paper to arXiv preprint server
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Beta</Badge>
      </div>

      {submittedArxivId ? (
        <div className="space-y-4">
          <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Successfully Prepared for Submission
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Your paper has been prepared for arXiv submission with ID: <code className="font-mono font-semibold">{submittedArxivId}</code>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://arxiv.org/abs/${submittedArxivId}`, '_blank')}
                  className="border-green-600 text-green-700 dark:text-green-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on arXiv
                </Button>
              </div>
            </div>
          </Card>

          <Button onClick={() => setSubmittedArxivId(null)} variant="outline" className="w-full">
            Prepare Another Submission
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">arXiv Category</Label>
            <Input
              id="category"
              value={arxivMetadata.category}
              onChange={(e) => setArxivMetadata({ ...arxivMetadata, category: e.target.value })}
              placeholder="cs.SD (Sound)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Common categories: cs.SD (Sound), cs.AI (AI), cs.LG (Learning)
            </p>
          </div>

          <div>
            <Label htmlFor="authors">Authors</Label>
            <Input
              id="authors"
              value={arxivMetadata.authors}
              onChange={(e) => setArxivMetadata({ ...arxivMetadata, authors: e.target.value })}
              placeholder="John Doe, Jane Smith"
            />
          </div>

          <div>
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={arxivMetadata.comments}
              onChange={(e) => setArxivMetadata({ ...arxivMetadata, comments: e.target.value })}
              placeholder="10 pages, 5 figures, submitted to ICML 2025"
              rows={3}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Submission Checklist:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                LaTeX source files compiled without errors
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                All figures and tables included
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                Bibliography properly formatted
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                Abstract under 1920 characters
              </li>
            </ul>
          </div>

          <Button
            onClick={prepareArxivSubmission}
            disabled={isSubmitting || !arxivMetadata.authors}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Submission...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Prepare for arXiv Submission
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will save your paper and generate submission metadata. 
            Final submission requires arXiv account credentials.
          </p>
        </div>
      )}
    </Card>
  );
};
