import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng()      # tilfeldige tall
n = 100_000                        # antall «forsøk» vi simulerer

# Målinger med usikkerhet (standardavvik)
L, dL = 0.800, 0.005    # m
T, dT = 1.79, 0.02      # s

L_trukket = rng.normal(L, dL, n)   # 100 000 tilfeldige lengder rundt 0,800 m
T_trukket = rng.normal(T, dT, n)
g = 4 * np.pi**2 * L_trukket / T_trukket**2

print(f"g = {g.mean():.2f} ± {g.std():.2f} m/s²  (Monte Carlo)")

# Sammenlign med reglene for usikkerhet
g0 = 4 * np.pi**2 * L / T**2
enkel = dL / L + 2 * dT / T
kvadrat = np.sqrt((dL / L)**2 + (2 * dT / T)**2)
print(f"g = {g0:.2f} m/s²")
print(f"Enkel regel:  ± {enkel * g0:.2f} m/s²  ({enkel * 100:.1f} %)")
print(f"Kvadratsum:   ± {kvadrat * g0:.2f} m/s²  ({kvadrat * 100:.1f} %)")

plt.hist(g, bins=80)
plt.xlabel("g / (m/s²)")
plt.ylabel("antall")
plt.show()
