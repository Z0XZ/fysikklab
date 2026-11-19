from robot import Robot

robot = Robot()
robot.motorer(0.2, 0.2, 3)     # like fart på begge hjulene i 3 sekunder
robot.farge = "red"
robot.motorer(0.2, 0.3, 5)     # høyre hjul går fortere enn venstre
robot.farge = "green"
robot.motorer(-0.1, 0.1, 2)    # hjulene går hver sin vei
