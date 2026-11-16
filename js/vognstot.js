// Støt mellom to vogner på en vannrett bane uten friksjon.
// Støtfangerne er fjærer. Ved uelastiske støt er fjæra stivere på vei ut enn på vei inn,
// slik at en del av energien blir igjen som indre energi. Ved eksplosjon er en fjær spent mellom vognene.
// Enheter: kg, m, s.

const VOGN = 0.18;        // vognens lengde
const SPOR = 2.4;         // banens lengde
const MIDT = 1.2;         // her møtes vognene
const K_STOT = 300;       // stivheten til støtfangeren i N/m
const K_FJAER = 400;      // stivheten til utskyterfjæra i N/m
const STOTTALL = { elastisk: 1, uelastisk: 0.5, fullstendig: 0 };

// Farten etter et sentralt støt der e = 1 er elastisk og e = 0 er fullstendig uelastisk
function etterStot(mA, vA, mB, vB, e) {
  const p = mA * vA + mB * vB, M = mA + mB;
  return [(p + mB * e * (vB - vA)) / M, (p + mA * e * (vA - vB)) / M];
}

// Farten etter en eksplosjon der fjærenergien E deles mellom vognene. A går mot venstre.
function etterEksplosjon(mA, mB, E) {
  const uB = Math.sqrt(2 * E * mA / (mB * (mA + mB)));
  return [-mB * uB / mA, uB];
}

