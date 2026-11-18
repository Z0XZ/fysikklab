# Feltet langs aksen gjennom sløyfa
z = np.linspace(-0.3, 0.3, 121)
biter = ring(R, 0)
Bz = [felt(biter, I, np.array([0, 0, zi]))[2] for zi in z]
B_formel = mu0 * I * R**2 / (2 * (R**2 + z**2)**1.5)

plt.plot(z * 100, np.array(Bz) * 1e6, label="Biot–Savart, numerisk")
plt.plot(z * 100, B_formel * 1e6, "--", label="formel på aksen")
plt.xlabel("z / cm")
plt.ylabel("$B_z$ / µT")
plt.legend()
plt.grid(True)
plt.show()
