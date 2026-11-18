import numpy as np
import matplotlib.pyplot as plt

g = 9.81                      # m/s²
t = np.linspace(0, 2.0, 21)   # 21 tidspunkter fra 0 til 2,0 s
s = 0.5 * g * t**2            # regnes ut for alle tidspunktene på en gang
v = g * t

print("De fem første tidspunktene:", t[:5])
print(f"Etter {t[-1]} s har steinen falt {s[-1]:.1f} m og har farten {v[-1]:.1f} m/s")

plt.plot(t, s, "o-")
plt.xlabel("t / s")
plt.ylabel("s / m")
plt.title("Fritt fall")
plt.grid(True)
plt.show()
