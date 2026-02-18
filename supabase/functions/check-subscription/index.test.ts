import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("check-subscription returns 200 without auth (graceful fallback)", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  // Should return 200 with free tier defaults even without valid user auth
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertExists(data);
  // Should return subscription data (defaults to free tier for unauthenticated)
  assertEquals(typeof data.subscribed, "boolean");
  assertEquals(typeof data.subscription_tier, "string");
});

Deno.test("check-subscription returns valid JSON structure", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await response.json();
  
  // Verify expected fields exist
  assertExists(data.subscription_tier);
  assertEquals(["free", "producer", "professional", "enterprise"].includes(data.subscription_tier), true);
});
