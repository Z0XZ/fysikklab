// Magnet og spole. En stavmagnet beveges langs aksen til en spole (dra med musa, eller kjør den gjennom med konstant fart).
// Fluksen gjennom én vinding er modellert som Φ(z) = Φ₀ / (1 + (z/a)²)^(3/2), der z er avstanden fra midten av spolen.
// Indusert spenning: ε = −N dΦ/dt = −N Φ'(z) v. Enheter: m, s, Wb og V.

const MS_A = 0.025;                         // «radius» i flukmodellen (m)
const MS_PHI0 = { sterk: 2.0e-4, svak: 0.8e-4 };   // største fluks gjennom én vinding (Wb)
const MS_Z = 0.27;                          // magneten kan være fra −0,27 m til 0,27 m

function msFluks(z, phi0) { return phi0 / Math.pow(1 + (z / MS_A) ** 2, 1.5); }
function msDFluks(z, phi0) { const u = z / MS_A; return phi0 * (-3 * u / MS_A) * Math.pow(1 + u * u, -2.5); }

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("ms-scene");
  if (!el) return;
  let N, phi0, snu, vAuto, z = -0.25, v = 0, t = 0, data = [], dra = false, auto = false, modus = "auto", sisteDra = null;

  function les() {
    N = Sim.verdi("ms-n", (x) => komma(x, 0));
    vAuto = Sim.verdi("ms-v", (x) => komma(x, 1) + " m/s");
    phi0 = MS_PHI0[$("ms-magnet").value];
    snu = $("ms-snu").checked ? -1 : 1;
  }
  const NPhi = (zz) => snu * N * msFluks(zz, phi0);
  const eps = (zz, vv) => -snu * N * msDFluks(zz, phi0) * vv;

  const ls = Sim.lerret(el, tegnScene);
  const lg = Sim.lerret($("ms-graf"), tegnGraf);

  function registrer() {
    data.push({ t, phi: NPhi(z), e: eps(z, v) });
    if (data.length > 4000) data.shift();
  }

  function nullstill() {
    avspiller.stopp(); auto = false; modus = "auto";
    les(); z = -0.25; v = 0; t = 0; data = [];
    registrer(); tegn();
  }

  function steg(dt) {
    const tempo = Number($("ms-tempo").value);
    const dtv = dt * tempo;
    if (!auto) { z = -0.25; t = 0; data = []; modus = "auto"; }
    auto = true; v = vAuto; z += v * dtv; t += dtv;
    registrer(); tegn();
    if (z >= 0.25) { auto = false; return false; }
    return true;
  }
  const avspiller = Sim.avspiller({ knapp: $("ms-start"), steg, nullstill: () => { les(); z = -0.25; v = 0; t = 0; data = []; registrer(); }, lerret: el, tekster: { ferdig: "Kjør igjen" } });

  // Dra magneten med musa. Farten regnes ut fra hvor fort pekeren flytter seg (glattet litt).
  const zFraPx = (x) => (x - ls.b / 2) / (ls.b / (2 * MS_Z) * 0.92);
  el.addEventListener("pointerdown", (e) => {
    avspiller.pause(); dra = true; auto = false; if (modus !== "dra") { data = []; t = 0; modus = "dra"; } el.setPointerCapture(e.pointerId);
    sisteDra = { z: Math.max(-MS_Z, Math.min(MS_Z, zFraPx(Sim.punkt(el, e)[0]))), tid: performance.now() };
    z = sisteDra.z;
  });
  el.addEventListener("pointermove", (e) => {
    if (!dra) return;
    const nz = Math.max(-MS_Z, Math.min(MS_Z, zFraPx(Sim.punkt(el, e)[0])));
    const nå = performance.now(), dt = Math.max(0.008, (nå - sisteDra.tid) / 1000);
    v = 0.6 * v + 0.4 * (nz - sisteDra.z) / dt;
    z = nz; t += dt; sisteDra = { z: nz, tid: nå };
    registrer(); tegn();
  });
  const slipp = () => { if (!dra) return; dra = false; v = 0; registrer(); tegn(); };
  el.addEventListener("pointerup", slipp);
  el.addEventListener("pointercancel", slipp);
  // Når magneten holdes i ro, går farten mot null
  setInterval(() => {
    if (!dra || performance.now() - sisteDra.tid < 80) return;
    v *= 0.5; t += 0.05; registrer(); tegn();
  }, 50);

  function tegn() { tegnScene(); tegnGraf(); tall(); }

  function tegnScene() {
    if (!ls.b) return;
    const c = ls.ctx, f = ls.f, b = ls.b, h = ls.h, s = b / (2 * MS_Z) * 0.92, cx = b / 2, cy = h * 0.45;
    ls.tom();
    const e = eps(z, v), moment = Math.abs(e) > 0.01 ? Math.sign(e) : 0;
    // Spolen: vindinger som ellipser, bakre halvdel først
    const L = 0.07, R = 0.06, vind = 14;
    c.lineWidth = 2;
    for (let i = 0; i < vind; i++) {
      const x = cx + (-L / 2 + L * i / (vind - 1)) * s;
      c.strokeStyle = f["rute-sterk"]; c.beginPath(); c.ellipse(x, cy, 0.25 * R * s, R * s, 0, Math.PI / 2, 3 * Math.PI / 2); c.stroke();
    }
    // Magneten
    const mL = 0.1, mH = 0.03, mx = cx + z * s;
    const venstreN = snu < 0;
    c.fillStyle = venstreN ? f.f1 : f.f2; c.fillRect(mx - mL / 2 * s, cy - mH / 2 * s, mL / 2 * s, mH * s);
    c.fillStyle = venstreN ? f.f2 : f.f1; c.fillRect(mx, cy - mH / 2 * s, mL / 2 * s, mH * s);
    c.fillStyle = "#fff"; c.font = "700 " + Math.max(11, Math.round(mH * s * 0.6)) + "px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(venstreN ? "N" : "S", mx - mL / 4 * s, cy + 1); c.fillText(venstreN ? "S" : "N", mx + mL / 4 * s, cy + 1);
    // Fremre halvdel av vindingene, farget etter strømretningen
    for (let i = 0; i < vind; i++) {
      const x = cx + (-L / 2 + L * i / (vind - 1)) * s;
      c.strokeStyle = moment ? f.f1 : f.blekk; c.lineWidth = 2;
      c.beginPath(); c.ellipse(x, cy, 0.25 * R * s, R * s, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
    }
    // Strømpil foran på spolen og induserte poler
    if (moment) {
      const ax = cx + (L / 2 + 0.012) * s, ned = moment > 0;
      c.strokeStyle = f.f1; c.fillStyle = f.f1; c.lineWidth = 2.5;
      const y0 = cy + (ned ? -1 : 1) * R * s * 0.7, y1 = cy - (ned ? -1 : 1) * R * s * 0.7;
      c.beginPath(); c.moveTo(ax, y0); c.lineTo(ax, y1); c.stroke();
      c.beginPath(); c.moveTo(ax, y1); c.lineTo(ax - 6, y1 + (ned ? -9 : 9)); c.lineTo(ax + 6, y1 + (ned ? -9 : 9)); c.closePath(); c.fill();
      c.font = "600 12px " + Sim.SANS; c.textBaseline = "alphabetic";
      c.fillText("I", ax + 12, cy);
      c.font = "700 15px " + Sim.SANS;
      c.fillText(moment > 0 ? "S" : "N", cx - (L / 2 + 0.02) * s, cy - R * s - 8);
      c.fillText(moment > 0 ? "N" : "S", cx + (L / 2 + 0.02) * s, cy - R * s - 8);
    }
    // Voltmeter
    const vmx = cx, vmy = h - 26, r = Math.min(46, h * 0.16);
    c.strokeStyle = f["rute-sterk"]; c.lineWidth = 1.5;
    c.beginPath(); c.arc(vmx, vmy, r, Math.PI, 2 * Math.PI); c.stroke();
    const skala = Math.max(0.5, maksE()), vinkel = -Math.PI / 2 + Math.max(-1, Math.min(1, e / skala)) * Math.PI * 0.42;
    c.strokeStyle = f.blekk; c.lineWidth = 2; c.beginPath(); c.moveTo(vmx, vmy); c.lineTo(vmx + r * 0.92 * Math.cos(vinkel), vmy + r * 0.92 * Math.sin(vinkel)); c.stroke();
    c.fillStyle = f.dempet; c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("0", vmx, vmy - r - 14);
    c.textAlign = "left"; c.textBaseline = "top";
    c.fillText(dra ? "Du drar magneten" : auto ? "Magneten kjøres gjennom spolen" : "Dra magneten med musa, eller trykk Start", 10, 8);
  }

  function maksE() { return data.reduce((m, d) => Math.max(m, Math.abs(d.e)), 0); }

  function tegnGraf() {
    if (!lg.b) return;
    const c = lg.ctx, f = lg.f;
    lg.tom();
    const tEnd = data.length ? data[data.length - 1].t : 0;
    const W = modus === "auto" ? 0.5 / vAuto : 3;
    const t0 = Math.max(0, tEnd - W), t1 = Math.max(t0 + W, tEnd) || 1;
    const em = Math.max(0.2, maksE()) * 1.15;
    const phiM = Math.max(1e-9, ...data.map((d) => Math.abs(d.phi)), N * phi0);
    const { px, py } = Sim.akser(lg, { x: [t0, t1], y: [-em, em], xTekst: "t / s", yTekst: "ε / V" });
    const vis = data.filter((d) => d.t >= t0);
    c.save();
    c.strokeStyle = f.f2; c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath();
    vis.forEach((d, i) => { const y = py(d.phi / phiM * em * 0.85); i ? c.lineTo(px(d.t), y) : c.moveTo(px(d.t), y); });
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = f.f1; c.lineWidth = 2.5; c.beginPath();
    vis.forEach((d, i) => (i ? c.lineTo(px(d.t), py(d.e)) : c.moveTo(px(d.t), py(d.e))));
    c.stroke();
    c.restore();
  }

  function tall() {
    const e = eps(z, v), m = Math.abs(e) > 0.01 ? Math.sign(e) : 0;
    $("ms-z").textContent = komma(z * 100, 1) + " cm";
    $("ms-fart").textContent = komma(v, 2) + " m/s";
    $("ms-phi").textContent = komma(NPhi(z) * 1000, 2) + " mWb";
    $("ms-e").textContent = komma(e, 2) + " V";
    $("ms-topp").textContent = komma(maksE(), 2) + " V";
    $("ms-pol").textContent = m ? `venstre ende ${m > 0 ? "S" : "N"}, høyre ende ${m > 0 ? "N" : "S"}` : "ingen strøm";
  }

  for (const id of ["ms-n", "ms-v", "ms-magnet", "ms-snu"]) $(id).addEventListener("input", nullstill);
  $("ms-nullstill").addEventListener("click", nullstill);
  nullstill();
})();
