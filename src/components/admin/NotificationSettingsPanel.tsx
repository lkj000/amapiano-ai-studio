import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare } from "lucide-react";

interface NotificationSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  criticalOnly: boolean;
  slackWebhookUrl: string;
}

export const NotificationSettingsPanel = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    slackEnabled: false,
    criticalOnly: true,
    slackWebhookUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, you'd save these to user preferences
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async (type: 'email' | 'slack') => {
    try {
      // Create a test anomaly notification
      const { data, error } = await supabase.functions.invoke('send-performance-alert', {
        body: {
          anomaly_id: 'test-anomaly-id',
          notification_type: type
        }
      });

      if (error) throw error;
      toast.success(`Test ${type} notification sent`);
    } catch (error) {
      toast.error(`Failed to send test ${type} notification`);
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alert Notifications
        </CardTitle>
        <CardDescription>
          Configure how you want to be notified about performance anomalies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label className="font-semibold">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive alerts via email
              </p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailEnabled: checked })
              }
            />
          </div>

          {settings.emailEnabled && (
            <Button
              onClick={() => sendTestNotification('email')}
              variant="outline"
              size="sm"
            >
              Send Test Email
            </Button>
          )}
        </div>

        {/* Slack Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <Label className="font-semibold">Slack Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive alerts in Slack
              </p>
            </div>
            <Switch
              checked={settings.slackEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, slackEnabled: checked })
              }
            />
          </div>

          {settings.slackEnabled && (
            <div className="space-y-2">
              <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
              <Input
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={settings.slackWebhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, slackWebhookUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Create a webhook URL in your Slack workspace settings
              </p>
              <Button
                onClick={() => sendTestNotification('slack')}
                variant="outline"
                size="sm"
                disabled={!settings.slackWebhookUrl}
              >
                Send Test Message
              </Button>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-semibold">Critical Alerts Only</Label>
              <p className="text-sm text-muted-foreground">
                Only notify for critical severity anomalies
              </p>
            </div>
            <Switch
              checked={settings.criticalOnly}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, criticalOnly: checked })
              }
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};
