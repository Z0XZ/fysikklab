# Feltlinjer: regn ut feltet i et rutenett av punkter og tegn med streamplot
ladninger = [(1.0e-9, -0.10, 0.0),
             (-1.0e-9, 0.10, 0.0)]    # en dipol: like store ladninger med motsatt fortegn

X, Y = np.meshgrid(np.linspace(-0.3, 0.3, 200), np.linspace(-0.3, 0.3, 200))
Ex, Ey = samlet_felt(X, Y)
E = np.hypot(Ex, Ey)

plt.streamplot(X, Y, Ex, Ey, density=1.4, color=np.log10(E), cmap="viridis")
for q, xq, yq in ladninger:
    plt.plot(xq, yq, "o", markersize=12, color="tab:red" if q > 0 else "tab:blue")
plt.gca().set_aspect("equal")
plt.xlabel("x / m")
plt.ylabel("y / m")
plt.title("Feltlinjer for en dipol")
plt.show()
