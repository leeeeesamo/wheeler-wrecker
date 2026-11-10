const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
window.addEventListener("scroll", () => header?.classList.toggle("scrolled", window.scrollY > 20), {passive:true});
function closeMenu() {
  menuButton?.setAttribute("aria-expanded","false");
  nav?.classList.remove("open");
  document.body.classList.remove("menu-open");
}
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav?.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});
navLinks.forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if(event.key==="Escape") {closeMenu();menuButton?.focus();}
});
const year = document.getElementById("year");if(year) year.textContent=String(new Date().getFullYear());
const form=document.getElementById("inquiry-form");
form?.addEventListener("submit",event=>{
  event.preventDefault();
  if(!form.reportValidity()) return;
  const fd=new FormData(form);
  const value=k=>String(fd.get(k)||"").trim();
  const target=form.dataset.mailto;
  if(!target)return;
  const subject="Wheeler Wrecker – "+value("inquiry");
  const body=["Non-urgent website inquiry","", "Name: "+value("name"),"Phone: "+value("phone"),"Email: "+value("email"),"Inquiry type: "+value("inquiry"),"","Message:",value("message"),"","Urgent towing and recovery requests must be made by phone."].join("\n");
  const status=document.getElementById("form-status");
  if(status)status.textContent="Your email application will open with your message. You must send the email there. For urgent service, call dispatch.";
  window.location.href="mailto:"+target+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
});

// Homepage truck slideshow: auto-rotate, arrows, dot navigation
const slides = document.querySelectorAll(".slide-viewport .slide");
const dots = document.querySelectorAll(".slide-dot");
const slideViewport = document.querySelector(".slide-viewport");
if (slides.length > 1) {
  let slideIndex = 0;
  let slideTimer = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function goToSlide(i) {
    slideIndex = (i + slides.length) % slides.length;
    slides.forEach((el, n) => el.classList.toggle("active", n === slideIndex));
    dots.forEach((el, n) => {
      el.classList.toggle("active", n === slideIndex);
      el.setAttribute("aria-pressed", String(n === slideIndex));
    });
  }
  function startSlideTimer() {
    if (!reduceMotion && slideTimer === null) slideTimer = setInterval(() => goToSlide(slideIndex + 1), 6000);
  }
  function stopSlideTimer() {
    if (slideTimer !== null) { clearInterval(slideTimer); slideTimer = null; }
  }
  document.querySelector(".slide-prev")?.addEventListener("click", () => { goToSlide(slideIndex - 1); startSlideTimer(); });
  document.querySelector(".slide-next")?.addEventListener("click", () => { goToSlide(slideIndex + 1); startSlideTimer(); });
  dots.forEach((dot, n) => dot.addEventListener("click", () => { goToSlide(n); startSlideTimer(); }));
  slideViewport?.addEventListener("pointerenter", stopSlideTimer);
  slideViewport?.addEventListener("pointerleave", startSlideTimer);
  slideViewport?.addEventListener("focusin", stopSlideTimer);
  slideViewport?.addEventListener("focusout", startSlideTimer);
  dots.forEach(dot => dot.setAttribute("aria-pressed", "false"));
  dots[0]?.setAttribute("aria-pressed", "true");
  startSlideTimer();
}

// ===== Wheeler customer reviews — Supabase backend =====
// Config comes from assets/config.js (gitignored, Wheeler project only).
// Reviews submit to the submit-review Edge Function (status always 'pending').
// Approved reviews are rendered read-only from the list-reviews Edge Function.
const WHEELER = window.WHEELER_CONFIG || {};
const reviewApi = WHEELER.reviewFunctionUrl && !WHEELER.reviewFunctionUrl.includes("WHEELER-PROJECT")
  ? WHEELER.reviewFunctionUrl
  : null;
const reviewFormEnabled = !!(reviewApi && WHEELER.features && WHEELER.features.reviewForm);

function reviewStars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ----- Public display of APPROVED reviews only -----
const approvedWrap = document.getElementById("approved-reviews");
function reviewCard(r) {
  const card = document.createElement("article");
  card.className = "review-grid-card";
  const stars = document.createElement("div");
  stars.className = "review-grid-stars";
  stars.textContent = reviewStars(Number(r.rating) || 0);
  stars.setAttribute("aria-label", `${r.rating} out of 5 stars`);
  const body = document.createElement("p");
  body.className = "review-grid-text";
  body.textContent = r.text;
  const when = r.date ? new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const attrib = document.createElement("div");
  attrib.className = "review-grid-attrib";
  const nameEl = document.createElement("p");
  nameEl.className = "review-grid-name";
  nameEl.textContent = r.author || "Wheeler customer";
  const locEl = document.createElement("p");
  locEl.className = "review-grid-loc";
  locEl.textContent = [r.location, when].filter(Boolean).join(" · ");
  attrib.append(nameEl, locEl);
  card.append(stars, body, attrib);
  return card;
}

