import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RegressionAlertManagerProps {
  regressions?: any[];
}

export const RegressionAlertManager = ({ regressions = [] }: RegressionAlertManagerProps) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const addRecipient = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (recipients.includes(newEmail)) {
      toast.error("Email already added");
      return;
    }
    
    setRecipients([...recipients, newEmail]);
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const sendAlerts = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    if (regressions.length === 0) {
      toast.error("No regressions to report");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-regression-alert', {
        body: {
          recipientEmails: recipients,
          regressions: regressions,
          senderName: senderName || undefined
        }
      });

      if (error) throw error;

      toast.success("Regression alerts sent successfully!", {
        description: `Sent to ${recipients.length} recipient(s)`
      });
      
      // Clear form
      setRecipients([]);
      setSenderName("");
    } catch (error: any) {
      console.error("Error sending alerts:", error);
      toast.error("Failed to send alerts", {
        description: error.message
      });
    } finally {
      setIsSending(false);
    }
  };

  const criticalCount = regressions.filter(r => r.severity === "critical").length;
  const warningCount = regressions.filter(r => r.severity === "warning").length;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-semibold text-foreground">Regression Alert Manager</h3>
          <p className="text-sm text-muted-foreground">
            Send automated email alerts for detected performance regressions
          </p>
        </div>
        {regressions.length > 0 && (
          <Badge variant={criticalCount > 0 ? "destructive" : "secondary"} className="ml-auto">
            {regressions.length} Issue{regressions.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {regressions.length === 0 ? (
        <Card className="p-8 text-center bg-muted/50">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold text-lg mb-2">No Regressions Detected</h4>
          <p className="text-sm text-muted-foreground">
            Run the regression detector to identify performance issues before sending alerts
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alert Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Issues</div>
                <div className="text-2xl font-bold">{regressions.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Critical</div>
                <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Warnings</div>
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              </div>
            </div>
          </Card>

          <div>
            <Label htmlFor="sender-name">Your Name (Optional)</Label>
            <Input
              id="sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <Label htmlFor="recipient-email">Add Recipient Email</Label>
            <div className="flex gap-2">
              <Input
                id="recipient-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="supervisor@university.edu"
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
              />
              <Button onClick={addRecipient} type="button">
                Add
              </Button>
            </div>
          </div>

          {recipients.length > 0 && (
            <div>
              <Label className="mb-2 block">Recipients ({recipients.length})</Label>
              <div className="space-y-2">
                {recipients.map((email) => (
                  <div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(email)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Email will include:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Detailed regression summary with metrics</li>
              <li>• Current vs. baseline values for each issue</li>
              <li>• Severity classifications (Critical/Warning)</li>
              <li>• Percentage changes for all detected regressions</li>
              <li>• Direct link to the research dashboard</li>
              <li>• Recommended next steps for resolution</li>
            </ul>
          </div>

          <Button
            onClick={sendAlerts}
            disabled={isSending || recipients.length === 0}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Alerts...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Regression Alert{recipients.length > 1 ? 's' : ''} ({recipients.length} recipient{recipients.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};
