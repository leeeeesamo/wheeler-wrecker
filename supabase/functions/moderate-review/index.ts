// Supabase Edge Function: moderate-review
// PRIVATE admin endpoint for review moderation. Called by /admin/ with the
// signed-in admin's JWT. Verifies is_admin server-side, validates the status
// transition, updates the review, and writes the audit event atomically.
// Deploy (Wheeler's OWN Supabase project only):
//   supabase functions deploy moderate-review   (JWT verification ON — default)
// The site calls: POST {SUPABASE_URL}/functions/v1/moderate-review
// Headers: Authorization: Bearer <user access_token>
// Body: { review_id, action }  action ∈ approve | reject | restore

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ACTION_TO_STATUS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  restore: "pending",
};

// allowed transitions match the dashboard UI exactly:
//   pending  → approved | rejected
//   approved → rejected
//   rejected → pending  (restore)
const ALLOWED: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: ["pending"],
};

const MAX_BODY_BYTES = 8 * 1024; // moderation payloads are tiny

// ---- CORS: browser calls come only from Wheeler's own origins ----
const ALLOWED_ORIGINS = new Set([
  "https://wheelertowing.com",
  "https://www.wheelertowing.com",
  "https://leeeeesamo.github.io", // GitHub Pages preview
]);
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/; // local dev

function corsOrigin(req: Request): string | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

function json(req: Request, data: unknown, status = 200) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const origin = corsOrigin(req);
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    // Authorization is required — the admin dashboard sends a Bearer JWT.
    headers["Access-Control-Allow-Headers"] = "Content-Type, Accept, Authorization";
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

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
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const origin = corsOrigin(req);
    if (!origin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
        "Vary": "Origin",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json(req, { error: "Authentication required" }, 401);

  // User-scoped client: proves the caller is a real signed-in user.
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json(req, { error: "Invalid session" }, 401);

  // Server-side admin check — NOT a client-side flag.
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) return json(req, { error: "Forbidden" }, 403);

  const bytes = await readBodyCapped(req);
  if (bytes === null) return json(req, { error: "Payload too large" }, 413);

  const body = parseJsonObject(bytes);
  if (body === null) return json(req, { error: "Invalid JSON" }, 400);

  const action = String(body.action ?? "");
  const newStatus = ACTION_TO_STATUS[action];
  const reviewId = String(body.review_id ?? "");
  if (!newStatus || !reviewId) return json(req, { error: "Invalid request" }, 400);

  const svc = ADMIN();
  const { data: review, error: getErr } = await svc
    .from("reviews")
    .select("id, status")
    .eq("id", reviewId)
    .single();
  if (getErr || !review) return json(req, { error: "Review not found" }, 404);

  // Atomic: the moderate_review DB function updates the review AND inserts
  // the audit event in a single transaction. It re-validates the status
  // transition inside Postgres as defense-in-depth. service_role only.
  const { error: rpcErr } = await svc.rpc("moderate_review", {
    p_review_id: reviewId,
    p_new_status: newStatus,
    p_actor: userData.user.id,
  });
  if (rpcErr) {
    const msg = String(rpcErr.message ?? "");
    const status = msg.includes("invalid transition") ? 409 : 500;
    return json(req, { error: status === 409 ? "Invalid status transition" : "Update failed" }, status);
  }

  return json(req, { ok: true, status: newStatus });
});
