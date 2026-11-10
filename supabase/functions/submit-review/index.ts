// Supabase Edge Function: submit-review
// Public endpoint for customer review submission from /reviews.html.
// Reviews land as status='pending' — NEVER auto-published.
// No incentive, rating requirement, or sentiment check is involved.
// Deploy (Wheeler's OWN Supabase project only):
//   supabase functions deploy submit-review --no-verify-jwt
// The site calls: POST {SUPABASE_URL}/functions/v1/submit-review
// Body: { name?, location?, rating, review, website? }
// Spam/bot protection: honeypot field + optional Turnstile + payload caps.
// Rate limiting: atomic DB RPC (public.check_rate_limit) — 5 submissions
// per IP per 10 minutes, enforced across all instances. Fails CLOSED (503)
// if the limiter is unavailable; there is no in-memory fallback.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only, never in browser
);

const MAX_BODY_BYTES = 16 * 1024; // hard cap enforced WHILE streaming the body

// ---- CORS: only Wheeler's own origins may call this from a browser ----
const ALLOWED_ORIGINS = new Set([
  "https://wheelertowing.com",
  "https://www.wheelertowing.com",
  "https://leeeeesamo.github.io", // GitHub Pages preview
]);
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/; // local dev
// Headers the Wheeler frontend actually sends: Content-Type + Accept on
// public calls; Authorization is listed for completeness/consistency.
const ALLOW_HEADERS = "Content-Type, Accept, Authorization";

function corsOrigin(req: Request): string | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null; // non-browser client (curl, server-to-server)
  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

function json(req: Request, data: unknown, status = 200) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const origin = corsOrigin(req);
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = ALLOW_HEADERS;
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

// ---- Client IP ----
// Supabase does not document a provider-guaranteed client-IP header, and
// X-Forwarded-For entries added by the CLIENT are spoofable. Standard proxy
// semantics append each hop's observed address, so the RIGHTMOST entry is
// the one added by Supabase's edge gateway for the real TCP peer; entries to
// its left may be attacker-supplied. We take the rightmost entry that is a
// syntactically valid IP, and fall back to a shared "unknown" bucket
// (still rate-limited, just collectively) when nothing valid exists.
// Residual risk: a caller rotating source IPs bypasses per-IP limits —
// that is what Turnstile + human moderation are for.
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/; // loose; rejects obvious garbage

function isPlausibleIp(s: string): boolean {
  if (IPV4.test(s)) {
    return s.split(".").every((o) => Number(o) <= 255);
  }
  return s.includes(":") && IPV6.test(s) && s.length <= 45;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (isPlausibleIp(parts[i])) return parts[i];
    }
  }
  return "unknown";
}

// ---- Atomic rate limiter (DB-backed, fails closed) ----
// public.check_rate_limit() takes a per-IP advisory lock inside one
// transaction, counts the 10-minute window, records the attempt, and
// returns true when over the limit. Any RPC error → 503, never a silent
// fallback to per-instance memory (which would be unreliable anyway).
async function rateLimited(ip: string): Promise<"limited" | "unavailable" | "ok"> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", { p_ip: ip });
    if (error) {
      console.error("rate limit rpc error:", error.message);
      return "unavailable";
    }
    return data === true ? "limited" : "ok";
  } catch (e) {
    console.error("rate limit rpc exception:", String(e));
    return "unavailable";
  }
}

// ---- Request body: stream-read with a hard byte cap ----
// Content-Length can be absent or lied about; we count actual bytes.
async function readBodyCapped(req: Request): Promise<Uint8Array | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) return null;
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

function parseJsonObject(bytes: Uint8Array): Record<string, unknown> | null {
  let text: string;
  try { text = new TextDecoder().decode(bytes); } catch { return null; }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return null; }
  // Reject null, arrays, and scalar payloads — must be a plain object.
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

// Strict field typing: wrong JSON types are rejected, not coerced.
// Optional string fields may be absent/null/"" but must be strings otherwise.
function optString(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return undefined; // wrong type → reject
  const t = v.trim().slice(0, max);
  return t === "" ? null : t;
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true; // not configured — honeypot + rate limit still apply
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        ...(ip !== "unknown" ? { remoteip: ip } : {}),
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false; // fail closed when Turnstile is configured but unreachable
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    const origin = corsOrigin(req);
    if (!origin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": ALLOW_HEADERS,
        "Vary": "Origin",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const ip = clientIp(req);
  const rl = await rateLimited(ip);
  if (rl === "unavailable")
    return json(req, { error: "Service temporarily unavailable. Please try again shortly." }, 503);
  if (rl === "limited")
    return json(req, { error: "Too many submissions. Please try again later." }, 429);

  const bytes = await readBodyCapped(req);
  if (bytes === null) return json(req, { error: "Payload too large" }, 413);

  const body = parseJsonObject(bytes);
  if (body === null) return json(req, { error: "Invalid JSON" }, 400);

  // Honeypot: bots fill the hidden "website" field; humans never see it.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json(req, { ok: true }); // silently accept, store nothing
  }

  // Optional Cloudflare Turnstile (free). Only enforced when secret is set —
  // do NOT set TURNSTILE_SECRET_KEY until the widget is live on reviews.html,
  // or every submission will fail verification.
  if (!(await verifyTurnstile(
    typeof body["cf-turnstile-response"] === "string" ? body["cf-turnstile-response"] : undefined,
    ip,
  ))) {
    return json(req, { error: "Verification failed. Please refresh and try again." }, 400);
  }

  // Strict types: rating must be a JSON number; review must be a string.
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)
    return json(req, { error: "Rating must be 1-5" }, 400);
  if (typeof body.review !== "string")
    return json(req, { error: "Review text is required" }, 400);

  const review = body.review.trim();
  const name = optString(body.name, 80);
  const location = optString(body.location, 40);
  if (name === undefined || location === undefined)
    return json(req, { error: "Invalid field type" }, 400);

  if (review.length < 10 || review.length > 2000)
    return json(req, { error: "Review must be 10-2000 characters" }, 400);

  const { error } = await supabase.from("reviews").insert({
    author_name: name,
    rating: body.rating,
    body: review,
    service_location: location,
    status: "pending", // admin must approve before anything is public
    source: "website",
  });
  if (error) return json(req, { error: "Could not save review" }, 500);

  return json(req, { ok: true, message: "Thank you! Your review was received and will be reviewed by our team." });
});
