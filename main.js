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
  'Interest to Mobile & Frontend Developer',
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

const isMobile = window.matchMedia('(max-width: 767px)').matches;

if (isMobile || prefersReduced) {
  // matikan caret blink via class/inline style
  document.querySelectorAll('.caret').forEach(el => el.style.animation = 'none');

  // kalau mau hentikan typing sepenuhnya, tampilkan 1 kalimat saja:
  const target = document.getElementById('typeTarget');
  if (target) target.textContent = 'Interest to Mobile & Frontend';
  // lalu jangan panggil typeLoop di bawah (guard)
} else {
  // jalankan typing normal (panggilan typeLoop() yang sudah kamu punya)
}

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

/* ============================================================
   Hero card: subtle tilt (desktop) + parallax on scroll
   - hormati prefers-reduced-motion
   - tilt hanya di desktop
   ============================================================ */
(function () {
  const card = document.querySelector('.hero-card-tilt');
  if (!card) return;

  // pakai nilai prefersReduced yang sudah ada; fallback jika belum terdefinisi
  const prefReduced =
    (typeof prefersReduced !== 'undefined')
      ? prefersReduced
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isMobile = window.matchMedia('(max-width: 860px)').matches;

  // Parallax relatif ke section hero (clamp ±10px)
const hero = document.querySelector('.hero');
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function onScroll() {
  if (prefReduced || !hero) return;

  // scroll lokal di dalam hero: 0..heroH
  const heroTop = hero.offsetTop;
  const heroH   = hero.offsetHeight || 1;
  const y       = (window.scrollY || window.pageYOffset || 0) - heroTop;
  const local   = clamp(y, 0, heroH);

  // progress -1..1: -1 (awal hero) → 0 (tengah) → 1 (akhir)
  const p = ((local / heroH) * 2) - 1;

  // translateY kecil, di-clamp agar tidak “melorot”
  const translate = clamp(p * 10, -10, 10); // px

  const tiltSuffix = card._tiltSuffix || '';
  card.style.transform = `translateY(${translate.toFixed(1)}px)` + tiltSuffix;
}

onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);

  // Tilt ringan mengikuti pointer (desktop only)
  if (!prefReduced && !isMobile) {
    const maxTilt = 3; // derajat maksimum
    const damp = 0.12; // smoothing
    let tx = 0, ty = 0; // target rotY (tx) & rotX (ty)
    let rx = 0, ry = 0; // rendered rotX/rotY

    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      // rotasi kecil; clamp ke [-1,1]
      const cl = (v) => Math.max(-1, Math.min(1, v));
      tx = cl(dx) * maxTilt;  // rotY
      ty = cl(-dy) * maxTilt; // rotX
    }
    function onLeave() { tx = 0; ty = 0; }

    function raf() {
      // easing ke target
      rx += (ty - rx) * damp; // rotX render
      ry += (tx - ry) * damp; // rotY render
      card._tiltSuffix = ` rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      // pertahankan translateY dari parallax
      const currentTranslate = card.style.transform.match(/translateY\([^)]+\)/)?.[0] || 'translateY(0px)';
      card.style.transform = currentTranslate + card._tiltSuffix;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
  }
})();
