// Wheeler Wrecker Service — private admin dashboard logic.
// All data access is enforced server-side by Supabase Row Level Security:
// only users flagged is_admin in auth.users can read or moderate reviews.
// This file contains NO secrets — only the public anon key from config.js.

(function () {
  "use strict";

  var cfg = window.WHEELER_CONFIG || {};
  var configured = cfg.supabaseUrl && cfg.supabaseAnonKey &&
    cfg.supabaseUrl.indexOf("WHEELER-PROJECT") === -1 &&
    cfg.supabaseAnonKey.indexOf("WHEELER-ANON-KEY") === -1;

  var loginView = document.getElementById("login-view");
  var dashView = document.getElementById("dash-view");
  var notConfigured = document.getElementById("not-configured");

  if (!configured || typeof window.supabase === "undefined") {
    notConfigured.classList.remove("hidden");
    return;
  }

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  var reviews = [];
  var eventsByReview = {};
  var currentFilter = "all";

  function esc(s) { // extra safety; we also use textContent everywhere
    return String(s == null ? "" : s);
  }

  function stars(r) {
    var n = Math.round(Number(r) || 0);
    return "★".repeat(Math.max(0, Math.min(5, n))) + "☆".repeat(5 - Math.max(0, Math.min(5, n)));
  }

  function fmtDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  // ---------- auth ----------
  document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = document.getElementById("login-btn");
    var status = document.getElementById("login-status");
    btn.disabled = true;
    status.className = "status-msg";
    status.textContent = "Signing in…";
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;
    var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) {
      status.className = "status-msg err";
      status.textContent = "Sign-in failed. Check your email and password.";
      btn.disabled = false;
      return;
    }
    var isAdmin = await checkAdmin();
    if (!isAdmin) {
      await sb.auth.signOut();
      status.className = "status-msg err";
      status.textContent = "This account is not authorized for the Wheeler admin dashboard.";
      btn.disabled = false;
      return;
    }
    status.textContent = "";
    enterDashboard(data.user);
  });

  async function checkAdmin() {
    try {
      var { data, error } = await sb.rpc("is_admin");
      return !error && data === true;
    } catch (e) { return false; }
  }

  async function enterDashboard(user) {
    loginView.classList.add("hidden");
    dashView.classList.remove("hidden");
    document.getElementById("who").textContent = "Signed in as " + (user.email || "admin");
    await loadReviews();
  }

  document.getElementById("logout-btn").addEventListener("click", async function () {
    await sb.auth.signOut();
    dashView.classList.add("hidden");
    loginView.classList.remove("hidden");
    document.getElementById("password").value = "";
  });

  // restore session on load
  (async function init() {
    var { data: { session } } = await sb.auth.getSession();
    if (session && await checkAdmin()) {
      enterDashboard(session.user);
    } else {
      if (session) await sb.auth.signOut();
      loginView.classList.remove("hidden");
    }
  })();

  // ---------- data ----------
  async function loadReviews() {
    var list = document.getElementById("review-list");
    list.innerHTML = '<p class="empty">Loading…</p>';
    var { data, error } = await sb
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      list.innerHTML = '<p class="empty">Could not load reviews. If you just signed in, your admin flag may not be set yet.</p>';
      return;
    }
    reviews = data || [];
    await loadEvents();
    renderStats();
    renderList();
  }

  async function loadEvents() {
    eventsByReview = {};
    if (!reviews.length) return;
    var ids = reviews.map(function (r) { return r.id; });
    var { data } = await sb
      .from("review_events")
      .select("review_id, action, created_at")
      .in("review_id", ids)
      .order("created_at", { ascending: false });
    (data || []).forEach(function (ev) {
      (eventsByReview[ev.review_id] = eventsByReview[ev.review_id] || []).push(ev);
    });
  }

  function renderStats() {
    var c = { pending: 0, approved: 0, rejected: 0 };
    reviews.forEach(function (r) { c[r.status] = (c[r.status] || 0) + 1; });
    document.getElementById("stat-total").textContent = reviews.length;
    document.getElementById("stat-pending").textContent = c.pending || 0;
    document.getElementById("stat-approved").textContent = c.approved || 0;
    document.getElementById("stat-rejected").textContent = c.rejected || 0;
  }

  function renderList() {
    var list = document.getElementById("review-list");
    var shown = reviews.filter(function (r) {
      return currentFilter === "all" || r.status === currentFilter;
    });
    if (!shown.length) {
      list.innerHTML = '<p class="empty">No ' + (currentFilter === "all" ? "" : currentFilter) + ' reviews.</p>';
      return;
    }
    list.innerHTML = "";
    shown.forEach(function (r) { list.appendChild(buildCard(r)); });
  }

  function buildCard(r) {
    var card = document.createElement("article");
    card.className = "review";

    var head = document.createElement("div");
    head.className = "review-head";
    var left = document.createElement("div");
    var name = document.createElement("span");
    name.className = "review-name";
    name.textContent = r.author_name || "Anonymous";
    var loc = document.createElement("span");
    loc.className = "review-loc";
    loc.textContent = (r.service_location ? " · " + r.service_location : "") + " · " + fmtDate(r.created_at);
    left.appendChild(name); left.appendChild(loc);
    var right = document.createElement("div");
    var st = document.createElement("span");
    st.className = "review-stars";
    st.textContent = stars(r.rating);
    st.setAttribute("aria-label", r.rating + " out of 5 stars");
    var pill = document.createElement("span");
    pill.className = "pill " + r.status;
    pill.textContent = r.status;
    right.appendChild(st); right.appendChild(document.createTextNode(" ")); right.appendChild(pill);
    head.appendChild(left); head.appendChild(right);

    var text = document.createElement("div");
    text.className = "review-text";
    text.textContent = r.body;

    var meta = document.createElement("div");
    meta.className = "review-meta";
    meta.textContent = "Submitted " + fmtDate(r.created_at) +
      (r.moderated_at ? " · last moderated " + fmtDate(r.moderated_at) : "");

    var actions = document.createElement("div");
    actions.className = "review-actions";
    // Actions mirror the DB transition rules exactly:
    //   pending → approve/reject · approved → reject · rejected → restore
    if (r.status === "pending") {
      actions.appendChild(mkBtn("Approve", "approve small", function () { moderate(r, "approved"); }));
      actions.appendChild(mkBtn("Reject", "reject small", function () { moderate(r, "rejected"); }));
    } else if (r.status === "approved") {
      actions.appendChild(mkBtn("Reject", "reject small", function () { moderate(r, "rejected"); }));
    } else if (r.status === "rejected") {
      actions.appendChild(mkBtn("Restore to pending", "ghost small", function () { moderate(r, "pending"); }));
    }

    card.appendChild(head); card.appendChild(text); card.appendChild(meta); card.appendChild(actions);

    var evs = eventsByReview[r.id] || [];
    if (evs.length) {
      var hist = document.createElement("div");
      hist.className = "history";
      hist.innerHTML = "<strong>Moderation history</strong>";
      evs.slice(0, 6).forEach(function (ev) {
        var d = document.createElement("div");
        d.textContent = fmtDate(ev.created_at) + " — " + ev.action;
        hist.appendChild(d);
      });
      card.appendChild(hist);
    }
    return card;
  }

  function mkBtn(label, cls, fn) {
    var b = document.createElement("button");
    b.className = cls;
    b.textContent = label;
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  // ---------- moderation (via moderate-review Edge Function) ----------
  // Direct table UPDATE/INSERT is revoked for client roles — all moderation
  // writes go through the function, which re-verifies is_admin and the
  // allowed status transition server-side and writes the audit event.
  async function moderate(r, newStatus) {
    var verb = { approved: "approve", rejected: "reject", pending: "restore to pending" }[newStatus];
    if (!window.confirm("Are you sure you want to " + verb + " this review?")) return;
    var action = newStatus === "approved" ? "approve" : newStatus === "rejected" ? "reject" : "restore";
    var { data: sess } = await sb.auth.getSession();
    var token = sess && sess.session ? sess.session.access_token : null;
    if (!token || !cfg.reviewFunctionUrl || cfg.reviewFunctionUrl.indexOf("WHEELER-PROJECT") !== -1) {
      window.alert("Moderation is not configured yet.");
      return;
    }
    var res = await fetch(cfg.reviewFunctionUrl + "/moderate-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ review_id: r.id, action: action }),
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) { window.alert("Update failed: " + (data.error || res.status)); return; }
    r.status = newStatus;
    renderStats();
    renderList();
    loadEvents().then(renderList); // refresh audit history
  }

  // ---------- filters ----------
  document.getElementById("filters").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    this.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b === btn); });
    renderList();
  });
})();
