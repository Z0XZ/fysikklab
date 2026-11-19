from robot import Robot

robot = Robot()
for i in range(4):    # gjenta det som står under, 4 ganger
    robot.kjør(1)     # linjene med innrykk er det som gjentas
    robot.sving(90)

print("Roboten brukte", round(robot.tid, 1), "sekunder")
