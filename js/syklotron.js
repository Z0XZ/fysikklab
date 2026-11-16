// Syklotron: To D-formede elektroder i et homogent magnetfelt (ut av planet). Mellom dem er det en smal spalt
// med vekselspenning U cos(2π f t). Partikkelen går i halvsirkler og får energi hver gang den passerer spalten.
// Spalten regnes som uendelig smal, og relativistiske effekter er neglisjert.
// Passering nummer n skjer ved t = n · T/2, der T = 2πm/(qB). Energien den får er qU cos(π n (f/f₀ − 1)).

const E_LADNING = 1.602176634e-19;
const MEV = 1.602176634e-13;
const PARTIKLER = {
  proton: { navn: "proton", q: E_LADNING, m: 1.67262192e-27 },
  deuteron: { navn: "deuteron", q: E_LADNING, m: 3.3435837e-27 },
  alfa: { navn: "alfapartikkel", q: 2 * E_LADNING, m: 6.6446573e-27 },
};

function syklotron(p, B, R, U, forhold) {
  const T = 2 * Math.PI * p.m / (p.q * B), f0 = 1 / T;
  const halv = [];   // én halvsirkel per passering: { K, r, x0, x1, opp }
  let K = 0, x = 0, utfall = "maks";
  for (let n = 0; n < 4000; n++) {
    const gevinst = p.q * U * Math.cos(Math.PI * n * (forhold - 1));
    K += gevinst;
    if (K <= 0) { utfall = "stopp"; break; }
    const r = Math.sqrt(2 * p.m * K) / (p.q * B);
    if (r > R) { utfall = "ut"; break; }
    if (n === 0) x = -r;
    const opp = n % 2 === 0;
    const x1 = opp ? x + 2 * r : x - 2 * r;
    halv.push({ n, K, r, x0: x, x1, opp, gevinst });
    x = x1;
  }
  if (halv.length >= 4000) utfall = "maks";
  const Kmaks = (p.q * B * R) ** 2 / (2 * p.m);
  return { T, f0, halv, utfall, Kmaks };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("syklotron");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, s, fase = 0;

  const sci = (x) => {
    if (!isFinite(x) || x === 0 || (Math.abs(x) < 1e4 && Math.abs(x) >= 0.01)) return Sim.tall(x, 3);
    let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
    if (Math.abs(Number(m.toFixed(2))) >= 10) { m /= 10; e += 1; }
    return komma(m, 2) + " · 10" + String(e).split("").map((t) => (t === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[t])).join("");
  };

  function les() {
    inn = {
      p: PARTIKLER[Sim.verdi("partikkel")],
      B: Sim.verdi("felt", (v) => komma(v, 1) + " T"),
      R: Sim.verdi("radius", (v) => komma(v * 100, 0) + " cm"),
      U: Sim.verdi("spenning", (v) => komma(v, 0) + " kV") * 1000,
      forhold: Sim.verdi("frekvens", (v) => komma(v, 1) + " %") / 100,
    };
    s = syklotron(inn.p, inn.B, inn.R, inn.U, inn.forhold);
  }
  function nullstill() { avspiller.stopp(); les(); fase = 0; oppdater(); }
  // Skjermtid per halvsirkel, slik at hele forløpet tar noen sekunder
  const perHalv = () => Math.min(0.4, Math.max(0.03, 7 / Math.max(1, s.halv.length)));
  function steg(dt) {
    fase = Math.min(s.halv.length + 1, fase + dt / perHalv());
    oppdater();
    return fase < s.halv.length + 1;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  function tegn() {
    if (!l.b || !inn) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const sk = (Math.min(l.b, l.h) / 2 - 18) / (inn.R * 1.08), mx = l.b / 2, my = l.h / 2;
    const X = (x) => mx + x * sk, Y = (y) => my - y * sk;
    const n = Math.min(s.halv.length, Math.floor(fase));
    // Spenningens fortegn akkurat nå: øvre D positiv eller negativ
    const t = fase * s.T / 2;
    const V = Math.cos(2 * Math.PI * inn.forhold * s.f0 * t);
    const gap = 6;
    for (const [opp, tegnV] of [[true, -V], [false, V]]) {
      c.fillStyle = f.flate; c.strokeStyle = tegnV > 0.05 ? f.f1 : tegnV < -0.05 ? f.f2 : f.dempet; c.lineWidth = 3;
      c.beginPath();
      if (opp) { c.arc(mx, my - gap, inn.R * sk, Math.PI, 0); c.lineTo(mx + inn.R * sk, my - gap); }
      else { c.arc(mx, my + gap, inn.R * sk, 0, Math.PI); c.lineTo(mx - inn.R * sk, my + gap); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = c.strokeStyle; c.font = "700 16px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(tegnV > 0.05 ? "+" : tegnV < -0.05 ? "−" : "0", mx - inn.R * sk * 0.75, opp ? my - inn.R * sk * 0.55 : my + inn.R * sk * 0.55);
    }
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("B = " + komma(inn.B, 1) + " T ut av planet", 8, 8);
    // Banen så langt
    c.strokeStyle = inn.p.q > 0 ? f.f1 : f.f2; c.lineWidth = 1.6;
    c.beginPath();
    let pos = null;
    const frac = fase - n;
    for (let k = 0; k <= Math.min(n, s.halv.length - 1); k++) {
      const h = s.halv[k], cx = (h.x0 + h.x1) / 2, a0 = h.opp ? Math.PI : 0;
      const andel = k < n ? 1 : frac;
      // Med klokka: oppe fra venstre (π) til høyre (0), nede fra høyre (0) til venstre (−π)
      const slutt = a0 - Math.PI * andel;
      const start = [X(cx + h.r * Math.cos(a0)), Y(h.r * Math.sin(a0)) + (h.opp ? -gap : gap)];
      if (k === 0) c.moveTo(...start); else c.lineTo(...start);
      for (let v = a0; v >= slutt - 1e-9; v -= Math.PI / 60) c.lineTo(X(cx + h.r * Math.cos(v)), Y(h.r * Math.sin(v)) + (h.opp ? -gap : gap));
      c.lineTo(X(cx + h.r * Math.cos(slutt)), Y(h.r * Math.sin(slutt)) + (h.opp ? -gap : gap));
      pos = { x: X(cx + h.r * Math.cos(slutt)), y: Y(h.r * Math.sin(slutt)) + (h.opp ? -gap : gap) };
    }
    c.stroke();
    // Partikkelen går ut av syklotronen: en kvart sirkel til, og så rett ut langs tangenten
    if (fase >= s.halv.length && s.utfall === "ut" && s.halv.length) {
      const h = s.halv[s.halv.length - 1], cx = (h.x0 + h.x1) / 2, dy = h.opp ? gap : -gap;
      const a0 = h.opp ? 0 : -Math.PI, andel = Math.min(1, fase - s.halv.length);
      const bue = Math.min(1, andel * 2), a1 = a0 - Math.PI / 2 * bue;
      c.beginPath(); c.moveTo(X(cx + h.r * Math.cos(a0)), Y(h.r * Math.sin(a0)) + dy);
      for (let v = a0; v >= a1 - 1e-9; v -= Math.PI / 60) c.lineTo(X(cx + h.r * Math.cos(v)), Y(h.r * Math.sin(v)) + dy);
      let px = X(cx + h.r * Math.cos(a1)), py = Y(h.r * Math.sin(a1)) + dy;
      c.lineTo(px, py);
      if (andel > 0.5) {
        const lengde = (andel - 0.5) * 2 * l.b * 0.5;
        px += Math.sin(a1) * lengde; py += Math.cos(a1) * lengde;
        c.lineTo(px, py);
      }
      c.stroke();
      pos = { x: px, y: py };
    }
    if (pos) { c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(pos.x, pos.y, 4.5, 0, 2 * Math.PI); c.fill(); }
  }

  function oppdater() {
    const n = Math.min(s.halv.length, Math.floor(fase));
    const h = s.halv[Math.max(0, Math.min(s.halv.length - 1, n))];
    const K = h ? h.K : 0, v = Math.sqrt(2 * K / inn.p.m);
    $("r-f0").textContent = komma(s.f0 / 1e6, 2) + " MHz";
    $("r-fu").textContent = komma(s.f0 * inn.forhold / 1e6, 2) + " MHz";
    $("r-kmaks").textContent = komma(s.Kmaks / MEV, 2) + " MeV";
    $("r-n").textContent = String(Math.min(s.halv.length, n + (h ? 1 : 0)));
    $("r-k").textContent = komma(K / MEV, 3) + " MeV";
    $("r-v").textContent = sci(v) + " m/s";
    $("r-r").textContent = h ? komma(h.r * 100, 1) + " cm" : "–";
    const ferdig = fase >= s.halv.length;
    $("melding").textContent = !ferdig ? "" : s.utfall === "ut" ? `Partikkelen kom ut etter ${s.halv.length} passeringer av spalten (${komma(s.halv.length / 2, 1)} omløp) med ${komma(K / MEV, 2)} MeV.`
      : s.utfall === "stopp" ? `Partikkelen kom ut av takt med spenningen, ble bremset og stoppet etter ${s.halv.length} passeringer.`
      : `Partikkelen kom ikke ut etter ${s.halv.length} passeringer. Den kom ut av takt og nådde ${komma(Math.max(...s.halv.map((x) => x.K)) / MEV, 2)} MeV på det meste.`;
    tegn();
  }

  for (const id of ["partikkel", "felt", "radius", "spenning", "frekvens"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
