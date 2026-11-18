# Hvis vi ikke kjenner formelen: prøv en potensfunksjon T = C · L^n.
# Da er ln T = ln C + n · ln L, altså en rett linje med stigningstall n.
n, lnC = np.polyfit(np.log(L), np.log(T), 1)
print(f"n = {n:.3f}")
print(f"C = {np.exp(lnC):.3f} s/m^n")

plt.loglog(L, T, "o")
plt.xlabel("L / m")
plt.ylabel("T / s")
plt.grid(True, which="both")
plt.show()
