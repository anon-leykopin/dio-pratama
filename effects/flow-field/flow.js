// effects/flow-field/flow.js
// Flow field ringan: vektor sinus/cos yang drift halus (tanpa library).
// Desktop: animasi 30–45fps. Mobile & reduced-motion: render 1 frame statis.

(function(){
  const IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;

  if (IS_MOBILE || REDUCED) { canvas.remove(); return; }

  // ... sisanya tetap ...
})();

(function () {
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let raf = null;
  let running = false;

  // DPR dibatasi agar tidak berat
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Media query
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;

  // Konfigurasi (boleh disesuaikan)
  const cfg = {
    density: 0.00008,       // jumlah tracer per px^2 -> akan di-cap min/max
    minCount: 140,
    maxCount: 320,
    speed: 0.6,             // kecepatan advect
    steps: 14,              // panjang goresan per frame (lebih kecil = lebih halus)
    lineWidth: 0.7,         // ketebalan garis
    strokeAlpha: 0.085,     // opasitas stroke
    fadeAlpha: 0.08,        // besaran "clear" semi transparan per frame (trail)
    freq: 0.0018,           // frekuensi bidang vektor
    timeSpeed: 0.0006,      // kecepatan drift bidang vektor
    mobile: {
      animate: false        // mobile default: 1 frame statis
    },
    palette: [
      [14, 165, 233],   // sky-500
      [37, 99, 235],    // blue-600
      [34, 211, 238]    // cyan-400
    ]
  };

  // Terapkan kebijakan mobile
  const ALLOW_ANIM = !prefersReduced && (!IS_MOBILE || cfg.mobile.animate);

  // State tracer
  let tracers = [];
  let W = 0, H = 0;
  let t0 = performance.now();

  // Util ----------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    W = Math.floor(w * dpr);
    H = Math.floor(h * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Hitung jumlah tracer target
    const target = clamp(Math.round(w * h * cfg.density), cfg.minCount, cfg.maxCount);

    // Buat tracer baru
    tracers = new Array(target).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      c: cfg.palette[(Math.random() * cfg.palette.length) | 0],
      seed: Math.random() * 1000
    }));

    // Siapkan kanvas awal (clear)
    ctx.clearRect(0, 0, W, H);
  }

  // Bidang vektor (sin/cos drift) -------------------------------------------
  function field(x, y, t) {
    // Skala ke dunia pixel -> dunia field
    const fx = x * cfg.freq;
    const fy = y * cfg.freq;

    // Vektor sederhana yang cukup "organik"
    const u = Math.sin(fy + t) + Math.cos(fx * 0.5 - t * 0.9);
    const v = Math.cos(fx + t * 1.2) - Math.sin(fy * 0.7 - t * 0.8);

    // Normalisasi kira-kira (tidak harus presisi)
    const len = Math.hypot(u, v) || 1;
    return { u: u / len, v: v / len };
  }

  // Render satu frame animasi -----------------------------------------------
  function step(now) {
    const dt = (now - t0) || 16;
    t0 = now;

    // Fade perlahan supaya trail tetap terlihat
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255,255,255,${cfg.fadeAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Set gaya garis
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = cfg.lineWidth * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const t = now * cfg.timeSpeed;

    for (let i = 0; i < tracers.length; i++) {
      const tr = tracers[i];

      // Warna tipis
      ctx.strokeStyle = `rgba(${tr.c[0]}, ${tr.c[1]}, ${tr.c[2]}, ${cfg.strokeAlpha})`;
      ctx.beginPath();
      ctx.moveTo(tr.x, tr.y);

      let x = tr.x, y = tr.y;

      // Gambar sedikit langkah kecil membentuk "garis arus"
      for (let s = 0; s < cfg.steps; s++) {
        const vec = field(x, y, t + tr.seed);
        x += vec.u * cfg.speed * dpr * 4.0;
        y += vec.v * cfg.speed * dpr * 4.0;

        // Kalau keluar layar, respawn di posisi acak
        if (x < 0 || x > W || y < 0 || y > H) {
          x = Math.random() * W;
          y = Math.random() * H;
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Update posisi akhir tracer
      tr.x = x;
      tr.y = y;
    }

    if (running) raf = requestAnimationFrame(step);
  }

  // Render 1 frame statis (untuk mobile/reduced-motion) ---------------------
  function renderStatic() {
    // Latar putih tipis agar trail terlihat
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = cfg.lineWidth * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const t = performance.now() * cfg.timeSpeed;

    for (let i = 0; i < tracers.length; i++) {
      const tr = tracers[i];
      ctx.strokeStyle = `rgba(${tr.c[0]}, ${tr.c[1]}, ${tr.c[2]}, ${cfg.strokeAlpha})`;
      ctx.beginPath();
      ctx.moveTo(tr.x, tr.y);

      let x = tr.x, y = tr.y;
      const localSteps = cfg.steps * 4; // sedikit lebih panjang agar terlihat walau statis

      for (let s = 0; s < localSteps; s++) {
        const vec = field(x, y, t + tr.seed);
        x += vec.u * cfg.speed * dpr * 4.0;
        y += vec.v * cfg.speed * dpr * 4.0;
        if (x < 0 || x > W || y < 0 || y > H) break;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function start() {
    if (running) return;
    running = true;
    t0 = performance.now();
    raf = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  // Init --------------------------------------------------------------------
  function init() {
    resize();
    if (prefersReduced || (IS_MOBILE && !cfg.mobile.animate)) {
      renderStatic();
    } else {
      start();
    }
  }

  // Events ------------------------------------------------------------------
  window.addEventListener('resize', () => {
    clearTimeout(resize._t);
    resize._t = setTimeout(() => {
      const wasRunning = running;
      stop();
      resize();
      if (prefersReduced || (IS_MOBILE && !cfg.mobile.animate)) {
        renderStatic();
      } else if (wasRunning) {
        start();
      }
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReduced && (!IS_MOBILE || cfg.mobile.animate)) start();
  });

  init();
})();
