// Eggslippkonkurranse. Klassetabell med fysikken bak hvert forsøk.
// Tabellen lagres bare i nettleseren (localStorage).

const G = 9.81;
const EGG = 0.060;   // kg

// For et egg som slippes fra høyden h: farten ved landing, Δp, og hvor lang bremsetid og bremsestrekning
// innpakningen må gi for at middelkraften skal holde seg under grensen
function eggFysikk(h, grense = 30) {
  const v = Math.sqrt(2 * G * h), dp = EGG * v;
  const dt = dp / (grense - EGG * G);
  return { v, dp, dt, s: v * dt / 2 };
}

// Poeng: høyde i cm delt på masse i gram, ganget med 10. Knuste egg gir null poeng.
function poeng(rad) {
  if (!rad.helt || !(rad.masse > 0) || !(rad.hoyde > 0)) return 0;
  return Math.round(rad.hoyde * 100 / rad.masse * 10);
}

(function () {
  const $ = Sim.$, komma = Sim.komma;
  const liste = $("liste");
  if (!liste) return;
  const NOKKEL = "lektorbo-eggslipp";
  let rader = Sim.hent(NOKKEL, []);
  const tall = (id) => { const v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) ? v : null; };
  const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function forhandsvis() {
    const h = tall("hoyde"), grense = tall("grense") || 30;
    if (!h) { for (const id of ["f-v", "f-dp", "f-dt", "f-s"]) $(id).textContent = "–"; return; }
    const r = eggFysikk(h, grense);
    $("f-v").textContent = komma(r.v, 2) + " m/s";
    $("f-dp").textContent = komma(r.dp, 3) + " kg m/s";
    $("f-dt").textContent = komma(r.dt * 1000, 0) + " ms";
    $("f-s").textContent = komma(r.s * 100, 1) + " cm";
  }

  function tegnListe() {
    const sortert = rader.map((r, i) => ({ ...r, i, p: poeng(r) })).sort((a, b) => b.p - a.p || b.hoyde - a.hoyde);
    liste.innerHTML = sortert.length ? sortert.map((r, plass) => `<tr><td>${r.p > 0 ? plass + 1 : ""}</td><th scope="row">${escape(r.navn)}</th><td>${komma(r.masse, 0)} g</td><td>${komma(r.hoyde, 2)} m</td><td>${r.helt ? "helt" : "knust"}</td><td>${komma(eggFysikk(r.hoyde).v, 1)} m/s</td><td>${r.p}</td><td><button class="knapp lys liten" type="button" data-slett="${r.i}" aria-label="Slett ${escape(r.navn)}">×</button></td></tr>`).join("")
      : `<tr><td colspan="8" class="tom-rad">Ingen forsøk ennå.</td></tr>`;
    Sim.lagre(NOKKEL, rader);
  }

  $("legg-til").addEventListener("click", () => {
    const navn = $("navn").value.trim(), masse = tall("masse"), hoyde = tall("hoyde-tabell");
    if (!navn || !masse || !hoyde) { $("melding").textContent = "Fyll inn gruppenavn, masse og høyde."; return; }
    rader.push({ navn, masse, hoyde, helt: $("helt").value === "ja" });
    $("melding").textContent = "";
    tegnListe();
  });
  liste.addEventListener("click", (e) => {
    const i = e.target.dataset.slett;
    if (i === undefined) return;
    rader.splice(Number(i), 1);
    tegnListe();
  });
  const somTekst = (skille) => {
    const fmt = (x) => (skille === "," ? String(x) : String(x).replace(".", ","));
    return [["gruppe", "masse (g)", "høyde (m)", "resultat", "fart ved landing (m/s)", "poeng"].join(skille),
      ...rader.map((r) => [r.navn.replace(/[,;\t]/g, " "), fmt(r.masse), fmt(r.hoyde), r.helt ? "helt" : "knust", fmt(eggFysikk(r.hoyde).v.toFixed(2)), poeng(r)].join(skille))].join("\n");
  };
  $("kopier-liste").addEventListener("click", (e) => Sim.kopier(somTekst("\t"), e.currentTarget));
  $("last-ned").addEventListener("click", () => Sim.lastNed(somTekst(","), "eggslipp.csv"));
  $("tom-liste").addEventListener("click", () => { if (confirm("Vil du tømme tabellen?")) { rader = []; tegnListe(); } });
  for (const id of ["hoyde", "grense"]) $(id).addEventListener("input", forhandsvis);

  forhandsvis();
  tegnListe();
})();
