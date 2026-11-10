// Wheeler site runtime config — copy to assets/config.js and fill after Supabase setup.
// assets/config.js IS committed to the repo: it holds only the publishable
// SUPABASE_ANON_KEY + project URL, which are safe for public GitHub Pages.
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
