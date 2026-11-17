// Tog og tunnel: lengdekontraksjon og samtidighet.
// Toget er 200 m langt i sitt eget system S′, tunnelen er 150 m lang i sitt system S.
// Toget kjører mot høyre med farten v. I S er t = 0 når bakenden av toget passerer inngangen (x = 0).
// Alle hendelser defineres i S og Lorentz-transformeres til S′: x′ = γ(x − vt), t′ = γ(t − vx/c²).
// Enheter: meter og mikrosekunder.

const C = 299.792458;              // m/µs
const TOG = 200, TUNNEL = 150;
const gamma = (b) => 1 / Math.sqrt(1 - b * b);

function tilTog(x, t, v) { const g = gamma(v / C); return [g * (x - v * t), g * (t - v * x / (C * C))]; }
function fraTog(xp, tp, v) { const g = gamma(v / C); return [g * (xp + v * tp), g * (tp + v * xp / (C * C))]; }

// Alle hendelsene, med koordinater i begge systemer
function oppsett(beta, maaling) {
  const v = beta * C, g = gamma(beta), L = TOG / g;    // togets lengde i S
  const passer = L <= TUNNEL;
  // Portene er lukket et kort øyeblikk. Hvis toget passer, åpner utgangsporten før fronten kommer.
  const d = passer ? Math.min(0.05, 0.5 * (TUNNEL - L) / v || 0.05) : 0.05;
  const h = [];
  const leggTil = (id, tekst, x, t) => { const [xp, tp] = tilTog(x, t, v); h.push({ id, tekst, x, t, xp, tp }); };
  leggTil("inn-lukk", "Inngangsporten lukkes", 0, 0);
  leggTil("inn-apne", "Inngangsporten åpnes", 0, d);
  leggTil("ut-lukk", "Utgangsporten lukkes", TUNNEL, 0);
  leggTil("ut-apne", "Utgangsporten åpnes", TUNNEL, d);
  if (maaling === "tog") {
    // Tunnelfolket merker av bakenden og fronten på bakken samtidig i S (t = 0)
    leggTil("m-bak", "Merke på bakken ved bakenden av toget", 0, 0);
    leggTil("m-front", "Merke på bakken ved fronten av toget", L, 0);
  } else if (maaling === "tunnel") {
    // Togfolket merker av inngangen og utgangen på toget samtidig i S′ (t′ = 0)
    for (const [id, tekst, xp] of [["m-inn", "Merke på toget ved inngangen", 0], ["m-ut", "Merke på toget ved utgangen", TUNNEL / g]]) {
      const [x, t] = fraTog(xp, 0, v); h.push({ id, tekst, x, t, xp, tp: 0 });
    }
  }
  return { v, g, L, Lt: TUNNEL / g, passer, d, h };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("tunnel");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let o, sys = "S", tid = 0;
  const tidsrom = () => (sys === "S" ? [(-70 - o.L) / o.v, (TUNNEL + 70) / o.v] : [-(TOG + 70) / o.v, (o.Lt + 70) / o.v]);

  function les() {
    const beta = Sim.verdi("fart", (b) => komma(b, 2) + "c");
    sys = Sim.verdi("system");
    o = oppsett(beta, Sim.verdi("maaling"));
  }
  function nullstill() { avspiller.stopp(); les(); tid = tidsrom()[0]; oppdater(); }
  function steg(dt) { const [, t1] = tidsrom(); tid = Math.min(t1, tid + dt * Number($("tempo").value)); oppdater(); return tid < t1; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  const nårSkjer = (e) => (sys === "S" ? e.t : e.tp);
  const skjedd = (id) => { const e = o.h.find((x) => x.id === id); return e && nårSkjer(e) <= tid + 1e-12; };
  const lukket = (port) => skjedd(port + "-lukk") && !skjedd(port + "-apne");

  function tegn() {
    if (!l.b || !o) return;
    const c = l.ctx, f = l.f, smal = l.b < 560;
    l.tom();
    // Posisjoner i valgt system
    let tog0, tog1, tun0, tun1;
    if (sys === "S") { tog0 = o.v * tid; tog1 = tog0 + o.L; tun0 = 0; tun1 = TUNNEL; }
    else { tog0 = 0; tog1 = TOG; tun0 = -o.v * tid; tun1 = o.Lt - o.v * tid; }
    const xMin = -260, xMax = 420, X = (x) => 16 + (x - xMin) / (xMax - xMin) * (l.b - 32);
    const bakke = l.h * 0.62, hTog = Math.max(16, l.h * 0.12), hTun = hTog * 2.2;
    // Bakken med meterstreker (følger tunnelen)
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(0, bakke); c.lineTo(l.b, bakke); c.stroke();
    const skalaBakke = sys === "S" ? 1 : 1 / o.g;   // bakken er kontrahert i togets system
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.fillStyle = f.dempet; c.font = "10px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    for (let m = -600; m <= 800; m += 50) {
      const x = tun0 + m * skalaBakke; if (X(x) < 0 || X(x) > l.b) continue;
      c.beginPath(); c.moveTo(X(x), bakke); c.lineTo(X(x), bakke + (m % 100 === 0 ? 8 : 4)); c.stroke();
      if (m % 100 === 0 && !smal) c.fillText(m + " m", X(x), bakke + 10);
    }
    // Tunnelen
    c.fillStyle = f.flate; c.strokeStyle = f.dempet; c.lineWidth = 2;
    c.fillRect(X(tun0), bakke - hTun, X(tun1) - X(tun0), hTun);
    c.beginPath(); c.moveTo(X(tun0), bakke); c.lineTo(X(tun0), bakke - hTun); c.lineTo(X(tun1), bakke - hTun); c.lineTo(X(tun1), bakke); c.stroke();
    for (const [port, x] of [["inn", tun0], ["ut", tun1]]) {
      if (!lukket(port)) continue;
      c.strokeStyle = f.f1; c.lineWidth = 5; c.beginPath(); c.moveTo(X(x), bakke - hTun); c.lineTo(X(x), bakke); c.stroke();
    }
    // Toget
    c.fillStyle = f.f2; c.globalAlpha = 0.9;
    c.beginPath(); c.roundRect(X(tog0), bakke - hTog - 4, X(tog1) - X(tog0), hTog, 4); c.fill(); c.globalAlpha = 1;
    c.fillStyle = f.blekk; const nVogner = 4;
    for (let k = 0; k <= nVogner; k++) { const x = X(tog0 + (tog1 - tog0) * (k / nVogner)); c.fillRect(x - 1, bakke - hTog - 4, 2, hTog); }
    // Kollisjon: en port er lukket mens toget er i porten
    const kollisjon = [["inn", tun0], ["ut", tun1]].some(([p, x]) => lukket(p) && x > tog0 + 0.5 && x < tog1 - 0.5);
    if (kollisjon) { c.fillStyle = f.f1; c.font = "600 13px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom"; c.fillText("Porten treffer toget!", l.b / 2, bakke - hTun - 8); }
    // Målemerker: på bakken (følger tunnelen) eller på toget
    for (const e of o.h.filter((x) => x.id.startsWith("m-"))) {
      if (nårSkjer(e) > tid + 1e-12) continue;
      let x;
      if (e.id === "m-bak" || e.id === "m-front") x = sys === "S" ? e.x : tun0 + e.x / o.g;
      else x = sys === "S" ? tog0 + e.xp / o.g : e.xp;
      const påTog = e.id === "m-inn" || e.id === "m-ut", y = påTog ? bakke - hTog - 4 : bakke;
      c.fillStyle = påTog ? f.f1 : f.blekk;
      c.beginPath(); c.moveTo(X(x), y + (påTog ? -2 : 2)); c.lineTo(X(x) - 6, y + (påTog ? -12 : 12)); c.lineTo(X(x) + 6, y + (påTog ? -12 : 12)); c.closePath(); c.fill();
    }
    // Lengder
    c.fillStyle = f.blekk; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillText(komma(tog1 - tog0, 0) + " m", (X(tog0) + X(tog1)) / 2, bakke - hTog - 8);
    c.fillStyle = f.dempet; c.fillText("tunnel " + komma(tun1 - tun0, 0) + " m", (X(tun0) + X(tun1)) / 2, bakke - hTun - 4 - (kollisjon ? 18 : 0));
    c.textAlign = "left"; c.textBaseline = "top"; c.font = "12px " + Sim.MONO;
    c.fillText((sys === "S" ? "Tunnelens system: t = " : "Togets system: t′ = ") + komma(tid, 3) + " µs", 10, 8);
    c.textAlign = "right"; c.fillText(sys === "S" ? "toget kjører mot høyre →" : "← tunnelen kjører mot venstre", l.b - 10, 8);
  }

  function oppdater() {
    $("r-gamma").textContent = komma(o.g, 3);
    $("r-tog").textContent = komma(o.L, 1) + " m";
    $("r-tunnel").textContent = komma(o.Lt, 1) + " m";
    $("r-passer").textContent = o.passer ? "ja, sett fra tunnelen" : "nei";
    $("hendelser").innerHTML = o.h.slice().sort((a, b) => nårSkjer(a) - nårSkjer(b)).map((e) => {
      const ferdig = nårSkjer(e) <= tid + 1e-12;
      return `<tr class="${ferdig ? "skjedd" : ""}"><th scope="row">${e.tekst}</th><td>${komma(e.t, 3)}</td><td>${komma(e.tp, 3)}</td></tr>`;
    }).join("");
    tegn();
  }

  for (const id of ["fart", "system", "maaling"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
