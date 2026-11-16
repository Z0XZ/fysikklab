// Ballistisk pendel. En kule skytes inn i en kloss som henger i to snorer.
// Støtet er fullstendig uelastisk: Bevegelsesmengden er bevart i støtet, og etterpå er den mekaniske energien bevart.
// Enheter: kg, m, s.

const G = 9.81;
const L = 2.0;    // snorlengde i m

function ballistisk(m, v, M) {
  const V = m * v / (m + M), h = V * V / (2 * G);
  return {
    V, h,
    vinkel: Math.acos(1 - h / L) * 180 / Math.PI,
    ekFør: 0.5 * m * v * v,
    ekEtter: 0.5 * (m + M) * V * V,
    andelIgjen: m / (m + M),
  };
}

// Pendelen etter støtet, løst numerisk (RK4) uten antakelse om små utslag
function svingning(V, dt = 0.001, tMaks = 6) {
  let th = 0, w = V / L;
  const data = [{ t: 0, th }];
  const a = (x) => -G / L * Math.sin(x);
  for (let t = dt; t <= tMaks + 1e-9; t += dt) {
    const k1t = w, k1w = a(th);
    const k2t = w + k1w * dt / 2, k2w = a(th + k1t * dt / 2);
    const k3t = w + k2w * dt / 2, k3w = a(th + k2t * dt / 2);
    const k4t = w + k3w * dt, k4w = a(th + k3t * dt);
    th += (k1t + 2 * k2t + 2 * k3t + k4t) * dt / 6;
    w += (k1w + 2 * k2w + 2 * k3w + k4w) * dt / 6;
    data.push({ t, th });
  }
  return data;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("ballistisk");
  if (!el) return;

  const FLUKT = 0.8;   // så lenge kula bruker på flukten i animasjonen, i sekunder
  let m, v, M, res, sving, tid = 0, hMaks = 0, ukjent = false, ukjentV = 250, spor = [];
  const l = Sim.lerret(el, tegn);

  function lesInnstillinger() {
    m = Sim.verdi("kule", (x) => komma(x, 1) + " g") / 1000;
    M = Sim.verdi("kloss", (x) => komma(x, 1) + " kg");
    ukjent = Sim.verdi("ukjent");
    v = ukjent ? ukjentV : Sim.verdi("fart", (x) => komma(x, 0) + " m/s");
    $("rad-fart").hidden = ukjent;
    $("ny-ukjent").hidden = $("vis-fasit").hidden = !ukjent;
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    res = ballistisk(m, v, M);
    sving = svingning(res.V);
    tid = 0; hMaks = 0; spor = [];
    $("fasit-fart").textContent = "";
    tegn();
  }

  function steg(dt) {
    tid += dt * (tid < FLUKT ? 1 : Number($("tempo").value));
    const ferdig = tid >= FLUKT + sving[sving.length - 1].t;
    if (ferdig) tid = FLUKT + sving[sving.length - 1].t;
    tegn();
    return !ferdig;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el, tekster: { klar: "Skyt", ferdig: "Skyt igjen" } });

  function vinkelNå() {
    if (tid <= FLUKT) return 0;
    const i = Math.min(sving.length - 1, Math.round((tid - FLUKT) / 0.001));
    return sving[i].th;
  }

  function tegn() {
    if (!l.b || !res) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const skala = (l.h - 70) / L;          // piksler per meter
    const ox = l.b * 0.45, oy = 22;
    const th = vinkelNå();
    const bx = ox + L * Math.sin(th) * skala, by = oy + L * Math.cos(th) * skala;
    const kb = Math.max(34, 0.2 * skala), kh = kb * 0.7;
    const h = L * (1 - Math.cos(th));
    if (tid > FLUKT) { hMaks = Math.max(hMaks, h); spor.push([bx, by]); }

    // Opphenget og høydelinjer
    c.strokeStyle = f.blekk; c.lineWidth = 3;
    c.beginPath(); c.moveTo(ox - 60, oy); c.lineTo(ox + 60, oy); c.stroke();
    const yBunn = oy + L * skala;
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(ox - L * skala * 0.9, yBunn); c.lineTo(l.b - 10, yBunn); c.stroke();
    if (hMaks > 0) {
      const yT = yBunn - hMaks * skala;
      c.strokeStyle = f.f1;
      c.beginPath(); c.moveTo(ox - 40, yT); c.lineTo(l.b - 10, yT); c.stroke();
    }
    c.setLineDash([]);
    // Målestav for høyden ved siden av klossen
    const mx = l.b - 72;
    c.strokeStyle = f.dempet; c.fillStyle = f.dempet; c.lineWidth = 1; c.font = "11px " + Sim.MONO;
    c.textAlign = "left"; c.textBaseline = "middle";
    c.beginPath(); c.moveTo(mx, yBunn); c.lineTo(mx, yBunn - 1.0 * skala); c.stroke();
    for (let k = 0; k <= 100; k += 2) {
      const y = yBunn - k / 100 * skala, lang = k % 10 === 0;
      c.beginPath(); c.moveTo(mx, y); c.lineTo(mx + (lang ? 9 : 4), y); c.stroke();
      if (lang && (skala > 150 || k % 20 === 0)) c.fillText(k + " cm", mx + 12, y);
    }
    // Sporet
    if (spor.length > 1) {
      c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1.5; c.beginPath();
      spor.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
    // Snorer og kloss
    c.strokeStyle = f.dempet; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(ox - kb * 0.35, oy); c.lineTo(bx - kb * 0.35, by - kh / 2); c.moveTo(ox + kb * 0.35, oy); c.lineTo(bx + kb * 0.35, by - kh / 2); c.stroke();
    c.fillStyle = "#b98a52"; c.strokeStyle = f.blekk; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(bx - kb / 2, by - kh / 2, kb, kh, 3); c.fill(); c.stroke();
    // Kula
    const kx = tid < FLUKT ? 16 + (bx - kb / 2 - 16) * (tid / FLUKT) : bx - kb * 0.25;
    if (tid < FLUKT || tid === 0) {
      c.fillStyle = f.blekk; c.beginPath(); c.ellipse(kx, yBunn, 6, 3, 0, 0, 2 * Math.PI); c.fill();
      if (tid > 0) {
        c.strokeStyle = f.dempet; c.lineWidth = 1; c.setLineDash([2, 6]);
        c.beginPath(); c.moveTo(16, yBunn); c.lineTo(kx - 8, yBunn); c.stroke(); c.setLineDash([]);
      }
    }
    // Luftgevær til venstre
    c.fillStyle = f.dempet; c.fillRect(0, yBunn - 3, 18, 6);

    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText(tid < FLUKT ? "kula i lufta (sakte film)" : "t = " + komma(tid - FLUKT, 2) + " s etter støtet", 10, 8);
    if (hMaks > 0) { c.fillStyle = f.f1; c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("h = " + komma(hMaks * 100, 1) + " cm", mx - 6, yBunn - hMaks * skala - 3); }
    oppdaterTall();
  }

  function oppdaterTall() {
    const etter = tid > FLUKT;
    const s = (tekst) => (etter ? tekst : "?");
    $("v-kule").textContent = ukjent ? "ukjent" : komma(v, 0) + " m/s";
    $("v-etter").textContent = ukjent ? "?" : s(komma(res.V, 3) + " m/s");
    $("h-maks").textContent = s(komma(hMaks * 100, 1) + " cm");
    $("utslag").textContent = s(komma(Math.acos(1 - hMaks / L) * 180 / Math.PI, 1) + "°");
    $("ek-for").textContent = ukjent ? "?" : Sim.tall(res.ekFør, 3) + " J";
    $("ek-etter").textContent = ukjent ? "?" : s(Sim.tall(res.ekEtter, 3) + " J");
    $("andel").textContent = ukjent ? "?" : s(komma(res.andelIgjen * 100, 2) + " %");
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["kule", "kloss", "fart", "ukjent"]) $(id).addEventListener("input", nullstill);
  $("ny-ukjent").addEventListener("click", () => { ukjentV = Math.round(120 + Math.random() * 260); nullstill(); });
  $("vis-fasit").addEventListener("click", () => { $("fasit-fart").textContent = "Kula hadde farten " + komma(ukjentV, 0) + " m/s."; });

  ukjentV = Math.round(120 + Math.random() * 260);
  nullstill();
})();
