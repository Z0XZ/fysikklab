# En spole: N vindinger fordelt jevnt over lengden l
def spole(N, R, l, n=100):
    midt, dl = [], []
    for z0 in np.linspace(-l / 2, l / 2, N):
        m, d = ring(R, z0, n)
        midt.append(m)
        dl.append(d)
    return np.vstack(midt), np.vstack(dl)

N, l = 200, 0.40          # vindinger og lengde i m
R = 0.02                  # m
biter = spole(N, R, l)
z = np.linspace(-0.4, 0.4, 161)
Bz = np.array([felt(biter, I, np.array([0, 0, zi]))[2] for zi in z])

B_lang = mu0 * N * I / l
print(f"Midt i spolen: {Bz[80] * 1000:.3f} mT (numerisk)")
print(f"μ0 N I / l:     {B_lang * 1000:.3f} mT (lang spole)")
print(f"Ved enden:     {Bz[np.argmin(abs(z - l / 2))] * 1000:.3f} mT")

plt.plot(z * 100, Bz * 1000)
plt.axhline(B_lang * 1000, color="gray", linestyle="--", label="μ0NI/l")
plt.axvspan(-l / 2 * 100, l / 2 * 100, color="gray", alpha=0.15, label="spolen")
plt.xlabel("z / cm")
plt.ylabel("$B_z$ / mT")
plt.legend()
plt.grid(True)
plt.show()
