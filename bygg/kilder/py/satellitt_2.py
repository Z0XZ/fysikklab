# Mekanisk energi per kg langs banen: E = ½v² − GM/r. Den skal være konstant.
def bane(fart, timer=4, dt=1.0):
    s = np.array([r0, 0.0])
    v = np.array([0.0, fart])
    xs, ys, E = [], [], []
    for _ in range(int(timer * 3600 / dt)):
        r = np.linalg.norm(s)
        v = v - GM / r**3 * s * dt
        s = s + v * dt
        xs.append(s[0])
        ys.append(s[1])
        E.append(0.5 * np.dot(v, v) - GM / np.linalg.norm(s))
    return np.array(xs), np.array(ys), np.array(E)

for faktor in [1.0, 1.1, 1.2]:
    xs, ys, E = bane(faktor * v_sirkel)
    avstand = np.hypot(xs, ys)
    print(f"Startfart {faktor:.1f} · v_sirkel: lengst unna {(avstand.max() - R_jord) / 1000:.0f} km over bakken, "
          f"energien endrer seg {abs(E.max() - E.min()) / abs(E[0]) * 100:.3f} %")
    plt.plot(xs, ys, label=f"{faktor:.1f} · v_sirkel")

plt.gca().add_patch(plt.Circle((0, 0), R_jord, color="tab:blue", alpha=0.3))
plt.axis("equal")
plt.legend()
plt.show()
