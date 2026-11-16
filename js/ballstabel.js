// Ballstabel. En lett ball ligger oppå en tung ball, og begge slippes samtidig.
// Den tunge ballen spretter fra gulvet og møter den lette ballen, som fortsatt er på vei ned.
// Støtene regnes som momentane og skjer rett etter hverandre (vi ser bort fra den lille avstanden mellom ballene).
// Enheter: kg, m, s.

const G = 9.81;
const BALLER = {
  basket: { navn: "Basketball", m: 0.600, e: 0.85, r: 0.12 },
  fotball: { navn: "Fotball", m: 0.430, e: 0.80, r: 0.11 },
  tennis: { navn: "Tennisball", m: 0.057, e: 0.75, r: 0.033 },
  sprett: { navn: "Sprettball", m: 0.020, e: 0.92, r: 0.016 },
  bordtennis: { navn: "Bordtennisball", m: 0.0027, e: 0.87, r: 0.02 },
};
const E_BALLER = 0.80;   // støttall mellom ballene i realistisk modus

function etterStot(mA, vA, mB, vB, e) {
  const p = mA * vA + mB * vB, M = mA + mB;
  return [(p + mB * e * (vB - vA)) / M, (p + mA * e * (vA - vB)) / M];
}

// Farten oppover etter at den nederste ballen har sprettet fra gulvet og truffet den øverste.
// Positiv retning er oppover. Returnerer også høydene ballene når opp til.
function ballstabel(h0, nede, oppe, ideell) {
  const v = Math.sqrt(2 * G * h0);
  const eGulv = ideell ? 1 : BALLER[nede].e, eBall = ideell ? 1 : E_BALLER;
  const vNede = eGulv * v, vOppe = -v;
  const [uNede, uOppe] = etterStot(BALLER[nede].m, vNede, BALLER[oppe].m, vOppe, eBall);
  return {
    v, uNede, uOppe,
    hNede: uNede > 0 ? uNede * uNede / (2 * G) : 0,
    hOppe: uOppe > 0 ? uOppe * uOppe / (2 * G) : 0,
    ekFør: 0.5 * (BALLER[nede].m + BALLER[oppe].m) * v * v,
    ekOppe: 0.5 * BALLER[oppe].m * uOppe * uOppe,
    ekNede: 0.5 * BALLER[nede].m * uNede * uNede,
    eGulv,
  };
}

// Posisjonen til en ball som skytes opp fra bakken med farten u og spretter videre med støttallet e
function sprettHoyde(u, e, t) {
  while (u > 0.05) {
    const T = 2 * u / G;
    if (t < T) return u * t - 0.5 * G * t * t;
    t -= T; u *= e;
  }
  return 0;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("stabel");
  if (!el) return;

  let h0, nede, oppe, ideell, res, tid = 0, tFall = 0, toppNå = 0;
  const l = Sim.lerret(el, tegn);

  function lesInnstillinger() {
    h0 = Sim.verdi("hoyde", (v) => komma(v, 1) + " m");
    nede = Sim.verdi("nede"); oppe = Sim.verdi("oppe");
    ideell = Sim.verdi("ideell");
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    res = ballstabel(h0, nede, oppe, ideell);
    tFall = Math.sqrt(2 * h0 / G);
    tid = 0; toppNå = 0;
    tegn();
  }

  const tSlutt = () => tFall + Math.max(2 * res.uOppe / G, 2 * res.uNede / G, 0.5) + 0.3;
  function steg(dt) {
    tid = Math.min(tSlutt(), tid + dt * Number($("tempo").value));
    tegn();
    return tid < tSlutt();
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el, tekster: { klar: "Slipp ballene", ferdig: "Slipp igjen" } });

  // Høyden til bunnen av hver ball ved tiden tid
  function posisjoner() {
    if (tid <= tFall) { const y = h0 - 0.5 * G * tid * tid; return [y, y + 2 * BALLER[nede].r]; }
    const t = tid - tFall;
    const yNede = res.uNede > 0 ? sprettHoyde(res.uNede, ideell ? 1 : BALLER[nede].e, t) : 0;
    let yOppe = 2 * BALLER[nede].r + res.uOppe * t - 0.5 * G * t * t;
    if (yOppe < 0) yOppe = 0;
    return [yNede, yOppe];
  }

  function tegn() {
    if (!l.b || !res) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const yMaks = Math.max(h0 + 0.5, res.hOppe + 2 * BALLER[nede].r + 0.3) * 1.08;
    const bunn = l.h - 26, topp = 16;
    const sy = (y) => bunn - y / yMaks * (bunn - topp);
    // Høydeskala
    const s = Sim.steglengde(yMaks, 6);
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.strokeStyle = f.rute; c.lineWidth = 1;
    c.textAlign = "right"; c.textBaseline = "middle";
    for (let y = 0; y <= yMaks + 1e-9; y += s) {
      c.beginPath(); c.moveTo(46, sy(y)); c.lineTo(l.b - 10, sy(y)); c.stroke();
      c.fillText(komma(y, s < 1 ? 1 : 0) + " m", 42, sy(y));
    }
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(46, bunn); c.lineTo(l.b - 10, bunn); c.stroke();
    // Slipphøyden og høyeste punkt
    c.setLineDash([5, 5]); c.lineWidth = 1;
    c.strokeStyle = f.dempet;
    c.beginPath(); c.moveTo(46, sy(h0 + 2 * BALLER[nede].r)); c.lineTo(l.b - 10, sy(h0 + 2 * BALLER[nede].r)); c.stroke();
    const [yN, yO] = posisjoner();
    if (tid > tFall) toppNå = Math.max(toppNå, yO);
    if (toppNå > 0) {
      c.strokeStyle = f.f1;
      c.beginPath(); c.moveTo(46, sy(toppNå)); c.lineTo(l.b - 10, sy(toppNå)); c.stroke();
      c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "bottom";
      c.fillText("toppen av fluktbanen", l.b - 12, sy(toppNå) - 2);
    }
    c.setLineDash([]);
    c.fillStyle = f.dempet; c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("startpunkt", l.b - 12, sy(h0 + 2 * BALLER[nede].r) - 2);
    // Ballene. Radiene tegnes større enn i virkeligheten når skalaen er liten.
    const xm = l.b * 0.45;
    const rpx = (r) => Math.max(5, r / yMaks * (bunn - topp));
    const rN = rpx(BALLER[nede].r), rO = rpx(BALLER[oppe].r);
    c.fillStyle = f.f2; c.beginPath(); c.arc(xm, sy(yN) - rN, rN, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.f1; c.beginPath(); c.arc(xm, tid <= tFall ? sy(yN) - 2 * rN - rO : sy(yO) - rO, rO, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", 52, 4);
    oppdaterTall();
  }

  function oppdaterTall() {
    const etter = tid > tFall, vis = (x) => (etter ? x : "?");
    $("v-gulv").textContent = komma(res.v, 2) + " m/s";
    $("u-oppe").textContent = vis(komma(res.uOppe, 2) + " m/s");
    $("u-nede").textContent = vis(komma(res.uNede, 2) + " m/s");
    $("h-oppe").textContent = vis(komma(res.hOppe, 2) + " m");
    $("faktor").textContent = vis(komma(res.hOppe / h0, 1) + " ganger");
    $("ek").textContent = vis(komma(res.ekOppe, 2) + " J av " + komma(res.ekFør, 2) + " J");
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["hoyde", "nede", "oppe", "ideell"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
