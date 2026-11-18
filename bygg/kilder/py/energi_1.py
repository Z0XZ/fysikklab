import numpy as np
import matplotlib.pyplot as plt

g = 9.81            # m/s²
m = 2.0             # kg
vinkel = np.radians(25)
mu = 0.20           # friksjonstall
L = 4.0             # lengden på skråplanet i m
h0 = L * np.sin(vinkel)   # starthøyde i m

N = m * g * np.cos(vinkel)        # normalkraft
R = mu * N                        # friksjonskraft
a = g * np.sin(vinkel) - R / m    # akselerasjon langs planet

t, s, v = 0, 0, 0     # s, m, m/s
dt = 0.001            # s
tider, Ek, Ep, Q = [], [], [], []

while s < L:
    v = v + a * dt
    s = s + v * dt
    t = t + dt
    tider.append(t)
    Ek.append(0.5 * m * v**2)
    Ep.append(m * g * (h0 - s * np.sin(vinkel)))
    Q.append(R * s)               # friksjonsarbeidet blir til varme

print(f"Klossen er nederst etter {t:.2f} s med farten {v:.2f} m/s.")
v_energi = np.sqrt(2 * (m * g * h0 - R * L) / m)
print(f"Energibevaring gir {v_energi:.2f} m/s.")
print(f"Varme fra friksjonen: {R * L:.1f} J av {m * g * h0:.1f} J")
