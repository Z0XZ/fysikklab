import numpy as np
import matplotlib.pyplot as plt

M = 1000.0      # startmasse i kg (rakett + drivstoff)
drivstoff = 800.0
u = 2500.0      # farten til gassen bakover, i forhold til raketten, i m/s
dm = 1.0        # masse som skytes ut i hvert steg, i kg

v = 0.0         # farten til raketten i m/s (i rommet, uten tyngdekraft)
masser, farter = [M], [v]

while drivstoff > 0:
    # Bevegelsesmengden før = etter:
    # M·v = (M − dm)·(v + dv) + dm·(v − u)   gir   dv = u·dm / (M − dm)
    dv = u * dm / (M - dm)
    v = v + dv
    M = M - dm
    drivstoff = drivstoff - dm
    masser.append(M)
    farter.append(v)

print(f"Sluttfart: {v:.0f} m/s med {M:.0f} kg igjen")
print(f"Rakettlikningen u·ln(M0/M): {u * np.log(1000 / M):.0f} m/s")

plt.plot(masser, farter)
plt.gca().invert_xaxis()          # massen minker mot høyre
plt.xlabel("massen til raketten / kg")
plt.ylabel("v / (m/s)")
plt.grid(True)
plt.show()
