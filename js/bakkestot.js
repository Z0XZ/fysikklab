// Vogn A triller ned en bakke og støter mot vogn B nede på den flate delen av banen.
// Banen er en rett bakke (25°) som går over i en sirkelbue og så en vannrett del.
// Vognene beveger seg langs banen. s er strekningen målt langs banen fra toppen.
// Støtfangerne er fjærer, slik som i simuleringen «Støt mellom to vogner».
// Friksjonen er rullefriksjon med kraft μ · m · g · cos(vinkel) mot fartsretningen.
// Sentripetalkraften i buen og rotasjonsenergien i hjulene er ikke tatt med.
// Enheter: kg, m, s.

const G = 9.81;
const VOGN = 0.25;                 // vognens lengde langs banen
const VINKEL = 25 * Math.PI / 180; // bakkens helning
const TOPP = 0.70;                 // bakkens høyde
const BUE = 0.5;                   // radius i buen nederst i bakken
const FLAT = 2.4;                  // lengden av den vannrette delen
const K_STOT = 2000;               // stivheten til støtfangeren i N/m
const STOTTALL = { elastisk: 1, uelastisk: 0.5, fullstendig: 0 };

// Banens form: x og y som funksjon av s, med en tabell for hver millimeter
const BANE = (function () {
  const yBue = BUE * (1 - Math.cos(VINKEL));
  const lBakke = (TOPP - yBue) / Math.sin(VINKEL), lBue = BUE * VINKEL;
  const x1 = lBakke * Math.cos(VINKEL), x2 = x1 + BUE * Math.sin(VINKEL);
  const lengde = lBakke + lBue + FLAT, ds = 0.001;
  const n = Math.ceil(lengde / ds) + 1;
  const xs = new Float64Array(n), ys = new Float64Array(n), vs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.min(i * ds, lengde);
    let x, y, v;   // v er vinkelen nedover mot høyre
    if (s <= lBakke) { v = VINKEL; x = s * Math.cos(v); y = TOPP - s * Math.sin(v); }
    else if (s <= lBakke + lBue) { const u = (s - lBakke) / BUE; v = VINKEL - u; x = x2 - BUE * Math.sin(v); y = BUE * (1 - Math.cos(v)); }
    else { v = 0; x = x2 + (s - lBakke - lBue); y = 0; }
    xs[i] = x; ys[i] = y; vs[i] = v;
  }
  const hent = (tab, s) => {
    const k = Math.max(0, Math.min(n - 1.000001, s / ds)), i = Math.floor(k), r = k - i;
    return tab[i] * (1 - r) + tab[i + 1] * r;
  };
  return {
    lengde, lBakke, lBue, x2, sFlat: lBakke + lBue, xSlutt: x2 + FLAT,
    x: (s) => hent(xs, s), y: (s) => hent(ys, s), vinkel: (s) => hent(vs, s),
  };
})();

// Strekningen langs banen der høyden er h (på bakken)
function sVedHoyde(h) { return (TOPP - h) / Math.sin(VINKEL); }
const B_START = BANE.sFlat + 1.0;   // midten av vogn B ved start

