import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  alertType: 'test_failure' | 'metric_failure' | 'system_critical';
  successRate?: number;
  failedTests?: Array<{
    testName: string;
    hypothesis: string;
    result: string;
  }>;
  metrics?: {
    accuracy?: number;
    latency?: number;
    cacheHitRate?: number;
    authenticity?: number;
  };
  timestamp: string;
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      alertType, 
      successRate, 
      failedTests = [],
      metrics = {},
      timestamp,
      recipientEmail 
    }: AlertRequest = await req.json();

    console.log('[Research Alert] Processing alert:', { alertType, successRate, recipientEmail });

    // Generate email content based on alert type
    let subject = '';
    let htmlContent = '';

    if (alertType === 'test_failure') {
      subject = `🚨 Research Alert: Test Success Rate Dropped to ${successRate?.toFixed(1)}%`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .metric { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; }
              .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
              .metric-value { font-size: 24px; font-weight: bold; color: #111827; margin-top: 5px; }
              .failed-test { background: #fff; border: 1px solid #e5e7eb; padding: 12px; margin: 8px 0; border-radius: 6px; }
              .failed-test-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
              .failed-test-result { font-size: 14px; color: #6b7280; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 Research Test Alert</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Automated Testing System - Amapiano AI Studio</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <strong>⚠️ Action Required:</strong> Test success rate has dropped below the 95% threshold.
                </div>
                
                <div class="metric">
                  <div class="metric-label">Current Success Rate</div>
                  <div class="metric-value" style="color: #ef4444;">${successRate?.toFixed(1)}%</div>
                </div>
                
                <div class="metric">
                  <div class="metric-label">Target Success Rate</div>
                  <div class="metric-value" style="color: #10b981;">95.0%</div>
                </div>
                
                <h3 style="margin-top: 30px; color: #111827;">Failed Tests (${failedTests.length})</h3>
                ${failedTests.map(test => `
                  <div class="failed-test">
                    <div class="failed-test-name">${test.testName}</div>
                    <div class="failed-test-result">
                      <strong>Hypothesis:</strong> ${test.hypothesis}<br>
                      <strong>Result:</strong> ${test.result}
                    </div>
                  </div>
                `).join('')}
                
                <p style="margin-top: 30px;">
                  <strong>Recommended Actions:</strong>
                </p>
                <ul>
                  <li>Review failed test logs in the Research Dashboard</li>
                  <li>Check system resources and network connectivity</li>
                  <li>Verify cache performance and distributed inference routing</li>
                  <li>Run manual validation tests to isolate the issue</li>
                </ul>
                
                <a href="${Deno.env.get('SUPABASE_URL') || 'https://your-project.lovable.app'}/research?tab=testing" class="button">
                  View Research Dashboard →
                </a>
                
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  <strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}<br>
                  <strong>Alert Type:</strong> Test Failure Threshold Exceeded
                </p>
              </div>
              
              <div class="footer">
                Amapiano AI Studio - Doctoral Thesis Research Platform<br>
                This is an automated alert from the continuous validation system.
              </div>
            </div>
          </body>
        </html>
      `;
    } else if (alertType === 'metric_failure') {
      subject = '⚠️ Research Alert: Critical Metric Threshold Exceeded';
      
      const failedMetrics = [];
      if (metrics.accuracy && metrics.accuracy < 90) failedMetrics.push({ name: 'Accuracy', value: metrics.accuracy, threshold: 90 });
      if (metrics.latency && metrics.latency > 500) failedMetrics.push({ name: 'Latency', value: metrics.latency, threshold: 500 });
      if (metrics.cacheHitRate && metrics.cacheHitRate < 50) failedMetrics.push({ name: 'Cache Hit Rate', value: metrics.cacheHitRate, threshold: 50 });
      if (metrics.authenticity && metrics.authenticity < 90) failedMetrics.push({ name: 'Cultural Authenticity', value: metrics.authenticity, threshold: 90 });
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .metric-failure { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 10px 0; border-radius: 8px; }
              .metric-name { font-weight: 600; color: #111827; }
              .metric-comparison { display: flex; justify-content: space-between; margin-top: 8px; }
              .current { color: #ef4444; font-weight: bold; }
              .threshold { color: #10b981; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Metric Threshold Alert</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Performance Monitoring System</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <strong>⚠️ Performance Warning:</strong> One or more critical metrics have exceeded their thresholds.
                </div>
                
                <h3 style="margin-top: 30px; color: #111827;">Failed Metrics (${failedMetrics.length})</h3>
                ${failedMetrics.map(metric => `
                  <div class="metric-failure">
                    <div class="metric-name">${metric.name}</div>
                    <div class="metric-comparison">
                      <div>
                        <span style="font-size: 12px; color: #6b7280;">Current:</span>
                        <div class="current">${typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}${metric.name === 'Latency' ? 'ms' : metric.name.includes('Rate') || metric.name.includes('Authenticity') ? '%' : ''}</div>
                      </div>
                      <div>
                        <span style="font-size: 12px; color: #6b7280;">Threshold:</span>
                        <div class="threshold">${metric.threshold}${metric.name === 'Latency' ? 'ms' : '%'}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
                
                <p style="margin-top: 30px;">
                  <strong>Recommended Actions:</strong>
                </p>
                <ul>
                  <li>Check system performance and resource allocation</li>
                  <li>Review recent code changes or deployments</li>
                  <li>Verify cache invalidation and warming strategies</li>
                  <li>Monitor network latency and cloud service health</li>
                </ul>
                
                <a href="${Deno.env.get('SUPABASE_URL') || 'https://your-project.lovable.app'}/research?tab=overview" class="button">
                  View Performance Dashboard →
                </a>
                
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  <strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}<br>
                  <strong>Alert Type:</strong> Metric Threshold Exceeded
                </p>
              </div>
              
              <div class="footer">
                Amapiano AI Studio - Performance Monitoring<br>
                This is an automated alert from the real-time monitoring system.
              </div>
            </div>
          </body>
        </html>
      `;
    } else if (alertType === 'system_critical') {
      subject = '🔴 CRITICAL: Research System Failure Detected';
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 16px; font-weight: 600; }
              .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔴 CRITICAL SYSTEM ALERT</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate Action Required</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  🔴 CRITICAL: Multiple system failures detected. Immediate attention required.
                </div>
                
                <p style="font-size: 16px; margin-top: 20px;">
                  The research validation system has detected critical failures that require immediate investigation:
                </p>
                
                <ul style="font-size: 16px;">
                  <li>Multiple tests failing consecutively</li>
                  <li>System performance degraded significantly</li>
                  <li>Research hypotheses validation at risk</li>
                </ul>
                
                <p style="margin-top: 30px;">
                  <strong>IMMEDIATE ACTIONS REQUIRED:</strong>
                </p>
                <ol>
                  <li>Check system logs immediately</li>
                  <li>Verify all backend services are operational</li>
                  <li>Review recent deployments or configuration changes</li>
                  <li>Contact system administrators if issue persists</li>
                </ol>
                
                <a href="${Deno.env.get('SUPABASE_URL') || 'https://your-project.lovable.app'}/research" class="button">
                  Access Research Dashboard Now →
                </a>
                
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  <strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}<br>
                  <strong>Alert Type:</strong> Critical System Failure<br>
                  <strong>Priority:</strong> URGENT
                </p>
              </div>
              
              <div class="footer">
                Amapiano AI Studio - Critical Alert System<br>
                This is an automated CRITICAL alert requiring immediate attention.
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Research System <research@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log('[Research Alert] Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('[Research Alert] Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send research alert email' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);