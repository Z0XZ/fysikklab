import numpy as np
import matplotlib.pyplot as plt

# Store halvakser a (AU) og omløpstider T (år) for planetene
planeter = ["Merkur", "Venus", "Jorda", "Mars", "Jupiter", "Saturn", "Uranus", "Neptun"]
a = np.array([0.387, 0.723, 1.000, 1.524, 5.203, 9.537, 19.19, 30.07])   # AU
T = np.array([0.241, 0.615, 1.000, 1.881, 11.86, 29.45, 84.02, 164.8])   # år

n, lnC = np.polyfit(np.log(a), np.log(T), 1)
print(f"T er proporsjonal med a^{n:.3f}")

for navn, ai, Ti in zip(planeter, a, T):
    print(f"{navn:8s} T²/a³ = {Ti**2 / ai**3:.3f} år²/AU³")

plt.loglog(a, T, "o")
for navn, ai, Ti in zip(planeter, a, T):
    plt.annotate(navn, (ai, Ti), textcoords="offset points", xytext=(5, -10))
plt.xlabel("a / AU")
plt.ylabel("T / år")
plt.grid(True, which="both")
plt.show()
