// Det interaktive periodesystemet i formelsamlingen (bygg/formelsamling.py lager tabellen og teksten).
// Et trykk på et grunnstoff viser isotoper, løsrivningsarbeid og hva grunnstoffet brukes til i fysikken.
(function () {
  const ps = document.querySelector(".ps");
  const info = document.getElementById("ps-info");
  const dataEl = document.getElementById("ps-data");
  if (!ps || !info || !dataEl) return;
  const data = JSON.parse(dataEl.textContent);
  let valgt = null;
  function vis(knapp) {
    if (valgt) valgt.setAttribute("aria-pressed", "false");
    valgt = knapp;
    knapp.setAttribute("aria-pressed", "true");
    info.innerHTML = data[knapp.dataset.z];
    const b = info.getBoundingClientRect();
    if (b.bottom > innerHeight || b.top < 0) info.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  for (const k of ps.querySelectorAll(".ps-c")) k.setAttribute("aria-pressed", "false");
  ps.addEventListener("click", (e) => { const k = e.target.closest(".ps-c"); if (k) vis(k); });
  // Piltaster flytter mellom grunnstoffene
  ps.addEventListener("keydown", (e) => {
    const k = e.target.closest(".ps-c");
    const steg = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!k || !steg) return;
    const neste = ps.querySelector(`.ps-c[data-z="${+k.dataset.z + steg}"]`);
    if (neste) { e.preventDefault(); neste.focus(); vis(neste); }
  });
})();
