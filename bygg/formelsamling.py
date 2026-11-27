# Formelsamlingen for Fysikk 1 og 2: nettsiden opplegg/formelsamling.html og PDF-ene i LaTeX.
#   Nettsiden bygges av bygg.py. PDF-ene lages med  python3 bygg/formelsamling_pdf.py  (krever lualatex).
#   Alt innholdet står i TEMAER og tabellene nederst. Endre her, og kjør begge kommandoene.
#
# Formlene skrives med en liten markering som gjøres om både til HTML og til LaTeX:
#   _x eller _{...}   senket skrift, rett (for merkelapper som E_k). \i{n} gir kursiv inni: x_\i{n}
#   ^x eller ^{...}   hevet skrift, kursiv
#   \frac{a}{b}  brøk     \sqrt{x}  rot     \vec{F}  vektor     \bar{x}  gjennomsnitt     \t{tekst}  rett tekst
#   \l( og \r)   parenteser som vokser med innholdet i PDF-en
#   Latinske bokstaver blir kursiv (variabler). sin, cos, tan, ln og lim blir rette. Små greske bokstaver får en egen skrift på nettsiden.
#   - blir minustegn, * blir multiplikasjonsprikk og ' blir derivasjonsmerke. «, » (komma og mellomrom) gir luft i PDF-en.
# I forklaringene skrives formler mellom $ og $, for eksempel "$v_0$ er startfarten".
import html as _html, os, re

FIL = "formelsamling"
FAGNAVN = {"f1": "Fysikk 1", "f2": "Fysikk 2"}
ORD = {"sin", "cos", "tan", "ln", "lim"}
GRESK = set("αβγδεηθκλμνξρστφχψω")

def _latin(c):
    return c.isalpha() and ord(c) < 0x370   # latinske bokstaver, også æ, ø og å

def _gruppe(s, i):
    """Leser {...} eller ett tegn fra posisjon i. Gir (innhold, ny posisjon)."""
    if s[i] == "{":
        d, j = 1, i + 1
        while d:
            d += {"{": 1, "}": -1}.get(s[j], 0); j += 1
        return s[i + 1:j - 1], j
    return s[i], i + 1

def _forbered(s):
    s = re.sub(r"_\\t\{", "_{", s)
    return re.sub(r"_\\i\{([^{}]+)\}", r"_{\\i{\1}}", s)

def h(s, rett=False):
    """Markering → HTML."""
    s = _forbered(s); ut, i = [], 0
    while i < len(s):
        c = s[i]
        kom = re.match(r"\\([a-z]+)", s[i:])
        if kom:
            navn = kom.group(1); j = i + len(kom.group(0))
            if navn == "frac":
                a, j = _gruppe(s, j); b, j = _gruppe(s, j)
                ut.append(f'<span class="br"><span>{h(a, rett)}</span><span>{h(b, rett)}</span></span>')
            elif navn == "sqrt":
                a, j = _gruppe(s, j); ut.append(f'√<span class="rot">{h(a, rett)}</span>')
            elif navn == "vec":
                a, j = _gruppe(s, j); ut.append(f'<span class="vek">{h(a, rett)}</span>')
            elif navn == "bar":
                a, j = _gruppe(s, j); ut.append(f'<span class="strek">{h(a, rett)}</span>')
            elif navn == "t":
                a, j = _gruppe(s, j); ut.append(_html.escape(a, quote=False))
            elif navn == "i":
                a, j = _gruppe(s, j); ut.append(h(a, False))
            elif navn in ("l", "r"):
                ut.append(s[j]); j += 1
            elif navn in ORD:
                ut.append(navn)
            else:
                raise ValueError("ukjent kommando \\" + navn + " i " + s)
            i = j
        elif c == " " and 0 < i < len(s) - 1 and s[i - 1].isdigit() and s[i + 1].isdigit():
            ut.append("\u202f"); i += 1
        elif c in "_^":
            a, i = _gruppe(s, i + 1)
            tag = "sub" if c == "_" else "sup"
            ut.append(f"<{tag}>{h(a, rett=(c == '_'))}</{tag}>")
        elif _latin(c):
            j = i
            while j < len(s) and _latin(s[j]): j += 1
            w = s[i:j]
            ut.append(w if (w in ORD or rett) else "".join(f"<i>{b}</i>" for b in w)); i = j
        elif c == "," and i + 1 < len(s) and s[i + 1] == " ":
            ut.append(",&ensp;&ensp;"); i += 2
        elif s.startswith("   ", i):
            ut.append("&ensp;&ensp;"); i += 3
        elif c in GRESK:   # egen skrift for greske bokstaver, siden α i sideskriften ligner for mye på a
            ut.append(f'<span class="gr">{c}</span>'); i += 1
        else:
            ut.append({"-": "−", "*": "·", "'": "′", "<": "&lt;", ">": "&gt;", "&": "&amp;"}.get(c, c)); i += 1
    return "".join(ut)

def l(s, rett=False):
    """Markering → LaTeX (matematikkmodus, unicode-math)."""
    s = _forbered(s); ut, i = [], 0
    while i < len(s):
        c = s[i]
        kom = re.match(r"\\([a-z]+)", s[i:])
        if kom:
            navn = kom.group(1); j = i + len(kom.group(0))
            if navn == "frac":
                a, j = _gruppe(s, j); b, j = _gruppe(s, j); ut.append(f"\\frac{{{l(a, rett)}}}{{{l(b, rett)}}}")
            elif navn in ("sqrt", "vec", "bar"):
                a, j = _gruppe(s, j); ut.append(f"\\{navn}{{{l(a, rett)}}}")
            elif navn == "t":
                a, j = _gruppe(s, j); ut.append("\\text{" + _tekst_esc(a) + "}")
            elif navn == "i":
                a, j = _gruppe(s, j); ut.append("{" + l(a, False) + "}")
            elif navn == "l":
                ut.append("\\left" + s[j]); j += 1
            elif navn == "r":
                ut.append("\\right" + s[j]); j += 1
            elif navn in ORD:
                ut.append("\\" + navn)
            else:
                raise ValueError("ukjent kommando \\" + navn + " i " + s)
            i = j
        elif c in "_^":
            a, i = _gruppe(s, i + 1)
            ut.append(c + "{" + l(a, rett=(c == "_")) + "}")
        elif _latin(c):
            j = i
            while j < len(s) and _latin(s[j]): j += 1
            w = s[i:j]
            if w in ORD: ut.append("\\" + w + " ")
            elif rett: ut.append("\\mathrm{" + w + "}")
            else: ut.append(w)
            i = j
        elif c == " " and 0 < i < len(s) - 1 and s[i - 1].isdigit() and s[i + 1].isdigit():
            ut.append("\\,"); i += 1
        elif c == "," and 0 < i < len(s) - 1 and s[i + 1].isdigit() and s[i - 1].isdigit():
            ut.append("{,}"); i += 1
        elif c == "," and i + 1 < len(s) and s[i + 1] == " ":
            ut.append(",\\quad "); i += 2
        elif c == " " and i + 2 < len(s) and s[i + 1] == " " and s[i + 2] == " ":   # tre mellomrom gir luft
            ut.append("\\quad "); i += 3
        else:
            ut.append({"*": "\\cdot ", "…": "\\dots ", "%": "\\%", "|": "\\vert "}.get(c, c)); i += 1
    return "".join(ut)

