// Wheeler Wrecker Service — runtime config
// Committed to the repo for GitHub Pages: contains ONLY publishable values
// (project URL + anon key). Fill in from Wheeler's OWN Supabase project
// (docs/supabase-wheeler-setup.md). NEVER reuse credentials from other projects.
// supabaseAnonKey is safe to expose publicly (protected by Row Level Security).
// The SERVICE ROLE key must NEVER appear in this file or any client-side code.
window.WHEELER_CONFIG = {
  supabaseUrl: "https://yyplaluzyavgriheggyc.supabase.co",
  supabaseAnonKey: "sb_publishable_tp1g_kiDsd4bKJPasooxcw_wg5MWqPr",
  reviewFunctionUrl: "https://yyplaluzyavgriheggyc.supabase.co/functions/v1",
  features: {
    feedbackForm: false,   // flip true after edge functions deployed + tested
    reviewForm: true,      // submit-review + list-reviews deployed — live
    promoEnabled: false    // NEVER true until Wheeler approves discount terms
  }
};
