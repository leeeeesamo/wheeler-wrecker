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
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}
  }),{threshold:.08});
  reveals.forEach(el=>observer.observe(el));
} else reveals.forEach(el=>el.classList.add("visible"));
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

// Homepage hero slideshow (Wheeler client photos)
const heroSlides = document.querySelectorAll(".hero-slide");
if (heroSlides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let heroIndex = 0;
  setInterval(() => {
    heroSlides[heroIndex].classList.remove("active");
    heroIndex = (heroIndex + 1) % heroSlides.length;
    heroSlides[heroIndex].classList.add("active");
  }, 6000);
}

// Rotate the primary dispatch number in the "Need help now" band.
// Both numbers stay visible/clickable in the "Or call directly" row at all times.
const DISPATCH_NUMBERS = [
  { label: "Bessemer dispatch", number: "(205) 424-3200", tel: "tel:+12054243200", alabaster: false },
  { label: "Alabaster dispatch", number: "(205) 664-9000", tel: "tel:+12056649000", alabaster: true }
];
const helpFeatured = document.getElementById("help-now-featured");
const helpLocation = document.getElementById("help-now-location");
const helpNumber = document.getElementById("help-now-number");
if (helpFeatured && helpLocation && helpNumber && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let dispatchIndex = 0;
  setInterval(() => {
    dispatchIndex = (dispatchIndex + 1) % DISPATCH_NUMBERS.length;
    const d = DISPATCH_NUMBERS[dispatchIndex];
    helpFeatured.classList.toggle("is-alabaster", d.alabaster);
    helpFeatured.setAttribute("href", d.tel);
    helpLocation.textContent = d.label;
    helpNumber.textContent = d.number;
  }, 6000);
}