def _tekst_esc(t):
    return t.replace("\\", "").replace("%", "\\%").replace("&", "\\&").replace("#", "\\#").replace("_", "\\_")

def forkl_h(t):
    deler = t.split("$")
    return "".join(h(d) if k % 2 else _html.escape(d, quote=False) for k, d in enumerate(deler))

def forkl_l(t):
    deler = t.split("$")
    return "".join(f"${l(d)}$" if k % 2 else _tekst_esc(d) for k, d in enumerate(deler))

# ---------- Innholdet ----------
class F:
    """Én formel. begge: hører til begge fagene. ogsa: andre temaer formelen også er relevant for."""
    def __init__(self, navn, formel, forkl="", begge=False, ogsa=()):
        self.navn, self.formel, self.forkl, self.begge, self.ogsa = navn, formel, forkl or "", begge, tuple(ogsa)

# Hvert tema: (fag, navn, [formler], merknad). Temanavnene er de samme som på resten av fysikklab.no.
TEMAER = [
 ("f1", "Introduksjon til fysikk", [
   F("Massetetthet", r"ρ = \frac{m}{V}"),
   F("Gjennomsnitt", r"\bar{x} = \frac{x_1 + x_2 + … + x_\i{n}}{n}", "$n$ er antall målinger.", begge=True),
   F("Absolutt usikkerhet", r"Δx = \frac{x_\t{maks} - x_\t{min}}{2}", "Et enkelt anslag fra spredningen i målingene.", begge=True),
   F("Relativ usikkerhet", r"\frac{Δx}{x}", "Oppgis ofte i prosent.", begge=True),
   F("Måleresultat", r"x = \bar{x} ± Δx", None, begge=True),
   F("Sum og differanse", r"s = x ± y   ⇒   Δs = Δx + Δy", "De absolutte usikkerhetene legges sammen.", begge=True),
   F("Produkt og kvotient", r"p = xy \t{ eller } p = \frac{x}{y}   ⇒   \frac{Δp}{p} = \frac{Δx}{x} + \frac{Δy}{y}", "De relative usikkerhetene legges sammen.", begge=True),
 ], None),
 ("f1", "Rettlinjet bevegelse", [
   F("Konstant fart", r"s = vt"),
   F("Gjennomsnittsfart", r"\bar{v} = \frac{Δs}{Δt}"),
   F("Momentanfart", r"v = \lim_{\i{Δt} → 0} \frac{Δs}{Δt} = s'(t)", "Stigningstallet til tangenten i en $s$,$t$-graf.", begge=True),
   F("Akselerasjon", r"\bar{a} = \frac{Δv}{Δt}, a = v'(t)", "Stigningstallet til tangenten i en $v$,$t$-graf.", begge=True),
   F("Bevegelseslikningene", r"v = v_0 + at", "Gjelder bare når akselerasjonen er konstant.", begge=True),
   F("", r"s = v_0t + \frac{1}{2}at^2", None, begge=True),
   F("", r"s = \frac{v_0 + v}{2} * t", None, begge=True),
   F("", r"v^2 - v_0^2 = 2as", None, begge=True),
   F("Fritt fall", r"a = g = 9,81 \t{ m/s}^2", "Når vi ser bort fra luftmotstand."),
 ], "Arealet under en $v$,$t$-graf er forflytningen. Arealet under en $a$,$t$-graf er endringen i fart."),
 ("f1", "Krefter", [
   F("Newtons 1. lov", r"Σ\vec{F} = \vec{0}   ⇔   \vec{v} \t{ er konstant}", "Gjenstanden er i ro eller beveger seg rettlinjet med konstant fart.", begge=True),
   F("Newtons 2. lov", r"Σ\vec{F} = m\vec{a}", None, begge=True),
   F("Newtons 3. lov", r"\vec{F}_\t{AB} = -\vec{F}_\t{BA}", "Kraft og motkraft virker på hver sin gjenstand.", begge=True),
   F("Tyngde", r"G = mg", None, begge=True),
   F("Friksjon", r"R = μN", "$μ$ er friksjonstallet og $N$ er normalkraften.", begge=True),
   F("Luftmotstand", r"L = bv \t{ eller } L = kv^2", "Lineær ved lav fart, kvadratisk ved høy fart."),
   F("Fjærkraft", r"F = kx", "Hookes lov. $k$ er fjærstivheten og $x$ er forlengelsen eller sammentrykningen.", begge=True),
   F("Oppdrift", r"B = ρ_\t{f}Vg", "$ρ_f$ er massetettheten til væsken eller gassen, $V$ er volumet som er fortrengt."),
 ], None),
 ("f1", "Mekanisk energi", [
   F("Arbeid", r"W = Fs \cos α", "$α$ er vinkelen mellom kraften og forflytningen.", begge=True),
   F("Kinetisk energi", r"E_k = \frac{1}{2}mv^2", None, begge=True),
   F("Potensiell energi", r"E_p = mgh", "$h$ er høyden over et valgt nullnivå.", begge=True),
   F("Fjærenergi", r"E_p = \frac{1}{2}kx^2", None, begge=True),
   F("Mekanisk energi", r"E = E_k + E_p", None, begge=True),
   F("Energibevaring", r"\frac{1}{2}mv_0^2 + mgh_0 = \frac{1}{2}mv^2 + mgh", "Når bare tyngden gjør arbeid.", begge=True),
   F("Med andre krefter", r"E = E_0 + W_\t{A}", "$W_A$ er arbeidet fra andre krefter enn tyngden og fjærkraften.", begge=True),
   F("Friksjonsarbeid", r"W_\i{R} = -Rs", None, begge=True),
   F("Arbeid–energi", r"W_\t{ΣF} = ΔE_k", "Arbeidet fra kraftsummen er lik endringen i kinetisk energi.", begge=True),
   F("Effekt", r"P = \frac{W}{t} = Fv"),
   F("Virkningsgrad", r"η = \frac{\t{nyttig energi}}{\t{tilført energi}} = \frac{\t{nyttig effekt}}{\t{tilført effekt}}"),
 ], None),
 ("f1", "Bevegelsesmengde og støt", [
   F("Bevegelsesmengde", r"\vec{p} = m\vec{v}", None, begge=True),
   F("Impuls", r"\vec{I} = Σ\vec{F} * Δt = Δ\vec{p}", "Arealet under en $F$,$t$-graf.", begge=True),
   F("Newtons 2. lov", r"Σ\vec{F} = \frac{Δ\vec{p}}{Δt}"),
   F("Bevaring", r"m_\t{A}\vec{v}_\t{A0} + m_\t{B}\vec{v}_\t{B0} = m_\t{A}\vec{v}_\t{A} + m_\t{B}\vec{v}_\t{B}", "Når summen av ytre krefter er null.", begge=True),
   F("Fullstendig uelastisk", r"m_\t{A}v_\t{A0} + m_\t{B}v_\t{B0} = (m_\t{A} + m_\t{B})v", "Gjenstandene henger sammen etter støtet."),
   F("Elastisk støt", r"ΣE_k \t{ før} = ΣE_k \t{ etter}", "I et uelastisk støt går noe av den kinetiske energien over til andre former."),
 ], None),
 ("f1", "Elektrisitet", [
   F("Strøm", r"I = \frac{Q}{t}", "1 A = 1 C/s"),
   F("Spenning", r"U = \frac{W}{Q}", "1 V = 1 J/C"),
   F("Resistans", r"R = \frac{U}{I}", "Ohms lov $U = RI$ gjelder når $R$ er konstant."),
   F("Resistivitet", r"R = ρ\frac{L}{A}", "$L$ er lengden og $A$ er tverrsnittsarealet til lederen."),
   F("Effekt", r"P = UI = RI^2 = \frac{U^2}{R}"),
   F("Energi", r"W = Pt = UIt", "1 kWh = 3,6 MJ"),
   F("Seriekobling", r"R_\t{tot} = R_1 + R_2 + …"),
   F("Parallellkobling", r"\frac{1}{R_\t{tot}} = \frac{1}{R_1} + \frac{1}{R_2} + …"),
   F("Kirchhoffs 1. lov", r"ΣI_\t{inn} = ΣI_\t{ut}", "I et forgreningspunkt."),
   F("Kirchhoffs 2. lov", r"ε = U_1 + U_2 + …", "Rundt en lukket sløyfe er ems lik summen av spenningsfallene."),
   F("Polspenning", r"U = ε - R_\t{i}I", "$ε$ er ems og $R_i$ er den indre resistansen."),
 ], None),
 ("f1", "Termofysikk", [
   F("Temperatur", r"T = t + 273", "$T$ i kelvin og $t$ i grader celsius (nøyaktig 273,15)."),
   F("Trykk", r"p = \frac{F}{A}", "1 Pa = 1 N/m²"),
   F("Ideell gass", r"pV = NkT", "$N$ er antall molekyler og $k$ er Boltzmanns konstant."),
   F("Lukket gassmengde", r"\frac{p_1V_1}{T_1} = \frac{p_2V_2}{T_2}"),
   F("Kinetisk energi i gass", r"\bar{E}_k = \frac{3}{2}kT", "Gjennomsnittlig kinetisk energi per molekyl."),
   F("Spesifikk varmekapasitet", r"c = \frac{Q}{mΔT}", "Varmekapasitet: $C = Q/ΔT$"),
   F("Faseovergang", r"Q = lm", "$l$ er spesifikk smeltevarme eller fordampingsvarme."),
   F("Termofysikkens 1. lov", r"ΔU = W + Q", "$W$ er arbeid gjort på systemet og $Q$ er varme tilført systemet."),
   F("Arbeid på gass", r"W = -pΔV", "Ved konstant trykk."),
   F("Varmekraftmaskin", r"η = \frac{W}{Q_\t{tilført}} ≤ 1 - \frac{T_\t{kald}}{T_\t{varm}}", "Temperaturene i kelvin."),
   F("Varmepumpe", r"\t{COP} = \frac{Q_\t{avgitt}}{W} ≤ \frac{T_\t{varm}}{T_\t{varm} - T_\t{kald}}", "Varmefaktoren: varme levert per energi tilført."),
 ], "Termofysikkens 2. lov: Varme går av seg selv bare fra varmt til kaldt. Entropien i et isolert system øker."),
 ("f1", "Stråling og klima", [
   F("Periode og frekvens", r"f = \frac{1}{T}", None, begge=True),
   F("Bølgeligningen", r"v = λf", "For lys i vakuum er $v = c$.", begge=True),
   F("Fotonenergi", r"E = hf = \frac{hc}{λ}", None, begge=True, ogsa=["Kvantefysikk"]),
   F("Wiens forskyvningslov", r"λ_\t{topp} = \frac{a}{T}", "Bølgelengden der et svart legeme stråler mest."),
   F("Stefan–Boltzmanns lov", r"P = σAT^4", "Utstrålt effekt fra et svart legeme med areal $A$."),
   F("Strålingstetthet", r"I = \frac{P}{A}", "Effekt per areal, W/m²."),
   F("Avstand fra en kilde", r"I = \frac{P}{4πr^2}", "Kilden stråler likt i alle retninger."),
   F("Albedo", r"α = \frac{\t{reflektert effekt}}{\t{innkommende effekt}}"),
   F("Jordas strålingsbalanse", r"(1 - α)S * πR^2 = σT^4 * 4πR^2", "$S$ er solarkonstanten. Gir $T ≈ 255$ K uten drivhuseffekt."),
 ], None),
 ("f1", "Atommodeller", [
   F("Energinivåer i hydrogen", r"E_\i{n} = -\frac{B}{n^2}", "$n$ = 1, 2, 3, … og $B$ er Bohrs konstant."),
   F("Foton ved overgang", r"hf = E_\i{n} - E_\i{m}", "Fra nivå $n$ til et lavere nivå $m$."),
   F("Elektronvolt", r"1 \t{ eV} = 1,60 * 10^{-19} \t{ J}"),
 ], "Et emisjonsspekter har lyse linjer fra atomer som sender ut fotoner. Et absorpsjonsspekter har mørke linjer der gassen tar opp fotoner."),
 ("f1", "Kjerner og stjerner", [
   F("Nukleontall", r"A = Z + N", "$Z$ er protontallet (ladningstallet) og $N$ er nøytrontallet."),
   F("Hvileenergi", r"E_0 = mc^2", None, begge=True, ogsa=["Spesiell relativitetsteori"]),
   F("Massedefekt", r"Δm = Zm_\t{p} + Nm_\t{n} - m_\t{kjerne}", "Med atommasser bruker vi massen til hydrogenatomet i stedet for $m_p$."),
   F("Bindingsenergi", r"E_\t{b} = Δm * c^2"),
   F("Frigjort energi", r"ΔE = (m_\t{før} - m_\t{etter})c^2", "Ved kjernereaksjoner og radioaktivt henfall."),
   F("Halveringstid", r"N = N_0 * \l(\frac{1}{2}\r)^{t/T_{1/2}}", "$N$ er antall kjerner som er igjen etter tiden $t$."),
   F("Luminositet", r"L = 4πR^2σT^4", "Utstrålt effekt fra en stjerne med radius $R$ og overflatetemperatur $T$."),
 ], "I kjernereaksjoner er ladning, nukleontall, leptontall og energi bevart."),

 ("f2", "Bevegelse og krefter i to dimensjoner", [
   F("Fart og akselerasjon", r"\vec{v} = \vec{r}'(t), \vec{a} = \vec{v}'(t)", "$\\vec{r}$ er posisjonsvektoren."),
   F("Dekomponering", r"F_\i{x} = F \cos α, F_\i{y} = F \sin α", "$α$ er vinkelen mellom kraften og $x$-aksen."),
   F("Størrelse og retning", r"F = \sqrt{F_\i{x}^2 + F_\i{y}^2}, \tan α = \frac{F_\i{y}}{F_\i{x}}"),
   F("Skråplan", r"G_\t{∥} = mg \sin α, G_\t{⊥} = mg \cos α", "Tyngden dekomponert langs og vinkelrett på et skråplan med helning $α$."),
   F("Startfart i kast", r"v_\t{0x} = v_0 \cos α, v_\t{0y} = v_0 \sin α"),
   F("Kast", r"x = v_\t{0x}t, y = v_\t{0y}t - \frac{1}{2}gt^2", "$y$-aksen peker oppover. Uten luftmotstand."),
   F("", r"v_\i{x} = v_\t{0x}, v_\i{y} = v_\t{0y} - gt"),
   F("Banefart og retning", r"v = \sqrt{v_\i{x}^2 + v_\i{y}^2}, \tan θ = \frac{v_\i{y}}{v_\i{x}}"),
   F("Arbeid fra variabel kraft", r"W = ∫_{\i{x_1}}^{x_2} F(x) \t{ d}x", "Arealet under en $F$,$x$-graf."),
 ], None),
 ("f2", "Sirkelbevegelse", [
   F("Vinkelfart", r"ω = \frac{Δθ}{Δt} = \frac{v}{r}", "$θ$ måles i radianer."),
   F("Banefart", r"v = \frac{2πr}{T}", "$T$ er omløpstiden."),
   F("Sentripetalakselerasjon", r"a = \frac{v^2}{r} = \frac{4π^2r}{T^2}", "Rettet inn mot sentrum."),
   F("Sentripetalkraft", r"ΣF = m\frac{v^2}{r}", "Kraftsummen inn mot sentrum."),
   F("Matematisk pendel", r"T = 2π\sqrt{\frac{l}{g}}", "Ved små utslag."),
 ], None),
 ("f2", "Gravitasjon", [
   F("Newtons gravitasjonslov", r"G = γ\frac{Mm}{r^2}", "$γ$ er gravitasjonskonstanten og $r$ er avstanden mellom sentrene."),
   F("Gravitasjonsfeltstyrke", r"g = γ\frac{M}{r^2}"),
   F("Potensiell energi", r"E_p = -γ\frac{Mm}{r}", "Nullnivået er uendelig langt borte."),
   F("Mekanisk energi", r"E = \frac{1}{2}mv^2 - γ\frac{Mm}{r}"),
   F("Sirkelbane", r"v = \sqrt{\frac{γM}{r}}"),
   F("Keplers 3. lov", r"\frac{T^2}{r^3} = \frac{4π^2}{γM}", "For sirkelbaner rundt et legeme med masse $M$."),
   F("Unnslipningsfart", r"v = \sqrt{\frac{2γM}{r}}"),
 ], None),
 ("f2", "Spesiell relativitetsteori", [
   F("Lorentzfaktoren", r"γ = \frac{1}{\sqrt{1 - v^2/c^2}}"),
   F("Tidsdilatasjon", r"t = γt_0", "$t_0$ er egentiden, målt der hendelsene skjer på samme sted."),
   F("Lengdekontraksjon", r"l = \frac{l_0}{γ}", "$l_0$ er egenlengden, målt i ro i forhold til gjenstanden."),
   F("Bevegelsesmengde", r"p = γmv"),
   F("Total energi", r"E = γmc^2"),
   F("Kinetisk energi", r"E_k = E - E_0 = (γ - 1)mc^2"),
   F("Energi og bevegelsesmengde", r"E^2 = (pc)^2 + (mc^2)^2"),
 ], None),
 ("f2", "Elektriske felt og krefter", [
   F("Coulombs lov", r"F = k_\t{e}\frac{|q_1q_2|}{r^2}"),
   F("Elektrisk feltstyrke", r"\vec{E} = \frac{\vec{F}}{q}"),
   F("Felt fra en punktladning", r"E = k_\t{e}\frac{|Q|}{r^2}"),
   F("Homogent felt", r"E = \frac{U}{d}", "Mellom to parallelle plater med avstand $d$."),
   F("Arbeid på ladning", r"W = qU", "Ladning som akselereres fra ro: $\\frac{1}{2}mv^2 = qU$."),
   F("Potensiell energi", r"E_p = k_\t{e}\frac{q_1q_2}{r}", "Mellom to punktladninger."),
 ], None),
 ("f2", "Magnetiske felt og krefter", [
   F("Kraft på ladd partikkel", r"\vec{F} = q\vec{v} × \vec{B}, F = qvB \sin α"),
   F("Kraft på strømleder", r"\vec{F} = I\vec{L} × \vec{B}, F = ILB \sin α"),
   F("Felt rundt rett leder", r"B = k_\t{m}\frac{I}{r}", "Biot–Savarts lov."),
   F("Sirkelbane i magnetfelt", r"r = \frac{mv}{qB}", "Når farten står vinkelrett på feltet."),
 ], None),
 ("f2", "Elektromagnetisk induksjon", [
   F("Magnetisk fluks", r"Φ = \vec{B} * \vec{A} = BA \cos α", "1 Wb = 1 T m²"),
   F("Faradays induksjonslov", r"ε = -N\frac{ΔΦ}{Δt} = -NΦ'(t)", "Minustegnet viser Lenz' regel."),
   F("Leder i bevegelse", r"ε = vBL"),
   F("Generator", r"ε(t) = NωBA \sin ωt"),
   F("Effektivverdier", r"U_\t{e} = \frac{U_\t{m}}{\sqrt{2}}, I_\t{e} = \frac{I_\t{m}}{\sqrt{2}}", "Middeleffekt: $P = U_e I_e$"),
   F("Transformator", r"\frac{U_\t{s}}{U_\t{p}} = \frac{N_\t{s}}{N_\t{p}}, U_\t{p}I_\t{p} = U_\t{s}I_\t{s}", "Den siste likningen gjelder en tapsfri transformator."),
 ], "Lenz' regel: Den induserte strømmen går slik at magnetfeltet den lager, motvirker endringen som skaper den."),
 ("f2", "Kvantefysikk", [
   F("Fotoelektrisk effekt", r"E_k = hf - W", "$W$ er løsrivningsarbeidet, $W = hf_\\t{min}$."),
   F("Fotonets bevegelsesmengde", r"p = \frac{h}{λ} = \frac{hf}{c}"),
   F("de Broglie-bølgelengde", r"λ = \frac{h}{p}"),
   F("Comptonspredning", r"Δλ = \frac{h}{m_\t{e}c}(1 - \cos θ)"),
   F("Uskarphetsrelasjonene", r"Δx * Δp ≥ \frac{h}{4π}, ΔE * Δt ≥ \frac{h}{4π}"),
   F("Pardanning og annihilasjon", r"E_\t{fotoner} = 2mc^2 + E_k", "$m$ er massen til partikkelen og antipartikkelen, $E_k$ er deres samlede kinetiske energi."),
 ], None),
]

