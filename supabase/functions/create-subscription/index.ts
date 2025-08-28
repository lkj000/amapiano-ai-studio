import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { tier } = await req.json();
    
    // Define subscription tiers with pricing
    const subscriptionPlans = {
      producer: {
        name: "Producer Plan",
        price: 999, // $9.99/month
        features: ["Unlimited Projects", "Basic VST Plugins", "Sample Library Access"]
      },
      professional: {
        name: "Professional Plan", 
        price: 2999, // $29.99/month
        features: ["Everything in Producer", "Premium VST Plugins", "Advanced Audio Effects", "Multi-track Routing"]
      },
      enterprise: {
        name: "Enterprise Plan",
        price: 4999, // $49.99/month
        features: ["Everything in Professional", "All VST Plugins", "Collaboration Tools", "Priority Support"]
      }
    };

    const plan = subscriptionPlans[tier as keyof typeof subscriptionPlans];
    if (!plan) throw new Error("Invalid subscription tier");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: plan.name,
              description: plan.features.join(", ")
            },
            unit_amount: plan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?tier=${tier}`,
      cancel_url: `${req.headers.get("origin")}/subscription`,
      metadata: {
        user_id: user.id,
        subscription_tier: tier
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});