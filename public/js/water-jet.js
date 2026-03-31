(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("water-fx");
  if (!canvas) return;

  var ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  if (!ctx) return;

  /* Лёгкий слой: без retina ×2 — меньше пикселей, выше FPS */
  var dpr = 1;
  var particles = [];
  var maxParticles = 420;
  var isDown = false;
  var lastSpawnX = 0;
  var lastSpawnY = 0;
  var lastSpawnTime = 0;
  var lastFrame = performance.now();

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  function lightboxBlocksFx() {
    var lb = document.getElementById("lightbox");
    return lb && !lb.hidden;
  }

  function spawnJet(x, y) {
    if (lightboxBlocksFx()) return;
    var n = 5 + Math.floor(Math.random() * 5);
    for (var i = 0; i < n; i++) {
      if (particles.length >= maxParticles) break;
      var spread = (Math.random() - 0.5) * 1.15;
      var angle = -Math.PI / 2 + spread;
      var speed = 248 + Math.random() * 350;
      particles.push({
        x: x + (Math.random() - 0.5) * 6.5,
        y: y + (Math.random() - 0.5) * 6.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.28 + Math.random() * 2.95,
        life: 0,
        maxLife: 0.585 + Math.random() * 0.565,
      });
    }
  }

  function trySpawn(clientX, clientY) {
    var now = performance.now();
    var dx = clientX - lastSpawnX;
    var dy = clientY - lastSpawnY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4 && now - lastSpawnTime < 32) return;
    lastSpawnX = clientX;
    lastSpawnY = clientY;
    lastSpawnTime = now;
    spawnJet(clientX, clientY);
  }

  document.addEventListener(
    "pointerdown",
    function (e) {
      if (!e.isPrimary) return;
      isDown = true;
      if (lightboxBlocksFx()) return;
      spawnJet(e.clientX, e.clientY);
      lastSpawnX = e.clientX;
      lastSpawnY = e.clientY;
      lastSpawnTime = performance.now();
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerup",
    function (e) {
      if (e.isPrimary) isDown = false;
    },
    { passive: true }
  );

  document.addEventListener(
    "pointercancel",
    function (e) {
      if (e.isPrimary) isDown = false;
    },
    { passive: true }
  );

  document.addEventListener(
    "pointermove",
    function (e) {
      if (!isDown) return;
      if (e.pointerType === "mouse" && (e.buttons & 1) !== 1) return;
      trySpawn(e.clientX, clientY);
    },
    { passive: true }
  );

  var gravity = 493;

  function tick(now) {
    var dt = Math.min(0.045, (now - lastFrame) / 1000);
    lastFrame = now;

    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    /* Без shadowBlur — главный выигрыш по FPS; lighter даёт мягкое свечение при наложении */
    ctx.globalCompositeOperation = "lighter";
    var i = 0;
    while (i < particles.length) {
      var p = particles[i];
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      if (p.life >= p.maxLife || p.y > h + 40 || p.x < -40 || p.x > w + 40) {
        particles[i] = particles[particles.length - 1];
        particles.pop();
        continue;
      }

      var t = p.life / p.maxLife;
      var fade = 1 - t;
      fade = fade * fade;
      var alpha = fade * 0.42;
      var r = p.r * (0.65 + 0.35 * fade);

      ctx.fillStyle =
        "rgba(" +
        Math.round(100 + 90 * fade) +
        "," +
        Math.round(200 + 55 * fade) +
        "," +
        Math.round(255) +
        "," +
        alpha +
        ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      i++;
    }
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
