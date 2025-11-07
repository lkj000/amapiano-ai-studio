import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, MessageSquare, CheckCircle2, XCircle, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PaperReviewSystem = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [newReviewer, setNewReviewer] = useState({ name: "", email: "", institution: "" });
  const [reviewComment, setReviewComment] = useState("");
  const [rating, setRating] = useState(3);

  useEffect(() => {
    fetchPapers();
    fetchReviewers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const fetchReviewers = async () => {
    try {
      const { data, error } = await supabase
        .from('reviewers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviewers(data || []);
    } catch (error) {
      console.error("Error fetching reviewers:", error);
    }
  };

  const addReviewer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add reviewers");
        return;
      }

      const { error } = await supabase
        .from('reviewers')
        .insert({
          user_id: user.id,
          name: newReviewer.name,
          email: newReviewer.email,
          institution: newReviewer.institution,
          role: 'reviewer'
        });

      if (error) throw error;

      toast.success("Reviewer added successfully");
      setNewReviewer({ name: "", email: "", institution: "" });
      fetchReviewers();
    } catch (error: any) {
      console.error("Error adding reviewer:", error);
      toast.error(error.message || "Failed to add reviewer");
    }
  };

  const submitReview = async (paperId: string, reviewerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          paper_id: paperId,
          reviewer_id: reviewerId,
          status: status,
          rating: rating,
          summary: reviewComment
        });

      if (error) throw error;

      toast.success("Review submitted successfully");
      setReviewComment("");
      setRating(3);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { label: "Draft", icon: Clock, variant: "secondary" },
      under_review: { label: "Under Review", icon: Clock, variant: "default" },
      approved: { label: "Approved", icon: CheckCircle2, variant: "default" },
      rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
      submitted: { label: "Submitted", icon: CheckCircle2, variant: "default" }
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Paper Review System</h3>
            <p className="text-sm text-muted-foreground">
              Collaborative review workflow for research papers
            </p>
          </div>
        </div>

        <Tabs defaultValue="papers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="papers">
              <FileText className="w-4 h-4 mr-2" />
              Papers ({papers.length})
            </TabsTrigger>
            <TabsTrigger value="reviewers">
              <Users className="w-4 h-4 mr-2" />
              Reviewers ({reviewers.length})
            </TabsTrigger>
            <TabsTrigger value="review">
              <MessageSquare className="w-4 h-4 mr-2" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="space-y-4 mt-6">
            {papers.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">No Papers Yet</h4>
                <p className="text-sm text-muted-foreground">
                  Generate a paper using the Auto Paper Generator to get started
                </p>
              </Card>
            ) : (
              papers.map((paper) => (
                <Card key={paper.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPaper(paper)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">{paper.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{paper.abstract}</p>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(paper.status)}
                        {paper.arxiv_id && (
                          <Badge variant="outline">
                            arXiv: {paper.arxiv_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviewers" className="space-y-4 mt-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Add New Reviewer</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewer-name">Name</Label>
                  <Input
                    id="reviewer-name"
                    value={newReviewer.name}
                    onChange={(e) => setNewReviewer({ ...newReviewer, name: e.target.value })}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="reviewer-email">Email</Label>
                  <Input
                    id="reviewer-email"
                    type="email"
                    value={newReviewer.email}
                    onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                    placeholder="jane@university.edu"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="reviewer-institution">Institution</Label>
                  <Input
                    id="reviewer-institution"
                    value={newReviewer.institution}
                    onChange={(e) => setNewReviewer({ ...newReviewer, institution: e.target.value })}
                    placeholder="University Name"
                  />
                </div>
              </div>
              <Button 
                onClick={addReviewer} 
                disabled={!newReviewer.name || !newReviewer.email}
                className="w-full mt-4"
              >
                Add Reviewer
              </Button>
            </Card>

            {reviewers.map((reviewer) => (
              <Card key={reviewer.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{reviewer.name}</h4>
                    <p className="text-sm text-muted-foreground">{reviewer.email}</p>
                    <p className="text-xs text-muted-foreground">{reviewer.institution}</p>
                  </div>
                  <Badge variant="secondary">{reviewer.role}</Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="review" className="space-y-4 mt-6">
            {selectedPaper ? (
              <div className="space-y-4">
                <Card className="p-4 bg-primary/5">
                  <h4 className="font-semibold mb-2">{selectedPaper.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedPaper.abstract}</p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-4">Submit Review</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <Button
                            key={r}
                            variant={rating >= r ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRating(r)}
                          >
                            <Star className="w-4 h-4" fill={rating >= r ? "currentColor" : "none"} />
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="review-comment">Review Comments</Label>
                      <Textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Provide detailed feedback..."
                        rows={6}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => submitReview(selectedPaper.id, reviewers[0]?.id, 'approved')}
                        disabled={!reviewComment || reviewers.length === 0}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => submitReview(selectedPaper.id, reviewers[0]?.id, 'needs_revision')}
                        disabled={!reviewComment || reviewers.length === 0}
                        variant="outline"
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Needs Revision
                      </Button>
                      <Button 
                        onClick={() => submitReview(selectedPaper.id, reviewers[0]?.id, 'rejected')}
                        disabled={!reviewComment || reviewers.length === 0}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">No Paper Selected</h4>
                <p className="text-sm text-muted-foreground">
                  Select a paper from the Papers tab to start reviewing
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
