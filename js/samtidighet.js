// Toget og lynene. To lyn slår ned i hver sin ende av toget, samtidig sett fra perrongen.
// P står på perrongen midt mellom nedslagene. T sitter midt i toget.
// Hendelsene regnes ut i perrongens system og Lorentz-transformeres til togets system.
// Enheter: meter og mikrosekunder.

const C = 299.792458;   // m/µs
const TOG_L0 = 300;     // Togets lengde i togets eget system
const gamma = (b) => 1 / Math.sqrt(1 - b * b);

// Lorentz-transformasjon fra perrongens system S til togets system S′
function tilTog(x, t, v) {
  const g = gamma(v / C);
  return [g * (x - v * t), g * (t - v * x / (C * C))];
}

// Alle hendelsene i perrongens system. Toget kjører mot høyre med farten v.
function hendelser(v) {
  const L = TOG_L0 / gamma(v / C);
  const tPF = L / 2 / C, tTF = L / 2 / (C + v), tTB = L / 2 / (C - v);
  return [
    { id: "lyn-f", tekst: "Lynet slår ned i forenden", x: L / 2, t: 0, kilde: "f" },
    { id: "lyn-b", tekst: "Lynet slår ned i bakenden", x: -L / 2, t: 0, kilde: "b" },
    { id: "p-f", tekst: "P ser lyset fra forenden", x: 0, t: tPF, mottaker: "P", kilde: "f" },
    { id: "p-b", tekst: "P ser lyset fra bakenden", x: 0, t: tPF, mottaker: "P", kilde: "b" },
    { id: "t-f", tekst: "T ser lyset fra forenden", x: v * tTF, t: tTF, mottaker: "T", kilde: "f" },
    { id: "t-b", tekst: "T ser lyset fra bakenden", x: v * tTB, t: tTB, mottaker: "T", kilde: "b" },
  ];
}

