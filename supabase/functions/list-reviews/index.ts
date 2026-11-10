// Supabase Edge Function: list-reviews
// PUBLIC read-only endpoint returning ONLY approved reviews with whitelisted
// fields. Pending/rejected reviews, moderator identity, and internal fields
// are never returned. Deploy (Wheeler's OWN Supabase project only):
//   supabase functions deploy list-reviews --no-verify-jwt
// The site calls: GET {SUPABASE_URL}/functions/v1/list-reviews

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only
);

const MAX_LIMIT = 50;

// ---- CORS: only Wheeler's own origins may call this from a browser ----
const ALLOWED_ORIGINS = new Set([
  "https://wheelertowing.com",
  "https://www.wheelertowing.com",
  "https://leeeeesamo.github.io", // GitHub Pages preview
]);
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/; // local dev

function corsOrigin(req: Request): string | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null; // non-browser client
  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

function json(req: Request, data: unknown, status = 200) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Approved reviews change rarely; keep CDN/browser cache short.
    "Cache-Control": "public, max-age=300",
  };
  const origin = corsOrigin(req);
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Accept";
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const origin = corsOrigin(req);
    if (!origin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Vary": "Origin",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), MAX_LIMIT);

  const { data, error } = await supabase
    .from("reviews")
    .select("author_name, rating, body, service_location, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return json(req, { error: "Could not load reviews" }, 500);

  return json(req, {
    reviews: (data ?? []).map((r) => ({
      author: r.author_name ?? "Wheeler customer",
      rating: r.rating,
      text: r.body,
      location: r.service_location,
      date: r.created_at,
    })),
  });
});
