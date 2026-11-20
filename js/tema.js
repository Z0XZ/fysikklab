// Lys/mørk modus. Lastes i <head> slik at riktig tema er satt før siden tegnes.
(function () {
  const NOKKEL = "lektorbo-tema";
  const rot = document.documentElement;
  const systemMorkt = matchMedia("(prefers-color-scheme: dark)");

  function lagret() {
    try { return localStorage.getItem(NOKKEL); } catch (e) { return null; }
  }
  function lagre(tema) {
    try { localStorage.setItem(NOKKEL, tema); } catch (e) { /* valget gjelder da bare denne siden */ }
  }
  const gjeldende = () => rot.dataset.tema || (systemMorkt.matches ? "mork" : "lys");

  const start = lagret();
  if (start === "lys" || start === "mork") rot.dataset.tema = start;

  function oppdaterKnapp() {
    const knapp = document.getElementById("tema-knapp");
    if (!knapp) return;
    const tekst = gjeldende() === "mork" ? "Bytt til lys modus" : "Bytt til mørk modus";
    knapp.setAttribute("aria-label", tekst);
    knapp.title = tekst;
  }

  document.addEventListener("DOMContentLoaded", () => {
    oppdaterKnapp();
    document.getElementById("tema-knapp").addEventListener("click", () => {
      const nytt = gjeldende() === "mork" ? "lys" : "mork";
      rot.dataset.tema = nytt;
      lagre(nytt);
      oppdaterKnapp();
      window.dispatchEvent(new Event("temaendring"));
    });
  });
  systemMorkt.addEventListener("change", oppdaterKnapp);
})();

// Fagvalg: Alle, Fysikk 1 eller Fysikk 2. Valget står i nedfallsmenyen øverst, lagres i nettleseren og følger
// med fra side til side. Oversiktssidene (simuleringer, undervisningsopplegg og programmering, se js/filter.js)
// og kompetansemålsiden viser da bare det faget.
// Lenker med ?fag=f1, ?fag=f2 eller ?fag=alle setter valget. Uten JavaScript vises alt som før.
(function () {
  const NOKKEL = "fysikklab-fag";
  const GYLDIG = ["", "f1", "f2"];
  const hentLagret = () => { try { const v = localStorage.getItem(NOKKEL) || ""; return GYLDIG.includes(v) ? v : ""; } catch (e) { return ""; } };
  let fag = hentLagret();
  const fraAdresse = new URLSearchParams(location.search).get("fag");
  if (fraAdresse === "alle") fag = "";
  else if (GYLDIG.includes(fraAdresse) && fraAdresse) fag = fraAdresse;

  window.Fag = {
    hent: () => fag,
    navn: (f) => ({ f1: "Fysikk 1", f2: "Fysikk 2" })[f] || "Alle fag",
    sett(ny) {
      if (!GYLDIG.includes(ny) || ny === fag) return;
      fag = ny;
      try { ny ? localStorage.setItem(NOKKEL, ny) : localStorage.removeItem(NOKKEL); } catch (e) { /* gjelder bare denne siden */ }
      oppdaterSide();
      window.dispatchEvent(new Event("fagendring"));
    },
  };
  if (fraAdresse) { try { fag ? localStorage.setItem(NOKKEL, fag) : localStorage.removeItem(NOKKEL); } catch (e) { /* ingen lagring */ } }

  function oppdaterSide() {
    const valg = document.getElementById("fag-valg");
    if (valg) valg.value = fag;
    // Deler av en side som bare gjelder ett fag (for eksempel på kompetansemålsiden)
    for (const d of document.querySelectorAll("[data-fagdel]")) d.hidden = !!fag && d.dataset.fagdel !== fag;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const knapp = document.getElementById("tema-knapp");
    // Ikke på utdanningsvalg-sidene for 10. klasse
    if (knapp && !/\/utdanningsvalg\//.test(location.pathname)) {
      const valg = document.createElement("select");
      valg.id = "fag-valg";
      valg.className = "fag-valg";
      valg.setAttribute("aria-label", "Vis innhold for faget");
      valg.title = "Vis innhold for faget";
      valg.innerHTML = '<option value="">Alle fag</option><option value="f1">Fysikk 1</option><option value="f2">Fysikk 2</option>';
      knapp.before(valg);
      valg.addEventListener("change", () => window.Fag.sett(valg.value));
    }
    oppdaterSide();
  });
})();
