# Feltet langs x-aksen mellom ladningene
x = np.linspace(0.02, 0.28, 500)
Ex, Ey = samlet_felt(x, 0 * x)

i = np.argmin(np.abs(Ex))
print(f"Feltet er null omtrent ved x = {x[i]:.3f} m")

plt.plot(x, Ex)
plt.axhline(0, color="gray", linewidth=0.8)
plt.xlabel("x / m")
plt.ylabel("$E_x$ / (N/C)")
plt.ylim(-5000, 5000)
plt.grid(True)
plt.show()
