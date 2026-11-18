# Massen av vannet i et beger: full minus tom
m_full = rng.normal(152.3, 0.5, n)   # g
m_tom = rng.normal(148.9, 0.5, n)    # g
m_vann = m_full - m_tom

print(f"m = {m_vann.mean():.1f} ± {m_vann.std():.1f} g")
print(f"Relativ usikkerhet: {m_vann.std() / m_vann.mean() * 100:.0f} %")
print(f"Regelen for differanse: ± {0.5 + 0.5:.1f} g")
