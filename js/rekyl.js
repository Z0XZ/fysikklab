// Rekyl. To gjenstander står i ro og skyver seg fra hverandre.
// Den samlede bevegelsesmengden er null før og etter. Etterpå bremses de av friksjon.
// Enheter: kg, m, s og N.

const G = 9.81;
const SCENER = {
  skoyter: {
    navn: ["Voksen", "Barn"], m: [80, 30], mRange: [[20, 120, 5], [20, 120, 5]],
    mu: [0.015, 0.015], kraft: true, F: 200, dt: 0.4,
    tekst: "To skøyteløpere står på isen og dytter fra hverandre.",
  },
  kast: {
    navn: ["Person på skøyter", "Medisinball"], m: [60, 4], mRange: [[30, 100, 5], [1, 10, 0.5]],
    mu: [0.015, 0], kraft: false, v2: 6, v2Range: [1, 15, 0.5],
    tekst: "En person på skøyter kaster en medisinball rett fram.",
  },
  kanon: {
    navn: ["Kanon", "Kule"], m: [400, 4], mRange: [[100, 1000, 50], [1, 10, 0.5]],
    mu: [0.08, 0], kraft: false, v2: 150, v2Range: [50, 300, 10],
    tekst: "En kanon på hjul skyter ut en kule vannrett.",
  },
};