# Tabeller: (overskrift, kolonner, rader). Celler som begynner med $ er markering (som formlene).
KONSTANTER = ("Konstanter", ["", "", ""], [
 ("Tyngdeakselerasjonen", "$g", "$9,81 \\t{ m/s}^2"),
 ("Lysfarten i vakuum", "$c", "$3,00 * 10^8 \\t{ m/s}"),
 ("Plancks konstant", "$h", "$6,63 * 10^{-34} \\t{ J s}"),
 ("Elementærladningen", "$e", "$1,60 * 10^{-19} \\t{ C}"),
 ("Boltzmanns konstant", "$k", "$1,38 * 10^{-23} \\t{ J/K}"),
 ("Stefan–Boltzmanns konstant", "$σ", "$5,67 * 10^{-8} \\t{ W/(m}^2\\t{ K}^4\\t{)}"),
 ("Wiens konstant", "$a", "$2,90 * 10^{-3} \\t{ K m}"),
 ("Bohrs konstant", "$B", "$2,18 * 10^{-18} \\t{ J} = 13,6 \\t{ eV}"),
 ("Gravitasjonskonstanten", "$γ", "$6,67 * 10^{-11} \\t{ N m}^2\\t{/kg}^2"),
 ("Coulombkonstanten", "$k_e", "$8,99 * 10^9 \\t{ N m}^2\\t{/C}^2"),
 ("Biot–Savart-konstanten", "$k_m", "$2,00 * 10^{-7} \\t{ T m/A}"),
 ("Solarkonstanten", "$S", "$1361 \\t{ W/m}^2"),
 ("Lysår", "", "$1 \\t{ lysår} = 9,46 * 10^{15} \\t{ m}"),
])
MASSER = ("Masser", ["", "", ""], [
 ("Atommasseenheten", "$u", "$1,66 * 10^{-27} \\t{ kg}"),
 ("Elektronet", "$m_e", "$9,109 * 10^{-31} \\t{ kg} = 0,000 548 6 \\t{ u}"),
 ("Protonet", "$m_p", "$1,6726 * 10^{-27} \\t{ kg} = 1,007 276 \\t{ u}"),
 ("Nøytronet", "$m_n", "$1,6749 * 10^{-27} \\t{ kg} = 1,008 665 \\t{ u}"),
 ("Hydrogenatomet (H-1)", "", "$1,007 825 \\t{ u}"),
 ("Heliumatomet (He-4)", "", "$4,002 603 \\t{ u}"),
])
PREFIKSER = ("Prefikser", ["", "", ""], [
 ("tera", "T", "$10^{12}"), ("giga", "G", "$10^9"), ("mega", "M", "$10^6"), ("kilo", "k", "$10^3"),
 ("desi", "d", "$10^{-1}"), ("centi", "c", "$10^{-2}"), ("milli", "m", "$10^{-3}"), ("mikro", "μ", "$10^{-6}"),
 ("nano", "n", "$10^{-9}"), ("piko", "p", "$10^{-12}"), ("femto", "f", "$10^{-15}"),
])
STOFF = ("Stoffdata", ["Stoff", "Spesifikk varmekapasitet", "Annet"], [
 ("Vann", "4180 J/(kg K)", "tetthet 1000 kg/m³, fordampingsvarme 2,26 MJ/kg"),
 ("Is", "2090 J/(kg K)", "tetthet 917 kg/m³, smeltevarme 334 kJ/kg"),
 ("Luft", "1005 J/(kg K)", "tetthet 1,2 kg/m³ ved 20 °C"),
 ("Aluminium", "900 J/(kg K)", "resistivitet 2,7 · 10⁻⁸ Ω m"),
 ("Jern", "450 J/(kg K)", "resistivitet 9,7 · 10⁻⁸ Ω m"),
 ("Kobber", "385 J/(kg K)", "resistivitet 1,7 · 10⁻⁸ Ω m"),
])
SOL = ("Solsystemet", ["", "Masse", "Radius", "Avstand"], [
 ("Sola", "$1,99 * 10^{30} \\t{ kg}", "$6,96 * 10^8 \\t{ m}", "–"),
 ("Jorda", "$5,97 * 10^{24} \\t{ kg}", "$6,37 * 10^6 \\t{ m}", "$1,50 * 10^{11} \\t{ m}"),
 ("Månen", "$7,35 * 10^{22} \\t{ kg}", "$1,74 * 10^6 \\t{ m}", "$3,84 * 10^8 \\t{ m}"),
 ("Mars", "$6,42 * 10^{23} \\t{ kg}", "$3,39 * 10^6 \\t{ m}", "$2,28 * 10^{11} \\t{ m}"),
 ("Jupiter", "$1,90 * 10^{27} \\t{ kg}", "$6,99 * 10^7 \\t{ m}", "$7,79 * 10^{11} \\t{ m}"),
])
SOL_MERKNAD = "Avstanden er middelavstanden til sola, for Månen til jorda. Sola stråler ut $3,83 * 10^{26}$ W, og overflatetemperaturen er omtrent 5800 K."
from kjernedata import GRUNNSTOFF, NUKLIDER
from grunnstoff_fysikk import KATEGORI, LOSRIVNING, FYSIKK

