// effects/particles/particles.js
// Particles minimalis: ringan, subtle, hormati reduced motion, pause saat tab hidden.
// Versi ini: link distance & jumlah partikel ADAPTIF terhadap ukuran canvas (desktop ≠ mobile).

(function(){
  const IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  // MOBILE/REDUCED: hapus canvas, jangan init sama sekali
  if (IS_MOBILE || REDUCED) { canvas.remove(); return; }

  // ... sisanya tetap (kode animasi asli) ...
})();

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

  // Config — nilai dasar; beberapa akan dioverride secara adaptif saat resize()
  const cfg = {
    density: 0.000045,           // (tidak lagi dipakai langsung; tetap dibiarkan sbg fallback)
    minCount: 16,
    maxCount: 70,                // naikkan sedikit agar desktop bisa lebih ramai
    speed: 0.15,                 // px per frame (sebelum dikali dpr)
    radius: [1.0, 2.4],          // ukuran titik (min, max)
    linkDist: 120,               // jarak garis (akan di-scale)
    linkAlpha: 0.24,             // sedikit dinaikkan agar terlihat di layar besar
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
    ],
    // nilai adaptif hasil hitung resize()
    _linkDist: 120,
    _count: 32
  };

  // Terapkan tweak mobile untuk opacity default
  if (IS_MOBILE) {
    cfg.dotAlpha = cfg.mobile.dotAlpha;
  }

  // --- NEW: skala parameter sesuai luas canvas --------------------------------
  function computeParticleParams(w, h) {
  const area = w * h;
  const BASE_AREA = 1280 * 720;
  const scale = Math.sqrt(area / BASE_AREA);

  // Desktop butuh lebih ramai supaya garis ketemu
  const count = Math.max(40, Math.min(90, Math.round(area / 40000)));

  // Jarak koneksi dibuat lebih longgar
  const baseLink = IS_MOBILE ? cfg.mobile.linkDist : cfg.linkDist; // 96 vs 120
  const linkDist = Math.max(baseLink, Math.round(baseLink * scale * 1.25));

  return { count, linkDist };
}

  // Setup ukuran canvas + hitung parameter adaptif
  function resize() {
    const { innerWidth: w, innerHeight: h } = window;

    // DPR bisa berubah saat pindah layar—ambil ulang & cap
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Param adaptif (jumlah + link distance)
    const params = computeParticleParams(w, h);
    cfg._linkDist = params.linkDist;
    cfg._count = params.count;

    // Inisialisasi ulang partikel
    particles = spawnParticles(cfg._count, w, h);
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

    // Gambar garis penghubung tipis — gunakan link distance adaptif
    const linkPx = (cfg._linkDist || cfg.linkDist) * dpr;
    // sedikit lebih tebal agar tampak di layar besar/high-DPR
    ctx.lineWidth = Math.max(0.9, 0.9 * dpr);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkPx) {
          const t = 1 - dist / linkPx;                 // 0..1 (dekat = 1)
          // kasih floor opacity supaya tetap kelihatan walau agak jauh
          const alpha = cfg.linkAlpha * (0.4 + 0.6 * t);
          const c = a.c;
          ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
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