// Simulerer hele forløpet. Returnerer målinger hvert millisekund.
function simuler({ h, mA, mB, vB, type, mu }) {
  const dt = 2e-4, e = STOTTALL[type], m = [mA, mB];
  const s = [sVedHoyde(h), B_START], v = [0, vB];
  const data = [];
  let t = 0, varme = 0, laast = false, kontakt = false, maks = 0, antall = 0;
  let første = null, slutt = "tid", tRo = 0, tSisteStot = 0;
  for (let i = 0; ; i++) {
    // Sammenpressing av støtfangerne
    const c = (s[0] + VOGN / 2) - (s[1] - VOGN / 2);
    let F = 0;
    if (!laast && !kontakt && c > 0 && v[0] > v[1]) {
      kontakt = true; maks = 0; antall++;
      if (!første) første = { tKontakt: t, før: [v[0], v[1]] };
    }
    if (kontakt) {
      if (v[1] - v[0] < 0) { F = K_STOT * Math.max(0, c); maks = Math.max(maks, c); }
      else if (e === 0) { laast = true; kontakt = false; v[0] = v[1] = (mA * v[0] + mB * v[1]) / (mA + mB); }
      else F = Math.max(0, K_STOT / (e * e) * (c - maks * (1 - e * e)));
      if (!laast && F === 0 && v[1] - v[0] >= 0) {
        kontakt = false; tSisteStot = t;
        if (første.tFerdig === undefined) { første.tFerdig = t; første.etter = [v[0], v[1]]; }
      }
    }
    if (laast && første.tFerdig === undefined) { første.tFerdig = t; første.etter = [v[0], v[1]]; tSisteStot = t; }

    const yA = BANE.y(s[0]), yB = BANE.y(s[1]);
    if (i % 5 === 0) data.push({ t, sA: s[0], sB: s[1], vA: v[0], vB: v[1], F, yA, yB, varme, c: Math.max(0, c) });

    // Slutt: en vogn når enden av banen, alt står stille, eller det har gått lang tid
    if (s[1] + VOGN / 2 >= BANE.lengde || s[0] + VOGN / 2 >= BANE.lengde) { slutt = "ende"; break; }
    if (s[0] - VOGN / 2 <= 0) { slutt = "topp"; break; }
    if (Math.abs(v[0]) < 1e-6 && Math.abs(v[1]) < 1e-6 && F === 0) { if ((tRo += dt) > 0.3) { slutt = "ro"; break; } } else tRo = 0;
    if (t > 12 || (første && første.tFerdig !== undefined && t > tSisteStot + 4)) break;

    // Krefter langs banen: tyngde, støt og friksjon
    // Tyngdens komponent langs banen er m g sin(vinkel), positiv nedover bakken mot høyre
    const ytre = [m[0] * G * Math.sin(BANE.vinkel(s[0])) - F, m[1] * G * Math.sin(BANE.vinkel(s[1])) + F];
    const fr = [0, 1].map((k) => mu * m[k] * G * Math.cos(BANE.vinkel(s[k])));
    const nyFart = (vk, Fk, frk, mk) => {
      if (Math.abs(vk) < 1e-6) {
        if (Math.abs(Fk) <= frk) return 0;
        return vk + (Fk - Math.sign(Fk) * frk) / mk * dt;
      }
      const ny = vk + (Fk - Math.sign(vk) * frk) / mk * dt;
      return Math.sign(ny) !== Math.sign(vk) && Math.abs(Fk) <= frk ? 0 : ny;
    };
    if (laast) {
      const M = mA + mB, Fsum = ytre[0] + ytre[1], frSum = fr[0] + fr[1];
      const vNy = nyFart(v[0], Fsum, frSum, M);
      varme += frSum * Math.abs(v[0]) * dt;
      v[0] = v[1] = vNy;
    } else {
      for (const k of [0, 1]) { varme += fr[k] * Math.abs(v[k]) * dt; v[k] = nyFart(v[k], ytre[k], fr[k], m[k]); }
    }
    s[0] += v[0] * dt; s[1] += v[1] * dt;
    t += dt;
  }
  if (første && første.tFerdig === undefined) første.tFerdig = Infinity;
  return { data, første, antall, slutt, laast, tSlutt: data[data.length - 1].t };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("bakke");
  if (!el) return;

  let inn, sim, tid = 0;
  const scene = Sim.lerret(el, tegn);
  const graf = Sim.lerret($("bakkegraf"), tegn);
  const fart = (v) => (v > 0 ? "+" : "") + komma(v, 2) + " m/s";

  function lesInnstillinger() {
    inn = {
      type: Sim.verdi("type"),
      h: Sim.verdi("hoyde", (v) => komma(v, 2) + " m"),
      mA: Sim.verdi("masse-a", (v) => komma(v, 2) + " kg"),
      mB: Sim.verdi("masse-b", (v) => komma(v, 2) + " kg"),
      vB: Sim.verdi("fart-b", fart),
      mu: Sim.verdi("friksjon", (v) => (v === 0 ? "ingen" : "μ = " + komma(v, 2))),
    };
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    sim = simuler(inn);
    tid = 0;
    $("melding").textContent = "";
    tegn();
  }

  function steg(dt) {
    tid = Math.min(sim.tSlutt, tid + dt * Number($("tempo").value));
    tegn();
    if (tid >= sim.tSlutt) {
      const tekst = { ende: "En vogn nådde enden av banen.", ro: "Begge vognene står stille.", topp: "Vogn A kom helt opp til toppen igjen.", tid: "" }[sim.slutt];
      $("melding").textContent = (sim.første ? "" : "Vognene støtte ikke sammen. ") + tekst;
    }
    return tid < sim.tSlutt;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => sim.data[Math.min(sim.data.length - 1, Math.round(tid / 1e-3))];

  // Energi: kinetisk, potensiell (nullnivå på den flate delen), varme fra friksjon og fra støt
  const energi = (d) => {
    const ek = 0.5 * inn.mA * d.vA ** 2 + 0.5 * inn.mB * d.vB ** 2;
    const ep = inn.mA * G * d.yA + inn.mB * G * d.yB;
    return { ek, ep, mek: ek + ep, friksjon: d.varme };
  };

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const margV = smal ? 30 : 44, margH = 14, topp = smal ? 30 : 40, bunn = 28;
    const sk = Math.min((l.b - margV - margH) / BANE.xSlutt, (l.h - topp - bunn) / TOPP);
    const ox = margV, oy = l.h - bunn;
    const px = (x) => ox + x * sk, py = (y) => oy - y * sk;
    // Bakken fylt ned til bakken
    c.fillStyle = f.flate; c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(px(0), oy);
    for (let s = 0; s <= BANE.lengde; s += 0.01) c.lineTo(px(BANE.x(s)), py(BANE.y(s)));
    c.lineTo(px(BANE.xSlutt), oy); c.closePath(); c.fill();
    c.beginPath();
    for (let s = 0; s <= BANE.lengde; s += 0.01) s ? c.lineTo(px(BANE.x(s)), py(BANE.y(s))) : c.moveTo(px(BANE.x(s)), py(BANE.y(s)));
    c.stroke();
    // Endestopp
    c.fillStyle = f.dempet; c.fillRect(px(BANE.xSlutt) - 3, oy - 16, 4, 16);
    // Høydeskala til venstre
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.fillStyle = f.dempet;
    c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "middle";
    c.beginPath(); c.moveTo(px(0) - 8, oy); c.lineTo(px(0) - 8, py(TOPP)); c.stroke();
    for (let y = 0; y <= TOPP + 1e-9; y += 0.1) {
      const hel = Math.abs(y * 10 - Math.round(y * 10)) < 1e-6 && Math.round(y * 10) % 2 === 0;
      c.beginPath(); c.moveTo(px(0) - 8, py(y)); c.lineTo(px(0) - (hel ? 14 : 11), py(y)); c.stroke();
      if (hel && !smal) c.fillText(komma(y, 1), px(0) - 16, py(y));
    }
    if (smal) { c.textAlign = "left"; c.fillText(komma(TOPP, 1) + " m", 4, py(TOPP) - 12); }
    // Starthøyden
    c.strokeStyle = f.f1; c.setLineDash([4, 4]); c.globalAlpha = 0.6;
    c.beginPath(); c.moveTo(px(0) - 8, py(inn.h)); c.lineTo(px(BANE.xSlutt), py(inn.h)); c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;
    c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("h = " + komma(inn.h, 2) + " m", px(BANE.xSlutt) - 4, py(inn.h) - 3);
    if (!sim) return;
    const d = nå();
    const vognH = Math.max(12, VOGN * sk * 0.42);
    const vogn = (sMidt, v, farge, navn, side) => {
      const x = px(BANE.x(sMidt)), y = py(BANE.y(sMidt)), a = BANE.vinkel(sMidt), b = VOGN * sk;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = farge; c.globalAlpha = 0.9;
      c.beginPath(); c.roundRect(-b / 2 + 3, -4 - vognH, b - 6, vognH, 3); c.fill();
      c.globalAlpha = 1; c.fillStyle = f.blekk;
      for (const hjul of [-0.25, 0.25]) { c.beginPath(); c.arc(b * hjul, -3, 3, 0, 2 * Math.PI); c.fill(); }
      c.fillStyle = inn.type === "fullstendig" ? f.dempet : f["rute-sterk"];
      c.fillRect(side > 0 ? b / 2 - 4 : -b / 2, -4 - vognH * 0.75, 4, vognH * 0.5);
      c.fillStyle = f.papir; c.font = "600 " + (smal ? 10 : 12) + "px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(navn, 0, -4 - vognH / 2);
      // Fartspil langs banen
      const lengde = v * sk * 0.12, yP = -4 - vognH - 9;
      if (Math.abs(lengde) > 2) {
        const r = Math.sign(lengde);
        c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(0, yP); c.lineTo(lengde - r * 6, yP); c.stroke();
        c.beginPath(); c.moveTo(lengde, yP); c.lineTo(lengde - r * 8, yP - 5); c.lineTo(lengde - r * 8, yP + 5); c.fill();
      }
      c.restore();
      return { x, y: y - (vognH + 4) * Math.cos(a) - 22 };
    };
    const pa = vogn(d.sA, d.vA, f.f1, "A", 1), pb = vogn(d.sB, d.vB, f.f2, "B", -1);
    // Fart over vognene
    c.font = "11px " + Sim.MONO; c.textBaseline = "bottom"; c.textAlign = "center";
    const etikett = (p, tekst, farge, løft) => {
      const tb = c.measureText(tekst).width;
      c.fillStyle = farge;
      c.fillText(tekst, Math.min(l.b - tb / 2 - 4, Math.max(tb / 2 + 4, p.x)), Math.max(12, p.y - løft));
    };
    const nær = Math.abs(pa.x - pb.x) < (smal ? 90 : 120);
    etikett(pa, komma(d.vA, 2) + " m/s", f.f1, nær ? 13 : 0);
    etikett(pb, komma(d.vB, 2) + " m/s", f.f2, 0);
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", l.b - 10, 8);
  }

  const STR = {
    v: { navn: "v / (m/s)", linjer: [["A", (d) => d.vA, "f1"], ["B", (d) => d.vB, "f2"]], forklaring: [["f1", "Vogn A"], ["f2", "Vogn B"]] },
    p: { navn: "p / (kg m/s)", linjer: [["A", (d) => inn.mA * d.vA, "f1"], ["B", (d) => inn.mB * d.vB, "f2"], ["sum", (d) => inn.mA * d.vA + inn.mB * d.vB, "blekk", true]], forklaring: [["f1", "Vogn A"], ["f2", "Vogn B"], ["stiplet", "Summen"]] },
    e: {
      navn: "E / J",
      linjer: [["ek", (d) => energi(d).ek, "f1"], ["ep", (d) => energi(d).ep, "f2"], ["fr", (d) => d.varme, "dempet"], ["mek", (d) => energi(d).mek, "blekk", true]],
      forklaring: [["f1", "Kinetisk energi"], ["f2", "Potensiell energi"], ["dempet", "Varme fra friksjon"], ["stiplet", "Mekanisk energi E<sub>k</sub> + E<sub>p</sub>"]],
    },
  };

  let forrigeForklaring = "";
  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const q = STR[Sim.verdi("storrelse")];
    const html = q.forklaring.map(([k, t]) => `<li><span class="linje ${k === "dempet" ? "varme" : k}"></span><span>${t}</span></li>`).join("");
    if (html !== forrigeForklaring) { $("graf-forklaring").innerHTML = html; forrigeForklaring = html; }
    if (!sim) return;
    const verdier = sim.data.flatMap((d) => q.linjer.map(([, fn]) => fn(d)));
    let y0 = Math.min(0, ...verdier), y1 = Math.max(0, ...verdier);
    const pad = (y1 - y0 || 1) * 0.12; y0 = y0 < 0 ? y0 - pad : 0; y1 += pad;
    const { px, py } = Sim.akser(l, { x: [0, sim.tSlutt], y: [y0, y1], xTekst: "t / s", yTekst: q.navn });
    for (const [, fn, farge, stiplet] of q.linjer) {
      c.strokeStyle = f[farge]; c.lineWidth = 2; c.setLineDash(stiplet ? [6, 4] : []);
      c.beginPath();
      for (const d of sim.data) { if (d.t > tid) break; d.t ? c.lineTo(px(d.t), py(fn(d))) : c.moveTo(px(d.t), py(fn(d))); }
      c.stroke(); c.setLineDash([]);
    }
  }

  function oppdaterTabell() {
    const fs = sim.første;
    const rad = (navn, v, vis) => {
      const u = (x, des) => (vis && v ? komma(x, des) : vis ? "–" : "?");
      const [vA, vB] = v || [0, 0];
      const pA = inn.mA * vA, pB = inn.mB * vB, ek = 0.5 * inn.mA * vA ** 2 + 0.5 * inn.mB * vB ** 2;
      return `<tr><th scope="row">${navn}</th><td class="f1">${u(vA, 2)}</td><td class="f2">${u(vB, 2)}</td><td class="f1">${u(pA, 3)}</td><td class="f2">${u(pB, 3)}</td><td>${u(pA + pB, 3)}</td><td>${u(ek, 3)}</td></tr>`;
    };
    const ferdig = tid >= sim.tSlutt;
    const visFør = fs ? tid >= fs.tKontakt : ferdig, visEtter = fs ? tid >= fs.tFerdig : ferdig;
    $("stot-rader").innerHTML = rad("Rett før", fs && fs.før, visFør) + rad("Rett etter", fs && fs.etter, visEtter);
  }

  function tegn() {
    if (scene.b) tegnScene();
    if (graf.b) tegnGraf();
    if (!sim) return;
    const d = nå(), E = energi(d);
    $("tid").textContent = komma(tid, 2) + " s";
    $("h-a").textContent = komma(d.yA, 3) + " m";
    $("p-tot").textContent = komma(inn.mA * d.vA + inn.mB * d.vB, 3) + " kg m/s";
    $("e-mek").textContent = komma(E.mek, 3) + " J";
    $("e-fr").textContent = komma(d.varme, 3) + " J";
    oppdaterTabell();
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["type", "hoyde", "masse-a", "masse-b", "fart-b", "friksjon"]) $(id).addEventListener("input", nullstill);
  $("storrelse").addEventListener("input", tegn);
  nullstill();
})();
