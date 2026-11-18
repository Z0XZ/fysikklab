import numpy as np
import matplotlib.pyplot as plt

GM = 3.986e14     # m³/s², G ganger jordas masse
R_jord = 6.371e6  # m
h = 420e3         # m, omtrent høyden til ISS

r0 = R_jord + h
v_sirkel = np.sqrt(GM / r0)   # farten som gir en sirkelbane

s = np.array([r0, 0.0])         # startposisjon i m
v = np.array([0.0, v_sirkel])   # startfart i m/s, vinkelrett på radien
dt = 1.0                        # s
t = 0.0
t_slutt = 3 * 60 * 60           # simuler i 3 timer

xs, ys = [s[0]], [s[1]]
omlop = None
while t < t_slutt:
    r = np.linalg.norm(s)
    a = -GM / r**3 * s          # gravitasjonen peker mot jordas sentrum
    v = v + a * dt
    s_ny = s + v * dt
    if omlop is None and s[1] < 0 <= s_ny[1]:   # krysser x-aksen nedenfra: ett omløp
        omlop = t + dt
    s = s_ny
    t = t + dt
    xs.append(s[0])
    ys.append(s[1])

print(f"Fart i sirkelbanen: {v_sirkel:.0f} m/s")
print(f"Omløpstid fra simuleringen: {omlop / 60:.1f} min")
print(f"Omløpstid fra T = 2πr/v: {2 * np.pi * r0 / v_sirkel / 60:.1f} min")

jorda = plt.Circle((0, 0), R_jord, color="tab:blue", alpha=0.3)
plt.gca().add_patch(jorda)
plt.plot(xs, ys)
plt.axis("equal")
plt.xlabel("x / m")
plt.ylabel("y / m")
plt.show()
