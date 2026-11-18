import numpy as np
import matplotlib.pyplot as plt

g = 9.81
m_tom = 0.108          # kg, rakett uten drivstoff
drivstoff = 0.012      # kg
brennetid = 1.6        # s
u = 800.0              # utstrømningsfart i m/s
k = 2.2e-4             # luftmotstandstall i kg/m: L = k·v²

dmdt = drivstoff / brennetid      # kg/s
F_skyv = u * dmdt                 # skyvekraften: endringen i bevegelsesmengde per tid
print(f"Skyvekraft: {F_skyv:.1f} N")

t, h, v = 0.0, 0.0, 0.0
m = m_tom + drivstoff
dt = 0.001
tider, hoyder, farter = [], [], []

while v >= 0:                     # til raketten er på toppen
    F = -m * g - k * v * abs(v)   # tyngde og luftmotstand
    if t < brennetid:
        F = F + F_skyv
        m = m - dmdt * dt
    a = F / m
    v = v + a * dt
    h = h + v * dt
    t = t + dt
    tider.append(t)
    hoyder.append(h)
    farter.append(v)

print(f"Største fart: {max(farter):.1f} m/s")
print(f"Toppunkt: {h:.0f} m etter {t:.1f} s")

plt.subplot(2, 1, 1)
plt.plot(tider, hoyder)
plt.ylabel("h / m")
plt.grid(True)
plt.subplot(2, 1, 2)
plt.plot(tider, farter)
plt.xlabel("t / s")
plt.ylabel("v / (m/s)")
plt.grid(True)
plt.show()
