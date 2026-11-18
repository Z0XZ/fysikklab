import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng()
n = 100_000
g = 9.81

# Rekkevidden til et skrått kast på flatt underlag: R = v² sin(2θ) / g
v = rng.normal(10.0, 0.2, n)                 # m/s
vinkel = np.radians(rng.normal(45, 3, n))    # 45 ± 3 grader
R = v**2 * np.sin(2 * vinkel) / g

R0 = 10.0**2 * np.sin(np.radians(90)) / g
print(f"Med v = 10,0 m/s og 45°: R = {R0:.2f} m")
print(f"Monte Carlo: gjennomsnitt {R.mean():.2f} m, standardavvik {R.std():.2f} m")
print(f"Andel kast som går lenger enn R0: {np.mean(R > R0) * 100:.0f} %")

plt.hist(R, bins=80)
plt.axvline(R0, color="k", linestyle="--")
plt.xlabel("R / m")
plt.ylabel("antall")
plt.show()
