// Myk landing. Et egg eller en sprettball med samme masse slippes fra en høyde og lander på ulike underlag.
// Underlaget er en fjær med demping som øker med sammentrykningen (Hunt–Crossley-modellen), slik at
// kraften starter på null og egget nesten ikke spretter. Stivheten er valgt slik at støtet varer omtrent
// like lenge som i virkeligheten. Sprettballen er selv en fjær i serie med underlaget (T² legges sammen),
// og har mindre demping, slik at den spretter opp igjen. Da blir Δp større enn når egget blir liggende.
// Enheter: kg, m, s og N.

const G = 9.81;
const EGG = 0.060;   // eggets masse i kg
// ball: dempingen for sprettballen på dette underlaget. Den gir at ballen spretter opp med
// 83 % (betong), 75 % (tre), 41 % (gress), 30 % (skum) og 19 % (dyne) av farten inn, uavhengig av høyden.
const UNDERLAG = {
  betong: { navn: "Betong", T: 0.001, ball: 0.3 },
  tre: { navn: "Treplate", T: 0.004, ball: 0.5 },
  gress: { navn: "Gressplen", T: 0.015, ball: 2 },
  skum: { navn: "Skumgummi", T: 0.05, ball: 3 },
  dyne: { navn: "Dyne", T: 0.12, ball: 5 },
};
const DEMPING = 5;    // gir at egget spretter med 10–20 % av farten inn
const T_BALL = 0.006; // halv svingetid for ballen selv på et helt stivt underlag