EV = 1.602176634e-19
def _ev_til_j(t):
    """'4,06–4,26' (eV) → '6,50–6,83' (10⁻¹⁹ J)."""
    tall = [float(x.replace(",", ".").replace("ca. ", "")) for x in t.split("–")]
    return "–".join(f"{v * EV / 1e-19:.2f}".replace(".", ",") for v in tall)

LOS = ("Løsrivningsarbeid", ["Metall", "W i eV", "W i 10⁻¹⁹ J"], [
    (next(g["navn"].capitalize() for g in GRUNNSTOFF if g["sym"] == sym) + f" ({sym})", v, _ev_til_j(v))
    for sym, v in sorted(((k, v) for k, v in LOSRIVNING.items() if k not in ("C", "Si", "Be", "Co", "Cr", "Hg", "Ti", "Sn", "Pb")),
                         key=lambda kv: float(kv[1].split("–")[0].replace(",", ".")))])
LOS_MERKNAD = "Verdiene varierer med hvordan overflaten er. Der det står et intervall, er det spredningen i målinger på ulike flater. Kilde: CRC Handbook of Chemistry and Physics."
FRIKSJON = ("Friksjonstall", ["Flater", "Hvile, μ_s", "Glidning, μ_k"], [
    ("Tre mot tre", "0,25–0,62", "0,32–0,48"),
    ("Tre mot metall", "0,2–0,6", "0,49"),
    ("Stål mot stål", "0,74–0,80", "0,42–0,62"),
    ("Aluminium mot stål", "0,61", "0,47"),
    ("Kobber mot stål", "0,53", "0,36"),
    ("Messing mot stål", "0,35–0,51", "0,44"),
    ("Glass mot glass", "0,9–1,0", "0,4"),
    ("Gummi mot tørr betong", "1,0", "0,6–0,85"),
    ("Gummi mot våt betong", "–", "0,45–0,75"),
    ("Stål mot is", "0,03", "–"),
    ("Is mot is", "0,02–0,09", "–"),
    ("Teflon mot teflon", "0,04", "–"),
])
FRIKSJON_MERKNAD = "Omtrentlige verdier for rene og tørre flater, hentet fra tekniske tabeller. Friksjonstallet avhenger mye av overflaten, så bruk tallene i oppgaven når de er gitt."

SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
def _iso(a, sym): return str(a).translate(SUP) + sym

def _halv_m(t):
    """'1,25 · 10^{9} år' → markering med \t for enheten."""
    m = re.match(r"(.+?) · 10\^\{(-?\d+)\} (.+)", t)
    if m: return f"${m.group(1)} * 10^{{{m.group(2)}}} \\t{{ {m.group(3)}}}"
    return t

def _nuk(n):
    z, a, sym = n["z"], n["a"], n["sym"]
    html = f'<span class="nuk"><span class="nuk-tall"><sup>{a}</sup><sub>{z}</sub></span>{sym}</span>'
    latex = f"${{}}^{{{a}}}_{{{z}}}\\mathrm{{{sym}}}$"
    return (html, latex)

NUKTAB = ("Nuklidetabell", ["Nuklide", "Atommasse (u)", "Halveringstid", "Henfall", "Forekomst"], [
    (_nuk(n), n["masse"], _halv_m(n["halv"]), n["henfall"], n["forekomst"]) for n in NUKLIDER])
NUK_MERKNAD = ("Massene er atommasser, altså med elektronene (for nøytronet massen til nøytronet). Forekomst er andelen av grunnstoffet i naturen. "
               "β⁺/EC betyr positronutsendelse eller elektroninnfanging. Kilder: NIST (masser og forekomst) og IAEA (halveringstider).")

