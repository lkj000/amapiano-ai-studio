import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, X, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ThesisEmailNotificationsProps {
  validationData: {
    sigeAudio: {
      avgLatency: number;
      cacheHitRate: number;
      validated: boolean;
    };
    nunchakuAudio: {
      ptq8Quality: number;
      svd8Quality: number;
      validated: boolean;
    };
    distriFusionAudio: {
      edgeLoad: number;
      cloudLoad: number;
      totalJobs: number;
      validated: boolean;
    };
  };
}

export const ThesisEmailNotifications = ({ validationData }: ThesisEmailNotificationsProps) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);

  const addRecipient = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!newEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (recipients.includes(newEmail)) {
      toast.error("This email is already in the list");
      return;
    }
    
    setRecipients([...recipients, newEmail]);
    setNewEmail("");
    toast.success("Recipient added");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
    toast.success("Recipient removed");
  };

  const sendNotifications = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    setSending(true);
    toast.info("Sending thesis validation emails...");

    try {
      const dashboardUrl = window.location.origin + "/research";

      const { data, error } = await supabase.functions.invoke(
        "send-thesis-validation-email",
        {
          body: {
            recipientEmails: recipients,
            validationData,
            dashboardUrl,
            senderName: senderName || undefined,
          },
        }
      );

      if (error) throw error;

      toast.success(
        `Successfully sent ${data.sent} email(s)${
          data.failed > 0 ? `, ${data.failed} failed` : ""
        }`
      );

      // Clear recipients after successful send
      setRecipients([]);
      setSenderName("");
    } catch (error: any) {
      console.error("Failed to send emails:", error);
      toast.error(`Failed to send emails: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const allValidated =
    validationData.sigeAudio.validated &&
    validationData.nunchakuAudio.validated &&
    validationData.distriFusionAudio.validated;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Email Notifications</h3>
        {allValidated && (
          <Badge variant="default" className="ml-auto">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            All Pillars Validated
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Send automated thesis validation alerts to supervisors and committee members with PDF
        reports and dashboard links.
      </p>

      <div className="space-y-4">
        {/* Sender Name */}
        <div className="space-y-2">
          <Label htmlFor="senderName">Your Name (Optional)</Label>
          <Input
            id="senderName"
            placeholder="e.g., John Doe"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>

        {/* Add Recipients */}
        <div className="space-y-2">
          <Label htmlFor="newEmail">Add Recipient Email</Label>
          <div className="flex gap-2">
            <Input
              id="newEmail"
              type="email"
              placeholder="supervisor@university.edu"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
            />
            <Button onClick={addRecipient} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Recipients List */}
        {recipients.length > 0 && (
          <div className="space-y-2">
            <Label>Recipients ({recipients.length})</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
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

        {/* Validation Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-semibold">Email will include:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>
              • SIGE-Audio: {validationData.sigeAudio.avgLatency.toFixed(2)}ms latency,{" "}
              {validationData.sigeAudio.cacheHitRate.toFixed(1)}% cache hit
            </li>
            <li>
              • Nunchaku-Audio: PTQ {validationData.nunchakuAudio.ptq8Quality.toFixed(1)}%,
              SVD {validationData.nunchakuAudio.svd8Quality.toFixed(1)}%
            </li>
            <li>
              • DistriFusion: {validationData.distriFusionAudio.edgeLoad} edge /{" "}
              {validationData.distriFusionAudio.cloudLoad} cloud jobs
            </li>
            <li>• Live dashboard link</li>
            <li>• Defense strategy summary</li>
          </ul>
        </div>

        {/* Send Button */}
        <Button
          className="w-full"
          onClick={sendNotifications}
          disabled={recipients.length === 0 || sending}
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? "Sending..." : `Send Validation Email${recipients.length > 1 ? "s" : ""}`}
        </Button>
      </div>
    </Card>
  );
};
