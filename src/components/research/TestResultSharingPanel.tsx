import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Mail, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTestHistory } from "@/hooks/useTestHistory";
import { supabase } from "@/integrations/supabase/client";

interface TestResultSharingPanelProps {
  selectedTests?: string[];
}

export const TestResultSharingPanel = ({ selectedTests = [] }: TestResultSharingPanelProps) => {
  const { toast } = useToast();
  const { history } = useTestHistory();
  const [shareUrl, setShareUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const testsToShare = selectedTests.length > 0
    ? history.filter(t => selectedTests.includes(t.id))
    : history.slice(0, 5); // Share latest 5 if none selected

  const generateShareableLink = async () => {
    setIsGenerating(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Create a shareable record
      const shareData = {
        user_id: user.user.id,
        test_ids: testsToShare.map(t => t.id),
        test_data: testsToShare,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      // In a real implementation, this would create a share record in the database
      // For now, we'll generate a mock shareable URL
      const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const url = `${window.location.origin}/research/shared/${shareId}`;

      setShareUrl(url);
      toast({
        title: "Shareable link generated",
        description: "Link expires in 7 days",
      });
    } catch (error) {
      console.error("Failed to generate share link:", error);
      toast({
        title: "Failed to generate link",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaEmail = async () => {
    if (!recipientEmail || !shareUrl) {
      toast({
        title: "Missing information",
        description: "Please generate a link and enter recipient email",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the send-test-notification function
      const { error } = await supabase.functions.invoke("send-test-notification", {
        body: {
          email: recipientEmail,
          subject: "Shared Research Test Results",
          message: `
            ${message || "I've shared some research test results with you."}
            
            View the results here: ${shareUrl}
            
            This link expires in 7 days.
          `,
          testResults: {
            tests: testsToShare.length,
            types: [...new Set(testsToShare.map(t => t.test_type))],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Email sent",
        description: `Results shared with ${recipientEmail}`,
      });

      setRecipientEmail("");
      setMessage("");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Failed to send email",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Share Test Results</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate a shareable link to your test results or send them via email
        </p>
      </Card>

      {/* Selected Tests */}
      <Card className="p-6">
        <h4 className="font-semibold mb-3">Tests to Share</h4>
        <div className="space-y-2">
          {testsToShare.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="font-medium capitalize">{test.test_type}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(test.test_date).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">
                {Object.keys(test.summary_metrics || {}).length} metrics
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate Link */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Shareable Link</h4>
        <div className="space-y-4">
          <Button
            onClick={generateShareableLink}
            disabled={isGenerating || testsToShare.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : shareUrl ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Regenerate Link
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Generate Shareable Link
              </>
            )}
          </Button>

          {shareUrl && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ This link will expire in 7 days
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Email Sharing */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Send via Email</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="colleague@university.edu"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="mt-1"
              rows={3}
            />
          </div>
          <Button
            onClick={sendViaEmail}
            disabled={!shareUrl || !recipientEmail}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TestResultSharingPanel;
