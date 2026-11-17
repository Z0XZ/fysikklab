// Skrått kast med og uten luftmotstand. Uten luft: x = v0 cosα t, y = h0 + v0 sinα t − ½gt².
// Med luft: a = −g ŷ − (k/m)|v| v, med k/m = 0,013 1/m, omtrent som for en fotball.

const G = 9.81, KM = 0.013;

function kast(v0, vinkel, h0, luft) {
  const a = vinkel * Math.PI / 180, dt = 0.002, data = [];
  let x = 0, y = h0, vx = v0 * Math.cos(a), vy = v0 * Math.sin(a), t = 0, yMaks = h0;
  while (t < 30) {
    data.push({ t, x, y, vx, vy });
    const v = Math.hypot(vx, vy), k = luft ? KM : 0;
    const ax = -k * v * vx, ay = -G - k * v * vy;
    const nx = x + vx * dt + 0.5 * ax * dt * dt, ny = y + vy * dt + 0.5 * ay * dt * dt;
    if (ny < 0) {
      const andel = y / (y - ny);
      const sist = { t: t + andel * dt, x: x + (nx - x) * andel, y: 0, vx: vx + ax * dt * andel, vy: vy + ay * dt * andel };
      data.push(sist);
      break;
    }
    x = nx; y = ny; vx += ax * dt; vy += ay * dt; t += dt;
    yMaks = Math.max(yMaks, y);
  }
  const sist = data[data.length - 1];
  return { data, T: sist.t, R: sist.x, yMaks, vSlutt: Math.hypot(sist.vx, sist.vy), vinkelSlutt: Math.atan2(-sist.vy, sist.vx) * 180 / Math.PI, luft };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("kast");
  if (!el) return;
  const l = Sim.lerret(el, tegn);
  let inn, k, tid = 0, spor = [];

  function les() {
    inn = {
      v0: Sim.verdi("fart", (v) => komma(v, 0) + " m/s"),
      vinkel: Sim.verdi("vinkel", (v) => komma(v, 0) + "°"),
      h0: Sim.verdi("hoyde", (v) => komma(v, 0) + " m"),
      luft: $("luft").checked,
    };
    k = kast(inn.v0, inn.vinkel, inn.h0, inn.luft);
  }
  function nullstill() { avspiller.stopp(); les(); tid = 0; oppdater(); }
  function steg(dt) {
    tid = Math.min(k.T, tid + dt * Number($("tempo").value));
    if (tid >= k.T) { spor.push({ ...k, vinkel: inn.vinkel }); if (spor.length > 5) spor.shift(); }
    oppdater();
    return tid < k.T;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });
  const nå = () => k.data[Math.min(k.data.length - 1, Math.round(tid / 0.002))];

  function tegn() {
    if (!l.b || !k) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const alle = [...spor, k];
    const xMaks = Math.max(10, ...alle.map((s) => s.R)) * 1.08, yMaks = Math.max(5, ...alle.map((s) => s.yMaks)) * 1.15;
    // Lik målestokk på aksene
    const ml = 46, mb = 30, sk = Math.min((l.b - ml - 14) / xMaks, (l.h - mb - 14) / yMaks);
    const X = (x) => ml + x * sk, Y = (y) => l.h - mb - y * sk;
    c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ml, Y(0)); c.lineTo(l.b - 10, Y(0)); c.moveTo(ml, Y(0)); c.lineTo(ml, 10); c.stroke();
    const steg = Sim.steglengde(Math.max(xMaks, yMaks), 8);
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.lineWidth = 1; c.strokeStyle = f.rute;
    c.textAlign = "center"; c.textBaseline = "top";
    for (let x = steg; X(x) < l.b - 10; x += steg) { c.beginPath(); c.moveTo(X(x), Y(0)); c.lineTo(X(x), 10); c.stroke(); c.fillText(komma(x, 0), X(x), Y(0) + 4); }
    c.textAlign = "right"; c.textBaseline = "middle";
    for (let y = steg; Y(y) > 10; y += steg) { c.beginPath(); c.moveTo(ml, Y(y)); c.lineTo(l.b - 10, Y(y)); c.stroke(); c.fillText(komma(y, 0), ml - 6, Y(y)); }
    c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("x / m", l.b - 10, Y(0) - 3);
    c.textAlign = "left"; c.textBaseline = "top"; c.fillText("y / m", ml + 6, 6);
    if (inn.h0 > 0) { c.fillStyle = f.flate; c.fillRect(ml - 1, Y(inn.h0), 14, inn.h0 * sk); }
    // Gamle baner
    for (const s of spor) {
      c.strokeStyle = s.luft ? f.f2 : f.dempet; c.globalAlpha = 0.5; c.lineWidth = 1.8; c.beginPath();
      s.data.forEach((d, i) => { if (i % 5 === 0 || i === s.data.length - 1) (i ? c.lineTo(X(d.x), Y(d.y)) : c.moveTo(X(d.x), Y(d.y))); });
      c.stroke(); c.globalAlpha = 1;
      c.fillStyle = c.strokeStyle; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText(komma(s.vinkel, 0) + "°", X(s.R), Y(0) - 4);
    }
    // Banen nå med stroboskopprikker hvert 0,2 s
    c.strokeStyle = inn.luft ? f.f2 : f.f1; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i < k.data.length; i += 5) { const d = k.data[i]; if (d.t > tid) break; i ? c.lineTo(X(d.x), Y(d.y)) : c.moveTo(X(d.x), Y(d.y)); }
    const d = nå(); c.lineTo(X(d.x), Y(d.y)); c.stroke();
    c.fillStyle = c.strokeStyle;
    for (let t = 0.2; t <= tid; t += 0.2) { const p = k.data[Math.round(t / 0.002)]; if (p) { c.beginPath(); c.arc(X(p.x), Y(p.y), 2.5, 0, 2 * Math.PI); c.fill(); } }
    c.beginPath(); c.arc(X(d.x), Y(d.y), 6, 0, 2 * Math.PI); c.fill();
    // Fartskomponenter
    if ($("komponenter").checked) {
      const vs = 2.2;
      const pil = (dx, dy, farge, navn) => {
        const x0 = X(d.x), y0 = Y(d.y), x1 = x0 + dx * vs, y1 = y0 - dy * vs, len = Math.hypot(x1 - x0, y1 - y0);
        if (len < 4) return;
        const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
        c.strokeStyle = farge; c.fillStyle = farge; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke();
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 9 - uy * 4.5, y1 - uy * 9 + ux * 4.5); c.lineTo(x1 - ux * 9 + uy * 4.5, y1 - uy * 9 - ux * 4.5); c.closePath(); c.fill();
        c.font = "600 12px " + Sim.SANS; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(navn, x1 + 6, y1);
      };
      pil(d.vx, 0, f.dempet, "vₓ"); pil(0, d.vy, f.dempet, "vᵧ"); pil(d.vx, d.vy, f.blekk, "v");
    }
  }

  function oppdater() {
    const d = nå();
    $("r-t").textContent = komma(d.t, 2) + " s";
    $("r-vx").textContent = komma(d.vx, 2) + " m/s";
    $("r-vy").textContent = komma(d.vy, 2) + " m/s";
    const ferdig = tid >= k.T;
    $("r-r").textContent = ferdig ? komma(k.R, 2) + " m" : "?";
    $("r-h").textContent = ferdig ? komma(k.yMaks, 2) + " m" : "?";
    $("r-tt").textContent = ferdig ? komma(k.T, 2) + " s" : "?";
    $("r-vs").textContent = ferdig ? komma(k.vSlutt, 2) + " m/s" : "?";
    tegn();
  }

  for (const id of ["fart", "vinkel", "hoyde", "luft"]) $(id).addEventListener("input", nullstill);
  $("komponenter").addEventListener("input", tegn);
  $("visk").addEventListener("click", () => { spor = []; tegn(); });
  nullstill();
})();
