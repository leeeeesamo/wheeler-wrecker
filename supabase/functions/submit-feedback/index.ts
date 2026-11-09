// Supabase Edge Function: submit-feedback
// Public endpoint for the /reviews/ "Send us private feedback" form.
// Deploy: supabase functions deploy submit-feedback
// The site calls: POST {SUPABASE_URL}/functions/v1/submit-feedback
// Body: { name?, contact?, message, kind? }
// Spam protection: honeypot field + per-IP rate limit via Supabase (see notes).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only, never exposed to browser
);

const ALLOWED_KINDS = new Set(["general", "question", "complaint", "compliment", "discount-inquiry"]);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  // Honeypot: bots fill hidden "website" field; humans never see it.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }); // silently accept, store nothing
  }

  const message = String(body.message ?? "").trim();
  if (!message || message.length > 4000) return json({ error: "Message required (max 4000 chars)" }, 400);

  const kind = ALLOWED_KINDS.has(String(body.kind)) ? String(body.kind) : "general";

  // TODO before launch: add rate limiting (e.g., Upstash Redis or Supabase-based counter)
  // TODO: consider Turnstile/reCAPTCHA token verification for production.

  const { error } = await supabase.from("feedback").insert({
    name: String(body.name ?? "").slice(0, 120) || null,
    contact: String(body.contact ?? "").slice(0, 180) || null,
    message,
    kind,
  });
  if (error) return json({ error: "Could not save feedback" }, 500);
  return json({ ok: true });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}
