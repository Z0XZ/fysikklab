def kinetisk_energi(m, v):
    return 0.5 * m * v**2

def potensiell_energi(m, h, g=9.81):
    return m * g * h

m = 70   # kg
print(f"Kinetisk energi: {kinetisk_energi(m, v):.0f} J")
print(f"Potensiell energi 10 m over bakken: {potensiell_energi(m, 10):.0f} J")