// Simulerer hele forløpet. Returnerer målinger hvert millisekund, eller null hvis vognene ikke møtes.
function simuler({ mA, vA, mB, vB, type, E }) {
  const dt = 2e-4;
  let xA, xB, tKontakt, tSlipp = 0;
  if (type === "eksplosjon") {
    const c0 = Math.sqrt(2 * E / K_FJAER);
    xA = MIDT - VOGN / 2 + c0 / 2; xB = MIDT + VOGN / 2 - c0 / 2;
    vA = 0; vB = 0; tSlipp = tKontakt = 0.5;
  } else {
    if (vA <= vB) return null;
    // Velg starttidspunkt slik at vognene møtes midt på banen og begge starter på banen
    tKontakt = 1;
    if (vA > 0) tKontakt = Math.min(tKontakt, (MIDT - VOGN - 0.03) / vA);
    if (vB < 0) tKontakt = Math.min(tKontakt, (SPOR - MIDT - VOGN - 0.03) / -vB);
    xA = MIDT - VOGN / 2 - vA * tKontakt; xB = MIDT + VOGN / 2 - vB * tKontakt;
  }
  const e = STOTTALL[type];
  const data = [];
  let t = 0, maks = 0, laast = false, ferdig = false, tFerdig = Infinity, slutt = "tid";
  for (let i = 0; ; i++) {
    const c = (xA + VOGN / 2) - (xB - VOGN / 2);   // hvor mye støtfangerne er presset sammen
    let F = 0;
    if (type === "eksplosjon") {
      if (t >= tSlipp && c > 0) F = K_FJAER * c;
    } else if (!laast && c > 0) {
      if (vB - vA < 0) { F = K_STOT * c; maks = Math.max(maks, c); }
      else if (e === 0) { laast = true; vA = vB = (mA * vA + mB * vB) / (mA + mB); }
      else F = Math.max(0, K_STOT / (e * e) * (c - maks * (1 - e * e)));
    }
    if (i % 5 === 0) data.push({ t, xA, xB, vA, vB, F });
    if (!ferdig && t > tKontakt - 0.05 && F === 0 && (vB - vA >= 0 || laast) && (maks > 0 || laast || t > tSlipp + 0.01 && type === "eksplosjon")) { ferdig = true; tFerdig = t; }
    if (ferdig && (xA - VOGN / 2 < 0 || xB + VOGN / 2 > SPOR)) { slutt = "ende"; break; }
    if (t >= tKontakt + 1.6) break;
    vA -= F / mA * dt; vB += F / mB * dt;
    xA += vA * dt; xB += vB * dt;
    t += dt;
  }
  const før = data[0], etter = data[data.length - 1];
  return { data, tKontakt, tFerdig, tSlutt: etter.t, slutt, laast, før: [før.vA, før.vB], etter: [etter.vA, etter.vB] };
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const el = $("vogner");
  if (!el) return;

  let inn, sim, tid = 0;
  const scene = Sim.lerret(el, tegn);
  const graf = Sim.lerret($("vogngraf"), tegn);

  const fart = (v) => (v > 0 ? "+" : "") + komma(v, 2) + " m/s";
  function lesInnstillinger() {
    const type = Sim.verdi("type");
    inn = {
      type,
      mA: Sim.verdi("masse-a", (v) => komma(v, 2) + " kg"),
      mB: Sim.verdi("masse-b", (v) => komma(v, 2) + " kg"),
      vA: Sim.verdi("fart-a", fart),
      vB: Sim.verdi("fart-b", fart),
      E: Sim.verdi("energi", (v) => komma(v, 2) + " J"),
    };
    const eksplosjon = type === "eksplosjon";
    $("rad-fart-a").hidden = $("rad-fart-b").hidden = eksplosjon;
    $("rad-energi").hidden = !eksplosjon;
  }

  function nullstill() {
    avspiller.stopp();
    lesInnstillinger();
    sim = simuler(inn);
    tid = 0;
    $("melding").textContent = sim ? "" : "Vognene møtes ikke. Vogn A må ha større fart mot høyre enn vogn B.";
    $("start").disabled = !sim;
    tegn();
  }

  function steg(dt) {
    tid = Math.min(sim.tSlutt, tid + dt * Number($("tempo").value));
    tegn();
    return tid < sim.tSlutt;
  }
  const avspiller = Sim.avspiller({ knapp: $("start"), steg, nullstill, lerret: el });

  const nå = () => sim.data[Math.min(sim.data.length - 1, Math.round(tid / 1e-3))];

  function tegnScene() {
    const l = scene, c = l.ctx, f = l.f;
    l.tom();
    const marg = 26, sx = (x) => marg + x / SPOR * (l.b - 2 * marg), skala = (l.b - 2 * marg) / SPOR;
    const bane = l.h * 0.74, vognH = Math.max(20, Math.min(l.h * 0.22, VOGN * skala * 0.45));
    // Bane med meterstrek
    c.strokeStyle = f.blekk; c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx(0), bane); c.lineTo(sx(SPOR), bane); c.stroke();
    c.font = "11px " + Sim.MONO; c.fillStyle = f.dempet; c.textAlign = "center"; c.textBaseline = "top";
    c.lineWidth = 1; c.strokeStyle = f["rute-sterk"];
    for (let x = 0; x <= SPOR + 1e-9; x += 0.2) {
      const hel = Math.abs(x - Math.round(x * 2) / 2) < 1e-6;
      c.beginPath(); c.moveTo(sx(x), bane + 2); c.lineTo(sx(x), bane + (hel ? 9 : 5)); c.stroke();
      if (hel) c.fillText(komma(x, 1) + " m", sx(x), bane + 11);
    }
    if (!sim) return;
    const s = nå();
    const vogn = (x, m, v, farge, navn, side) => {
      const x0 = sx(x - VOGN / 2), b = VOGN * skala, topp = bane - 5 - vognH;
      c.fillStyle = farge; c.globalAlpha = 0.9;
      c.beginPath(); c.roundRect(x0 + 4, topp, b - 8, vognH, 3); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = f.blekk;
      for (const hjul of [0.28, 0.72]) { c.beginPath(); c.arc(x0 + b * hjul, bane - 4, 4, 0, 2 * Math.PI); c.fill(); }
      // Støtfanger på siden som vender mot den andre vogna
      const sx0 = side > 0 ? x0 + b - 4 : x0;
      c.fillStyle = inn.type === "fullstendig" ? f.dempet : f["rute-sterk"];
      c.fillRect(sx0, topp + vognH * 0.25, 4, vognH * 0.5);
      c.fillStyle = f.papir; c.font = "600 12px " + Sim.SANS; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(navn, x0 + b / 2, topp + vognH / 2);
      // Fartspil
      c.fillStyle = farge; c.strokeStyle = farge; c.lineWidth = 2.5;
      const yP = topp - 16, lengde = v * skala * 0.35;
      if (Math.abs(lengde) > 2) {
        const xm = x0 + b / 2, ende = xm + lengde, r = Math.sign(lengde);
        c.beginPath(); c.moveTo(xm, yP); c.lineTo(ende - r * 6, yP); c.stroke();
        c.beginPath(); c.moveTo(ende, yP); c.lineTo(ende - r * 8, yP - 5); c.lineTo(ende - r * 8, yP + 5); c.fill();
      }
      c.font = "11px " + Sim.MONO; c.textAlign = "center"; c.textBaseline = "bottom";
      const smal = l.b < 560;
      const tekst = (smal ? "" : komma(m, 2) + " kg · ") + komma(v, 2) + " m/s", tb = c.measureText(tekst).width;
      c.fillText(tekst, Math.min(l.b - tb / 2 - 4, Math.max(tb / 2 + 4, x0 + b / 2)), yP - 6 - (smal && navn === "B" ? 13 : 0));
    };
    vogn(s.xA, inn.mA, s.vA, f.f1, "A", 1);
    vogn(s.xB, inn.mB, s.vB, f.f2, "B", -1);
    // Fjæra ved eksplosjon
    if (inn.type === "eksplosjon" && s.F > 0) {
      const a = sx(s.xA + VOGN / 2) - 4, b = sx(s.xB - VOGN / 2) + 4, y = bane - 5 - vognH / 2;
      c.strokeStyle = f.blekk; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a, y);
      for (let k = 1; k <= 6; k++) c.lineTo(a + (b - a) * k / 6, y + (k % 2 ? -4 : 4));
      c.stroke();
    }
    c.fillStyle = f.dempet; c.font = "12px " + Sim.MONO; c.textAlign = "right"; c.textBaseline = "top";
    c.fillText("t = " + komma(tid, 2) + " s", l.b - 12, 8);
  }

  const STR = {
    p: { navn: "p / (kg m/s)", A: (s) => inn.mA * s.vA, B: (s) => inn.mB * s.vB, sum: true },
    v: { navn: "v / (m/s)", A: (s) => s.vA, B: (s) => s.vB, sum: false },
    ek: { navn: "Ek / J", A: (s) => 0.5 * inn.mA * s.vA ** 2, B: (s) => 0.5 * inn.mB * s.vB ** 2, sum: true },
    f: { navn: "F / N (kraft fra B på A)", A: (s) => -s.F, B: (s) => s.F, sum: true },
  };

  function tegnGraf() {
    const l = graf, c = l.ctx, f = l.f;
    l.tom();
    if (!sim) return;
    const q = STR[Sim.verdi("storrelse")];
    const verdier = sim.data.flatMap((s) => [q.A(s), q.B(s), q.sum ? q.A(s) + q.B(s) : 0]);
    let y0 = Math.min(0, ...verdier), y1 = Math.max(0, ...verdier);
    const pad = (y1 - y0 || 1) * 0.12; y0 = y0 < 0 ? y0 - pad : 0; y1 += pad;
    const { px, py } = Sim.akser(l, { x: [0, sim.tSlutt], y: [y0, y1], xTekst: "t / s", yTekst: q.navn });
    const kurve = (fn, farge, stiplet) => {
      c.strokeStyle = farge; c.lineWidth = 2; c.setLineDash(stiplet ? [6, 4] : []);
      c.beginPath();
      for (const s of sim.data) { if (s.t > tid) break; const y = fn(s); s.t ? c.lineTo(px(s.t), py(y)) : c.moveTo(px(s.t), py(y)); }
      c.stroke(); c.setLineDash([]);
    };
    kurve(q.A, f.f1); kurve(q.B, f.f2);
    if (q.sum) kurve((s) => q.A(s) + q.B(s), f.blekk, true);
  }

  function oppdaterTabell() {
    const ferdig = tid >= sim.tFerdig;
    const rad = (navn, [vA, vB], vis) => {
      const pA = inn.mA * vA, pB = inn.mB * vB, ek = 0.5 * inn.mA * vA ** 2 + 0.5 * inn.mB * vB ** 2;
      const u = (x, d) => (vis ? komma(x, d) : "?");
      return `<tr><th scope="row">${navn}</th><td class="f1">${u(vA, 2)}</td><td class="f2">${u(vB, 2)}</td><td class="f1">${u(pA, 3)}</td><td class="f2">${u(pB, 3)}</td><td>${u(pA + pB, 3)}</td><td>${u(ek, 3)}</td></tr>`;
    };
    $("stot-rader").innerHTML = rad("Før", sim.før, true) + rad("Etter", sim.etter, ferdig);
    const pFør = inn.mA * sim.før[0] + inn.mB * sim.før[1], pEtter = inn.mA * sim.etter[0] + inn.mB * sim.etter[1];
    const ekFør = 0.5 * inn.mA * sim.før[0] ** 2 + 0.5 * inn.mB * sim.før[1] ** 2;
    const ekEtter = 0.5 * inn.mA * sim.etter[0] ** 2 + 0.5 * inn.mB * sim.etter[1] ** 2;
    $("p-forhold").textContent = !ferdig ? "?" : Math.abs(pFør) < 1e-9 ? "p før = 0" : komma(pEtter / pFør, 3);
    $("p-diff").textContent = ferdig ? komma(pEtter - pFør, 3) + " kg m/s" : "?";
    $("ek-forhold").textContent = !ferdig ? "?" : ekFør < 1e-9 ? "Ek før = 0" : komma(ekEtter / ekFør, 3);
    $("ek-diff").textContent = ferdig ? komma(ekEtter - ekFør, 3) + " J" : "?";
  }

  function tegn() {
    if (scene.b) tegnScene();
    if (graf.b) tegnGraf();
    if (!sim) { for (const id of ["tid", "p-tot", "ek-tot", "kraft"]) $(id).textContent = "–"; $("stot-rader").innerHTML = ""; return; }
    const s = nå();
    $("tid").textContent = komma(tid, 3) + " s";
    $("p-tot").textContent = komma(inn.mA * s.vA + inn.mB * s.vB, 3) + " kg m/s";
    $("ek-tot").textContent = komma(0.5 * inn.mA * s.vA ** 2 + 0.5 * inn.mB * s.vB ** 2, 3) + " J";
    $("kraft").textContent = komma(s.F, 1) + " N";
    oppdaterTabell();
  }

  $("nullstill").addEventListener("click", nullstill);
  for (const id of ["type", "masse-a", "masse-b", "fart-a", "fart-b", "energi"]) $(id).addEventListener("input", nullstill);
  $("storrelse").addEventListener("input", tegn);

  nullstill();
})();