TABELLER = [(KONSTANTER, None), (MASSER, None), (PREFIKSER, None), (STOFF, None), (SOL, SOL_MERKNAD),
            (FRIKSJON, FRIKSJON_MERKNAD), (LOS, LOS_MERKNAD), (NUKTAB, NUK_MERKNAD)]

# ---------- Nettsiden ----------
def _celle_h(c):
    if isinstance(c, tuple): return c[0]
    return h(c[1:]) if c.startswith("$") else _html.escape(c, quote=False)

def _tabell_h(tab, merknad=None):
    navn, kol, rader = tab
    kol_h = [h(k.split(", ")[1]) if ", μ" in k else k for k in kol]
    kol_h = [(k.split(", ")[0] + ", " + kh) if ", μ" in k else kh for k, kh in zip(kol, kol_h)]
    hode = f"<thead><tr>{''.join(f'<th>{k}</th>' for k in kol_h)}</tr></thead>" if any(kol) else ""
    r = "\n".join("        <tr>" + "".join(f"<td>{_celle_h(c)}</td>" for c in rad) + "</tr>" for rad in rader)
    m = f'\n    <p class="fm-merknad">{forkl_h(merknad)}</p>' if merknad else ""
    ekstra = " fm-bred" if navn == "Nuklidetabell" else ""
    idattr = ' id="nuklidetabell"' if navn == "Nuklidetabell" else ""
    return f"""<div class="tema-blokk fm-del fm-tabelldel{ekstra}"{idattr}>
  <h2>{navn}</h2>
  <ul class="fm-liste"><li>
    <div class="fm-rull"><table class="fm-tabell">{hode}<tbody>
{r}
    </tbody></table></div>{m}
  </li></ul>
</div>"""

# ---------- Periodesystemet ----------
def _plass(z):
    """(rad, kolonne) i periodesystemet. Lantanoider og aktinoider i rad 9 og 10."""
    if z == 1: return 1, 1
    if z == 2: return 1, 18
    for p, (start, slutt) in enumerate([(3, 10), (11, 18)], start=2):
        if start <= z <= slutt:
            i = z - start
            return p, i + 1 if i < 2 else i + 11
    for p, start in [(4, 19), (5, 37)]:
        if start <= z < start + 18: return p, z - start + 1
    for p, start in [(6, 55), (7, 87)]:
        if start <= z < start + 32:
            i = z - start
            if i < 2: return p, i + 1
            if i < 17: return p + 3, i + 1      # La–Lu og Ac–Lr: kolonne 3–17 i rad 9/10
            return p, i - 13
    raise ValueError(z)

KAT_AV = {z: k for k, (_, zs) in KATEGORI.items() for z in zs}
NUK_AV = {}
for n in NUKLIDER:
    if n["z"]: NUK_AV.setdefault(n["z"], []).append(n["a"])

def _kort_masse(m):
    if m.startswith("(") or not m: return m
    v = float(m.replace(",", "."))
    des = 3 if v < 10 else 2
    if len(m.split(",")[-1]) < des and "," in m: return m   # konvensjonelle verdier som 6,94 vises som de er
    return (f"{v:.{des}f}").replace(".", ",")

def _halv_h(t):
    return re.sub(r"10\^\{(-?\d+)\}", lambda mm: f"10<sup>{mm.group(1).replace('-', '−')}</sup>", t)

def _ps_info(g):
    z, sym, navn = g["z"], g["sym"], g["navn"].capitalize()
    kat = KAT_AV.get(z, "")
    linjer = [f'<div class="ps-hode"><span class="ps-stor kat-{kat}">{sym}</span><div><h3>{navn}</h3>'
              f'<p>Atomnummer {z} · atomvekt {g["masse"]} u · {KATEGORI[kat][0].lower() if kat else ""}</p></div></div>']
    if g["stabile"]:
        iso = ", ".join(f"{_iso(a, sym)} ({p} %)" for a, p in g["stabile"])
        linjer.append(f"<p><strong>Stabile isotoper:</strong> {iso}</p>")
    nat = [x for x in g["naturlige"] if not any(x[0] == a for a, _ in g["stabile"])]
    if nat:
        iso = ", ".join(f"{_iso(a, sym)} ({p} %, T<sub>½</sub> = {_halv_h(t)}, {d})" for a, p, t, d in nat)
        linjer.append(f"<p><strong>Radioaktive isotoper i naturen:</strong> {iso}</p>")
    if not g["stabile"] and not nat and g["lengst"]:
        a, t, d = g["lengst"]
        linjer.append(f"<p><strong>Ingen stabile isotoper.</strong> Den mest stabile er {_iso(a, sym)} med halveringstid {_halv_h(t)}{f' ({d})' if d else ''}.</p>")
    if sym in LOSRIVNING:
        linjer.append(f"<p><strong>Løsrivningsarbeid:</strong> {LOSRIVNING[sym]} eV</p>")
    if z in FYSIKK:
        linjer.append(f"<p><strong>I fysikken:</strong> {forkl_h(FYSIKK[z])}</p>")
    if z in NUK_AV:
        lenker = ", ".join(_iso(a, sym) for a in NUK_AV[z])
        linjer.append(f'<p class="ps-nuk">I <a href="#nuklidetabell">nuklidetabellen</a>: {lenker}</p>')
    return "".join(linjer)

def periodesystem_h():
    import json as _json
    celler, info = [], {}
    for g in GRUNNSTOFF:
        z = g["z"]; r, k = _plass(z); kat = KAT_AV.get(z, "")
        merke = " ps-merket" if z in FYSIKK else ""
        celler.append(f'<button type="button" class="ps-c kat-{kat}{merke}" style="grid-row:{r};grid-column:{k}" data-z="{z}" aria-label="{g["navn"].capitalize()}">'
                      f'<span class="ps-z">{z}</span><span class="ps-s">{g["sym"]}</span><span class="ps-m">{_kort_masse(g["masse"])}</span></button>')
        info[z] = _ps_info(g)
    forklaring = "".join(f'<span class="ps-forkl kat-{k}">{n}</span>' for k, (n, _) in KATEGORI.items())
    data = _json.dumps(info, ensure_ascii=False).replace("</", "<\\/")
    return f"""<div class="tema-blokk fm-del fm-bred ps-blokk" id="periodesystemet">
  <h2>Periodesystemet</h2>
  <ul class="fm-liste"><li>
    <p class="fm-merknad ps-hjelp">Trykk på et grunnstoff for å se isotoper og hva det brukes til i fysikken. Grunnstoffene med prikk har en egen forklaring.</p>
    <div class="ps-rull"><div class="ps" role="group" aria-label="Periodesystemet">
{chr(10).join(celler)}
      <span class="ps-plass" style="grid-row:6;grid-column:3">57–71</span><span class="ps-plass" style="grid-row:7;grid-column:3">89–103</span>
    </div></div>
    <div class="ps-forklaring">{forklaring}</div>
    <div class="ps-info" id="ps-info" aria-live="polite"><p class="ps-tom">Velg et grunnstoff i tabellen.</p></div>
    <script type="application/json" id="ps-data">{data}</script>
  </li></ul>
</div>"""