// Farten til begge etter at de har skjøvet fra hverandre. Positiv retning mot høyre (der gjenstand 2 går).
function rekyl(m1, m2, impuls) {
  return { v1: -impuls / m1, v2: impuls / m2 };
}
// Hvor langt noe glir før det stopper, når friksjonstallet er mu
function glidelengde(v, mu) {
  return mu > 0 ? v * v / (2 * mu * G) : Infinity;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("rekyl");
  if (!el) return;

  let sc, m1, m2, I, F, dtDytt, res, tid = 0, scene = "skoyter";
  const l = Sim.lerret(el, tegn);

  function settOppScene() {
    sc = SCENER[scene];
    const sett = (id, [min, maks, steg], verdi) => { const e = $(id); e.min = min; e.max = maks; e.step = steg; e.value = verdi; };
    sett("masse-1", sc.mRange[0], sc.m[0]);
    sett("masse-2", sc.mRange[1], sc.m[1]);
    $("navn-1").textContent = sc.navn[0]; $("navn-2").textContent = sc.navn[1];
    $("rad-kraft").hidden = $("rad-tid").hidden = !sc.kraft;
    $("rad-v2").hidden = sc.kraft;
    if (sc.kraft) { $("kraft").value = sc.F; $("varighet").value = sc.dt; }
    else sett("v2", sc.v2Range, sc.v2);
    $("scene-tekst").textContent = sc.tekst;
    for (const k of document.querySelectorAll("[data-scene]")) k.classList.toggle("aktiv", k.dataset.scene === scene);
    nullstill();
  }

  function lesInnstillinger() {
    const kg = (v) => komma(v, v < 10 ? 1 : 0) + " kg";
    m1 = Sim.verdi("masse-1", kg); m2 = Sim.verdi("masse-2", kg);
    if (sc.kraft) {
      F = Sim.verdi("kraft", (v) => komma(v, 0) + " N");
      dtDytt = Sim.verdi("varighet", (v) => komma(v, 2) + " s");
      I = F * dtDytt;
    } else {
      const v2 = Sim.verdi("v2", (v) => komma(v, v < 20 ? 1 : 0) + " m/s");
      I = m2 * v2; dtDytt = 0.15; F = I / dtDytt;
    }
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    res = rekyl(m1, m2, I);
    tid = 0;
    tegn();
  }

  // Posisjonen til gjenstand i ved tiden t. Under dyttet er akselerasjonen konstant.
  function pos(i, t) {
    const m = i === 1 ? m1 : m2, mu = sc.mu[i - 1], fortegn = i === 1 ? -1 : 1;
    if (t <= 0) return 0;
    const a = F / m;
    if (t < dtDytt) return fortegn * 0.5 * a * t * t;
    const s0 = 0.5 * a * dtDytt * dtDytt, v = I / m, tt = t - dtDytt;
    if (mu === 0) return fortegn * (s0 + v * tt);
    const b = mu * G, tStopp = v / b;
    return fortegn * (s0 + (tt < tStopp ? v * tt - 0.5 * b * tt * tt : v * v / (2 * b)));
  }
  const tSlutt = () => {
    const tider = [Math.abs(res.v1) / (sc.mu[0] * G), sc.mu[1] > 0 ? res.v2 / (sc.mu[1] * G) : 0];
    return dtDytt + Math.min(20, Math.max(3, ...tider.filter(isFinite)));
  };

  function steg(dt) {
    tid = Math.min(tSlutt(), tid + dt * Number($("tempo").value));
    tegn();
    return tid < tSlutt();
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegn() {
    if (!l.b || !res) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const x1 = pos(1, tid), x2 = pos(2, tid);
    // Skala: vis minst 10 m, og så langt som gjenstand 1 glir
    const s1 = glidelengde(res.v1, sc.mu[0]), s2 = glidelengde(res.v2, sc.mu[1]);
    const venstre = Math.max(5, s1 * 1.2), hoyre = isFinite(s2) ? Math.max(5, s2 * 1.2) : Math.max(10, venstre);
    const sx = (x) => 20 + (x + venstre) / (venstre + hoyre) * (l.b - 40);
    const bakke = l.h * 0.72;
    c.fillStyle = scene === "kanon" ? f.rute : "#cfe3ef";
    c.globalAlpha = scene === "kanon" ? 1 : 0.35; c.fillRect(0, bakke, l.b, l.h - bakke); c.globalAlpha = 1;
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(0, bakke); c.lineTo(l.b, bakke); c.stroke();
    // Meterstreker
    const st = Sim.steglengde(venstre + hoyre, 8);
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top"; c.lineWidth = 1; c.strokeStyle = f["rute-sterk"];
    for (let x = -Math.floor(venstre / st) * st; x <= hoyre + 1e-9; x += st) {
      c.beginPath(); c.moveTo(sx(x), bakke); c.lineTo(sx(x), bakke + 6); c.stroke();
      c.fillText(komma(x, 0) + " m", sx(x), bakke + 9);
    }
    // Gjenstandene. Størrelsen følger massen litt.
    const figur = (x, m, farge, navn, i) => {
      const hoyde = Math.min(l.h * 0.45, 22 + 30 * Math.cbrt(m / 60));
      const px = sx(x) + (i === 1 ? -hoyde * 0.3 : hoyde * 0.3);
      c.fillStyle = farge;
      if (scene === "kanon" && i === 1) {
        c.beginPath(); c.roundRect(px - hoyde * 0.5, bakke - hoyde * 0.55, hoyde, hoyde * 0.3, 4); c.fill();
        c.fillRect(px, bakke - hoyde * 0.6, hoyde * 0.7, hoyde * 0.14);
        c.strokeStyle = f.blekk; c.lineWidth = 2;
        for (const dx of [-0.25, 0.25]) { c.beginPath(); c.arc(px + dx * hoyde, bakke - hoyde * 0.18, hoyde * 0.17, 0, 2 * Math.PI); c.stroke(); }
      } else if (i === 2 && scene !== "skoyter") {
        const r = Math.max(5, hoyde * 0.15), y = scene === "kast" ? bakke - 40 : bakke - hoyde * 0.53;
        c.beginPath(); c.arc(sx(x), y, r, 0, 2 * Math.PI); c.fill();
      } else {
        c.strokeStyle = farge; c.lineWidth = 3; c.lineCap = "round";
        const fot = bakke - 3, hode = hoyde * 0.12;
        c.beginPath();
        c.moveTo(px - hoyde * 0.15, fot); c.lineTo(px, fot - hoyde * 0.42); c.lineTo(px + hoyde * 0.15, fot);
        c.moveTo(px, fot - hoyde * 0.42); c.lineTo(px, fot - hoyde * 0.78);
        const arm = i === 1 ? 1 : -1;
        c.moveTo(px, fot - hoyde * 0.68); c.lineTo(px + arm * hoyde * 0.3, fot - hoyde * 0.6);
        c.stroke(); c.lineCap = "butt";
        c.beginPath(); c.arc(px, fot - hoyde * 0.78 - hode, hode, 0, 2 * Math.PI); c.fill();
      }
      c.fillStyle = farge; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText(navn, Math.min(l.b - 50, Math.max(50, px)), bakke - hoyde - 8);
    };
    figur(x1, m1, f.f1, sc.navn[0], 1);
    if (sx(x2) < l.b + 60) figur(x2, m2, f.f2, sc.navn[1], 2);
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", 10, 8);
    oppdaterTall();
  }

  function oppdaterTall() {
    const ferdig = tid >= dtDytt, vis = (x) => (ferdig ? x : "?");
    const v = (x) => (Math.abs(x) >= 20 ? komma(x, 0) : komma(x, 2)) + " m/s";
    $("impuls").textContent = komma(I, 0) + " Ns";
    $("v-1").textContent = vis(v(res.v1));
    $("v-2").textContent = vis(v(res.v2));
    $("p-sum").textContent = vis(komma(m1 * res.v1 + m2 * res.v2, 1) + " kg m/s");
    $("ek-1").textContent = vis(Sim.tall(0.5 * m1 * res.v1 ** 2, 3) + " J");
    $("ek-2").textContent = vis(Sim.tall(0.5 * m2 * res.v2 ** 2, 3) + " J");
    $("s-1").textContent = vis(komma(glidelengde(res.v1, sc.mu[0]), 1) + " m");
    $("s-2").textContent = sc.mu[1] > 0 ? vis(komma(glidelengde(res.v2, sc.mu[1]), 1) + " m") : "flyr av gårde";
  }

  for (const k of document.querySelectorAll("[data-scene]")) k.addEventListener("click", () => { scene = k.dataset.scene; settOppScene(); });
  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["masse-1", "masse-2", "kraft", "varighet", "v2"]) $(id).addEventListener("input", nullstill);
  settOppScene();
})();
