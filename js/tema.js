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
