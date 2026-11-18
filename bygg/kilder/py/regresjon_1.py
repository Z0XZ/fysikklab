import numpy as np
import matplotlib.pyplot as plt

# Simulerte målinger: svingetiden T for en pendel med lengde L
L = np.array([0.20, 0.40, 0.60, 0.80, 1.00, 1.20])        # m
T = np.array([0.901, 1.279, 1.558, 1.779, 2.017, 2.203])  # s

# Teorien sier T = 2π√(L/g), altså T² = (4π²/g) · L. Da skal T² mot L bli en rett linje.
koeff, kov = np.polyfit(L, T**2, 1, cov=True)
stigning, konstant = koeff
u_stigning = np.sqrt(kov[0, 0])    # standardusikkerheten i stigningstallet

g = 4 * np.pi**2 / stigning
u_g = g * u_stigning / stigning    # samme relative usikkerhet som stigningstallet

print(f"T² = {stigning:.3f} · L + {konstant:.3f}")
print(f"g = ({g:.2f} ± {u_g:.2f}) m/s²")

plt.plot(L, T**2, "o", label="målinger")
L_linje = np.linspace(0, 1.3, 50)
plt.plot(L_linje, stigning * L_linje + konstant, label="rett linje")
plt.xlabel("L / m")
plt.ylabel("T² / s²")
plt.legend()
plt.grid(True)
plt.show()
