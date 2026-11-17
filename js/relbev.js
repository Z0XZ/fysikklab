// Konstant kraft og lysfarten: Et legeme skyves med konstant kraft F fra ro.
// Impulsen gir bevegelsesmengden både klassisk og relativistisk: p = F · t.
// Klassisk: v = p/m, Eₖ = ½mv². Relativistisk: p = γmv gir v = pc / √(p² + m²c²), og Eₖ = (γ − 1)mc².
// Tiden måles i enheten t_c = mc/F, tiden det ville tatt å nå lysfarten klassisk.

const C = 2.998e8;
const LEGEMER = {
  elektron: { navn: "elektron", m: 9.109e-31, F: 1.0e-15 },
  proton: { navn: "proton", m: 1.673e-27, F: 1.0e-12 },
  romskip: { navn: "romskip på 50 tonn", m: 5.0e4, F: 1.0e6 },
};

function tilstand(m, F, t) {
  const p = F * t, x = p / (m * C);                 // x = p/(mc)
  const g = Math.sqrt(1 + x * x);                    // γ = √(1 + (p/mc)²)
  return { p, g, vRel: C * x / g, vKl: p / m, ekRel: (g - 1) * m * C * C, ekKl: 0.5 * p * p / m, E: g * m * C * C };
}
const gammaAv = (b) => 1 / Math.sqrt(1 - b * b);

