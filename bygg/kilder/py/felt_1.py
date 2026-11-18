import numpy as np
import matplotlib.pyplot as plt

k = 8.99e9   # N m²/C²

def felt(q, xq, yq, x, y):
    """Elektrisk felt (Ex, Ey) i punktet (x, y) fra ladningen q i punktet (xq, yq)."""
    dx, dy = x - xq, y - yq
    r = np.sqrt(dx**2 + dy**2)
    E = k * q / r**2            # med fortegn: positiv peker bort fra ladningen
    return E * dx / r, E * dy / r

# To ladninger på x-aksen
ladninger = [(4.0e-9, 0.0, 0.0),    # (q i C, x i m, y i m)
             (1.0e-9, 0.30, 0.0)]

def samlet_felt(x, y):
    Ex, Ey = 0.0, 0.0
    for q, xq, yq in ladninger:   # superposisjon: legg sammen feltene
        ex, ey = felt(q, xq, yq, x, y)
        Ex, Ey = Ex + ex, Ey + ey
    return Ex, Ey

Ex, Ey = samlet_felt(0.10, 0.10)
print(f"I punktet (0,10 m, 0,10 m): Ex = {Ex:.0f} N/C, Ey = {Ey:.0f} N/C, E = {np.hypot(Ex, Ey):.0f} N/C")
print(f"Retning: {np.degrees(np.arctan2(Ey, Ex)):.0f} grader over x-aksen")
