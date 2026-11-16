// Magnetfelt rundt en leder målt med mobilen. Elevene skriver inn avstanden r og B_z med strømmen
// i begge retninger. Feltet fra lederen er halve differansen, slik at jordas felt faller bort.
// Verktøyet plotter B mot 1/r og tilpasser en rett linje gjennom origo: B = k/r, der k = μ0 I / (2π).

const MU0 = 4 * Math.PI * 1e-7;

function analyser(rader, I) {
  const pkt = [];
  for (const r of rader) {
    const rr = tallFra(r.r), b1 = tallFra(r.b1), b2 = tallFra(r.b2);
    if (rr === null || b1 === null || b2 === null || rr <= 0) continue;
    const B = Math.abs(b1 - b2) / 2 * 1e-6;          // T
    pkt.push({ x: 1 / (rr / 100), y: B, r: rr, B });   // x i 1/m
  }
  let sxy = 0, sxx = 0;
  for (const p of pkt) { sxy += p.x * p.y; sxx += p.x * p.x; }
  const k = sxx > 0 ? sxy / sxx : null;
  return { pkt, k, mu0: k !== null && I > 0 ? 2 * Math.PI * k / I : null };
}
function tallFra(s) {
  const v = parseFloat(String(s ?? "").replace(",", ".").replace("−", "-"));
  return isFinite(v) ? v : null;
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const tabell = $("maale-rader");
  if (!tabell) return;
  const NOKKEL = "lektorbo-mobilfelt";
  const lagret = Sim.hent(NOKKEL, null);
  let rader = lagret?.rader || [tom(), tom(), tom(), tom(), tom()];
  if (lagret?.I) $("strom").value = lagret.I;
  const l = Sim.lerret($("mobilgraf"), tegn);

  function tom() { return { r: "", b1: "", b2: "" }; }
  const I = () => tallFra($("strom").value) || 0;

  function tegnTabell() {
    tabell.innerHTML = rader.map((r, i) => `<tr><th scope="row">${i + 1}</th>${["r", "b1", "b2"].map((k) => `<td><input data-rad="${i}" data-kol="${k}" type="text" inputmode="decimal" value="${String(r[k]).replace(/"/g, "")}" aria-label="${k} i måling ${i + 1}"></td>`).join("")}<td id="m-b-${i}"></td><td><button class="knapp lys liten" type="button" data-slett="${i}" aria-label="Slett måling ${i + 1}">×</button></td></tr>`).join("");
    oppdater();
  }

  function oppdater() {
    const a = analyser(rader, I());
    rader.forEach((r, i) => {
      const b1 = tallFra(r.b1), b2 = tallFra(r.b2);
      $("m-b-" + i).textContent = b1 !== null && b2 !== null ? komma(Math.abs(b1 - b2) / 2, 1) : "";
    });
    $("r-k").textContent = a.k !== null ? Sim.tall(a.k * 1e6, 3) + " µT · m" : "–";
    $("r-mu").textContent = a.mu0 !== null ? Sim.tall(a.mu0 / 1e-7, 3) + " · 10⁻⁷ T m/A" : "–";
    $("r-avvik").textContent = a.mu0 !== null ? komma((a.mu0 / MU0 - 1) * 100, 0) + " %" : "–";
    Sim.lagre(NOKKEL, { rader, I: $("strom").value });
    tegn();
  }

  function tegn() {
    if (!l.b) return;
    const c = l.ctx, f = l.f;
    l.tom();
    const a = analyser(rader, I());
    const xMaks = Math.max(50, ...a.pkt.map((p) => p.x)) * 1.1;
    const yMaks = Math.max(50e-6, ...a.pkt.map((p) => p.y)) * 1.15 * 1e6;
    const { px, py } = Sim.akser(l, { x: [0, xMaks], y: [0, yMaks], xTekst: "1/r / m⁻¹", yTekst: "B / µT" });
    if (a.k !== null) {
      c.strokeStyle = f.blekk; c.setLineDash([6, 4]); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(xMaks), py(Math.min(yMaks, a.k * xMaks * 1e6))); c.stroke(); c.setLineDash([]);
    }
    c.fillStyle = f.f1;
    for (const p of a.pkt) { c.beginPath(); c.arc(px(p.x), py(p.y * 1e6), 4.5, 0, 2 * Math.PI); c.fill(); }
  }

  tabell.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset.kol) return;
    rader[Number(t.dataset.rad)][t.dataset.kol] = t.value;
    oppdater();
  });
  tabell.addEventListener("click", (e) => {
    const i = e.target.dataset.slett;
    if (i === undefined) return;
    rader.splice(Number(i), 1);
    if (!rader.length) rader.push(tom());
    tegnTabell();
  });
  $("strom").addEventListener("input", oppdater);
  $("m-ny").addEventListener("click", () => { rader.push(tom()); tegnTabell(); });
  // Oppdiktede tall laget med I = 5,0 A, en sensor 4 mm over ledningen, bakgrunnsfelt −46 µT og litt støy
  $("m-eksempel").addEventListener("click", () => {
    $("strom").value = "5,0";
    rader = [
      { r: "1,0", b1: "40,0", b2: "−131,8" },
      { r: "1,5", b1: "16,1", b2: "−108,5" },
      { r: "2,0", b1: "1,3", b2: "−94,2" },
      { r: "3,0", b1: "−12,4", b2: "−78,4" },
      { r: "4,0", b1: "−20,4", b2: "−70,6" },
      { r: "5,0", b1: "−25,8", b2: "−65,7" },
      { r: "6,0", b1: "−30,7", b2: "−61,9" },
    ];
    tegnTabell();
  });
  $("m-tom").addEventListener("click", () => { if (!confirm("Vil du tømme tabellen?")) return; rader = [tom(), tom(), tom(), tom(), tom()]; tegnTabell(); });
  const somTekst = (skille) => {
    const fmt = (x) => (skille === "," ? String(x) : String(x).replace(".", ","));
    const linjer = [["r (cm)", "Bz strøm én vei (µT)", "Bz strøm motsatt vei (µT)", "B fra lederen (µT)"].join(skille)];
    for (const r of rader) {
      const b1 = tallFra(r.b1), b2 = tallFra(r.b2);
      linjer.push([fmt(tallFra(r.r) ?? ""), fmt(b1 ?? ""), fmt(b2 ?? ""), b1 !== null && b2 !== null ? fmt(Number((Math.abs(b1 - b2) / 2).toFixed(2))) : ""].join(skille));
    }
    return linjer.join("\n");
  };
  $("m-kopier").addEventListener("click", (e) => Sim.kopier(somTekst("\t"), e.currentTarget));
  $("m-last-ned").addEventListener("click", () => Sim.lastNed(somTekst(","), "magnetfelt-leder.csv"));
  tegnTabell();
})();
