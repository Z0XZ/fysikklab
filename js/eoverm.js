// e/m for elektronet: Elektronene akselereres gjennom spenningen U og går inn i et homogent magnetfelt
// fra to Helmholtz-spoler. Banen er en sirkel med r = √(2mU/e) / B, der B = (4/5)^(3/2) · μ0 N I / R.
// Røret er en glasskule med radius 8 cm. Elektronkanonen sitter nederst og skyter elektronene mot høyre.
// Målestaven har merker for banediameteren fra 2 til 12 cm.

const EM_E = 1.602176634e-19, EM_ME = 9.1093837e-31, EM_MU0 = 4e-7 * Math.PI;
const SPOLE = { N: 130, R: 0.150 };              // vindinger og radius, som i mange skoleapparater
const ROR_R = 0.080, KANON_Y = -0.065;          // m
const feltPerAmpere = () => (4 / 5) ** 1.5 * EM_MU0 * SPOLE.N / SPOLE.R;
function banen(U, I) {
  const B = feltPerAmpere() * I, v = Math.sqrt(2 * EM_E * U / EM_ME);
  return { B, v, r: B > 0 ? EM_ME * v / (EM_E * B) : Infinity };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("eoverm");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let tilstand;

  function les() {
    const U = Sim.verdi("em-u", (v) => v + " V"), I = Sim.verdi("em-i", (v) => komma(v, 2) + " A");
    tilstand = { U, I, ...banen(U, I), vis: $("em-vis").checked };
    $("em-b").textContent = komma(tilstand.B * 1000, 3) + " mT";
    $("em-d").textContent = !tilstand.vis ? "skjult" : 2 * tilstand.r < 0.145 ? komma(200 * tilstand.r, 1) + " cm" : "treffer glasset";
    tegn();
  }

  function tegn() {
    if (!l.b || !tilstand) return;
    const c = l.ctx, f = l.f, { b, h } = l;
    l.tom();
    const s = Math.min(b, h) / 0.36, ox = b / 2, oy = h / 2 + 0.005 * s;
    const P = (x, y) => [ox + x * s, oy - y * s];
    // Helmholtz-spolene sett forfra: en ring rundt røret
    c.strokeStyle = f.f2; c.globalAlpha = 0.35; c.lineWidth = Math.max(6, 0.012 * s);
    c.beginPath(); c.arc(ox, oy, SPOLE.R * s, 0, 2 * Math.PI); c.stroke(); c.globalAlpha = 1;
    // Magnetfeltet ut av planet (⊙)
    c.fillStyle = f.dempet; c.strokeStyle = f.dempet; c.lineWidth = 1;
    for (const [x, y] of [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.1], [0.12, -0.1], [-0.135, 0], [0.135, 0]]) {
      const [X, Y] = P(x, y); c.beginPath(); c.arc(X, Y, 6, 0, 2 * Math.PI); c.stroke(); c.beginPath(); c.arc(X, Y, 1.8, 0, 2 * Math.PI); c.fill();
    }
    // Glasskula
    c.fillStyle = f.flate; c.strokeStyle = f["rute-sterk"]; c.lineWidth = 2;
    c.beginPath(); c.arc(ox, oy, ROR_R * s, 0, 2 * Math.PI); c.fill(); c.stroke();
    // Målestaven med merker for diameteren
    const [sx, sy0] = P(0, KANON_Y), [, sy1] = P(0, KANON_Y + 0.13);
    c.strokeStyle = f.dempet; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx, sy0); c.lineTo(sx, sy1); c.stroke();
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.textAlign = "right"; c.textBaseline = "middle";
    for (let d = 2; d <= 12; d += 2) {
      const [, Y] = P(0, KANON_Y + d / 100);
      c.beginPath(); c.moveTo(sx - 7, Y); c.lineTo(sx + 7, Y); c.stroke();
      c.fillText(String(d), sx - 10, Y);
    }
    for (let d = 1; d <= 12; d += 2) { const [, Y] = P(0, KANON_Y + d / 100); c.beginPath(); c.moveTo(sx - 3, Y); c.lineTo(sx + 3, Y); c.stroke(); }
    c.textAlign = "left"; c.fillText("d / cm", sx + 10, sy1);
    // Elektronkanonen
    const [kx, ky] = P(0, KANON_Y);
    c.fillStyle = f.blekk; c.fillRect(kx - 0.03 * s, ky - 5, 0.03 * s, 10);
    // Strålen: sirkel med sentrum rett over kanonen, klippet mot glasset
    c.save();
    c.beginPath(); c.arc(ox, oy, ROR_R * s - 2, 0, 2 * Math.PI); c.clip();
    c.strokeStyle = f.f1; c.lineCap = "round";
    for (const [bredde, alfa] of [[9, 0.15], [5, 0.3], [2.2, 1]]) {
      c.lineWidth = bredde; c.globalAlpha = alfa; c.beginPath();
      if (!isFinite(tilstand.r) || tilstand.r > 2) { c.moveTo(kx, ky); c.lineTo(kx + 0.2 * s, ky); }
      else {
        // Følg sirkelen til den treffer glasset eller går hele runden
        const r = tilstand.r;
        c.moveTo(kx, ky);
        for (let i = 1; i <= 400; i++) {
          const fi = i / 400 * 2 * Math.PI, x = r * Math.sin(fi), y = KANON_Y + r - r * Math.cos(fi);
          if (Math.hypot(x, y) > ROR_R) { c.lineTo(...P(x, y)); break; }
          c.lineTo(...P(x, y));
        }
      }
      c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
    // Tekst
    c.fillStyle = f.dempet; c.font = "12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("B ut av planet (⊙)", 8, 8);
    c.textAlign = "right"; c.fillText(`Helmholtz-spoler: N = ${SPOLE.N}, R = ${komma(SPOLE.R * 100, 1)} cm`, b - 8, 8);
    c.textBaseline = "bottom"; c.fillText("elektronkanon", kx - 0.035 * s, ky + 18);
  }

  for (const id of ["em-u", "em-i", "em-vis"]) $(id).addEventListener("input", les);
  les();
})();