// Landingen fra første berøring. x er hvor langt underlaget er trykket ned, v er farten nedover.
function landing(h, type, ting = "egg", m = EGG) {
  const ball = ting === "ball";
  const T = ball ? Math.hypot(UNDERLAG[type].T, T_BALL) : UNDERLAG[type].T, w = Math.PI / T;
  const k = m * w * w;
  const v0 = Math.sqrt(2 * G * h), dt = T / 2000, beta = (ball ? UNDERLAG[type].ball : DEMPING) / v0;
  let x = 0, v = v0, t = 0, impuls = 0, maks = 0, xMaks = 0, tStopp = null;
  const data = [{ t: 0, F: 0, x: 0 }];
  for (let i = 1; t < 3 * T; i++) {
    const F = x > 0 ? Math.max(0, k * x * (1 + beta * v)) : 0;
    if (t > 0 && x <= 0 && v < 0) break;            // egget letter fra underlaget
    v += (G - F / m) * dt; x += v * dt; t += dt;
    impuls += (F - m * G) * dt;
    if (F > maks) maks = F;
    if (x > xMaks) xMaks = x;
    if (tStopp === null && v <= 0) tStopp = t;
    if (i % 10 === 0) data.push({ t, F, x });
  }
  data.push({ t, F: 0, x });
  return { data, v0, vUt: -v, tKontakt: t, tStopp, Fmaks: maks, xMaks, impuls, dp: m * (-v + v0), k, ball };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("landing");
  if (!el) return;

  let h, type, ting, grense, res, tid = 0, tFall = 0, tidligere = [];
  const l = Sim.lerret(el, tegn);

  function lesInnstillinger() {
    h = Sim.verdi("hoyde", (v) => komma(v, 2) + " m");
    type = Sim.verdi("underlag");
    ting = Sim.verdi("gjenstand");
    $("grense").disabled = ting === "ball";
    $("areal-sprett").hidden = ting !== "ball";
    $("areal-tekst").textContent = ting === "ball" ? "Areal fram til ballen står stille" : "Areal fram til egget står stille";
    $("t-tekst").textContent = ting === "ball" ? "kontakttid med underlaget" : "bremsetid (til egget står stille)";
    $("dp-tekst").textContent = ting === "ball" ? "Δp i hele støtet (opp er positiv)" : "Δp i bremsingen";
    grense = Sim.verdi("grense", (v) => komma(v, 0) + " N");
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    res = landing(h, type, ting);
    tFall = Math.sqrt(2 * h / G);
    tid = 0;
    tegn();
  }

  // Fallet vises i valgt tempo. Selve støtet vises alltid i sakte film, slik at det rekker å synes.
  function steg(dt) {
    const tempo = Number($("tempo").value);
    if (tid < tFall) tid = Math.min(tFall, tid + dt * tempo);
    else tid = Math.min(tFall + res.tKontakt, tid + dt * Math.max(res.tKontakt / 1.2, 0.002));
    tegn();
    if (tid >= tFall + res.tKontakt) {
      tidligere = [{ type, h, ting, data: res.data, Fmaks: res.Fmaks }, ...tidligere.filter((r) => !(r.type === type && r.h === h && r.ting === ting))].slice(0, 4);
      tegn();
      return false;
    }
    return true;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el, tekster: { klar: "Slipp egget", ferdig: "Slipp igjen" } });

  function tegnEgg(c, x, y, r, f, knust) {
    if (ting === "ball") {
      c.fillStyle = f.f2; c.beginPath(); c.arc(x, y + r * 0.22, r * 0.78, 0, 2 * Math.PI); c.fill();
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x - r * 0.22, y, r * 0.3, Math.PI, 1.5 * Math.PI); c.stroke();
      return;
    }
    if (knust) {
      c.fillStyle = "#f2c230";
      c.beginPath(); c.ellipse(x, y + r * 0.9, r * 1.6, r * 0.35, 0, 0, 2 * Math.PI); c.fill();
      c.fillStyle = "#f6efe0"; c.strokeStyle = f.dempet; c.lineWidth = 1;
      for (const [dx, rot] of [[-r * 1.2, -0.6], [r * 1.1, 0.5]]) {
        c.save(); c.translate(x + dx, y + r * 0.6); c.rotate(rot);
        c.beginPath(); c.moveTo(-r * 0.6, 0); c.lineTo(-r * 0.3, -r * 0.5); c.lineTo(0, -r * 0.2); c.lineTo(r * 0.3, -r * 0.6); c.lineTo(r * 0.6, 0); c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
      return;
    }
    c.fillStyle = "#f6efe0"; c.strokeStyle = f.dempet; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(x, y, r * 0.78, r, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
  }

  function tegn() {
    if (!l.b || !res) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 600;
    const sb = smal ? l.b : Math.min(260, l.b * 0.32);
    const sh = smal ? l.h * 0.42 : l.h;
    // Scenen: høyde og underlag
    const bunn = sh - 22, toppY = 26, underlagH = 18;
    const sy = (y) => bunn - underlagH - y / 2.0 * (bunn - underlagH - toppY);
    const xm = sb * 0.55;
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.strokeStyle = f.rute; c.lineWidth = 1;
    c.textAlign = "right"; c.textBaseline = "middle";
    for (let y = 0; y <= 2.0001; y += 0.5) {
      c.beginPath(); c.moveTo(40, sy(y)); c.lineTo(sb - 10, sy(y)); c.stroke();
      c.fillText(komma(y, 1) + " m", 36, sy(y));
    }
    // Underlaget trykkes sammen
    const kontakt = tid > tFall;
    const s = kontakt ? res.data.find((d) => d.t >= tid - tFall) || res.data[res.data.length - 1] : null;
    const trykk = s ? Math.min(underlagH * 0.9, s.x / 2.0 * (bunn - underlagH - toppY)) : 0;
    c.fillStyle = { betong: f["rute-sterk"], tre: "#b98a52", gress: "#5b9a4a", skum: "#e5d36a", dyne: "#a9c4e8" }[type];
    c.beginPath(); c.moveTo(48, bunn - underlagH); c.lineTo(xm - 22, bunn - underlagH);
    c.quadraticCurveTo(xm, bunn - underlagH + trykk * 2, xm + 22, bunn - underlagH);
    c.lineTo(sb - 10, bunn - underlagH); c.lineTo(sb - 10, bunn); c.lineTo(48, bunn); c.closePath(); c.fill();
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(40, bunn); c.lineTo(sb - 10, bunn); c.stroke();
    // Egget
    const ferdig = tid >= tFall + res.tKontakt - 1e-9;
    const r = 11, knust = !res.ball && ferdig && res.Fmaks > grense;
    let yEgg;
    if (!kontakt) yEgg = sy(h - 0.5 * G * tid * tid) - r;
    else if (ferdig && res.ball) yEgg = sy(res.vUt * res.vUt / (2 * G)) - r;   // ballen vises på toppen av sprettet
    else yEgg = bunn - underlagH + trykk - r;
    tegnEgg(c, xm, yEgg, r, f, knust);
    if (ferdig && res.ball) {
      c.strokeStyle = f["rute-sterk"]; c.setLineDash([3, 4]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(xm, yEgg + r + 4); c.lineTo(xm, bunn - underlagH - 2); c.stroke(); c.setLineDash([]);
    }
    if (ferdig) tegnPiler(c, f, sb, toppY, bunn - underlagH);
    if (tid === 0) {
      c.strokeStyle = f["rute-sterk"]; c.setLineDash([4, 4]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(xm, yEgg + r + 4); c.lineTo(xm, bunn - underlagH - 2); c.stroke(); c.setLineDash([]);
    }
    c.fillStyle = f.dempet; c.textAlign = "left"; c.textBaseline = "top"; c.font = "12px " + Sim.MONO;
    c.fillText(knust ? "Knust!" : UNDERLAG[type].navn + (res.ball ? " · sprettball" : ""), 48, 6);

    // Grafen: kraft fra underlaget mot tiden
    const gx = smal ? 0 : sb + 10, gy = smal ? sh : 0;
    c.save(); c.translate(gx, gy);
    const g = { ctx: c, b: l.b - gx, h: l.h - gy, f };
    const kurver = tidligere.filter((r) => !(r.type === type && r.h === h));
    const vis = [{ type, h, data: kontakt ? res.data.filter((d) => d.t <= tid - tFall) : [], Fmaks: res.Fmaks, aktiv: true }, ...kurver];
    const felles = $("skala").value === "felles";
    const tMaks = Math.max(...(felles ? vis : vis.slice(0, 1)).map((r) => r.data.length ? r.data[r.data.length - 1].t : 0), res.tKontakt) * 1000 * 1.05;
    const FMaks = Math.max(...(felles ? vis : vis.slice(0, 1)).map((r) => r.Fmaks), res.Fmaks, res.ball ? 0 : grense) * 1.1;
    const { px, py } = Sim.akser(g, { x: [0, tMaks], y: [0, FMaks], xTekst: "t / ms", yTekst: "F / N", marg: { v: 50 } });
    c.save(); c.beginPath(); c.rect(px(0), py(FMaks), px(tMaks) - px(0), py(0) - py(FMaks)); c.clip();
    // Grensen for når egget knuser
    c.font = "11px " + Sim.MONO;
    if (!res.ball) {
      c.strokeStyle = f.f1; c.setLineDash([5, 5]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(px(0), py(grense)); c.lineTo(px(tMaks), py(grense)); c.stroke(); c.setLineDash([]);
      c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "bottom";
      c.fillText("egget knuser", px(tMaks) - 4, py(grense) - 2);
    }
    for (const run of vis.slice().reverse()) {
      if (!run.data.length) continue;
      if (run.aktiv) {
        c.fillStyle = f.f2; c.globalAlpha = res.ball ? 0.32 : 0.2;
        c.beginPath(); c.moveTo(px(0), py(0));
        const brems = run.data.filter((d) => d.t <= res.tStopp);
        for (const d of brems) c.lineTo(px(d.t * 1000), py(d.F));
        if (brems.length) c.lineTo(px(brems[brems.length - 1].t * 1000), py(0));
        c.closePath(); c.fill();
        // Sprettballen: arealet mens ballen skyves opp igjen
        const opp = res.ball ? run.data.filter((d) => d.t >= res.tStopp) : [];
        if (opp.length) {
          c.globalAlpha = 0.08;
          c.beginPath(); c.moveTo(px(opp[0].t * 1000), py(0));
          for (const d of opp) c.lineTo(px(d.t * 1000), py(d.F));
          c.lineTo(px(opp[opp.length - 1].t * 1000), py(0));
          c.closePath(); c.fill();
        }
        c.globalAlpha = 1;
      }
      c.strokeStyle = run.aktiv ? f.f2 : f["rute-sterk"]; c.lineWidth = run.aktiv ? 2.5 : 1.5;
      c.beginPath();
      run.data.forEach((d, i) => (i ? c.lineTo(px(d.t * 1000), py(d.F)) : c.moveTo(px(d.t * 1000), py(d.F))));
      c.stroke();
      if (!run.aktiv) {
        const topp = run.data.reduce((a, b) => (b.F > a.F ? b : a));
        c.fillStyle = f.dempet; c.textAlign = "left"; c.textBaseline = "bottom";
        c.fillText(UNDERLAG[run.type].navn + (run.ting === "ball" ? ", ball" : "") + (run.h !== h ? " (" + komma(run.h, 2) + " m)" : ""), Math.min(px(topp.t * 1000) + 4, px(tMaks) - 120), Math.max(py(topp.F) - 2, py(FMaks) + 14));
      }
    }
    c.restore(); c.restore();
    oppdaterTall(kontakt);
  }

  // Bevegelsesmengden før og etter, og Δp, som piler med positiv retning oppover.
  // Egget regnes som liggende i ro etter bremsingen, sprettballen har farten vUt oppover.
  function tegnPiler(c, f, sb, toppY, gulv) {
    const pFor = EGG * res.v0, pEtter = res.ball ? EGG * res.vUt : 0, dp = pEtter + pFor;
    const y0 = toppY + (gulv - toppY) * 0.62;
    const L = Math.min((y0 - toppY - 16) / 2, (gulv - y0 - 6)) / pFor;   // piksler per kg m/s
    const xs = [sb * 0.74, sb * 0.84, sb * 0.94].map(Math.round);
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1;
    c.beginPath(); c.moveTo(xs[0] - 12, y0); c.lineTo(xs[2] + 8, y0); c.stroke();
    const pil = (x, lengde, farge, tekst) => {
      c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
      const y1 = y0 - lengde, ret = Math.sign(lengde);
      if (Math.abs(lengde) > 6) {
        c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1 + ret * 6); c.stroke();
        c.beginPath(); c.moveTo(x, y1); c.lineTo(x - 5, y1 + ret * 8); c.lineTo(x + 5, y1 + ret * 8); c.closePath(); c.fill();
      } else { c.beginPath(); c.arc(x, y0, 3, 0, 2 * Math.PI); c.fill(); }
      c.font = "11px " + Sim.MONO; c.textAlign = "center";
      c.textBaseline = lengde >= 0 ? "bottom" : "top";
      c.fillText(tekst, x, lengde >= 0 ? y1 - 3 : y1 + 3);
    };
    pil(xs[0], -pFor * L, f.blekk, "p før");
    pil(xs[1], pEtter * L, f.f1, "p etter");
    pil(xs[2], dp * L, f.f2, "Δp");
  }

  function oppdaterTall(kontakt) {
    const ferdig = tid >= tFall + res.tKontakt - 1e-9;
    const vis = (tekst) => (ferdig ? tekst : "?");
    $("v-inn").textContent = komma(res.v0, 2) + " m/s";
    const dp = res.ball ? EGG * (res.v0 + res.vUt) : EGG * res.v0;
    $("dp").textContent = vis(komma(dp, 3) + " kg m/s");
    const tid_ = res.ball ? res.tKontakt : res.tStopp;
    $("t-brems").textContent = vis(komma(tid_ * 1000, tid_ < 0.01 ? 2 : 0) + " ms");
    $("f-maks").textContent = vis(komma(res.Fmaks, res.Fmaks < 100 ? 1 : 0) + " N");
    const snitt = dp / tid_ + EGG * G;
    $("f-snitt").textContent = vis(komma(snitt, snitt < 100 ? 1 : 0) + " N");
    $("status").textContent = !ferdig ? "" : res.ball ? "Spretter opp med " + komma(res.vUt, 2) + " m/s." : res.Fmaks > grense ? "Egget knuste." : "Egget er helt.";
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["hoyde", "underlag", "gjenstand", "grense"]) $(id).addEventListener("input", nullstill);
  $("skala").addEventListener("input", tegn);
  $("glem").addEventListener("click", () => { tidligere = []; tegn(); });

  nullstill();
})();
