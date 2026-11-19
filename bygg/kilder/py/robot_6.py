from robot import Robot

robot = Robot("labyrint")
print("Avstand til veggen:", robot.avstand(), "m")

while robot.avstand() > 0.2:    # så lenge det er plass foran roboten
    robot.kjør(0.05)            # kjør et lite stykke fram

print("Stopper. Avstand til veggen:", robot.avstand(), "m")
