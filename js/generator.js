// Generator. En rektangulær spole med N vindinger og arealet A roterer med frekvensen f i et homogent magnetfelt B.
// Fluksen er NΦ = NBA cos(ωt), og den induserte spenningen er ε = NBAω sin(ωt). Med kommutator blir spenningen |ε|.
// Animasjonen går i sakte film når frekvensen er høy, men tallene og grafen bruker virkelig tid.

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("gen-scene");
  if (!el) return;
  let N, B, A, fr, komm, t = 0;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("gen-graf"), tegnGraf);

  function les() {
    fr = Sim.verdi("gen-f", (x) => komma(x, x < 10 ? 1 : 0) + " Hz");
    N = Sim.verdi("gen-n", (x) => komma(x, 0));
    B = Sim.verdi("gen-b", (x) => komma(x, 2) + " T");
    A = Sim.verdi("gen-a", (x) => komma(x, 0) + " cm²") / 1e4;
    komm = $("gen-komm").checked;
  }
  const w = () => 2 * Math.PI * fr;
  const emaks = () => N * B * A * w();
  const eps = (tt) => { const e = emaks() * Math.sin(w() * tt); return komm ? Math.abs(e) : e; };
  const fluks = (tt) => N * B * A * Math.cos(w() * tt);
  // Sakte film: animasjonen viser høyst én omdreining per sekund
  const tempo = () => Math.min(1, 1 / fr);

  function steg(dt) { t += dt * tempo(); tegn(); return true; }
  const avspiller = Sim.avspiller({ knapp: $("gen-start"), steg, lerret: el });

  function tegn() { tegnScene(); tegnGraf(); tall(); }

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, b = ls.b, h = ls.h, cx = b * 0.42, cy = h * 0.5;
    ls.tom();
    // Polene
    const pb = Math.min(b * 0.1, 70), ph = h * 0.62, gap = Math.min(b * 0.28, h * 0.62);
    c.fillStyle = f.f1; c.fillRect(cx - gap - pb, cy - ph / 2, pb, ph);
    c.fillStyle = f.f2; c.fillRect(cx + gap, cy - ph / 2, pb, ph);
    c.fillStyle = "#fff"; c.font = "700 20px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("N", cx - gap - pb / 2, cy); c.fillText("S", cx + gap + pb / 2, cy);
    // Feltlinjer
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([4, 5]);
    for (let k = -2; k <= 2; k++) { const y = cy + k * ph / 5.5; c.beginPath(); c.moveTo(cx - gap, y); c.lineTo(cx + gap, y); c.stroke(); }
    c.setLineDash([]);
    // Spolen: et rektangel som roterer om en loddrett akse. Normalen n = (cos θ, sin θ), θ = ωt.
    const th = w() * t, bredde = gap * 0.75, hoyde = ph * 0.6;
    const ux = -Math.sin(th), uy = Math.cos(th);           // retning i spoleplanet, vannrett
    const proj = (x, y, z) => [cx + x + 0.35 * y, cy - z + 0.22 * y];
    const hj = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, k]) => proj(a * ux * bredde / 2, a * uy * bredde / 2, k * hoyde / 2));
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, cy - h * 0.46); c.lineTo(cx, cy + h * 0.46); c.stroke();
    const e = eps(t);
    c.strokeStyle = Math.abs(e) > 0.02 * emaks() ? f.f1 : f.blekk; c.lineWidth = 4; c.lineJoin = "round";
    c.beginPath(); hj.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
    c.fillStyle = f.f1; c.globalAlpha = 0.08; c.fill(); c.globalAlpha = 1;
    // Normalvektoren
    const [nx0, ny0] = proj(0, 0, 0), [nx1, ny1] = proj(Math.cos(th) * bredde * 0.5, Math.sin(th) * bredde * 0.5, 0);
    c.strokeStyle = f.f2; c.lineWidth = 2; c.beginPath(); c.moveTo(nx0, ny0); c.lineTo(nx1, ny1); c.stroke();
    c.fillStyle = f.f2; c.font = "italic 13px " + Sim.SANS; c.fillText("n", nx1 + 8, ny1 - 6);
    // Lyspære
    const lx = b * 0.88, ly = cy, rl = Math.min(26, h * 0.1), lys = Math.min(1, Math.abs(e) / 12);
    c.fillStyle = "#ffd23f"; c.globalAlpha = 0.12 + 0.88 * lys; c.beginPath(); c.arc(lx, ly, rl, 0, 2 * Math.PI); c.fill();
    c.globalAlpha = 1; c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textBaseline = "top";
    c.fillText("lyspære", lx, ly + rl + 6);
    c.textAlign = "left";
    c.fillText(fr > 1 ? "Sakte film: " + komma(1 / tempo(), 0) + " ganger langsommere" : "Sanntid", 10, 8);
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f, T = 1 / fr;
    lg.tom();
    const em = Math.max(0.1, emaks()) * 1.15, t1 = 2 * T;
    const { px, py } = Sim.akser(lg, { x: [0, t1], y: [komm ? -em * 0.2 : -em, em], xTekst: "t / s", yTekst: "ε / V" });
    const n = 300, fm = N * B * A || 1;
    c.strokeStyle = f.f2; c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath();
    for (let i = 0; i <= n; i++) { const tt = t1 * i / n, y = py(fluks(tt) / fm * em * 0.85); i ? c.lineTo(px(tt), y) : c.moveTo(px(tt), y); }
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= n; i++) { const tt = t1 * i / n; i ? c.lineTo(px(tt), py(eps(tt))) : c.moveTo(px(tt), py(eps(tt))); }
    c.stroke();
    const tm = t % t1;
    c.fillStyle = f.blekk; c.beginPath(); c.arc(px(tm), py(eps(tm)), 5, 0, 2 * Math.PI); c.fill();
  }

  function tall() {
    $("gen-emaks").textContent = Sim.tall(emaks(), 3) + " V";
    $("gen-eeff").textContent = Sim.tall(komm ? emaks() / Math.sqrt(2) : emaks() / Math.sqrt(2), 3) + " V";
    $("gen-phi").textContent = Sim.tall(N * B * A * 1000, 3) + " mWb";
    $("gen-T").textContent = Sim.tall(1 / fr * 1000, 3) + " ms";
    $("gen-e").textContent = komma(eps(t), 2) + " V";
  }

  for (const id of ["gen-f", "gen-n", "gen-b", "gen-a", "gen-komm"]) $(id).addEventListener("input", () => { les(); tegn(); });
  $("gen-nullstill").addEventListener("click", () => { avspiller.stopp(); t = 0; tegn(); });
  les(); tegn();
})();
