import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestNotificationRequest {
  email: string;
  testType: string;
  status: "success" | "failure";
  summaryMetrics: Record<string, any>;
  testDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, testType, status, summaryMetrics, testDate }: TestNotificationRequest = 
      await req.json();

    console.log("[TEST-NOTIFICATION] Sending notification:", {
      email,
      testType,
      status,
    });

    const subject = status === "success"
      ? `✅ ${testType} Test Completed Successfully`
      : `❌ ${testType} Test Failed`;

    const metricsHtml = Object.entries(summaryMetrics)
      .map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${key}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">
            ${typeof value === 'number' ? value.toFixed(2) : String(value)}
          </td>
        </tr>
      `)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "AURA-X Research <onboarding@resend.dev>",
      to: [email],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AURA-X Research Platform</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">PhD Thesis Testing Suite</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #333;">
                ${status === "success" ? "✅ Test Completed" : "❌ Test Failed"}
              </h2>
              <p style="color: #666; margin: 10px 0;">
                <strong>Test Type:</strong> ${testType}<br>
                <strong>Completed:</strong> ${new Date(testDate).toLocaleString()}
              </p>
            </div>

            ${status === "success" ? `
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">Summary Metrics</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${metricsHtml}
                </table>
              </div>
            ` : `
              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ The test encountered errors.</strong> Please review the logs for details.
                </p>
              </div>
            `}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                View full results in your 
                <a href="https://your-app-url.com/research" style="color: #667eea; text-decoration: none;">
                  Research Dashboard
                </a>
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>AURA-X Platform | Research Testing Suite</p>
            <p>This is an automated notification from your test scheduler</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[TEST-NOTIFICATION] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[TEST-NOTIFICATION] Error:", error);
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
