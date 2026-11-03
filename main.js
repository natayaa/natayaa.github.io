/* ============================================================
   Ivan Azhari — portfolio runtime
   Vanilla JS. No build step, no dependencies.
   Every motion effect degrades to a static, readable state.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /* ============================================================
     01 — Time: copyright year + Jakarta clock
     ============================================================ */
  var yearEls = doc.querySelectorAll('[data-year]');
  var thisYear = String(new Date().getFullYear());
  yearEls.forEach(function (el) { el.textContent = thisYear; });

  var clockFmt = null;
  try {
    clockFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (err) { clockFmt = null; }

  function tickClock() {
    if (!clockFmt) return;
    var text = clockFmt.format(new Date()) + ' WIB';
    doc.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = text; });
  }
  tickClock();
  window.setInterval(tickClock, 20000);

  /* ============================================================
     02 — Scroll engine: sticky nav, progress bar, active link, HUD
     ============================================================ */
  var nav = doc.getElementById('siteNav');
  var progress = doc.querySelector('.scroll-progress span');
  var hudScroll = doc.querySelector('[data-hud-scroll]');
  var ticking = false;

  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav-links a'));
  var navSections = ['about', 'work', 'experience', 'craft', 'contact']
    .map(function (id) { return doc.getElementById(id); })
    .filter(Boolean);

  function updateActiveNav() {
    var checkpoint = window.innerHeight * 0.42;
    var current = '';
    navSections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= checkpoint) current = section.id;
    });
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + current;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = root.scrollHeight - window.innerHeight;

    if (nav) nav.classList.toggle('is-scrolled', y > 16);
    if (progress) {
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0).toFixed(4) + ')';
    }
    if (hudScroll) {
      var pct = max > 0 ? Math.round(clamp(y / max, 0, 1) * 100) : 0;
      hudScroll.textContent = String(pct).padStart(3, '0') + '%';
    }
    updateActiveNav();
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ============================================================
     03 — Mobile menu
     ============================================================ */
  var menuBtn = doc.getElementById('menuBtn');
  var menu = doc.getElementById('mobileMenu');
  var menuLabel = doc.getElementById('menuLabel');

  function closeMenu() {
    if (!menu || !menuBtn) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = 'Menu';
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    doc.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 920) closeMenu();
    });
  }

  /* ============================================================
     04 — Reveal on scroll
     ============================================================ */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('[data-reveal]'));

  if (reduceMotion || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ============================================================
     05 — Glyph decode: section labels resolve like they are parsed
     ============================================================ */
  var decodeEls = Array.prototype.slice.call(doc.querySelectorAll('[data-decode]'));
  var glyphs = '0123456789<>/{}=+*#';

  decodeEls.forEach(function (el) {
    var original = (el.textContent || '').trim();
    if (!original) return;
    el.setAttribute('aria-label', original);

    if (reduceMotion) return;

    var timer = null;

    function resolve() {
      if (timer) return;
      var frame = 0;
      var total = 22;
      el.classList.add('is-decoding');

      timer = window.setInterval(function () {
        frame += 1;
        var settled = Math.floor((frame / total) * original.length);
        var out = '';

        for (var i = 0; i < original.length; i += 1) {
          var ch = original.charAt(i);
          var isGlyph = /[a-z0-9]/i.test(ch);
          if (i < settled || !isGlyph) out += ch;
          else out += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        }

        el.textContent = out;

        if (frame >= total) {
          window.clearInterval(timer);
          timer = null;
          el.textContent = original;
          el.classList.remove('is-decoding');
        }
      }, 34);
    }

    if (!hasIO) return;
    var decodeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        resolve();
        decodeIO.disconnect();
      });
    }, { threshold: 0.6 });
    decodeIO.observe(el);
  });

  /* ============================================================
     06 — Count-up stats
     ============================================================ */
  var counters = Array.prototype.slice.call(doc.querySelectorAll('[data-count]'));

  function renderCount(el, value) {
    var pad = parseInt(el.getAttribute('data-pad'), 10) || 0;
    el.textContent = pad ? String(value).padStart(pad, '0') : String(value);
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion) { renderCount(el, target); return; }

    var duration = 1250;
    var start = null;

    renderCount(el, 0);

    function step(now) {
      if (start === null) start = now;
      var p = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      renderCount(el, Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if (reduceMotion || !hasIO) {
      counters.forEach(function (el) {
        renderCount(el, parseInt(el.getAttribute('data-count'), 10) || 0);
      });
    } else {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countIO.unobserve(el);
          window.setTimeout(function () { animateCount(el); }, 180);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countIO.observe(el); });
    }
  }

  /* ============================================================
     07 — Terminal typewriter (identity chip)
     ============================================================ */
  var typeEl = doc.querySelector('[data-typewriter]');

  if (typeEl) {
    var phrases = (typeEl.getAttribute('data-phrases') || '')
      .split('|')
      .map(function (p) { return p.trim(); })
      .filter(Boolean);

    if (phrases.length) {
      if (reduceMotion || phrases.length === 1) {
        typeEl.textContent = phrases[0];
      } else {
        var phraseIndex = 0;
        var charIndex = 0;
        var deleting = false;

        typeEl.textContent = '';

        function typeStep() {
          var phrase = phrases[phraseIndex];

          if (!deleting) {
            charIndex += 1;
            typeEl.textContent = phrase.slice(0, charIndex);
            if (charIndex >= phrase.length) {
              deleting = true;
              window.setTimeout(typeStep, 2000);
              return;
            }
            window.setTimeout(typeStep, 44);
          } else {
            charIndex -= 1;
            typeEl.textContent = phrase.slice(0, charIndex);
            if (charIndex <= 0) {
              deleting = false;
              phraseIndex = (phraseIndex + 1) % phrases.length;
              window.setTimeout(typeStep, 380);
              return;
            }
            window.setTimeout(typeStep, 24);
          }
        }

        window.setTimeout(typeStep, 900);
      }
    }
  }

  /* ============================================================
     08 — Parallax (desktop, motion-safe)
     ============================================================ */
  var parallaxEls = Array.prototype.slice.call(doc.querySelectorAll('[data-parallax]'))
    .map(function (el) {
      return {
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0,
        base: 0
      };
    });
  var parallaxOn = !reduceMotion && window.innerWidth > 920;

  function measureParallax() {
    if (!parallaxOn) return;
    parallaxEls.forEach(function (item) {
      var prev = item.el.style.transform;
      item.el.style.transform = 'none';
      var rect = item.el.getBoundingClientRect();
      item.base = rect.top + window.scrollY + rect.height / 2;
      item.el.style.transform = prev;
    });
  }

  function runParallax() {
    if (!parallaxOn) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (item) {
      var offset = (item.base - window.scrollY - vh / 2) * item.speed;
      item.el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  if (parallaxEls.length && parallaxOn) {
    measureParallax();

    var pTick = false;
    window.addEventListener('scroll', function () {
      if (!pTick) {
        pTick = true;
        window.requestAnimationFrame(function () {
          runParallax();
          pTick = false;
        });
      }
    }, { passive: true });

    var pResizeTimer;
    window.addEventListener('resize', function () {
      parallaxOn = !reduceMotion && window.innerWidth > 920;
      window.clearTimeout(pResizeTimer);
      pResizeTimer = window.setTimeout(function () {
        if (parallaxOn) {
          measureParallax();
          runParallax();
        } else {
          parallaxEls.forEach(function (item) { item.el.style.transform = ''; });
        }
      }, 180);
    });

    window.addEventListener('load', function () {
      measureParallax();
      runParallax();
    });

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(function () {
        measureParallax();
        runParallax();
      });
    }

    runParallax();
  }

  /* ============================================================
     09 — Pointer light
     ============================================================ */
  if (finePointer && !reduceMotion) {
    var glow = doc.querySelector('.cursor-glow');
    if (glow) {
      doc.body.classList.add('has-pointer');

      var gx = -1000;
      var gy = -1000;
      var cx = -1000;
      var cy = -1000;
      var glowTick = false;

      function glowLoop() {
        cx += (gx - cx) * 0.14;
        cy += (gy - cy) * 0.14;
        glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';

        if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) {
          window.requestAnimationFrame(glowLoop);
        } else {
          glowTick = false;
        }
      }

      window.addEventListener('pointermove', function (e) {
        gx = e.clientX;
        gy = e.clientY;
        if (!glowTick) {
          glowTick = true;
          window.requestAnimationFrame(glowLoop);
        }
      }, { passive: true });

      doc.addEventListener('pointerleave', function () {
        gx = -1000;
        gy = -1000;
      });
    }
  }

  /* ============================================================
     10 — Identity card tilt
     ============================================================ */
  var stage = doc.querySelector('.identity-stage');
  var card = doc.getElementById('identityCard');

  if (stage && card && finePointer && !reduceMotion) {
    var baseTransform = 'rotate(-2.2deg)';
    stage.style.perspective = '1200px';

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = baseTransform +
        ' rotateX(' + (-py * 6).toFixed(2) + 'deg)' +
        ' rotateY(' + (px * 8).toFixed(2) + 'deg)';
    });

    stage.addEventListener('pointerleave', function () {
      card.style.transform = baseTransform;
    });
  }

  /* ============================================================
     11 — Stack tile spotlight
     ============================================================ */
  if (finePointer) {
    doc.querySelectorAll('[data-tile]').forEach(function (tile) {
      tile.addEventListener('pointermove', function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        tile.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ============================================================
     12 — Copy email
     ============================================================ */
  var copyBtn = doc.getElementById('copyEmail');

  if (copyBtn) {
    var copyLabel = doc.getElementById('copyLabel');
    var copyTimer;

    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email') || '';

      function done(ok) {
        if (!copyLabel) return;
        copyLabel.textContent = ok ? 'Copied' : 'Copy failed';
        window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(function () {
          copyLabel.textContent = 'Copy email';
        }, 2200);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { done(true); },
          function () { done(false); }
        );
      } else {
        try {
          var ta = doc.createElement('textarea');
          ta.value = email;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          doc.body.appendChild(ta);
          ta.select();
          var ok = doc.execCommand('copy');
          doc.body.removeChild(ta);
          done(ok);
        } catch (err) {
          done(false);
        }
      }
    });
  }

  /* ============================================================
     13 — Hero constellation canvas
     ============================================================ */
  var networkCanvas = doc.querySelector('[data-network]');

  if (networkCanvas && !reduceMotion) {
    var ctx = networkCanvas.getContext('2d');

    if (ctx) {
      var hero = networkCanvas.closest('.hero') || networkCanvas.parentElement;
      var nodes = [];
      var canvasW = 0;
      var canvasH = 0;
      var canvasRaf = null;
      var canvasRunning = false;
      var heroVisible = true;
      var pointerX = -9999;
      var pointerY = -9999;
      var pointerActive = false;
      var lastFrame = 0;
      var resizeTimer;

      function seedNodes() {
        var density = canvasW < 680 ? 30000 : 24000;
        var count = clamp(Math.round((canvasW * canvasH) / density), 18, 64);
        nodes = [];

        for (var i = 0; i < count; i += 1) {
          nodes.push({
            x: Math.random() * canvasW,
            y: Math.random() * canvasH,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.1 + 0.45,
            a: Math.random() * 0.36 + 0.22
          });
        }
      }

      function sizeCanvas() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var rect = networkCanvas.getBoundingClientRect();
        canvasW = Math.max(1, Math.round(rect.width));
        canvasH = Math.max(1, Math.round(rect.height));

        networkCanvas.width = Math.round(canvasW * dpr);
        networkCanvas.height = Math.round(canvasH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        seedNodes();
      }

      function drawFrame(now) {
        if (!canvasRunning) return;

        var dt = lastFrame ? clamp((now - lastFrame) / 16.667, 0.4, 2.2) : 1;
        lastFrame = now;

        ctx.clearRect(0, 0, canvasW, canvasH);

        var i;
        var j;
        var a;
        var b;
        var dx;
        var dy;
        var dist;
        var linkDist = canvasW < 680 ? 96 : 132;

        for (i = 0; i < nodes.length; i += 1) {
          a = nodes[i];
          a.x += a.vx * dt;
          a.y += a.vy * dt;

          if (a.x < -12) a.x = canvasW + 12;
          else if (a.x > canvasW + 12) a.x = -12;
          if (a.y < -12) a.y = canvasH + 12;
          else if (a.y > canvasH + 12) a.y = -12;
        }

        ctx.lineWidth = 0.7;

        for (i = 0; i < nodes.length; i += 1) {
          a = nodes[i];
          for (j = i + 1; j < nodes.length; j += 1) {
            b = nodes[j];
            dx = a.x - b.x;
            dy = a.y - b.y;
            dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < linkDist) {
              ctx.strokeStyle = 'rgba(236,233,226,' + ((1 - dist / linkDist) * 0.16).toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }

          if (pointerActive) {
            dx = a.x - pointerX;
            dy = a.y - pointerY;
            dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 168 && dist > 0.5) {
              ctx.strokeStyle = 'rgba(236,233,226,' + ((1 - dist / 168) * 0.3).toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(pointerX, pointerY);
              ctx.stroke();
            }
          }

          ctx.fillStyle = 'rgba(236,233,226,' + a.a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (pointerActive) {
          ctx.fillStyle = 'rgba(236,233,226,.62)';
          ctx.beginPath();
          ctx.arc(pointerX, pointerY, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        canvasRaf = window.requestAnimationFrame(drawFrame);
      }

      function startCanvas() {
        if (canvasRunning || doc.hidden) return;
        canvasRunning = true;
        lastFrame = 0;
        canvasRaf = window.requestAnimationFrame(drawFrame);
      }

      function stopCanvas() {
        canvasRunning = false;
        if (canvasRaf) window.cancelAnimationFrame(canvasRaf);
        canvasRaf = null;
      }

      sizeCanvas();

      if (hasIO && hero) {
        new IntersectionObserver(function (entries) {
          heroVisible = entries[0].isIntersecting;
          if (heroVisible) startCanvas();
          else stopCanvas();
        }, { threshold: 0.01 }).observe(hero);
      } else {
        startCanvas();
      }

      if (finePointer) {
        window.addEventListener('pointermove', function (e) {
          var r = networkCanvas.getBoundingClientRect();
          pointerX = e.clientX - r.left;
          pointerY = e.clientY - r.top;
          pointerActive = pointerX >= 0 && pointerY >= 0 && pointerX <= r.width && pointerY <= r.height;
        }, { passive: true });

        doc.addEventListener('pointerleave', function () {
          pointerActive = false;
        });
      }

      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          stopCanvas();
          sizeCanvas();
          if (heroVisible) startCanvas();
        }, 200);
      });

      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden) stopCanvas();
        else if (heroVisible) startCanvas();
      });
    }
  }

  /* ============================================================
     14 — Runtime HUD: fps sparkline, viewport, footer auto-hide
     ============================================================ */
  var hud = doc.querySelector('[data-hud]');

  if (hud) {
    var hudFps = hud.querySelector('[data-hud-fps]');
    var hudBars = Array.prototype.slice.call(hud.querySelectorAll('[data-hud-bars] i'));
    var hudVp = hud.querySelector('[data-hud-vp]');
    var hudMedia = window.matchMedia('(min-width: 1101px)');
    var hudRaf = null;
    var hudRunning = false;
    var hudFrames = 0;
    var hudStamp = 0;

    function setViewport() {
      if (hudVp) hudVp.textContent = String(window.innerWidth);
    }

    function hudLoop(now) {
      if (!hudRunning) return;
      hudFrames += 1;

      if (now - hudStamp >= 500) {
        var fps = clamp(Math.round((hudFrames * 1000) / (now - hudStamp)), 0, 240);

        if (hudFps) hudFps.textContent = String(fps).padStart(3, '0');

        if (hudBars.length) {
          var height = clamp(Math.round((fps / 60) * 13), 2, 14);
          for (var i = 0; i < hudBars.length - 1; i += 1) {
            hudBars[i].style.height = hudBars[i + 1].style.height || '2px';
          }
          hudBars[hudBars.length - 1].style.height = height + 'px';
        }

        hudFrames = 0;
        hudStamp = now;
      }

      hudRaf = window.requestAnimationFrame(hudLoop);
    }

    function startHud() {
      if (hudRunning || reduceMotion || !hudMedia.matches || doc.hidden) return;
      hudRunning = true;
      hudFrames = 0;
      hudStamp = window.performance.now();
      hudRaf = window.requestAnimationFrame(hudLoop);
    }

    function stopHud() {
      hudRunning = false;
      if (hudRaf) window.cancelAnimationFrame(hudRaf);
      hudRaf = null;
    }

    setViewport();
    startHud();

    window.addEventListener('resize', setViewport);

    if (hudMedia.addEventListener) {
      hudMedia.addEventListener('change', function () {
        if (hudMedia.matches) startHud();
        else stopHud();
      });
    }

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) stopHud();
      else startHud();
    });

    var footer = doc.querySelector('.footer');
    if (footer && hasIO) {
      new IntersectionObserver(function (entries) {
        hud.classList.toggle('is-hidden', entries[0].isIntersecting);
      }, { threshold: 0.18 }).observe(footer);
    }
  }

  /* ============================================================
     15 — Console signature
     ============================================================ */
  try {
    console.log(
      '%c Ivan Azhari %c software engineer — 10+ yrs in code, 4 yrs shipping ',
      'background:#ece9e2;color:#08090b;font-weight:600;padding:4px 8px;border-radius:3px 0 0 3px',
      'background:#191b1f;color:#ece9e2;padding:4px 8px;border-radius:0 3px 3px 0'
    );
  } catch (err) { /* console unavailable — nothing to do */ }

})();
