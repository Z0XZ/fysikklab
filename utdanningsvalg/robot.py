"""Robotbilen på fysikklab.no/utdanningsvalg.

Roboten har to hjul, og hvert hjul drives av sin egen elektromotor. Foran sitter en
avstandssensor (som en ultralydsensor) som måler hvor langt det er til veggen rett fram.
Alle lengder er i meter, vinkler i grader og tider i sekunder.

    robot = Robot()              # tom bane. Andre baner: Robot("garasje"), Robot("slalom"), Robot("labyrint")
    robot.kjør(1)                # kjør 1 m rett fram (negativt tall: bakover)
    robot.sving(90)              # snu 90° mot venstre på stedet (negativt tall: mot høyre)
    robot.motorer(0.2, 0.3, 2)   # venstre hjul 0,2 m/s og høyre hjul 0,3 m/s i 2 s
    robot.avstand()              # meter fra fronten av roboten til veggen rett fram
    robot.i_mål()                # True når roboten er i mål
    robot.farge = "red"          # fargen på streken roboten tegner
    robot.tid                    # hvor mange sekunder roboten har kjørt
"""
import math

import matplotlib
import matplotlib.ticker
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

HJULAVSTAND = 0.16   # m mellom de to hjulene
RADIUS = 0.08        # roboten er en sirkel med denne radiusen (m)
MAKSFART = 0.5       # største fart for hvert hjul (m/s)
KJØREFART = 0.25     # farten i kjør() (m/s)
SVINGEFART = 0.08    # farten til hvert hjul i sving() (m/s): 90° tar 1,6 s
DT = 0.01            # tidssteg i simuleringen (s)
MAKSTID = 600        # roboten slår seg av etter 10 minutter


class RobotKrasj(Exception):
    """Roboten har kjørt inn i en vegg."""
    __module__ = "builtins"   # da står det bare «RobotKrasj:» i feilmeldingen


def _kloss(x, y, b, h):
    """Fire vegger rundt et rektangel."""
    return [((x, y), (x + b, y)), ((x + b, y), (x + b, y + h)), ((x + b, y + h), (x, y + h)), ((x, y + h), (x, y))]


BANER = {
    "tom": dict(navn="Fri kjøring", bredde=6, høyde=4.5, start=(2.5, 1.25, 0), vegger=[], klosser=[], mål=None),
    "garasje": dict(
        navn="Parker i garasjen", bredde=3, høyde=2.5, start=(0.4, 0.6, 0),
        vegger=[((0, 1.2), (2.0, 1.2)), ((0, 1.7), (0.7, 1.7)), ((0, 2.2), (0.7, 2.2))],
        klosser=[], mål=(0.05, 1.75, 0.45, 0.4)),
    "slalom": dict(
        navn="Slalåm", bredde=5, høyde=2, start=(0.3, 1.0, 0),
        vegger=[((1.0, 0), (1.0, 1.2)), ((2.0, 0.8), (2.0, 2.0)), ((3.0, 0), (3.0, 1.2)), ((4.0, 0.8), (4.0, 2.0))],
        klosser=[], mål=(4.5, 0.05, 0.45, 0.7)),
    "labyrint": dict(
        navn="Labyrint", bredde=4, høyde=3, start=(0.3, 0.3, 90),
        vegger=[((0.6, 0), (0.6, 2.4)), ((1.2, 0.6), (1.2, 3.0)), ((1.8, 0), (1.8, 2.4)),
                ((2.4, 0.6), (2.4, 3.0)), ((3.0, 0), (3.0, 2.4))],
        klosser=[], mål=(3.1, 0.05, 0.8, 0.5)),
}


def _komma(v, d=1):
    return f"{v:.{d}f}".replace(".", ",").replace("-", "−")


def _avstand_til_linje(px, py, a, b):
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - x1 - t * dx, py - y1 - t * dy)


