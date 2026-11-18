import numpy as np
import matplotlib.pyplot as plt

mu0 = 4 * np.pi * 1e-7     # T m/A

def ring(R, z0, n=200):
    """Deler en strømsløyfe med radius R i planet z = z0 i n små biter.
    Gir midtpunktet og lengdevektoren dl til hver bit."""
    fi = np.linspace(0, 2 * np.pi, n + 1)
    punkter = np.column_stack([R * np.cos(fi), R * np.sin(fi), np.full(n + 1, z0)])
    dl = punkter[1:] - punkter[:-1]
    midt = (punkter[1:] + punkter[:-1]) / 2
    return midt, dl

def felt(biter, I, punkt):
    """Biot–Savarts lov: dB = μ0 I / (4π) · dl × r / r³, summert over alle bitene."""
    midt, dl = biter
    r = punkt - midt                              # fra hver bit til punktet
    r3 = np.linalg.norm(r, axis=1)**3
    dB = mu0 * I / (4 * np.pi) * np.cross(dl, r) / r3[:, None]
    return dB.sum(axis=0)                         # (Bx, By, Bz)

R, I = 0.10, 5.0        # m, A
B = felt(ring(R, 0), I, np.array([0, 0, 0]))
print(f"B i sentrum: {B[2] * 1e6:.3f} µT (numerisk)")
print(f"μ0 I / (2R):  {mu0 * I / (2 * R) * 1e6:.3f} µT (formel)")
