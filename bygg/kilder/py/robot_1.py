from robot import Robot

robot = Robot()       # lag en robot på en tom bane
robot.kjør(1)         # kjør 1 meter rett fram
robot.sving(90)       # snu 90 grader mot venstre
robot.kjør(0.5)       # kjør 0,5 meter (Python bruker punktum i desimaltall)
