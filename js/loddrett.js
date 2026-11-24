// Vertikal sirkelbevegelse: en ball i snor eller en vogn på innsiden av en loop. θ måles fra bunnen.
// Mens snora er stram: S = m v²/r + m g cos θ. Blir S negativ, går ballen over i et kast,
// og snora strammes igjen når ballen er like langt fra sentrum som snorlengden.

const G = 9.81;

function sving(r, vb, m) {
  const dt = 0.0005, data = [];
  let th = 0, w = vb / r, fri = false, x = 0, y = -r, vx = vb, vy = 0, t = 0, slakk = null, toppen = null;
  for (let i = 0; t < 6; i++, t = i * dt) {
    let S;
    if (!fri) {
      S = m * r * w * w + m * G * Math.cos(th);
      if (S < 0) {
        fri = true; slakk = slakk || { th, t, v: Math.abs(w) * r };
        x = r * Math.sin(th); y = -r * Math.cos(th); vx = w * r * Math.cos(th); vy = w * r * Math.sin(th);
        S = 0;
      }
    } else S = 0;
    const v = fri ? Math.hypot(vx, vy) : Math.abs(w) * r;
    const px = fri ? x : r * Math.sin(th), py = fri ? y : -r * Math.cos(th);
    if (i % 10 === 0) data.push({ t, x: px, y: py, S, v, fri });
    if (!fri && toppen === null && th >= Math.PI) toppen = { v, S };
    if (!fri) {
      // θ'' = −(g/r) sin θ, integrert med halvsteg (stabil for svingninger)
      w += -(G / r) * Math.sin(th) * dt; th += w * dt;
    } else {
      vy -= G * dt; x += vx * dt; y += vy * dt;
      if (Math.hypot(x, y) >= r) {
        // Snora strammes: den radielle farten forsvinner
        const ux = x / Math.hypot(x, y), uy = y / Math.hypot(x, y), vt = -vx * uy + vy * ux;
        th = Math.atan2(x, -y); w = vt / r; fri = false;
        data.push({ t, x, y, S: 0, v: Math.abs(vt), fri: false, rykk: true });
        break;
      }
    }
  }
  return { data, slakk, toppen, vMin: Math.sqrt(5 * G * r), Sbunn: m * vb * vb / r + m * G };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("loop");
  if (!el) return;
  const scene = Sim.lerret(el, tegn), graf = Sim.lerret($("loopgraf"), tegn);
  let inn, s, tid = 0;

  function les() {
    inn = {
      modus: Sim.verdi("modus"),
      r: Sim.verdi("radius", (v) => komma(v, 1) + " m"),
      vb: Sim.verdi("fart", (v) => komma(v, 1) + " m/s"),
      m: Sim.verdi("masse", (v) => komma(v, 1) + " kg"),
    };
    s = sving(inn.r, inn.vb, inn.m);
  }
  const slutt = () => s.data[s.data.length - 1].t;
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) { tid = Math.min(slutt(), tid + dt * Number($("tempo").value)); oppdater(); return tid < slutt(); }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => s.data[Math.min(s.data.length - 1, Math.round(tid / 0.005))];
  const kraftNavn = () => (inn.modus === "snor" ? "S" : "N");

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const cx = l.b * 0.32, cy = l.h / 2, R = Math.min(l.h * 0.4, l.b * 0.28);
    const sk = R / inn.r, X = (x) => cx + x * sk, Y = (y) => cy - y * sk;
    c.strokeStyle = inn.modus === "snor" ? f.rute : f.blekk; c.lineWidth = inn.modus === "snor" ? 1.5 : 4;
    if (inn.modus === "snor") c.setLineDash([5, 5]);
    c.beginPath(); c.arc(cx, cy, R, 0, 2 * Math.PI); c.stroke(); c.setLineDash([]);
    const d = nå();
    // Sporet så langt
    c.strokeStyle = f.f1; c.globalAlpha = 0.5; c.lineWidth = 2; c.beginPath();
    for (const p of s.data) { if (p.t > tid) break; p.t ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)); }
    c.stroke(); c.globalAlpha = 1;
    if (inn.modus === "snor") {
      c.strokeStyle = f.blekk; c.lineWidth = 1.5;
      if (d.fri) {
        // Slakk snor: tegn den som en bøyd linje
        const mx = (cx + X(d.x)) / 2, my = (cy + Y(d.y)) / 2 + 14;
        c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(mx, my, X(d.x), Y(d.y)); c.stroke();
      } else { c.beginPath(); c.moveTo(cx, cy); c.lineTo(X(d.x), Y(d.y)); c.stroke(); }
    }
    c.fillStyle = f.blekk; c.beginPath(); c.arc(cx, cy, 4, 0, 2 * Math.PI); c.fill();
    c.fillStyle = d.fri ? f.f1 : f.f2; c.beginPath(); c.arc(X(d.x), Y(d.y), 10, 0, 2 * Math.PI); c.fill();
    // Kraftpil mot sentrum og tyngde
    const kSk = 50 / (inn.m * G), ux = -d.x / inn.r, uy = -d.y / inn.r;
    const pil = (x0, y0, dx, dy, farge, navn) => {
      const len = Math.hypot(dx, dy); if (len < 3) return;
      const ex = dx / len, ey = dy / len, x1 = x0 + dx, y1 = y0 + dy;
      c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ex * 6, y1 - ey * 6); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ex * 10 - ey * 5, y1 - ey * 10 + ex * 5); c.lineTo(x1 - ex * 10 + ey * 5, y1 - ey * 10 - ex * 5); c.closePath(); c.fill();
      c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(navn, x1 + ex * 14, y1 + ey * 14);
    };
    pil(X(d.x), Y(d.y), 0, inn.m * G * kSk, f.blekk, "G");
    if (d.S > 0) pil(X(d.x), Y(d.y), ux * Math.min(d.S * kSk, R * 0.9), -uy * Math.min(d.S * kSk, R * 0.9), f.f2, kraftNavn());
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", 10, 8);
    if (d.fri) { c.fillStyle = f.f1; c.fillText(inn.modus === "snor" ? "Snora er slakk!" : "Vogna har sluppet banen!", 10, 26); }
  }

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    const { px, py } = Sim.akser(l, { x: [0, Math.max(0.5, slutt())], y: [0, s.Sbunn * 1.1], xTekst: "t / s", yTekst: kraftNavn() + " / N" });
    c.strokeStyle = f.dempet; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(px(0), py(inn.m * G)); c.lineTo(px(slutt()), py(inn.m * G)); c.stroke(); c.setLineDash([]);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("mg", px(slutt()) - 4, py(inn.m * G) - 2);
    c.strokeStyle = f.f2; c.lineWidth = 2.5; c.beginPath();
    for (const p of s.data) { if (p.t > tid) break; p.t ? c.lineTo(px(p.t), py(p.S)) : c.moveTo(px(p.t), py(p.S)); }
    c.stroke();
  }

  function tegn() { if (!s) return; if (scene.b) tegnScene(); if (graf.b) tegnGraf(); }

  function oppdater() {
    const d = nå(), n = kraftNavn();
    $("r-v").textContent = komma(d.v, 2) + " m/s";
    $("r-s").textContent = komma(d.S, 1) + " N";
    $("r-sbunn").textContent = komma(s.Sbunn, 1) + " N";
    $("r-vmin").textContent = komma(s.vMin, 2) + " m/s";
    $("r-topp").textContent = s.toppen ? `v = ${komma(s.toppen.v, 2)} m/s, ${n} = ${komma(s.toppen.S, 1)} N` : s.slakk ? `${n} = 0 ved ${komma(s.slakk.th * 180 / Math.PI, 0)}° fra bunnen` : "når ikke toppen";
    $("navn-s").textContent = n; $("navn-sbunn").textContent = n;
    tegn();
  }

  for (const id of ["modus", "radius", "fart", "masse"]) $(id).addEventListener("input", nullstill);
  nullstill();
})();
