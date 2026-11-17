// Dosert sving: Veien heller vinkelen θ inn mot sentrum. Bilen kjører i en sirkel med radius r.
// Med R positiv nedover langs veibanen (inn mot sentrum):
//   N = m(g cos θ + (v²/r) sin θ),  R = m((v²/r) cos θ − g sin θ).
// Bilen holder seg på veien når |R| ≤ μN.

const G = 9.81;
const FORE = { torr: { navn: "tørr asfalt", mu: 0.8 }, vat: { navn: "våt asfalt", mu: 0.5 }, sno: { navn: "snø", mu: 0.2 }, is: { navn: "is", mu: 0.1 }, ingen: { navn: "uten friksjon", mu: 0 } };

function sving(r, thetaGrader, mu, vKmh, m) {
  const th = thetaGrader * Math.PI / 180, s = Math.sin(th), c = Math.cos(th), v = vKmh / 3.6, ac = v * v / r;
  const N = m * (G * c + ac * s), R = m * (ac * c - G * s);
  const vIdeal = Math.sqrt(r * G * Math.tan(th));
  const nevnerMaks = c - mu * s;
  const vMaks = nevnerMaks > 0 ? Math.sqrt(r * G * (s + mu * c) / nevnerMaks) : Infinity;
  const tellerMin = s - mu * c;
  const vMin = tellerMin > 0 ? Math.sqrt(r * G * tellerMin / (c + mu * s)) : 0;
  // Litt slingringsmonn (1 % av mg), så den ideelle farten kan treffes med glidebryteren også uten friksjon
  const utfall = Math.abs(R) <= mu * N + 0.01 * m * G ? "holder" : R > 0 ? "ut" : "inn";
  return { v, ac, N, R, vIdeal, vMaks, vMin, utfall, th };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("sving");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, r;
  const kmh = (v) => (isFinite(v) ? komma(v * 3.6, 0) + " km/h" : "ingen grense");

  function les() {
    const fo = FORE[Sim.verdi("fore")];
    inn = {
      r: Sim.verdi("radius", (v) => komma(v, 0) + " m"),
      theta: Sim.verdi("vinkel", (v) => komma(v, 0) + "°"),
      v: Sim.verdi("fart", (v) => komma(v, 0) + " km/h"),
      m: 1200, fo,
    };
    r = sving(inn.r, inn.theta, fo.mu, inn.v, inn.m);
    $("r-ideal").textContent = kmh(r.vIdeal);
    $("r-min").textContent = r.vMin > 0 ? kmh(r.vMin) : "ingen grense";
    $("r-maks").textContent = kmh(r.vMaks);
    $("r-a").textContent = komma(r.ac, 2) + " m/s²";
    $("r-n").textContent = komma(r.N / 1000, 2) + " kN";
    $("r-r").textContent = komma(Math.abs(r.R) / 1000, 2) + " kN " + (Math.abs(r.R) < 1 ? "" : r.R > 0 ? "nedover veien" : "oppover veien");
    $("r-rmaks").textContent = komma(fo.mu * r.N / 1000, 2) + " kN";
    $("r-utfall").textContent = r.utfall === "holder" ? "Bilen holder seg på veien." : r.utfall === "ut" ? "For fort: Bilen glir utover og oppover." : "For sakte: Bilen glir innover og nedover.";
    tegn();
  }

  function pil(c, x0, y0, dx, dy, farge, navn, stiplet) {
    const len = Math.hypot(dx, dy); if (len < 3) return;
    const ux = dx / len, uy = dy / len, x1 = x0 + dx, y1 = y0 + dy;
    c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = stiplet ? 2 : 3; c.setLineDash(stiplet ? [6, 4] : []);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 10 - uy * 5, y1 - uy * 10 + ux * 5); c.lineTo(x1 - ux * 10 + uy * 5, y1 - uy * 10 - ux * 5); c.closePath(); c.fill();
    c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ux * 14, y1 + uy * 14);
  }

  function tegn() {
    if (!l.b || !r) return;
    const c = l.ctx, f = l.f;
    l.tom();
    // Tverrsnitt: sentrum av svingen er til venstre. Veien heller ned mot venstre.
    const th = r.th, cx = l.b * 0.55, cy = l.h * 0.62, L = Math.min(l.b * 0.4, 260);
    const dir = [Math.cos(th), -Math.sin(th)];   // oppover langs veien mot høyre på skjermen
    c.fillStyle = f.flate; c.beginPath();
    c.moveTo(cx - dir[0] * L, cy - dir[1] * L); c.lineTo(cx + dir[0] * L, cy + dir[1] * L); c.lineTo(cx + dir[0] * L, l.h); c.lineTo(cx - dir[0] * L, l.h); c.closePath(); c.fill();
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - dir[0] * L, cy - dir[1] * L); c.lineTo(cx + dir[0] * L, cy + dir[1] * L); c.stroke();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("← mot sentrum av svingen (r = " + komma(inn.r, 0) + " m)", 12, 10);
    c.fillText("θ = " + komma(inn.theta, 0) + "°", cx + dir[0] * L * 0.55, cy + dir[1] * L * 0.55 + 10);
    // Bilen sett bakfra
    const bw = 64, bh = 30;
    c.save(); c.translate(cx, cy); c.rotate(-th);
    c.fillStyle = r.utfall === "holder" ? f.f2 : f.f1; c.beginPath(); c.roundRect(-bw / 2, -bh - 6, bw, bh, 5); c.fill();
    c.fillStyle = f.blekk; c.fillRect(-bw / 2 + 4, -8, 12, 8); c.fillRect(bw / 2 - 16, -8, 12, 8);
    c.restore();
    // Kreftene fra tyngdepunktet
    const [gx, gy] = [cx + Math.sin(th) * -(bh / 2 + 6), cy - Math.cos(th) * (bh / 2 + 6)];
    const sk = Math.min(170, l.h * 0.36) / (inn.m * G);
    const nRet = [-Math.sin(th), -Math.cos(th)];   // normalt på veien, oppover
    pil(c, gx, gy, 0, inn.m * G * sk, f.blekk, "G");
    pil(c, gx, gy, nRet[0] * r.N * sk, nRet[1] * r.N * sk, f.f1, "N");
    // Friksjonen virker der hjulene treffer veien
    if (Math.abs(r.R) > 1 && r.utfall === "holder") pil(c, cx + dir[0] * 40, cy + dir[1] * 40 + 2, -dir[0] * r.R * sk, -dir[1] * r.R * sk, f.f2, "R");
    // Summen av kreftene peker vannrett inn mot sentrum
    if (r.utfall === "holder") {
      const sx = Math.min(l.b - 20, gx + 160 + inn.m * r.ac * sk), sy = l.h * 0.14;
      pil(c, sx, sy, -inn.m * r.ac * sk, 0, f.dempet, "", true);
      c.fillStyle = f.dempet; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText("ΣF = mv²/r (vannrett inn mot sentrum)", sx - inn.m * r.ac * sk / 2, sy - 8);
    }
  }

  for (const id of ["radius", "vinkel", "fart", "fore"]) $(id).addEventListener("input", les);
  les();
})();
