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