(function () {
  const $ = Sim.$, komma = Sim.komma, tall = Sim.tall;
  const el = $("fart");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("pgraf"), tegn);
  let inn, tid = 0;   // tid i enheten t_c
  const TMAKS = 5;

  const tidTekst = (s) => (s >= 3.156e7 * 0.5 ? komma(s / 3.156e7, 2) + " år" : s >= 1 ? komma(s, 2) + " s" : s >= 1e-3 ? komma(s * 1e3, 2) + " ms" : s >= 1e-7 ? komma(s * 1e6, 3) + " µs" : komma(s * 1e9, 3) + " ns");

  function les() {
    const l = LEGEMER[Sim.verdi("legeme")];
    const Fin = parseFloat(String($("kraft").value).replace(",", "."));
    inn = { l, m: l.m, F: isFinite(Fin) && Fin > 0 ? Fin : l.F };
    inn.tc = inn.m * C / inn.F;
  }
  function nullstill(beholdTid) { avspiller.stopp(); les(); if (!beholdTid) tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(TMAKS, tid + dt * 0.5 * Number($("tempo").value)); $("tid").value = tid; oppdater(); return tid < TMAKS; }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill: () => nullstill(false), lerret: el });

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f, smal = l.b < 560;
    l.tom();
    const s = tilstand(inn.m, inn.F, tid * inn.tc);
    const x0 = smal ? 90 : 150, b = l.b - x0 - 30, maksV = 3;   // fartsmålerne går til 3c
    const X = (v) => x0 + Math.min(v / C, maksV) / maksV * b;
    const rader = [["klassisk, v = p/m", s.vKl, f.dempet], ["relativistisk", s.vRel, f.f1]];
    rader.forEach(([navn, v, farge], k) => {
      const y = 30 + k * (l.h - 60) / 2 + 10, h = Math.min(30, l.h / 5);
      c.fillStyle = f.flate; c.fillRect(x0, y, b, h);
      c.fillStyle = farge; c.fillRect(x0, y, X(v) - x0, h);
      if (v / C > maksV) { c.fillStyle = farge; c.font = "600 14px " + Sim.SANS; c.textAlign = "right"; c.textBaseline = "middle"; c.fillText("→", x0 + b + 18, y + h / 2); }
      c.fillStyle = f.blekk; c.font = "600 12px " + Sim.SANS; c.textAlign = "right"; c.textBaseline = "middle";
      c.fillText(navn, x0 - 10, y + h / 2);
      c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top"; c.fillStyle = f.dempet;
      c.fillText("v = " + komma(v / C, 4) + "c", x0 + 4, y + h + 4);
    });
    // Lysfarten
    c.strokeStyle = f.f2; c.lineWidth = 2; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(X(C), 14); c.lineTo(X(C), l.h - 10); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.f2; c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top"; c.fillText("c", X(C) + 5, 8);
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.fillText("t = " + komma(tid, 2) + " · mc/F = " + tidTekst(tid * inn.tc), l.b - 8, 8);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const valg = Sim.verdi("graf"), s = tilstand(inn.m, inn.F, tid * inn.tc);
    if (valg === "vt") {
      const { px, py } = Sim.akser(l, { x: [0, TMAKS], y: [0, 2], xTekst: "t / (mc/F)", yTekst: "v / c" });
      c.strokeStyle = f.f2; c.setLineDash([6, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(0), py(1)); c.lineTo(px(TMAKS), py(1)); c.stroke(); c.setLineDash([]);
      for (const [fn, farge] of [[(t) => Math.min(2, t), f.dempet], [(t) => t / Math.sqrt(1 + t * t), f.f1]]) {
        c.strokeStyle = farge; c.lineWidth = 2.5; c.beginPath();
        for (let i = 0; i <= 200; i++) { const t = tid * i / 200; i ? c.lineTo(px(t), py(fn(t))) : c.moveTo(px(t), py(fn(t))); }
        c.stroke();
      }
      return;
    }
    // p eller Eₖ mot fart, som figur 4-17 og 4-18 i Kraft 2. Enheter: mc og mc².
    const p = valg === "pv";
    const { px, py } = Sim.akser(l, { x: [0, 1.6], y: [0, p ? 5 : 3], xTekst: "v / c", yTekst: p ? "p / (mc)" : "Eₖ / (mc²)" });
    c.strokeStyle = f.f2; c.setLineDash([6, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(1), py(0)); c.lineTo(px(1), py(p ? 5 : 3)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = f.dempet; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 160; i++) { const b = i / 100; const y = p ? b : 0.5 * b * b; i ? c.lineTo(px(b), py(y)) : c.moveTo(px(b), py(y)); }
    c.stroke();
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath(); let start = true;
    for (let i = 0; i < 1000; i++) { const b = i / 1000, g = gammaAv(b), y = p ? g * b : g - 1; if (y > (p ? 5 : 3)) break; start ? c.moveTo(px(b), py(y)) : c.lineTo(px(b), py(y)); start = false; }
    c.stroke();
    // Punktet for legemet nå (relativistisk)
    const b = s.vRel / C, y = p ? s.g * b : s.g - 1;
    if (y <= (p ? 5 : 3)) { c.fillStyle = f.f1; c.beginPath(); c.arc(px(b), py(y), 5, 0, 2 * Math.PI); c.fill(); }
  }

  function tegn() { if (!inn) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const s = tilstand(inn.m, inn.F, tid * inn.tc);
    $("r-tc").textContent = tidTekst(inn.tc);
    $("r-t").textContent = tidTekst(tid * inn.tc);
    $("r-p").textContent = tall(s.p, 3) + " kg m/s";
    $("r-vkl").textContent = komma(s.vKl / C, 3) + "c";
    $("r-vrel").textContent = komma(s.vRel / C, s.vRel / C > 0.999 ? 5 : 3) + "c";
    $("r-g").textContent = komma(s.g, 3);
    $("r-ek").textContent = tall(s.ekRel, 3) + " J";
    $("r-ekkl").textContent = tall(s.ekKl, 3) + " J";
    $("r-e0").textContent = tall(inn.m * C * C, 3) + " J";
    tegn();
  }

  $("legeme").addEventListener("input", () => { $("kraft").value = String(LEGEMER[Sim.verdi("legeme")].F).replace(".", ","); nullstill(false); });
  $("kraft").addEventListener("input", () => nullstill(true));
  $("tid").addEventListener("input", () => { avspiller.stopp(); tid = Number($("tid").value); oppdater(); });
  $("graf").addEventListener("input", tegn);
  $("kraft").value = "1e-12";
  nullstill(false);
})();