def side():
    blokker = []
    for fag, tema, formler, merknad in TEMAER:
        rader = []
        for x in formler:
            attr = ' data-fag="begge"' if x.begge else ""
            if x.ogsa: attr += f' data-tema="{"|".join((tema,) + x.ogsa)}"'
            fk = f'<span class="fm-forkl">{forkl_h(x.forkl)}</span>' if x.forkl else ""
            rader.append(f'    <li{attr}><span class="fm-navn">{x.navn}</span><span class="fm-f">{h(x.formel)}</span>{fk}</li>')
        m = f'\n  <p class="fm-merknad tema-merknad">{forkl_h(merknad)}</p>' if merknad else ""
        blokker.append(f'<div class="tema-blokk fm-del fm-{fag}">\n  <h2>{FAGNAVN[fag]} · {tema}</h2>\n  <ul class="fm-liste">\n' + "\n".join(rader) + f"\n  </ul>{m}\n</div>")
    tabeller = [_tabell_h(t, m) for t, m in TABELLER] + [periodesystem_h()]
    return f"""tittel: Formelsamling for Fysikk 1 og 2 – fysikklab.no
beskrivelse: Formler, konstanter og tabeller for Fysikk 1 og Fysikk 2, sortert etter tema og med forklaring av symbolene. Kan lastes ned som PDF.
fagside: undervisningsopplegg.html
fag: Undervisningsopplegg
tema: Formelsamling
script: filter.js,periodesystem.js
meny: undervisningsopplegg.html
---
<div class="formelsamling" data-sokhint="For eksempel friksjon, fluks eller energi">
<div class="fm-topp">
  <div>
    <h1>Formelsamling</h1>
    <p class="ingress">Formlene i Fysikk 1 og Fysikk 2, med forklaring av symbolene. Velg fag og tema for å se bare det som hører til. Konstanter, tabeller, nuklidetabellen og et interaktivt periodesystem står nederst.</p>
  </div>
  <div class="fm-last-ned">
    <span class="fm-last-ned-tittel">Last ned som PDF</span>
    <a class="knapp" href="{FIL}.pdf" download>Begge fagene</a>
    <a class="knapp lys" href="{FIL}-fysikk-1.pdf" download>Fysikk 1</a>
    <a class="knapp lys" href="{FIL}-fysikk-2.pdf" download>Fysikk 2</a>
  </div>
</div>

<div class="fm-deler">
{chr(10).join(blokker)}
{chr(10).join(tabeller)}
</div>
</div>
"""

def bygg(UT):
    open(os.path.join(UT, FIL + ".html"), "w", encoding="utf-8").write(side())

# ---------- PDF (LaTeX) ----------
PREAMBEL = r"""\documentclass[10pt]{article}
\usepackage[a4paper,margin=12mm,top=11mm,bottom=15mm]{geometry}
\usepackage[norsk]{babel}
\usepackage{fontspec}
\usepackage{unicode-math}
\setmainfont{LibertinusSerif}[Extension=.otf, UprightFont=*-Regular, BoldFont=*-Bold, ItalicFont=*-Italic, BoldItalicFont=*-BoldItalic]
\setsansfont{LibertinusSans}[Extension=.otf, UprightFont=*-Regular, BoldFont=*-Bold, ItalicFont=*-Italic]
\setmathfont{LibertinusMath-Regular.otf}
\usepackage{xcolor,multicol,array,tabularx,needspace,fancyhdr}
\usepackage{tikz}
\usepackage[hidelinks]{hyperref}
\definecolor{blekk}{HTML}{16213A}\definecolor{dempet}{HTML}{566077}\definecolor{rute}{HTML}{DDD8CA}
\definecolor{f1}{HTML}{BF3F0B}\definecolor{f2}{HTML}{0C7168}\colorlet{fag}{f1}
\setlength{\parindent}{0pt}\setlength{\parskip}{0pt}\setlength{\columnsep}{7mm}
\setlength{\columnseprule}{0.3pt}\renewcommand{\columnseprulecolor}{\color{rute}}
\pagestyle{fancy}\fancyhf{}\renewcommand{\headrulewidth}{0pt}
\fancyfoot[L]{\sffamily\scriptsize\color{dempet}fysikklab.no/opplegg/formelsamling.html}
\fancyfoot[R]{\sffamily\scriptsize\color{dempet}Side \thepage}
\setlength{\footskip}{8mm}
\raggedbottom\raggedcolumns
\newcommand{\tema}[1]{\par\addvspace{8pt}{\sffamily\bfseries\color{fag}#1\par}\nopagebreak[4]\vspace{1.5pt}\nopagebreak[4]{\color{fag}\hrule height 0.6pt}\nopagebreak[4]}
\newcommand{\formel}[3]{\par\noindent\begin{minipage}[t]{\linewidth}\vspace{3pt}%
  \begin{minipage}[t]{24mm}\raggedright\leavevmode{\sffamily\scriptsize\color{dempet}\strut#1\par}\end{minipage}\hfill
  \begin{minipage}[t]{\dimexpr\linewidth-26mm\relax}\raggedright\strut$\displaystyle #2$\if\relax\detokenize{#3}\relax\else\par\vspace{1pt}{\footnotesize\color{dempet}#3\par}\fi\end{minipage}%
  \par\vspace{3pt}{\color{rute}\hrule}\end{minipage}\par}
\newcommand{\merknad}[1]{\par\nopagebreak[4]\vspace{3pt}\noindent\begin{minipage}[t]{\linewidth}\leavevmode{\footnotesize\color{dempet}#1\par}\end{minipage}\par}
\newcommand{\fagdel}[2]{\colorlet{fag}{#1}\par\vspace{4pt}{\sffamily\bfseries\Large\color{#1}#2\par}\vspace{2pt}}
\renewcommand{\arraystretch}{1.3}
"""

def _celle_l(c):
    if isinstance(c, tuple): return c[1]
    return f"${l(c[1:])}$" if c.startswith("$") else _tekst_esc(c)

def _kol_l(k):
    return re.sub(r"μ_(\w)", r"$μ_\\mathrm{\1}$", _tekst_esc(k).replace("\\_", "_"))

