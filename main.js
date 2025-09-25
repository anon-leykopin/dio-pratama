const body = document.body;
const themeBtn = document.getElementById('themeToggle');
function setTheme(mode){
  if(mode === 'dark'){ body.classList.add('dark'); themeBtn.textContent = '🌙'; }
  else{ body.classList.remove('dark'); themeBtn.textContent = '☀️'; }
  localStorage.setItem('theme', mode);
}
const saved = localStorage.getItem('theme');
if(saved){ setTheme(saved); }
else{ setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
themeBtn.addEventListener('click', () => setTheme(body.classList.contains('dark') ? 'light' : 'dark'));

const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  burger.classList.toggle('active', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open'); burger.classList.remove('active'); burger.setAttribute('aria-expanded','false');
}));

const typeTarget = document.getElementById('typeTarget');
const phrases = [
  "Aspiring Mobile & Frontend Developer",
  "Flutter & Dart Focused",
  "Fast Learner • Adaptable • Problem Solver"
];
let pi = 0, ci = 0, deleting = false;

function typeLoop(){
  const current = phrases[pi];
  if(!deleting){
    typeTarget.textContent = current.slice(0, ++ci);
    if(ci === current.length){ deleting = true; setTimeout(typeLoop, 1200); return; }
  }else{
    typeTarget.textContent = current.slice(0, --ci);
    if(ci === 0){ deleting = false; pi = (pi+1) % phrases.length; }
  }
  setTimeout(typeLoop, deleting ? 40 : 60);
}
typeLoop();

const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
