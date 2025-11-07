import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegressionAlert {
  metric: string;
  category: string;
  current: number;
  baseline: number;
  change: number;
  severity: "critical" | "warning" | "info";
}

interface RegressionAlertRequest {
  recipientEmails: string[];
  regressions: RegressionAlert[];
  senderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { recipientEmails, regressions, senderName }: RegressionAlertRequest = await req.json();

    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("No recipient emails provided");
    }

    if (!regressions || regressions.length === 0) {
      throw new Error("No regressions provided");
    }

    const criticalCount = regressions.filter(r => r.severity === "critical").length;
    const warningCount = regressions.filter(r => r.severity === "warning").length;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: white; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .warning-box { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .metric { margin: 15px 0; }
    .metric-name { font-weight: bold; color: #667eea; }
    .value { font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
    .critical { color: #dc2626; font-weight: bold; }
    .warning { color: #f59e0b; font-weight: bold; }
    .summary { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Performance Regression Alert</h1>
      <p>Automated regression detection has identified performance issues</p>
    </div>
    <div class="content">
      ${senderName ? `<p><strong>From:</strong> ${senderName}</p>` : ""}
      
      <div class="summary">
        <h3>📊 Summary</h3>
        <ul>
          <li><span class="critical">${criticalCount} Critical Issues</span></li>
          <li><span class="warning">${warningCount} Warnings</span></li>
          <li><strong>${regressions.length} Total Regressions Detected</strong></li>
        </ul>
      </div>

      <h3>🔍 Detected Regressions:</h3>
      ${regressions.map(regression => `
        <div class="${regression.severity === 'critical' ? 'alert-box' : 'warning-box'}">
          <div class="metric">
            <span class="metric-name">${regression.metric}</span>
            <span class="value">${regression.category}</span>
          </div>
          <div class="metric">
            <strong>Current Value:</strong> 
            <span class="value ${regression.severity === 'critical' ? 'critical' : 'warning'}">
              ${regression.current.toFixed(2)}${regression.metric.includes("Rate") ? "%" : regression.metric.includes("Latency") ? "ms" : "%"}
            </span>
          </div>
          <div class="metric">
            <strong>Baseline:</strong> 
            <span class="value">${regression.baseline.toFixed(2)}${regression.metric.includes("Rate") ? "%" : regression.metric.includes("Latency") ? "ms" : "%"}</span>
          </div>
          <div class="metric">
            <strong>Change:</strong> 
            <span class="value ${regression.severity === 'critical' ? 'critical' : 'warning'}">
              ${regression.change > 0 ? "+" : ""}${regression.change.toFixed(1)}%
            </span>
          </div>
          <div class="metric">
            <strong>Severity:</strong> <span class="${regression.severity === 'critical' ? 'critical' : 'warning'}">${regression.severity.toUpperCase()}</span>
          </div>
        </div>
      `).join('')}

      <div class="summary">
        <h3>📈 Next Steps</h3>
        <ol>
          <li>Review the regression detection dashboard for detailed analysis</li>
          <li>Compare current results with historical trends</li>
          <li>Investigate recent code changes that may have impacted performance</li>
          <li>Run additional tests to confirm the regressions</li>
          <li>Implement fixes and re-run the test suite</li>
        </ol>
      </div>

      <p style="margin-top: 30px;">
        <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/research" 
           style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Full Dashboard
        </a>
      </p>

      <div class="footer">
        <p>This is an automated alert from the Amapiano AI Research Testing Suite</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const emailPromises = recipientEmails.map(email =>
      resend.emails.send({
        from: "Research Alerts <onboarding@resend.dev>",
        to: [email],
        subject: `🚨 Regression Alert: ${criticalCount} Critical Issue${criticalCount !== 1 ? 's' : ''} Detected`,
        html: htmlContent,
      })
    );

    const results = await Promise.all(emailPromises);
    console.log("Regression alert emails sent:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Alerts sent to ${recipientEmails.length} recipient(s)`,
        emailCount: recipientEmails.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-regression-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