// Egne målinger fra forsøket med vogner
(function () {
  const $ = Sim.$, komma = Sim.komma;
  const tabell = $("egne-rader");
  if (!tabell) return;
  const NOKKEL = "lektorbo-vognstot";
  const KOL = ["mA", "mB", "vA", "vB", "uA", "uB"];
  let rader = Sim.hent(NOKKEL, null) || [tomRad(), tomRad(), tomRad()];

  function tomRad() { return { mA: "", mB: "", vA: "", vB: "", uA: "", uB: "" }; }
  const tall = (s) => { const v = parseFloat(String(s).replace(",", ".").replace("−", "-")); return isFinite(v) ? v : null; };

  function beregn(r) {
    const [mA, mB, vA, vB, uA, uB] = KOL.map((k) => tall(r[k]));
    if ([mA, mB, vA, vB, uA, uB].some((x) => x === null)) return null;
    const pFør = mA * vA + mB * vB, pEtter = mA * uA + mB * uB;
    const ekFør = 0.5 * mA * vA ** 2 + 0.5 * mB * vB ** 2, ekEtter = 0.5 * mA * uA ** 2 + 0.5 * mB * uB ** 2;
    return { pFør, pEtter, ekFør, ekEtter };
  }

  function tegnTabell() {
    tabell.innerHTML = rader.map((r, i) => {
      const felt = KOL.map((k) => `<td><input data-rad="${i}" data-kol="${k}" type="text" inputmode="decimal" value="${String(r[k]).replace(/"/g, "")}" aria-label="${k} i forsøk ${i + 1}"></td>`).join("");
      return `<tr><th scope="row">${i + 1}</th>${felt}<td id="e-p-${i}"></td><td id="e-ek-${i}"></td><td><button class="knapp lys liten" type="button" data-slett="${i}" aria-label="Slett forsøk ${i + 1}">×</button></td></tr>`;
    }).join("");
    oppdaterResultater();
  }

  function oppdaterResultater() {
    rader.forEach((r, i) => {
      const b = beregn(r);
      $("e-p-" + i).textContent = b ? `${komma(b.pFør, 3)} → ${komma(b.pEtter, 3)}` + (Math.abs(b.pFør) > 1e-9 ? ` (${komma(b.pEtter / b.pFør * 100, 0)} %)` : "") : "";
      $("e-ek-" + i).textContent = b ? `${komma(b.ekFør, 3)} → ${komma(b.ekEtter, 3)}` + (b.ekFør > 1e-9 ? ` (${komma(b.ekEtter / b.ekFør * 100, 0)} %)` : "") : "";
    });
    Sim.lagre(NOKKEL, rader);
  }

  tabell.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset.kol) return;
    rader[Number(t.dataset.rad)][t.dataset.kol] = t.value;
    oppdaterResultater();
  });
  tabell.addEventListener("click", (e) => {
    const i = e.target.dataset.slett;
    if (i === undefined) return;
    rader.splice(Number(i), 1);
    if (!rader.length) rader.push(tomRad());
    tegnTabell();
  });
  $("e-ny").addEventListener("click", () => { rader.push(tomRad()); tegnTabell(); });
  $("e-eksempel").addEventListener("click", () => {
    rader = [
      { mA: "0,50", mB: "0,25", vA: "0,42", vB: "0", uA: "0,13", uB: "0,54" },
      { mA: "0,50", mB: "0,25", vA: "0,45", vB: "0", uA: "0,29", uB: "0,29" },
      { mA: "0,25", mB: "0,75", vA: "0", vB: "0", uA: "−0,51", uB: "0,17" },
    ];
    tegnTabell();
  });
  $("e-tom").addEventListener("click", () => {
    if (!confirm("Vil du tømme tabellen?")) return;
    rader = [tomRad(), tomRad(), tomRad()];
    tegnTabell();
  });
  const somTekst = (skille) => {
    const linjer = [["forsøk", "mA (kg)", "mB (kg)", "vA før (m/s)", "vB før (m/s)", "vA etter (m/s)", "vB etter (m/s)", "p før", "p etter", "Ek før", "Ek etter"].join(skille)];
    rader.forEach((r, i) => {
      const b = beregn(r);
      const fmt = (x) => (skille === "," ? String(x) : String(x).replace(".", ","));
      linjer.push([i + 1, ...KOL.map((k) => fmt(tall(r[k]) ?? "")), ...(b ? [b.pFør, b.pEtter, b.ekFør, b.ekEtter].map((x) => fmt(Number(x.toFixed(4)))) : ["", "", "", ""])].join(skille));
    });
    return linjer.join("\n");
  };
  $("e-kopier").addEventListener("click", (e) => Sim.kopier(somTekst("\t"), e.currentTarget));
  $("e-last-ned").addEventListener("click", () => Sim.lastNed(somTekst(","), "vognstot.csv"));

  tegnTabell();
})();
