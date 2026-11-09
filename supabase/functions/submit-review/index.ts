// Supabase Edge Function: submit-review
// Public endpoint for optional first-party review submission from /reviews/.
// Reviews land as status='pending' — NEVER auto-published.
// No incentive, rating requirement, or sentiment check is involved.
// Deploy: supabase functions deploy submit-review

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }); // honeypot
  }

  const author = String(body.author_name ?? "").trim().slice(0, 120);
  const text = String(body.body ?? "").trim().slice(0, 2000);
  const rating = Number(body.rating);
  if (!author || !text) return json({ error: "Name and review text are required" }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return json({ error: "Rating must be 1–5" }, 400);

  // TODO: rate limiting + optional Turnstile verification before launch.

  const { error } = await supabase.from("reviews").insert({
    author_name: author,
    rating,
    body: text,
    service_location: String(body.service_location ?? "").slice(0, 60) || null,
    status: "pending", // admin must approve before anything is public
    source: "website",
  });
  if (error) return json({ error: "Could not save review" }, 500);
  return json({ ok: true, message: "Thank you! Your review was received and will be reviewed by our team." });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}