def _stråle(px, py, ux, uy, a, b):
    """Hvor langt en stråle fra (px, py) i retning (ux, uy) går før den treffer linjestykket ab."""
    (x1, y1), (x2, y2) = a, b
    ex, ey = x2 - x1, y2 - y1
    nevner = ux * ey - uy * ex
    if abs(nevner) < 1e-12:
        return math.inf
    t = ((x1 - px) * ey - (y1 - py) * ex) / nevner
    s = ((x1 - px) * uy - (y1 - py) * ux) / nevner
    return t if t >= 0 and 0 <= s <= 1 else math.inf


class Robot:
    def __init__(self, bane="tom"):
        if bane not in BANER:
            raise ValueError(f"Banen «{bane}» finnes ikke. Velg en av disse: {', '.join(BANER)}")
        self.bane = BANER[bane]
        b, h = self.bane["bredde"], self.bane["høyde"]
        self._vegger = _kloss(0, 0, b, h) + list(self.bane["vegger"])
        for k in self.bane["klosser"]:
            self._vegger += _kloss(*k)
        self.x, self.y, self.retning = self.bane["start"]
        self.tid = 0.0
        self.farge = "tab:blue"
        self._krasj = None
        self._i_mål_tid = None
        self._streker = [[self.farge, [self.x], [self.y]]]
        self._advart = False
        self._fig = None
        self._tegn()

    # ---------- Kommandoer ----------
    def kjør(self, meter):
        """Kjør rett fram (eller bakover hvis meter er negativ)."""
        v = KJØREFART if meter >= 0 else -KJØREFART
        self._kjør_hjul(v, v, abs(meter) / KJØREFART)

    def sving(self, grader):
        """Snu på stedet. Positivt tall er mot venstre, negativt mot høyre."""
        v = SVINGEFART if grader >= 0 else -SVINGEFART
        omega = 2 * SVINGEFART / HJULAVSTAND
        self._kjør_hjul(-v, v, math.radians(abs(grader)) / omega)

    def motorer(self, venstre, høyre, sekunder):
        """Gi hvert hjul sin egen fart (m/s) i et antall sekunder."""
        if max(abs(venstre), abs(høyre)) > MAKSFART:
            if not self._advart:
                print(f"Motorene klarer ikke mer enn {_komma(MAKSFART)} m/s. Roboten bruker {_komma(MAKSFART)} m/s.")
                self._advart = True
            venstre = max(-MAKSFART, min(MAKSFART, venstre))
            høyre = max(-MAKSFART, min(MAKSFART, høyre))
        self._kjør_hjul(venstre, høyre, sekunder)

    def avstand(self):
        """Avstanden fra fronten av roboten til veggen rett fram, i meter (sensoren ser maks 3 m)."""
        self._sjekk_krasj()
        ux, uy = math.cos(math.radians(self.retning)), math.sin(math.radians(self.retning))
        d = min(_stråle(self.x, self.y, ux, uy, a, b) for a, b in self._vegger) - RADIUS
        return round(min(max(d, 0.0), 3.0), 2)

    def i_mål(self):
        """True hvis roboten er i mål."""
        return self._i_mål_tid is not None

    # ---------- Simuleringen ----------
    def _sjekk_krasj(self):
        if self._krasj:
            raise RobotKrasj("Roboten har krasjet og kan ikke kjøre mer. Rett opp koden og kjør på nytt.")

    def _kjør_hjul(self, vv, vh, sekunder):
        self._sjekk_krasj()
        if sekunder < 0:
            raise ValueError("Tiden kan ikke være negativ.")
        if self.farge != self._streker[-1][0]:
            self._streker.append([self.farge, [self.x], [self.y]])
        _, xs, ys = self._streker[-1]
        v, omega = (vv + vh) / 2, (vh - vv) / HJULAVSTAND
        n = max(1, math.ceil(sekunder / DT - 1e-9))
        dt = sekunder / n
        for i in range(n):
            th = math.radians(self.retning)
            if abs(omega) < 1e-9:
                self.x += v * dt * math.cos(th)
                self.y += v * dt * math.sin(th)
            else:
                th2 = th + omega * dt
                self.x += v / omega * (math.sin(th2) - math.sin(th))
                self.y -= v / omega * (math.cos(th2) - math.cos(th))
            self.retning = round(self.retning + math.degrees(omega * dt), 9) % 360
            self.tid += dt
            if i % 5 == 4 or i == n - 1:
                xs.append(self.x); ys.append(self.y)
            if any(_avstand_til_linje(self.x, self.y, a, b) < RADIUS for a, b in self._vegger):
                xs.append(self.x); ys.append(self.y)
                self._krasj = (self.x, self.y)
                self._tegn()
                raise RobotKrasj(f"Krasj! Roboten traff veggen etter {_komma(self.tid)} s. Se det røde krysset på figuren.")
            m = self.bane["mål"]
            if m and self._i_mål_tid is None and m[0] <= self.x <= m[0] + m[2] and m[1] <= self.y <= m[1] + m[3]:
                self._i_mål_tid = self.tid
                print(f"I mål! Tid: {_komma(self.tid, 2)} s")
            if self.tid > MAKSTID:
                self._krasj = (self.x, self.y)
                self._tegn()
                raise RobotKrasj("Batteriet er tomt: Roboten har kjørt i 10 minutter.")
        self._tegn()

    def _tegn(self):
        """Oppdaterer figuren. Banen tegnes én gang, deretter flyttes bare roboten og streken."""
        if self._fig is None or not plt.fignum_exists(self._fig.number):
            self._tegn_banen()
        ax = self._ax
        while len(self._linjer) < len(self._streker):
            self._linjer.append(ax.plot([], [], color=self._streker[len(self._linjer)][0], linewidth=2)[0])
        for linje, (_, xs, ys) in zip(self._linjer, self._streker):
            linje.set_data(xs, ys)
        th = math.radians(self.retning)
        self._kropp.center = (self.x, self.y)
        self._nese.set_data([self.x, self.x + RADIUS * math.cos(th)], [self.y, self.y + RADIUS * math.sin(th)])
        tittel = f"{self.bane['navn']} · tid: {_komma(self.tid)} s"
        if self._i_mål_tid is not None:
            tittel += f" · i mål etter {_komma(self._i_mål_tid, 2)} s"
        if self._krasj:
            ax.plot(*self._krasj, "x", color="red", markersize=16, markeredgewidth=4, zorder=5)
            tittel += " · KRASJ"
        ax.set_title(tittel)

    def _tegn_banen(self):
        b, h = self.bane["bredde"], self.bane["høyde"]
        self._fig, ax = plt.subplots(figsize=(7, max(3.2, 7 * h / b)))
        self._ax = ax
        ax.set_xlim(-0.05, b + 0.05); ax.set_ylim(-0.05, h + 0.05)
        ax.set_aspect("equal")
        ax.set_xticks([i * 0.5 for i in range(int(b * 2) + 1)]); ax.set_yticks([i * 0.5 for i in range(int(h * 2) + 1)])
        ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: _komma(v)))
        ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: _komma(v)))
        ax.grid(True, color="0.88", linewidth=0.8); ax.set_axisbelow(True)
        ax.set_xlabel("x / m"); ax.set_ylabel("y / m")
        m = self.bane["mål"]
        if m:
            ax.add_patch(Rectangle(m[:2], m[2], m[3], color="tab:green", alpha=0.25, linewidth=0))
            ax.text(m[0] + m[2] / 2, m[1] + m[3] / 2, "MÅL", ha="center", va="center", color="darkgreen", fontweight="bold")
        for k in self.bane["klosser"]:
            ax.add_patch(Rectangle(k[:2], k[2], k[3], color="0.25"))
        for a, c in self._vegger:
            ax.plot([a[0], c[0]], [a[1], c[1]], color="0.15", linewidth=3, solid_capstyle="round")
        sx, sy, _ = self.bane["start"]
        ax.plot(sx, sy, "o", color="0.6", markersize=5)
        self._linjer = []
        self._kropp = plt.Circle((self.x, self.y), RADIUS, facecolor="white", edgecolor="0.15", linewidth=1.5, zorder=3)
        ax.add_patch(self._kropp)
        self._nese, = ax.plot([], [], color="0.15", linewidth=2, zorder=4)
