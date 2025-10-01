// effects/particles/particles.js
// Particles minimalis: ringan, subtle, hormati reduced motion, pause saat tab hidden.

(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let particles = [];
  let raf = null;
  let running = false;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Simple feature flags
  const IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;

  // Config bisa kamu tweak
  const cfg = {
    density: 0.000045,           // jumlah partikel per px^2 (akan dikalikan area)
    minCount: 16,
    maxCount: 42,
    speed: 0.15,                 // px per frame (sebelum dikali dpr)
    radius: [1.0, 2.4],          // ukuran titik (min, max)
    linkDist: 120,               // jarak maksimum garis
    linkAlpha: 0.10,             // opasitas garis
    dotAlpha: 0.85,              // opasitas titik
    repelRadius: 120,            // radius interaksi pointer
    repelStrength: 0.06,         // kekuatan repel
    mobile: {
      animate: false,            // di mobile: render satu frame statis (hemat baterai)
      linkDist: 96,
      dotAlpha: 0.75
    },
    palette: [
      [14, 165, 233],   // sky-500
      [37, 99, 235],    // blue-600
      [34, 211, 238]    // cyan-400
    ]
  };

  // Terapkan tweak mobile
  if (IS_MOBILE) {
    cfg.linkDist = cfg.mobile.linkDist;
    cfg.dotAlpha = cfg.mobile.dotAlpha;
  }

  // Setup ukuran canvas
  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Hitung jumlah partikel berdasar area
    const area = w * h;
    const target = clamp(
      Math.round(area * cfg.density),
      cfg.minCount,
      cfg.maxCount
    );

    // Inisialisasi ulang partikel jika jumlah berbeda jauh (pertama kali juga)
    particles = spawnParticles(target, w, h);
  }

  function spawnParticles(count, w, h) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        r: lerp(cfg.radius[0], cfg.radius[1], Math.random()),
        c: cfg.palette[(Math.random() * cfg.palette.length) | 0]
      });
    }
    return arr;
  }

  const mouse = { x: -9999, y: -9999, active: false };
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
  function onMouseLeave() {
    mouse.active = false;
    mouse.x = mouse.y = -9999;
  }

  function step() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Gerak & gambar titik
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Interaksi mouse (repel lembut) - hanya desktop
      if (!IS_MOBILE && mouse.active) {
        const dx = (mouse.x * dpr) - p.x;
        const dy = (mouse.y * dpr) - p.y;
        const dist2 = dx * dx + dy * dy;
        const r2 = (cfg.repelRadius * dpr) ** 2;
        if (dist2 < r2) {
          const f = cfg.repelStrength / Math.max(Math.sqrt(dist2), 0.0001);
          p.vx -= dx * f;
          p.vy -= dy * f;
        }
      }

      // Update posisi
      p.x += p.vx * dpr;
      p.y += p.vy * dpr;

      // Bounce di tepi
      if (p.x < 0 || p.x > w) p.vx *= -1, p.x = clamp(p.x, 0, w);
      if (p.y < 0 || p.y > h) p.vy *= -1, p.y = clamp(p.y, 0, h);

      // Gambar titik
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c[0]}, ${p.c[1]}, ${p.c[2]}, ${cfg.dotAlpha})`;
      ctx.fill();
    }

    // Gambar garis penghubung tipis
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < cfg.linkDist * dpr) {
          const t = 1 - dist / (cfg.linkDist * dpr); // semakin dekat, semakin opak
          const c = a.c; // pakai warna titik A
          ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${cfg.linkAlpha * t})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (running) raf = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Init
  resize();

  // Event listeners
  window.addEventListener('resize', () => {
    // throttle resize agar tidak berat
    clearTimeout(resize._t);
    resize._t = setTimeout(resize, 150);
  });

  if (!IS_MOBILE) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
  }

  // Pause saat tab tidak aktif
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReduced && (!IS_MOBILE || cfg.mobile.animate)) start();
  });

  // Jalankan animasi sesuai kebijakan
  if (prefersReduced) {
    // Reduced motion: render satu frame statis sudah cukup
    step();
  } else if (IS_MOBILE && !cfg.mobile.animate) {
    // Mobile tanpa animasi: render satu frame lalu berhenti
    step();
  } else {
    start();
  }
})();