// Posisjonen ved tiden tau i valgt system for et punkt som i S følger x = a + u·t
function posisjon(a, u, tau, v, system) {
  if (system === "perrong") return a + u * tau;
  const g = gamma(v / C);
  const t = (tau / g + v * a / (C * C)) / (1 - v * u / (C * C));
  return g * (a + u * t - v * t);
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("tog");
  if (!el) return;

  let v, system, tempo, ev, tid = 0, tMin = 0, tMaks = 1, xMin = -300, xMaks = 300;
  const l = Sim.lerret(el, tegn);

  function koord(e, sys) { return sys === "perrong" ? [e.x, e.t] : tilTog(e.x, e.t, v); }

  function lesInnstillinger() {
    v = Sim.verdi("fart", (b) => komma(b, 2) + "c") * C;
    system = Sim.verdi("system");
    tempo = Number(Sim.verdi("tempo"));
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    ev = hendelser(v);
    const tider = ev.map((e) => koord(e, system)[1]);
    const spenn = Math.max(...tider) - Math.min(...tider);
    tMin = Math.min(...tider) - 0.12 * spenn - 0.05;
    tMaks = Math.max(...tider) + 0.12 * spenn + 0.05;
    tid = tMin;
    // Samme skala i begge systemer, slik at lengdene kan sammenlignes
    const xs = [];
    for (const sys of ["perrong", "tog"]) {
      const ts = ev.map((e) => koord(e, sys)[1]), a = Math.min(...ts), b = Math.max(...ts);
      for (const tau of [a, b]) for (const [p, u] of [[-TOG_L0 / gamma(v / C) / 2, v], [TOG_L0 / gamma(v / C) / 2, v], [0, 0]]) xs.push(posisjon(p, u, tau, v, sys));
    }
    const midt = (Math.min(...xs) + Math.max(...xs)) / 2, halv = (Math.max(...xs) - Math.min(...xs)) / 2 * 1.12 + 20;
    xMin = midt - halv; xMaks = midt + halv;
    tegn();
    oppdaterTabell();
  }

  function steg(dt) {
    tid = Math.min(tMaks, tid + dt * tempo * (tMaks - tMin) / 9);
    tegn();
    return tid < tMaks;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegn() {
    if (!ev || !l.b) return;
    const c = l.ctx, f = l.f, g = gamma(v / C);
    l.tom();
    const sx = (x) => 12 + (x - xMin) / (xMaks - xMin) * (l.b - 24);
    const togTopp = l.h * 0.3, togBunn = l.h * 0.56, perrong = l.h * 0.8, skinne = togBunn + 8;
    const farge = { f: f.f1, b: f.f2 };
    const L = TOG_L0 / g;
    const tid_ = (e) => koord(e, system)[1];
    const x_ = (e) => koord(e, system)[0];

    // Perrongen med stolper hver 50. meter
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, perrong); c.lineTo(l.b, perrong); c.stroke();
    c.lineWidth = 1; c.strokeStyle = f["rute-sterk"];
    c.beginPath(); c.moveTo(0, skinne); c.lineTo(l.b, skinne); c.stroke();
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top";
    for (let k = -40; k <= 40; k++) {
      const x = sx(posisjon(k * 50, 0, tid, v, system));
      if (x < -10 || x > l.b + 10) continue;
      c.strokeStyle = f["rute-sterk"];
      c.beginPath(); c.moveTo(x, perrong); c.lineTo(x, perrong + 8); c.stroke();
    }

    // Brennmerker på perrongen etter lynnedslagene
    for (const e of ev.slice(0, 2)) {
      if (tid < tid_(e)) continue;
      const x = sx(posisjon(e.x, 0, tid, v, system));
      c.fillStyle = farge[e.kilde];
      c.beginPath(); c.ellipse(x, perrong + 2, 9, 3, 0, 0, 2 * Math.PI); c.fill();
    }

    // Toget: fire vogner mellom bakenden og forenden
    const xb = sx(posisjon(-L / 2, v, tid, v, system)), xf = sx(posisjon(L / 2, v, tid, v, system));
    const vognB = (xf - xb) / 4;
    for (let i = 0; i < 4; i++) {
      const x = xb + i * vognB;
      c.fillStyle = f.flate; c.strokeStyle = f.dempet; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(x + 2, togTopp, vognB - 4, togBunn - togTopp, 4); c.fill(); c.stroke();
      c.fillStyle = f.rute;
      const vinduer = Math.max(1, Math.floor(vognB / 22));
      for (let k = 0; k < vinduer; k++) {
        const vb = (vognB - 12) / vinduer;
        c.fillRect(x + 6 + k * vb + 2, togTopp + 6, vb - 4, (togBunn - togTopp) * 0.35);
      }
    }
    for (const e of ev.slice(0, 2)) {
      if (tid < tid_(e)) continue;
      const x = e.kilde === "f" ? xf - 3 : xb + 3;
      c.fillStyle = farge[e.kilde];
      c.beginPath(); c.arc(x, togBunn - 6, 4, 0, 2 * Math.PI); c.fill();
    }

    // Observatørene
    const xT = sx(posisjon(0, v, tid, v, system)), xP = sx(posisjon(0, 0, tid, v, system));
    const mottatt = (hvem) => ev.filter((e) => e.mottaker === hvem && tid >= tid_(e));
    const figur = (x, fot, hoyde, navn) => {
      const hode = hoyde * 0.11;
      c.strokeStyle = f.blekk; c.fillStyle = f.blekk; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - hoyde * 0.15, fot); c.lineTo(x, fot - hoyde * 0.4); c.lineTo(x + hoyde * 0.15, fot);
      c.moveTo(x, fot - hoyde * 0.4); c.lineTo(x, fot - hoyde * 0.78);
      c.moveTo(x - hoyde * 0.18, fot - hoyde * 0.55); c.lineTo(x, fot - hoyde * 0.7); c.lineTo(x + hoyde * 0.18, fot - hoyde * 0.55);
      c.stroke(); c.lineCap = "butt";
      c.beginPath(); c.arc(x, fot - hoyde * 0.78 - hode, hode, 0, 2 * Math.PI); c.fill();
      c.font = "600 13px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText(navn, x, fot - hoyde - 4);
      // Små prikker viser hvilke blink observatøren har sett, i rekkefølge
      mottatt(navn).sort((a, b) => tid_(a) - tid_(b)).forEach((e, i) => {
        c.fillStyle = farge[e.kilde];
        c.beginPath(); c.arc(x + 12 + i * 10, fot - hoyde - 10, 4, 0, 2 * Math.PI); c.fill();
      });
    };
    figur(xT, togBunn - 4, (togBunn - togTopp) * 0.62, "T");
    figur(xP, perrong, (togBunn - togTopp) * 0.62, "P");

    // Lysfrontene fra hvert nedslag
    for (const e of ev.slice(0, 2)) {
      const [xe, te] = koord(e, system);
      if (tid < te) continue;
      const r = C * (tid - te);
      c.strokeStyle = farge[e.kilde]; c.lineWidth = 2.5;
      for (const xx of [xe - r, xe + r]) {
        const px = sx(xx);
        if (px < -5 || px > l.b + 5) continue;
        c.beginPath(); c.moveTo(px, togTopp - 6); c.lineTo(px, perrong); c.stroke();
      }
      // Selve lynet vises en kort stund
      if (tid - te < 0.06 * (tMaks - tMin)) {
        const x = sx(xe);
        c.strokeStyle = farge[e.kilde]; c.lineWidth = 3; c.lineJoin = "round";
        c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(x + 6, togTopp * 0.45); c.lineTo(x - 4, togTopp * 0.55); c.lineTo(x + 2, togTopp - 2); c.stroke();
      }
    }

    // Fartspil
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textBaseline = "top";
    if (system === "perrong") { c.textAlign = "left"; c.fillText("toget → " + komma(v / C, 2) + "c", 12, 6); }
    else { c.textAlign = "left"; c.fillText("← perrongen " + komma(v / C, 2) + "c", 12, 6); }
    c.textAlign = "right";
    c.fillText("t = " + komma(tid, 2) + " µs", l.b - 12, 6);

    oppdaterStatus();
  }

  function oppdaterTabell() {
    $("rader").innerHTML = ev.map((e) => {
      const ts = e.t, tt = tilTog(e.x, e.t, v)[1];
      return `<tr id="rad-${e.id}"><th scope="row"><span class="prikk ${e.kilde === "f" ? "lys-f" : "lys-b"}"></span> ${e.tekst}</th><td>${komma(ts, 3)} µs</td><td>${komma(tt, 3)} µs</td></tr>`;
    }).join("");
    const g = gamma(v / C);
    $("gamma").textContent = komma(g, 3);
    $("l-perrong").textContent = komma(TOG_L0 / g, 0) + " m";
    $("dt-tog").textContent = komma(v * TOG_L0 / (C * C), 3) + " µs";
  }

  function oppdaterStatus() {
    $("tid").textContent = komma(tid, 3) + " µs";
    for (const e of ev) {
      const rad = $("rad-" + e.id);
      if (rad) rad.classList.toggle("skjedd", tid >= koord(e, system)[1]);
    }
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["fart", "system"]) $(id).addEventListener("input", nullstill);
  $("tempo").addEventListener("input", () => { tempo = Number(Sim.verdi("tempo")); });

  nullstill();
  l.tilpass();
})();