def _tabell_l(tab, merknad=None):
    navn, kol, rader = tab
    n = len(kol)
    if n == 3 and not any(kol): spes = ">{\\raggedright\\arraybackslash}p{30mm}l>{\\raggedright\\arraybackslash}X"
    elif n == 3: spes = "l>{\\raggedright\\arraybackslash}p{26mm}>{\\raggedright\\arraybackslash}X"
    else: spes = "l" * n
    if navn == "Nuklidetabell": spes = "lllll"
    hode = " & ".join(f"\\leavevmode\\sffamily\\scriptsize\\color{{dempet}}{_kol_l(k)}" for k in kol) + " \\\\\n" if any(kol) else ""
    linjer = [" & ".join(_celle_l(c) for c in rad) + " \\\\\n" for rad in rader]
    deler = [linjer[i:i + 22] for i in range(0, len(linjer), 22)]   # lange tabeller deles så de kan gå over flere spalter
    miljoer = []
    for d in deler:
        if "X" in spes: miljoer.append("\\begin{tabularx}{\\linewidth}{@{}" + spes + "@{}}\n" + hode + "".join(d) + "\\end{tabularx}")
        else: miljoer.append("\\begin{tabular}{@{}" + spes + "@{}}\n" + hode + "".join(d) + "\\end{tabular}")
    m = f"\\merknad{{{forkl_l(merknad)}}}\n" if merknad else ""
    kropp = "\\par\\vspace{4pt}\n".join(f"{{\\footnotesize\\setlength{{\\tabcolsep}}{{4pt}}\n{x}\\par}}\n" for x in miljoer)
    return f"\\tema{{{navn}}}\\vspace{{2pt}}\n{kropp}{m}"

def _formler_l(formler):
    return "".join(f"\\formel{{{_tekst_esc(x.navn)}}}{{{l(x.formel)}}}{{{forkl_l(x.forkl)}}}\n" for x in formler)

KATFARGE = {"alkali": "D9534F", "jordalkali": "E8913A", "overgang": "C9A227", "lantanoid": "7FAE3E", "aktinoid": "2F9E7E",
            "metall": "4D8FD1", "halvmetall": "8C6FD6", "ikkemetall": "2A6FB0", "halogen": "C45AB3", "edelgass": "8A7F6A"}

def periodesystem_l():
    b, hgt = 10.25, 13.0   # cellestørrelse i mm
    ut = ["\\clearpage\n\\fagdel{blekk}{Periodesystemet}\n\\vspace{4pt}\n"]
    ut += [f"\\definecolor{{k{k}}}{{HTML}}{{{v}}}" for k, v in KATFARGE.items()]
    ut.append("\n\\noindent\\begin{tikzpicture}[x=1mm,y=1mm,font=\\sffamily]\n")
    for g in GRUNNSTOFF:
        r, k = _plass(g["z"]); kat = KAT_AV.get(g["z"], "")
        y = -(r - 1) * hgt if r < 9 else -(r - 2) * hgt - 5; x = (k - 1) * b
        ut.append(f"\\filldraw[fill=k{kat}!22,draw=k{kat}!70,line width=0.3pt,rounded corners=0.6mm] ({x:.2f},{y:.2f}) rectangle ++({b - 0.6:.2f},{-(hgt - 0.6):.2f});"
                  f"\\node[anchor=north west,inner sep=0.5mm,font=\\sffamily\\fontsize{{5}}{{6}}\\selectfont,text=dempet] at ({x:.2f},{y:.2f}) {{{g['z']}}};"
                  f"\\node[font=\\bfseries\\fontsize{{10}}{{11}}\\selectfont] at ({x + (b - 0.6) / 2:.2f},{y - 6.0:.2f}) {{{g['sym']}}};"
                  f"\\node[font=\\sffamily\\fontsize{{4.6}}{{5}}\\selectfont,text=dempet] at ({x + (b - 0.6) / 2:.2f},{y - 10.3:.2f}) {{{_kort_masse(g['masse'])}}};\n")
    for r, tekst in [(6, "57–71"), (7, "89–103")]:
        x = 2 * b; y = -(r - 1) * hgt
        ut.append(f"\\draw[dempet,dashed,line width=0.3pt,rounded corners=0.6mm] ({x:.2f},{y:.2f}) rectangle ++({b - 0.6:.2f},{-(hgt - 0.6):.2f});"
                  f"\\node[font=\\sffamily\\fontsize{{5}}{{6}}\\selectfont,text=dempet] at ({x + (b - 0.6) / 2:.2f},{y - 6.2:.2f}) {{{tekst}}};\n")
    # forklaring
    x0, y0 = 2.6 * b, -1.0
    for i, (k, (n, _)) in enumerate(KATEGORI.items()):
        x = x0 + (i % 3) * 30; y = y0 - (i // 3) * 5.2
        ut.append(f"\\filldraw[fill=k{k}!35,draw=k{k}!70,line width=0.3pt] ({x:.1f},{y:.1f}) rectangle ++(3,-3);"
                  f"\\node[anchor=west,font=\\sffamily\\fontsize{{6.5}}{{7}}\\selectfont] at ({x + 3.6:.1f},{y - 1.5:.1f}) {{{n}}};\n")
    ut.append("\\end{tikzpicture}\n\\par\\vspace{6pt}{\\footnotesize\\color{dempet}Tallet under symbolet er atomvekten i u. "
              "Tall i parentes er massetallet til den mest stabile isotopen. Atomvekter fra NIST og IUPAC.\\par}\n")
    return "".join(ut)

def tex(utvalg):
    """utvalg: 'alle', 'f1' eller 'f2'. Gir hele LaTeX-dokumentet."""
    tittel = {"alle": "Fysikk 1 og 2", "f1": "Fysikk 1", "f2": "Fysikk 2"}[utvalg]
    ut = [PREAMBEL, "\\begin{document}\n",
          f"{{\\sffamily\\bfseries\\LARGE\\color{{blekk}}Formelsamling · {tittel}\\par}}\\vspace{{4pt}}\n"]
    for fag in ("f1", "f2"):
        if utvalg not in ("alle", fag): continue
        if fag == "f2" and utvalg == "alle": ut.append("\\needspace{0.3\\textheight}\n")
        if utvalg == "alle": ut.append(f"\\fagdel{{{fag}}}{{{FAGNAVN[fag]}}}\n")
        else: ut.append(f"\\colorlet{{fag}}{{{fag}}}\n")
        ut.append("\\begin{multicols}{2}\n")
        if fag == "f2" and utvalg == "f2":   # formler fra Fysikk 1 som også brukes i Fysikk 2
            for f_, tema, formler, _ in TEMAER:
                felles = [x for x in formler if f_ == "f1" and x.begge]
                if felles: ut.append(f"\\tema{{Fra Fysikk 1 · {tema}}}\n" + _formler_l(felles))
        for f_, tema, formler, merknad in TEMAER:
            if f_ != fag: continue
            ut.append(f"\\tema{{{tema}}}\n" + _formler_l(formler))
            if merknad: ut.append(f"\\merknad{{{forkl_l(merknad)}}}\n")
        ut.append("\\end{multicols}\n")
    ut.append("\\needspace{0.35\\textheight}\n\\fagdel{blekk}{Konstanter og tabeller}\n\\begin{multicols}{2}\n")
    for t, m in TABELLER:
        ut.append(_tabell_l(t, m))
    ut.append("\\end{multicols}\n")
    ut.append(periodesystem_l())
    ut.append("\\end{document}\n")
    return "".join(ut)