// Local-only design preview: renders a clearly-labeled SAMPLE review card so
// the layout can be reviewed before real reviews exist. Only ever runs on
// localhost — it can never appear on wheelertowing.com or the GitHub Pages
// preview because the hostname check fails there.
const SAMPLE_REVIEW = {
  author: "Jamie R.",
  rating: 5,
  text: "Had to get my truck towed after it broke down near Alabaster. The dispatcher was really helpful, and the driver was friendly and professional. They made a stressful situation a lot easier. Definitely appreciate the help!",
  location: "Alabaster",
  date: null,
};
const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);

function sampleReviewCard() {
  // Identical markup/styling to a genuine approved-review card.
  return reviewCard(SAMPLE_REVIEW);
}

function sampleReviewNote() {
  const note = document.createElement("p");
  note.className = "review-sample-note";
  note.textContent = "Local preview — fictional sample";
  return note;
}

if (approvedWrap && reviewApi) {
  fetch(`${reviewApi}/list-reviews?limit=20`, { headers: { Accept: "application/json" } })
    .then((res) => { if (!res.ok) throw new Error("bad status"); return res.json(); })
    .then((data) => {
      const list = Array.isArray(data.reviews) ? data.reviews : [];
      if (!list.length && !isLocalHost) {
        approvedWrap.innerHTML = "";
        const p = document.createElement("p");
        p.className = "reviews-empty";
        p.textContent = "No published reviews yet — check back soon, or be the first to share your experience below.";
        approvedWrap.appendChild(p);
        return;
      }
      const grid = document.createElement("div");
      grid.className = "review-grid";
      for (const r of list) grid.appendChild(reviewCard(r));
      approvedWrap.innerHTML = "";
      approvedWrap.appendChild(grid);
      if (isLocalHost) {
        grid.appendChild(sampleReviewCard());
        approvedWrap.appendChild(sampleReviewNote());
      }
    })
    .catch(() => {
      approvedWrap.innerHTML = "";
      const p = document.createElement("p");
      p.className = "reviews-empty";
      p.textContent = "Reviews are temporarily unavailable. Please check back soon.";
      approvedWrap.appendChild(p);
    });
} else if (approvedWrap) {
  approvedWrap.innerHTML = "";
  const p = document.createElement("p");
  p.className = "reviews-empty";
  p.textContent = "Customer reviews will appear here once our online system is connected.";
  approvedWrap.appendChild(p);
}

// ----- Review submission form (pending moderation) -----
const reviewForm = document.getElementById("review-form");
if (reviewForm) {
  const statusEl = document.getElementById("review-status");
  const hintEl = document.getElementById("star-hint");
  const submitBtn = document.getElementById("review-submit");
  const successEl = document.getElementById("review-success");
  const ratingInputs = [...reviewForm.querySelectorAll('input[name="rating"]')];
  const starLabels = [...reviewForm.querySelectorAll(".star-rating .star")];
  let selectedRating = 0;

  function paintStars(value, isHover = false) {
    starLabels.forEach((l) => {
      const v = Number(l.dataset.value);
      l.classList.toggle("is-filled", v <= value);
      l.setAttribute("aria-hidden", "true");
    });
    if (!isHover) {
      hintEl.textContent = selectedRating
        ? `You selected ${selectedRating} out of 5 stars.`
        : "Select 1 to 5 stars.";
      hintEl.classList.toggle("is-error", false);
    }
  }
  ratingInputs.forEach((input) => {
    input.addEventListener("change", () => {
      selectedRating = Number(input.value);
      paintStars(selectedRating);
    });
  });
  starLabels.forEach((label) => {
    label.addEventListener("mouseenter", () => paintStars(Number(label.dataset.value), true));
    label.addEventListener("mouseleave", () => paintStars(selectedRating));
    label.addEventListener("focus", () => paintStars(Number(label.dataset.value), true));
    label.addEventListener("blur", () => paintStars(selectedRating));
  });

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
  }

  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rating = reviewForm.querySelector('input[name="rating"]:checked');
    const reviewText = reviewForm.querySelector('textarea[name="review"]').value.trim();

    if (!rating) {
      setStatus("Please choose a star rating.", "error");
      hintEl.textContent = "Please select 1 to 5 stars.";
      hintEl.classList.add("is-error");
      ratingInputs[0].focus();
      return;
    }
    if (reviewText.length < 10) {
      setStatus("Please write a few sentences about your experience (at least 10 characters).", "error");
      reviewForm.querySelector('textarea[name="review"]').focus();
      return;
    }
    if (!reviewFormEnabled) {
      setStatus("Online review submission is not configured yet. Please call (205) 664-9000 or email info@wheelertowing.com instead.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = "Sending…";
    setStatus("", "");

    const payload = {
      name: reviewForm.querySelector('input[name="name"]').value.trim() || null,
      location: reviewForm.querySelector('select[name="location"]').value || null,
      rating: Number(rating.value),
      review: reviewText,
      website: reviewForm.querySelector('input[name="website"]')?.value || "",
    };

    try {
      const res = await fetch(`${reviewApi}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "submit failed");
      reviewForm.hidden = true;
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      setStatus("Something went wrong sending your review. Please try again, or call (205) 664-9000.", "error");
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.textContent = "Submit review";
    }
  });
}
