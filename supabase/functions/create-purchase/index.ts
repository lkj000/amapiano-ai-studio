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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { item_id } = await req.json();
    
    // Fetch marketplace item details
    const { data: item, error: itemError } = await supabaseClient
      .from("marketplace_items")
      .select("*")
      .eq("id", item_id)
      .eq("active", true)
      .single();

    if (itemError || !item) {
      throw new Error("Marketplace item not found or inactive");
    }

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
            currency: item.currency || "usd",
            product_data: { 
              name: item.name,
              description: item.description || "",
              images: item.image_url ? [item.image_url] : []
            },
            unit_amount: item.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/purchase-success?item=${item.id}`,
      cancel_url: `${req.headers.get("origin")}/marketplace`,
      metadata: {
        user_id: user.id,
        item_id: item.id,
        product_type: item.category
      }
    });

    // Create pending order record
    await supabaseClient.from("orders").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: item.price_cents,
      currency: item.currency || "usd",
      product_type: item.category,
      product_id: item.id,
      status: "pending"
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Purchase creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});