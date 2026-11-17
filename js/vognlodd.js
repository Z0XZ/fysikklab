// Vogn trukket av lodd: En vogn med massen M på et vannrett bord er festet i en snor over en trinse
// til et lodd med massen m. Snora og trinsa er masseløse. Friksjonen på vogna er μ·M·g.
// a = (mg − μMg) / (M + m) og snorkraften S = m(g − a).

const G = 9.81, STREKNING = 0.80;

function vognLodd(M, m, mu) {
  const drivende = m * G - mu * M * G;
  const a = drivende > 0 ? drivende / (M + m) : 0;
  const S = m * (G - a);
  const t = a > 0 ? Math.sqrt(2 * STREKNING / a) : Infinity;
  return { a, S, t, v: a * t, R: a > 0 ? mu * M * G : m * G, rolig: a === 0 };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("vognlodd");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("vlgraf"), tegn);
  let inn, r, tid = 0;

  function les() {
    inn = {
      M: Sim.verdi("vogn", (v) => komma(v * 1000, 0) + " g"),
      m: Sim.verdi("lodd", (v) => komma(v * 1000, 0) + " g"),
      mu: Sim.verdi("friksjon", (v) => (v === 0 ? "ingen" : "μ = " + komma(v, 2))),
    };
    r = vognLodd(inn.M, inn.m, inn.mu);
  }
  const slutt = () => (isFinite(r.t) ? r.t : 2);
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(slutt(), tid + dt * Number($("tempo").value)); oppdater(); return tid < slutt(); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const s = (t) => 0.5 * r.a * t * t;

  function pil(c, x0, y0, x1, y1, farge, navn) {
    const len = Math.hypot(x1 - x0, y1 - y0); if (len < 3) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, h = 8;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ux * 14 + (Math.abs(ux) < 0.3 ? 12 : 0), y1 + uy * 14);
  }

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const smal = l.b < 560;
    const bordY = l.h * 0.3, kant = l.b * (smal ? 0.72 : 0.62), sk = Math.min((kant - 40) / 1.3, (l.h - 20 - (bordY - 8 + 40 + 30)) / STREKNING);
    const xs = s(tid), vognX = kant - 30 - (STREKNING + 0.25) * sk + xs * sk, vB = 80, vH = 34;
    c.fillStyle = f.flate; c.fillRect(10, bordY, kant - 10, 14);
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.strokeRect(10, bordY, kant - 10, 14);
    c.beginPath(); c.moveTo(kant - 20, bordY + 14); c.lineTo(kant - 20, l.h - 10); c.stroke();
    c.beginPath(); c.moveTo(0, l.h - 10); c.lineTo(l.b, l.h - 10); c.stroke();
    // Trinse
    const tx = kant + 8, ty = bordY - 8;
    c.beginPath(); c.arc(tx, ty, 10, 0, 2 * Math.PI); c.stroke();
    // Vogn
    c.fillStyle = f.f2; c.fillRect(vognX, bordY - vH - 6, vB, vH);
    c.fillStyle = f.blekk; for (const k of [0.22, 0.78]) { c.beginPath(); c.arc(vognX + vB * k, bordY - 4, 5, 0, 2 * Math.PI); c.fill(); }
    c.fillStyle = f.papir; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("M", vognX + vB / 2, bordY - vH / 2 - 6);
    // Snor og lodd
    const loddY = ty + 40 + xs * sk;
    c.strokeStyle = f.dempet; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(vognX + vB, ty - 10 + 0); c.lineTo(tx, ty - 10); c.arc(tx, ty, 10, -Math.PI / 2, 0); c.lineTo(tx + 10, loddY); c.stroke();
    c.fillStyle = f.f1; c.fillRect(tx + 10 - 14, loddY, 28, 30);
    c.fillStyle = f.papir; c.fillText("m", tx + 10, loddY + 15);
    // Krefter
    const kSk = 70 / Math.max(inn.m * G, r.S, 0.01);
    pil(c, vognX + vB + 2, bordY - vH / 2 - 6, vognX + vB + 2 + r.S * kSk, bordY - vH / 2 - 6, f.dempet, "S");
    if (inn.mu > 0) pil(c, vognX - 2, bordY - 10, vognX - 2 - r.R * kSk, bordY - 10, f.f2, "R");
    pil(c, tx + 10, loddY + 30, tx + 10, loddY + 30 + inn.m * G * kSk, f.blekk, "G");
    pil(c, tx + 10, loddY, tx + 10, loddY - r.S * kSk, f.dempet, "S");
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s   s = " + komma(xs * 100, 1) + " cm", 12, 8);
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const T = slutt();
    const { px, py } = Sim.akser(l, { x: [0, T * 1.05], y: [0, Math.max(0.5, r.a * T * 1.1)], xTekst: "t / s", yTekst: "v / (m/s)" });
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(tid), py(r.a * tid)); c.stroke();
  }

  function tegn() { if (!r) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    $("r-a").textContent = komma(r.a, 3) + " m/s²";
    $("r-s").textContent = komma(r.S, 3) + " N";
    $("r-g").textContent = komma(inn.m * G, 3) + " N";
    $("r-v").textContent = komma(r.a * tid, 2) + " m/s";
    $("r-t").textContent = r.rolig ? "står i ro" : tid >= r.t ? komma(r.t, 2) + " s" : "?";
    tegn();
  }

  for (const id of ["vogn", "lodd", "friksjon"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
