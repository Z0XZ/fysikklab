// Lys som bøyes av tyngdekraften. En lysstråle fra en fjern stjerne passerer et massivt legeme i avstanden b.
// Generell relativitetsteori gir avbøyningsvinkelen α = 4GM/(c²b) (svakt felt). En newtonsk «lyspartikkel» gir halvparten.
// Tegningen forstørrer vinkelen så den synes.

const LA_G = 6.674e-11, LA_C = 2.998e8, LA_MSOL = 1.989e30;
const LA_LEGEMER = {
  jorda: { navn: "Jorda", M: 5.972e24, R: 6.371e6 },
  sola: { navn: "Sola", M: LA_MSOL, R: 6.957e8 },
  dverg: { navn: "Hvit dverg", M: LA_MSOL, R: 6.4e6 },
  noytron: { navn: "Nøytronstjerne", M: 1.4 * LA_MSOL, R: 1.2e4 },
  hull: { navn: "Svart hull", M: 10 * LA_MSOL, R: 2 * LA_G * 10 * LA_MSOL / LA_C ** 2 },
};
const laAlfa = (M, b) => 4 * LA_G * M / (LA_C * LA_C * b);
const laBue = (rad) => rad * 180 / Math.PI * 3600;

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("la-scene");
  if (!el) return;
  let leg, bR;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("la-graf"), tegnGraf);

  function les() {
    leg = LA_LEGEMER[$("la-legeme").value];
    const min = $("la-legeme").value === "hull" ? 3 : 1;
    $("la-b").min = min; if (Number($("la-b").value) < min) $("la-b").value = min;
    bR = Sim.verdi("la-b", (x) => komma(x, 1) + (leg === LA_LEGEMER.hull ? " · Schwarzschild-radien" : " · radien"));
  }
  const vinkelTekst = (rad) => {
    const s = laBue(rad);
    return s < 1 ? Sim.tall(s, 3) + "″" : s < 3600 ? komma(s, s < 100 ? 2 : 0) + "″" : komma(rad * 180 / Math.PI, 1) + "°";
  };

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, B = ls.b, H = ls.h;
    ls.tom();
    const b = bR * leg.R, a = laAlfa(leg.M, b);
    // Forstørring: vis vinkelen som minst 6°
    const aVis = Math.min(Math.max(a, 6 * Math.PI / 180), 18 * Math.PI / 180), forst = aVis / a;
    const mx = B * 0.42, my = H * 0.7, rpx = Math.min(H * 0.16, 40), bpx = rpx * Math.min(bR, 6) * 0.9 + rpx * 0.4;
    // Legemet
    c.fillStyle = leg === LA_LEGEMER.hull ? "#000" : leg === LA_LEGEMER.jorda ? f.f2 : "#f4b400";
    c.beginPath(); c.arc(mx, my, rpx, 0, 2 * Math.PI); c.fill();
    if (leg === LA_LEGEMER.hull) { c.strokeStyle = f.dempet; c.setLineDash([3, 3]); c.beginPath(); c.arc(mx, my, rpx * 1.5, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]); }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "top"; c.fillText(leg.navn, mx, my + rpx + 6);
    // Strålen: rett inn, knekk ved legemet, rett ut mot observatøren
    const yRay = my - bpx, ox = B * 0.92;
    const oy = yRay + Math.tan(aVis) * (ox - mx);
    const sx = B * 0.04;
    c.strokeStyle = "#e0a400"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx, yRay); c.lineTo(mx, yRay); c.lineTo(ox, oy); c.stroke();
    // Tilsynelatende retning (forlengelse bakover av strålen observatøren ser)
    const yTil = oy - Math.tan(aVis) * (ox - sx);
    c.strokeStyle = f.f1; c.setLineDash([6, 5]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(ox, oy); c.lineTo(sx, yTil); c.stroke(); c.setLineDash([]);
    // Stjernen der den egentlig er, og der den ser ut til å være
    const stjerne = (x, y, farge, tekst) => { c.fillStyle = farge; c.beginPath(); c.arc(x, y, 6, 0, 2 * Math.PI); c.fill(); c.font = "12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(tekst, x + 10, y); };
    stjerne(sx, yRay, "#e0a400", "stjernen");
    stjerne(sx, yTil, f.f1, "ser ut til å være her");
    // Observatøren
    c.fillStyle = f.f2; c.beginPath(); c.arc(ox, oy, 7, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top"; c.fillText("observatør", ox, oy + 10);
    c.textAlign = "left"; c.textBaseline = "bottom"; c.fillStyle = f.dempet;
    c.fillText(forst > 1.5 ? "Vinkelen er forstørret " + Sim.tall(forst, 2) + " ganger" : forst < 0.95 ? "Vinkelen er tegnet mindre enn den er" : "Vinkelen er tegnet i riktig størrelse", 8, H - 6);
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f;
    lg.tom();
    const min = Number($("la-b").min), maks = 20;
    const ymaks = laBue(laAlfa(leg.M, min * leg.R)) * 1.1;
    const deg = ymaks > 36000, sk = deg ? 1 / 3600 : 1;
    const { px, py } = Sim.akser(lg, { x: [0, maks], y: [0, ymaks * sk], xTekst: "b / R", yTekst: deg ? "α / grader" : "α / buesekunder" });
    for (const [faktor, farge, stipl] of [[1, f.f1, false], [0.5, f.f2, true]]) {
      c.strokeStyle = farge; c.lineWidth = 2; c.setLineDash(stipl ? [5, 4] : []); c.beginPath();
      for (let i = 0; i <= 200; i++) { const x = min + (maks - min) * i / 200, y = faktor * laBue(laAlfa(leg.M, x * leg.R)) * sk; i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)); }
      c.stroke();
    }
    c.setLineDash([]);
    c.fillStyle = f.blekk; c.beginPath(); c.arc(px(bR), py(laBue(laAlfa(leg.M, bR * leg.R)) * sk), 5, 0, 2 * Math.PI); c.fill();
  }

  function tall() {
    const b = bR * leg.R, a = laAlfa(leg.M, b), rs = 2 * LA_G * leg.M / LA_C ** 2;
    $("la-alfa").textContent = vinkelTekst(a);
    $("la-newton").textContent = vinkelTekst(a / 2);
    $("la-rs").textContent = rs < 1 ? komma(rs * 1000, 1) + " mm" : rs < 1e4 ? komma(rs, 0) + " m" : komma(rs / 1000, 1) + " km";
    $("la-bkm").textContent = Sim.tall(b / 1000, 3) + " km";
    $("la-svak").textContent = rs / b > 0.1 ? "Nei, formelen gjelder ikke så nær" : "Ja";
  }

  function oppdater() { les(); tegnScene(); tegnGraf(); tall(); }
  $("la-legeme").addEventListener("input", oppdater);
  $("la-b").addEventListener("input", oppdater);
  oppdater();
})();
