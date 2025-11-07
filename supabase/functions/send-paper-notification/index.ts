import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "paper_submitted" | "review_added" | "reviewer_assigned" | "paper_status_changed";
  recipientEmail: string;
  recipientName: string;
  paperTitle: string;
  paperId: string;
  additionalData?: {
    reviewerName?: string;
    reviewComment?: string;
    newStatus?: string;
    arxivId?: string;
  };
}

const getEmailContent = (req: NotificationRequest) => {
  const baseUrl = Deno.env.get("SITE_URL") || "https://your-app.com";
  const paperUrl = `${baseUrl}/research?paper=${req.paperId}`;

  switch (req.type) {
    case "paper_submitted":
      return {
        subject: `Paper Submitted: ${req.paperTitle}`,
        html: `
          <h1>Paper Successfully Submitted</h1>
          <p>Hi ${req.recipientName},</p>
          <p>Your paper "<strong>${req.paperTitle}</strong>" has been successfully submitted.</p>
          ${req.additionalData?.arxivId ? `<p>arXiv ID: <strong>${req.additionalData.arxivId}</strong></p>` : ''}
          <p><a href="${paperUrl}" style="color: #2563eb; text-decoration: none;">View Paper</a></p>
          <p>You will receive notifications when reviewers provide feedback.</p>
          <p>Best regards,<br>Research Platform Team</p>
        `,
      };

    case "review_added":
      return {
        subject: `New Review on: ${req.paperTitle}`,
        html: `
          <h1>New Review Received</h1>
          <p>Hi ${req.recipientName},</p>
          <p>A new review has been submitted for your paper "<strong>${req.paperTitle}</strong>".</p>
          ${req.additionalData?.reviewerName ? `<p>Reviewer: <strong>${req.additionalData.reviewerName}</strong></p>` : ''}
          ${req.additionalData?.reviewComment ? `<p>Comment: <em>${req.additionalData.reviewComment}</em></p>` : ''}
          <p><a href="${paperUrl}" style="color: #2563eb; text-decoration: none;">View Review</a></p>
          <p>Best regards,<br>Research Platform Team</p>
        `,
      };

    case "reviewer_assigned":
      return {
        subject: `Review Request: ${req.paperTitle}`,
        html: `
          <h1>You've Been Assigned as a Reviewer</h1>
          <p>Hi ${req.recipientName},</p>
          <p>You have been assigned to review the paper "<strong>${req.paperTitle}</strong>".</p>
          <p><a href="${paperUrl}" style="color: #2563eb; text-decoration: none;">Start Review</a></p>
          <p>Please complete your review at your earliest convenience.</p>
          <p>Best regards,<br>Research Platform Team</p>
        `,
      };

    case "paper_status_changed":
      return {
        subject: `Paper Status Update: ${req.paperTitle}`,
        html: `
          <h1>Paper Status Updated</h1>
          <p>Hi ${req.recipientName},</p>
          <p>The status of your paper "<strong>${req.paperTitle}</strong>" has been updated.</p>
          ${req.additionalData?.newStatus ? `<p>New Status: <strong>${req.additionalData.newStatus.replace('_', ' ').toUpperCase()}</strong></p>` : ''}
          <p><a href="${paperUrl}" style="color: #2563eb; text-decoration: none;">View Paper</a></p>
          <p>Best regards,<br>Research Platform Team</p>
        `,
      };

    default:
      throw new Error("Invalid notification type");
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[PAPER-NOTIFICATION] Function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notificationRequest: NotificationRequest = await req.json();
    console.log("[PAPER-NOTIFICATION] Request:", notificationRequest);

    const { subject, html } = getEmailContent(notificationRequest);

    const emailResponse = await resend.emails.send({
      from: "Research Platform <onboarding@resend.dev>",
      to: [notificationRequest.recipientEmail],
      subject,
      html,
    });

    console.log("[PAPER-NOTIFICATION] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[PAPER-NOTIFICATION] Error:", error);
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
