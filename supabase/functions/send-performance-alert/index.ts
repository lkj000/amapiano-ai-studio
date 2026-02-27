/**
 * Performance Alert Notification Edge Function
 * 
 * Sends alerts via email or Slack when critical anomalies are detected
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { anomaly_id, notification_type = 'email' } = await req.json();

    console.log(`[Alert Notification] Sending ${notification_type} alert for anomaly ${anomaly_id}`);

    // Fetch anomaly details
    const { data: anomaly, error: anomalyError } = await supabaseClient
      .from('performance_anomalies')
      .select('*')
      .eq('id', anomaly_id)
      .single();

    if (anomalyError || !anomaly) {
      throw new Error('Anomaly not found');
    }

    // Fetch user profile for contact info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.display_name || user.email;

    // Prepare alert message
    const alertMessage = {
      severity: anomaly.severity,
      type: anomaly.anomaly_type,
      description: anomaly.description,
      detected_at: anomaly.detected_at,
      metrics: anomaly.metrics,
      user: userName
    };

    let notificationResult = null;

    if (notification_type === 'slack') {
      // Send Slack notification via webhook
      const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
      
      if (slackWebhookUrl) {
        const slackMessage = {
          text: `🚨 *Performance Alert*`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🚨 ${anomaly.severity.toUpperCase()} Performance Alert`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Type:*\n${anomaly.anomaly_type}`
                },
                {
                  type: "mrkdwn",
                  text: `*Severity:*\n${anomaly.severity}`
                },
                {
                  type: "mrkdwn",
                  text: `*User:*\n${userName}`
                },
                {
                  type: "mrkdwn",
                  text: `*Detected:*\n${new Date(anomaly.detected_at).toLocaleString()}`
                }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Description:*\n${anomaly.description}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Metrics:*\n\`\`\`${JSON.stringify(anomaly.metrics, null, 2)}\`\`\``
              }
            }
          ]
        };

        const slackResponse = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });

        notificationResult = {
          type: 'slack',
          success: slackResponse.ok,
          status: slackResponse.status
        };
      } else {
        console.warn('[Alert Notification] Slack webhook URL not configured');
        notificationResult = {
          type: 'slack',
          success: false,
          error: 'Slack webhook URL not configured'
        };
      }
    } else if (notification_type === 'email') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');

      if (resendApiKey) {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'alerts@amapiano-ai-studio.com',
            to: user.email,
            subject: `[Alert] ${anomaly.anomaly_type} threshold exceeded`,
            html: `<p>Metric <strong>${anomaly.anomaly_type}</strong> reached severity <strong>${anomaly.severity}</strong>.</p>
<p>${anomaly.description}</p>
<p>Detected: ${new Date(anomaly.detected_at).toLocaleString()}</p>
<pre>${JSON.stringify(anomaly.metrics, null, 2)}</pre>`,
          }),
        });

        if (!emailResp.ok) {
          console.error('[Alert Notification] Resend email failed:', await emailResp.text());
        }

        notificationResult = {
          type: 'email',
          success: emailResp.ok,
          status: emailResp.status,
        };
      } else {
        // No email key — write to Supabase performance_alerts table
        await supabaseClient.from('performance_alerts').insert({
          metric: anomaly.anomaly_type,
          current_value: anomaly.severity,
          threshold: anomaly.metrics,
          alert_type: anomaly.anomaly_type,
          sent_at: new Date().toISOString(),
        });

        notificationResult = {
          type: 'email',
          success: true,
          message: 'No RESEND_API_KEY configured — alert recorded in performance_alerts table',
        };
      }
    }

    // Record notification in database (optional - could add a notifications table)
    console.log('[Alert Notification] Notification sent:', notificationResult);

    return new Response(
      JSON.stringify({
        success: true,
        anomaly_id,
        notification: notificationResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Alert Notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
