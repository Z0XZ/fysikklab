h = 20.0    # m, høyden steinen slippes fra
dt = 0.01   # s, tidssteg
t = 0       # s
s = 0       # m, hvor langt steinen har falt
v = 0       # m/s

while s < h:
    v = v + g * dt
    s = s + v * dt
    t = t + dt

print(f"Steinen treffer bakken etter {t:.2f} s med farten {v:.1f} m/s")

if v * 3.6 > 50:
    print("Det er raskere enn 50 km/h!")
else:
    print("Det er saktere enn 50 km/h.")
