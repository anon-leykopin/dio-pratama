const body = document.body;
const themeBtn = document.getElementById('themeToggle');
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');

/* Theme toggle */
const saved = localStorage.getItem('theme');
if (saved) body.classList.toggle('dark', saved === 'dark');
if (themeBtn) themeBtn.textContent = body.classList.contains('dark') ? '🌙' : '☀️';
themeBtn?.addEventListener('click', () => {
  const isDark = body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '🌙' : '☀️';
});

/* Mobile menu */
burger?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.classList.toggle('active', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
});
menu?.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      menu.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
});

/* Typing */
const target = document.getElementById('typeTarget');
const phrases = [
  'Aspiring Mobile & Frontend Developer',
  'Fast Learner · Adaptable · Problem Solver',
  'Flutter & Dart Enthusiast'
];
let pi = 0, ci = 0, deleting = false;
function typeLoop(){
  if(!target) return;
  const text = phrases[pi];
  target.textContent = text.slice(0, ci);
  if(!deleting && ci < text.length){ ci++; }
  else if(deleting && ci > 0){ ci--; }
  else{
    if(!deleting){ deleting = true; setTimeout(typeLoop, 900); return; }
    if(ci === 0){ deleting = false; pi = (pi+1) % phrases.length; }
  }
  setTimeout(typeLoop, deleting ? 40 : 60);
}
typeLoop();

/* Reveal */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
},{threshold:.12}) : null;
document.querySelectorAll('.reveal').forEach(el=>io?.observe(el));

/* Smooth scroll (respect reduced motion) */
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',(e)=>{
    const id = a.getAttribute('href');
    if(!id || id==="#") return;
    const t = document.querySelector(id);
    if(!t) return;
    e.preventDefault();
    t.scrollIntoView({behavior: prefersReduced ? 'auto' : 'smooth', block: 'start'});
  });
});

/* Footer year */
document.getElementById('year').textContent = new Date().getFullYear();

/* Timeline axis (desktop) */
function updateTimelineAxis(){
  const timeline = document.querySelector('#experience .timeline');
  const axis = timeline?.querySelector('.tl-axis');
  const markers = timeline?.querySelectorAll('.tl-marker');
  if (!timeline || !axis || !markers || !markers.length) return;

  const first = markers[0].getBoundingClientRect();
  const last  = markers[markers.length - 1].getBoundingClientRect();
  const wrap  = timeline.getBoundingClientRect();

  const start = (first.top + first.height / 2) - wrap.top;
  const end   = (last.top  + last.height  / 2) - wrap.top;

  axis.style.top = `${start}px`;
  axis.style.height = `${Math.max(0, end - start)}px`;
}
window.addEventListener('load', updateTimelineAxis);
window.addEventListener('resize', updateTimelineAxis);
document.fonts?.ready.then(updateTimelineAxis);
