// Satellittbaner. En satellitt skytes ut vannrett (vinkelrett på radien) i høyden h over jorda med farten v.
// Banen regnes ut med a = −GM r/r³ (hastighets-Verlet). Banetypen og omløpstiden følger av energien:
// E = ½v² − GM/r. E < 0 gir ellipse med store halvakse a = −GM/(2E) og T = 2π√(a³/GM).

const SA_GM = 6.674e-11 * 5.972e24, SA_R = 6.371e6;

function saBane(r0, v0) {
  // Analytiske størrelser for utskyting vinkelrett på radien
  const E = 0.5 * v0 * v0 - SA_GM / r0, L = r0 * v0;
  const e = Math.sqrt(Math.max(0, 1 + 2 * E * L * L / (SA_GM * SA_GM)));
  if (E >= 0) return { E, e, lukket: false };
  const a = -SA_GM / (2 * E), T = 2 * Math.PI * Math.sqrt(a ** 3 / SA_GM);
  return { E, e, a, T, lukket: true, rp: a * (1 - e), ra: a * (1 + e) };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("sa-scene");
  if (!el) return;
  let h, v, r0, x, y, vx, vy, t, spor, energi, bane, krasj;
  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("sa-graf"), tegnGraf);

  function les() {
    h = Number($("sa-h").value);
    $("sa-h-ut").textContent = Sim.tall(h, 3) + " km";
    r0 = SA_R + h * 1000;
    const vc = Math.sqrt(SA_GM / r0);
    v = vc * Number($("sa-v").value);
    $("sa-v-ut").textContent = komma(v / 1000, 2) + " km/s (" + komma(Number($("sa-v").value) * 100, 0) + " % av sirkelbanefarten)";
  }
  function start() {
    x = r0; y = 0; vx = 0; vy = v; t = 0; spor = [[x, y]]; energi = []; krasj = false;
    bane = saBane(r0, v);
  }
  const acc = (px, py) => { const r3 = Math.hypot(px, py) ** 3; return [-SA_GM * px / r3, -SA_GM * py / r3]; };

  function steg(dtv) {
    // Én omløpstid (eller 6 h for åpne baner) varer omtrent 8 s i animasjonen
    const varighet = bane.lukket ? bane.T : 6 * 3600;
    let igjen = dtv * varighet / 8;
    const n = Math.ceil(igjen / 10);
    const dt = igjen / n;
    for (let i = 0; i < n && !krasj; i++) {
      const [ax, ay] = acc(x, y);
      x += vx * dt + 0.5 * ax * dt * dt; y += vy * dt + 0.5 * ay * dt * dt;
      const [bx, by] = acc(x, y);
      vx += 0.5 * (ax + bx) * dt; vy += 0.5 * (ay + by) * dt; t += dt;
      if (Math.hypot(x, y) < SA_R) krasj = true;
    }
    spor.push([x, y]); if (spor.length > 3000) spor.shift();
    const r = Math.hypot(x, y), ek = 0.5 * (vx * vx + vy * vy), ep = -SA_GM / r;
    energi.push({ t, ek, ep }); if (energi.length > 3000) energi.shift();
    tegn();
    return !krasj && (bane.lukket ? t < 3 * bane.T : Math.hypot(x, y) < 12 * SA_R);
  }
  const avspiller = Sim.avspiller({ knapp: $("sa-start"), steg, nullstill: start, lerret: el });

  function tegn() { tegnScene(); tegnGraf(); tall(); }

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, B = ls.b, H = ls.h;
    ls.tom();
    // Lukket bane: midten av ellipsen midt i bildet. Midten ligger i x = r0 − a fra jordsenteret.
    let sk, cx;
    if (bane.lukket) {
      const bm = bane.a * Math.sqrt(1 - bane.e * bane.e);
      sk = Math.min(B / (2 * 1.06 * bane.a), H / (2 * 1.1 * Math.max(bm, SA_R)));
      cx = B / 2 - (r0 - bane.a) * sk;
    } else { sk = Math.min(B, H) / 2 / Math.max(r0 * 3, 6 * SA_R) * 0.95; cx = B * 0.3; }
    const s = sk, cy = H / 2;
    const P = (px, py) => [cx + px * s, cy - py * s];
    c.fillStyle = f.f2; c.beginPath(); c.arc(cx, cy, SA_R * s, 0, 2 * Math.PI); c.fill();
    c.strokeStyle = f.f1; c.lineWidth = 2; c.beginPath();
    spor.forEach((p, i) => { const [X, Y] = P(...p); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
    const [X, Y] = P(x, y);
    c.fillStyle = krasj ? f.dempet : f.blekk; c.beginPath(); c.arc(X, Y, 5, 0, 2 * Math.PI); c.fill();
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(t / 3600, 2) + " h" + (krasj ? " · traff jorda" : ""), 8, 8);
  }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f;
    lg.tom();
    const tm = Math.max(bane.lukket ? bane.T : 6 * 3600, t) / 3600;
    const Ep0 = -SA_GM / SA_R / 1e6;
    const { px, py } = Sim.akser(lg, { x: [0, tm], y: [Ep0 * 1.05, -Ep0 * 0.9], xTekst: "t / h", yTekst: "energi / (MJ/kg)" });
    for (const [k, farge] of [["ek", f.f1], ["ep", f.f2], ["e", f.blekk]]) {
      c.strokeStyle = farge; c.lineWidth = k === "e" ? 2.5 : 2; c.beginPath();
      energi.forEach((d, i) => { const yv = (k === "e" ? d.ek + d.ep : d[k]) / 1e6; i ? c.lineTo(px(d.t / 3600), py(yv)) : c.moveTo(px(d.t / 3600), py(yv)); });
      c.stroke();
    }
  }

  function tall() {
    const vc = Math.sqrt(SA_GM / r0), ve = Math.sqrt(2 * SA_GM / r0);
    $("sa-vc").textContent = komma(vc / 1000, 2) + " km/s";
    $("sa-ve").textContent = komma(ve / 1000, 2) + " km/s";
    $("sa-E").textContent = komma(bane.E / 1e6, 2) + " MJ/kg";
    $("sa-T").textContent = bane.lukket ? (bane.T < 2 * 86400 ? komma(bane.T / 3600, 2) + " h" : komma(bane.T / 86400, 1) + " døgn") : "ingen (åpen bane)";
    $("sa-type").textContent = !bane.lukket ? (bane.e > 1.0001 ? "hyperbel, slipper unna" : "parabel, slipper akkurat unna") : bane.e < 0.005 ? "sirkel" : bane.rp < SA_R ? "ellipse som treffer jorda" : "ellipse";
    $("sa-hmin").textContent = bane.lukket ? Sim.tall((bane.rp - SA_R) / 1000, 3) + " km" : Sim.tall(h, 3) + " km";
    $("sa-hmaks").textContent = bane.lukket ? Sim.tall((bane.ra - SA_R) / 1000, 3) + " km" : "–";
  }

  function nullstill() { avspiller.stopp(); les(); start(); tegn(); }
  for (const id of ["sa-h", "sa-v"]) $(id).addEventListener("input", nullstill);
  for (const k of document.querySelectorAll("[data-sa]")) k.addEventListener("click", () => { $("sa-h").value = k.dataset.sa; $("sa-v").value = 1; nullstill(); });
  $("sa-nullstill").addEventListener("click", nullstill);
  nullstill();
})();
