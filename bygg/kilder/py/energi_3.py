import numpy as np
import matplotlib.pyplot as plt

g = 9.81
m = 70.0                 # kg, skiløper med utstyr
vinkel = np.radians(15)
mu = 0.05                # friksjonstall mellom ski og snø
k = 0.25                 # luftmotstandstall i kg/m: L = k·v²
lengde = 300.0           # m nedover bakken

R = mu * m * g * np.cos(vinkel)
t, s, v = 0, 0, 0
dt = 0.01
tider, farter = [], []
W_friksjon, W_luft = 0, 0

while s < lengde:
    L = k * v**2                                  # luftmotstanden endrer seg med farten
    a = g * np.sin(vinkel) - (R + L) / m
    v = v + a * dt
    s = s + v * dt
    t = t + dt
    W_friksjon = W_friksjon + R * v * dt          # arbeid = kraft · strekning
    W_luft = W_luft + L * v * dt
    tider.append(t)
    farter.append(v)

Ep_tap = m * g * lengde * np.sin(vinkel)
Ek = 0.5 * m * v**2
print(f"Etter {lengde:.0f} m: t = {t:.1f} s og v = {v:.1f} m/s ({v * 3.6:.0f} km/h)")
print(f"Tapt potensiell energi: {Ep_tap / 1000:.1f} kJ")
print(f"  kinetisk energi: {Ek / 1000:.1f} kJ")
print(f"  friksjon:        {W_friksjon / 1000:.1f} kJ")
print(f"  luftmotstand:    {W_luft / 1000:.1f} kJ")
print(f"  sum:             {(Ek + W_friksjon + W_luft) / 1000:.1f} kJ")

v_terminal = np.sqrt((m * g * np.sin(vinkel) - R) / k)
plt.plot(tider, farter)
plt.axhline(v_terminal, color="gray", linestyle="--", label="terminalfart")
plt.xlabel("t / s")
plt.ylabel("v / (m/s)")
plt.legend()
plt.grid(True)
plt.show()
