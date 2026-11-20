/* The home page's own movement, on top of scroll-craft (js/scrollcraft.js,
   which is used as is and never edited). Ported unchanged from the approved
   draft (scrollcraft/builds/baileydigital/index.html), less its form handler:
   the form is a plain POST to Web3Forms. No words live here; they are all in
   _data/home.yml, rendered into the HTML at build time. */
ScrollCraft.mount(document.body);
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var vh = function () { return window.innerHeight; };
  function actP(el) { var r = el.getBoundingClientRect(); var d = r.height - vh(); return d > 0 ? clamp(-r.top / d) : clamp(-r.top / vh()); }

  /* ---------- hero: the phone ---------- */
  var hero = document.getElementById('hero'), lock = document.getElementById('lock'), glow = document.getElementById('glow'),
      copy = document.getElementById('heroCopy');
  var nts = Array.prototype.map.call(document.querySelectorAll('.nt'), function (n) {
    var w = n.getAttribute('data-nt').split(' ').map(parseFloat);
    return { el: n, b: w[1], old: n.querySelector('.nt__old'), nw: n.querySelector('.nt__new') };
  });
  var mx = 0, my = 0, tx = 0, ty = 0;
  if (fine && !reduce) hero.addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
  // On a phone the screen lifts into view first, so the messages start after it has arrived.
  function heroP() { var r = actP(hero); return innerWidth <= 860 ? clamp((r - 0.28) / 0.72) : r; }
  function heroFrame() {
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    var raw = actP(hero), p = reduce ? 1 : heroP();
    var narrow = innerWidth <= 860;
    // planes: glow drifts least, phone rises and tilts a little, copy holds
    glow.style.transform = 'translate3d(' + (-mx * 12) + 'px,' + (-my * 8) + 'px,0) scale(' + (1 + 0.08 * p) + ')';
    if (!reduce) {
      var lift = narrow ? -300 * ease(clamp(raw / 0.3)) : (0.04 - 0.06 * raw) * vh();
      lock.style.transform = 'translate3d(' + (mx * 10) + 'px,' + (lift + my * 6) + 'px,0) rotateX(' + (-my * 3) + 'deg) rotateY(' + (mx * 5) + 'deg)';
      copy.style.transform = narrow ? 'translate3d(0,' + (-0.12 * vh() * ease(clamp(raw / 0.3))) + 'px,0)' : '';
      copy.style.opacity = narrow ? String(1 - ease(clamp(raw / 0.24))) : '';
    }
    nts.forEach(function (n) {
      var d = clamp((p - n.b) / 0.05);
      n.old.style.opacity = String(1 - d);
      n.nw.style.opacity = String(d);
      n.el.style.transform = 'scale(' + (1 - 0.02 * d) + ')';
      n.el.style.background = 'rgba(240,243,250,' + (0.16 - 0.08 * d).toFixed(3) + ')';
    });
  }


  /* ---------- landing: the evening arrives ---------- */
  (function () {
    var root = document.documentElement;
    if (!root.classList.contains('js-intro')) return;
    var order = nts.slice(), i = 0, timers = [];
    function finish() { timers.forEach(clearTimeout); lock.classList.add('is-awake'); nts.forEach(function (n) { n.el.classList.add('is-in'); }); }
    function arrive() {
      if (i >= order.length) return;
      order[i++].el.classList.add('is-in');
      lock.classList.remove('buzz'); void lock.offsetWidth; lock.classList.add('buzz');
      timers.push(setTimeout(arrive, 560));
    }
    timers.push(setTimeout(function () { lock.classList.add('is-awake'); }, 450));
    timers.push(setTimeout(arrive, 900));
    addEventListener('scroll', function once() { if (scrollY > 40) { finish(); removeEventListener('scroll', once); } }, { passive: true });
  })();

  /* ---------- the pen line ---------- */
  // The logo's own stroke, in its 300 x 14 box: M2 9 C 40 6.5, 95 11.5, 150 9 S 245 6.8, 298 4.5
  var LOGO = [[2, 9], [40, 6.5], [95, 11.5], [150, 9], [205, 6.5], [245, 6.8], [298, 4.5]];
  function penPath(x0, x1, y, amp) {
    var f = function (pt) { return ((x0 + (pt[0] - 2) / 296 * (x1 - x0))).toFixed(1) + ' ' + (y + (pt[1] - 8) * amp).toFixed(1); };
    return 'M' + f(LOGO[0]) + ' C' + f(LOGO[1]) + ', ' + f(LOGO[2]) + ', ' + f(LOGO[3]) + ' C' + f(LOGO[4]) + ', ' + f(LOGO[5]) + ', ' + f(LOGO[6]);
  }
  var pens = Array.prototype.map.call(document.querySelectorAll('[data-pen]'), function (el) {
    var act = el.getAttribute('data-pen-act');
    return { el: el, kind: el.getAttribute('data-pen'), host: el.closest('[data-pen-host]'),
      win: act ? act.split(/\s+/).map(parseFloat) : null, actEl: act ? el.closest('[data-sc-act]') : null, svg: null, paths: [], len: [], total: 0, t: -1 };
  });
  function layoutPen(pn) {
    if (pn.svg) pn.svg.remove();
    var host = pn.host, hr = host.getBoundingClientRect();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pen-svg'); svg.setAttribute('aria-hidden', 'true');
    var lines = [];
    if (pn.kind === 'under') {
      var r = pn.el.getBoundingClientRect();
      lines.push([r.left - hr.left - 2, r.right - hr.left + 6, r.bottom - hr.top - 4, 1.1, 3.6]);
    } else {
      var range = document.createRange(); range.selectNodeContents(pn.el);
      var rects = Array.prototype.filter.call(range.getClientRects(), function (q) { return q.width > 2; });
      var merged = [];
      rects.forEach(function (q) { var m = merged[merged.length - 1]; if (m && Math.abs(m.top - q.top) < 4) { m.right = Math.max(m.right, q.right); } else merged.push({ left: q.left, right: q.right, top: q.top, height: q.height }); });
      merged.forEach(function (q) { lines.push([q.left - hr.left - 3, q.right - hr.left + 4, q.top - hr.top + q.height * 0.56, 0.55, 2.6]); });
    }
    pn.paths = []; pn.len = []; pn.total = 0;
    lines.forEach(function (L) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', penPath(L[0], L[1], L[2], L[3])); p.setAttribute('stroke-width', L[4]);
      svg.appendChild(p); pn.paths.push(p);
    });
    host.appendChild(svg); pn.svg = svg;
    pn.paths.forEach(function (p) { var l = p.getTotalLength(); pn.len.push(l); pn.total += l; p.style.strokeDasharray = l + ' ' + l; });
    pn.t = -1;
  }
  function drawPen(pn, t) {
    if (Math.abs(t - pn.t) < 0.002) return; pn.t = t;
    var done = t * pn.total;
    pn.paths.forEach(function (p, i) { var l = pn.len[i]; var d = Math.max(0, Math.min(l, done)); done -= l; p.style.strokeDashoffset = (l - d).toFixed(1); p.style.visibility = d > 0.5 ? 'visible' : 'hidden'; });
    pn.el.classList.toggle('is-struck', pn.kind === 'strike' && t > 0.98);
  }
  function penT(pn) {
    if (reduce) return 1;
    if (pn.win && pn.actEl) return clamp(((pn.actEl === hero ? heroP() : actP(pn.actEl)) - pn.win[0]) / (pn.win[1] - pn.win[0]));
    var r = pn.el.getBoundingClientRect();
    return clamp((vh() * 0.82 - r.top) / (vh() * 0.3));
  }
  function layoutAll() { pens.forEach(layoutPen); }

  /* ---------- bar colour ---------- */
  var bar = document.getElementById('bar'), zones = Array.prototype.slice.call(document.querySelectorAll('[data-bar]'));
  function barFrame() {
    var y = 36, mode = 'dark';
    for (var i = 0; i < zones.length; i++) { var r = zones[i].getBoundingClientRect(); if (r.top <= y && r.bottom > y) { mode = zones[i].getAttribute('data-bar'); break; } }
    bar.classList.toggle('is-light', mode === 'light');
  }

  function tick() { heroFrame(); pens.forEach(function (pn) { drawPen(pn, penT(pn)); }); barFrame(); requestAnimationFrame(tick); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { layoutAll(); requestAnimationFrame(tick); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layoutAll, 120); });

  /* ---------- the demo video plays only while on screen ---------- */
  var vid = document.querySelector('.story video');
  if (vid && 'IntersectionObserver' in window && !reduce) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) vid.play().catch(function () {}); else vid.pause(); }); }, { threshold: 0.4 }).observe(vid);

})();
