// Wheeler site runtime config — copy to assets/config.js and fill after Supabase setup.
// assets/config.js is gitignored; never commit real keys.
// SUPABASE_ANON_KEY is safe to expose publicly (protected by Row Level Security).
// The SERVICE ROLE key must NEVER appear in this file or any client-side code.
window.WHEELER_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY",
  features: {
    feedbackForm: false,   // flip true after edge functions deployed + tested
    reviewForm: false,     // flip true after submit-review deployed + tested
    promoEnabled: false    // NEVER true until Wheeler approves discount terms
  }
};
