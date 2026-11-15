// Skrått kast uten luftmotstand på forsiden. Regner med virkelige enheter (m, s).
(function () {
  const g = 9.81;
  const X_MAKS = 45, Y_MAKS = 23.6;   // Plottets størrelse i meter (samme skala på aksene)
  const V_MIN = 3, V_MAKS = 20;
  const PIL_SKALA = 0.5;              // Meter pil per m/s
  const EKSEMPLER = [[16, 62], [20, 30], [13, 78], [19, 45]];

  const lerret = document.getElementById("kast");
  if (!lerret) return;
  const ctx = lerret.getContext("2d");
  const felt = {};
  for (const id of ["tid", "x", "y", "fart", "v0", "vinkel", "v0-ut", "vinkel-ut", "kast-knapp"]) {
    felt[id] = document.getElementById(id);
  }
  const roligBevegelse = matchMedia("(prefers-reduced-motion: reduce)");
  const fargeskjema = matchMedia("(prefers-color-scheme: dark)");

  let farger = {}, skala = 1, venstre = 0, bunn = 0;
  let v0 = 16, vinkel = 62;
  let t = 0, forrigeTid = null, kaster = false, animasjon = null, synlig = true;
  let spor = [], gammeltSpor = [];
  let brukerHarStyrt = false, eksempel = 0, neste = null;

  const komma = (n, d) => n.toFixed(d).replace(".", ",");
  const vx = () => v0 * Math.cos(vinkel * Math.PI / 180);
  const vy0 = () => v0 * Math.sin(vinkel * Math.PI / 180);
  const flytid = () => 2 * vy0() / g;
  const px = (x) => venstre + x * skala;
  const py = (y) => bunn - y * skala;

  function lesFarger() {
    const s = getComputedStyle(document.documentElement);
    for (const navn of ["blekk", "dempet", "rute", "rute-sterk", "f1", "f2", "flate"]) {
      farger[navn] = s.getPropertyValue("--" + navn).trim();
    }
  }

  function tilpass() {
    const r = lerret.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    lerret.width = Math.round(r.width * dpr);
    lerret.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    venstre = 34;
    skala = Math.min((r.width - venstre - 10) / X_MAKS, (r.height - 34 - 10) / Y_MAKS);
    bunn = r.height - 34;
    tegn();
  }

  function pil(x0, y0, dx, dy, farge, bredde) {
    const a = px(x0), b = py(y0), c = px(x0 + dx), d = py(y0 + dy);
    if (Math.hypot(c - a, d - b) < 2) return;
    const v = Math.atan2(d - b, c - a), h = 5 + bredde * 2;
    ctx.strokeStyle = ctx.fillStyle = farge;
    ctx.lineWidth = bredde;
    ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c, d);
    ctx.lineTo(c - h * Math.cos(v - .45), d - h * Math.sin(v - .45));
    ctx.lineTo(c - h * Math.cos(v + .45), d - h * Math.sin(v + .45));
    ctx.closePath(); ctx.fill();
  }

  function tegnAkser() {
    ctx.lineWidth = 1;
    for (let x = 0; x <= X_MAKS; x += 5) {
      ctx.strokeStyle = x % 10 ? farger.rute : farger["rute-sterk"];
      ctx.beginPath(); ctx.moveTo(px(x), py(0)); ctx.lineTo(px(x), py(Y_MAKS)); ctx.stroke();
    }
    for (let y = 0; y <= Y_MAKS; y += 5) {
      ctx.strokeStyle = y % 10 ? farger.rute : farger["rute-sterk"];
      ctx.beginPath(); ctx.moveTo(px(0), py(y)); ctx.lineTo(px(X_MAKS), py(y)); ctx.stroke();
    }
    ctx.strokeStyle = farger.blekk;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px(0), py(Y_MAKS)); ctx.lineTo(px(0), py(0)); ctx.lineTo(px(X_MAKS), py(0)); ctx.stroke();

    ctx.fillStyle = farger.dempet;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let x = 0; x <= 40; x += 10) ctx.fillText(x, px(x), py(0) + 5);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("x / m", px(X_MAKS) - 2, py(0) - 3);
    ctx.textBaseline = "middle";
    for (let y = 10; y <= 20; y += 10) ctx.fillText(y, px(0) - 6, py(y));
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("y / m", px(0) + 5, py(Y_MAKS) + 2);
  }

  function tegnSpor(punkter, farge, bredde) {
    if (punkter.length < 2) return;
    ctx.strokeStyle = farge;
    ctx.lineWidth = bredde;
    ctx.lineJoin = "round";
    ctx.beginPath();
    punkter.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
    ctx.stroke();
  }

  function posisjon(tid) {
    return [vx() * tid, Math.max(0, vy0() * tid - g * tid * tid / 2)];
  }

  function tegn() {
    ctx.clearRect(0, 0, lerret.width, lerret.height);
    tegnAkser();
    tegnSpor(gammeltSpor, farger["rute-sterk"], 2);
    tegnSpor(spor, farger.f2, 2.5);

    const [x, y] = posisjon(t);
    const fartY = vy0() - g * t;
    const ferdig = t >= flytid();
    if (!ferdig || !spor.length) {
      pil(x, y, vx() * PIL_SKALA, 0, farger.dempet, 1.5);
      pil(x, y, 0, fartY * PIL_SKALA, farger.dempet, 1.5);
      pil(x, y, vx() * PIL_SKALA, fartY * PIL_SKALA, farger.f1, 2.5);
    }
    ctx.fillStyle = farger.blekk;
    ctx.beginPath(); ctx.arc(px(x), py(y), 5.5, 0, 2 * Math.PI); ctx.fill();

    felt.tid.textContent = komma(t, 2) + " s";
    felt.x.textContent = komma(x, 1) + " m";
    felt.y.textContent = komma(y, 1) + " m";
    felt.fart.textContent = komma(Math.hypot(vx(), fartY), 1) + " m/s";
  }

  function visVerdier() {
    felt.v0.value = v0;
    felt.vinkel.value = vinkel;
    felt["v0-ut"].textContent = komma(v0, 1) + " m/s";
    felt["vinkel-ut"].textContent = Math.round(vinkel) + "°";
  }

  function nullstill() {
    clearTimeout(neste);
    if (animasjon) cancelAnimationFrame(animasjon);
    animasjon = null; kaster = false; forrigeTid = null; t = 0; spor = [];
  }

  function steg(naa) {
    animasjon = null;
    if (!kaster) return;
    if (forrigeTid !== null) t = Math.min(t + (naa - forrigeTid) / 1000, flytid());
    forrigeTid = naa;
    spor.push(posisjon(t));
    tegn();
    if (t < flytid()) {
      if (synlig) animasjon = requestAnimationFrame(steg);
      return;
    }
    kaster = false;
    planleggEksempel();
  }

  function kast() {
    if (spor.length > 1) gammeltSpor = spor;
    nullstill();
    if (roligBevegelse.matches) {
      for (let i = 0; i <= 120; i++) spor.push(posisjon(flytid() * i / 120));
      t = flytid();
      tegn();
      return;
    }
    kaster = true;
    spor.push(posisjon(0));
    animasjon = requestAnimationFrame(steg);
  }

  function planleggEksempel() {
    if (brukerHarStyrt || roligBevegelse.matches) return;
    neste = setTimeout(() => {
      if (!synlig) { planleggEksempel(); return; }
      eksempel = (eksempel + 1) % EKSEMPLER.length;
      [v0, vinkel] = EKSEMPLER[eksempel];
      visVerdier();
      kast();
    }, 2200);
  }

  function brukerStyrer() {
    brukerHarStyrt = true;
    if (spor.length > 1) gammeltSpor = spor;
    nullstill();
  }

  function siktMot(e) {
    const r = lerret.getBoundingClientRect();
    const dx = (e.clientX - r.left - px(0)) / skala;
    const dy = (py(0) - (e.clientY - r.top)) / skala;
    v0 = Math.min(V_MAKS, Math.max(V_MIN, Math.hypot(dx, dy) / PIL_SKALA));
    vinkel = Math.min(85, Math.max(10, Math.atan2(dy, dx) * 180 / Math.PI));
    visVerdier();
    tegn();
  }

  let sikter = false;
  lerret.addEventListener("pointerdown", (e) => {
    sikter = true;
    brukerStyrer();
    lerret.setPointerCapture(e.pointerId);
    siktMot(e);
  });
  lerret.addEventListener("pointermove", (e) => { if (sikter) siktMot(e); });
  lerret.addEventListener("pointerup", () => { if (sikter) { sikter = false; kast(); } });
  lerret.addEventListener("pointercancel", () => { sikter = false; });

  for (const [id, sett] of [["v0", (n) => { v0 = n; }], ["vinkel", (n) => { vinkel = n; }]]) {
    felt[id].addEventListener("input", () => {
      brukerStyrer();
      sett(Number(felt[id].value));
      visVerdier();
      tegn();
    });
  }
  felt["kast-knapp"].addEventListener("click", () => { brukerStyrer(); kast(); });

  new IntersectionObserver(([e]) => {
    synlig = e.isIntersecting;
    if (synlig && kaster && !animasjon) { forrigeTid = null; animasjon = requestAnimationFrame(steg); }
  }).observe(lerret);
  new ResizeObserver(tilpass).observe(lerret);
  fargeskjema.addEventListener("change", () => { lesFarger(); tegn(); });
  window.addEventListener("temaendring", () => { lesFarger(); tegn(); });

  lesFarger();
  visVerdier();
  tilpass();
  kast();
})();
