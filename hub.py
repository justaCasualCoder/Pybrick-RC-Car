from pybricks.hubs import InventorHub
from pybricks.pupdevices import Motor, ColorSensor, UltrasonicSensor
from pybricks.parameters import Button, Color, Direction, Port, Side, Stop
from pybricks.robotics import DriveBase
from pybricks.tools import wait, StopWatch
# Standard MicroPython modules
from usys import stdin, stdout
from uselect import poll
# Turning motor
t_motor = Motor(Port.F)
# Right Motor
r_motor = Motor(Port.B)
# Left Motor
l_motor = Motor(Port.D)
# Register input from stdin
input = poll()
input.register(stdin)
while True:
    # Let the web interface know we are ready
    stdout.buffer.write(b"rdy")
    # Optional: Check available input.
    while not input.poll(0):
        # Optional: Do something here.
        wait(10)

    # Read three bytes.
    cmd = stdin.buffer.read(3)

    # Decide what to do based on the command.
    if cmd == b"fwd":
        r_motor.dc(100)
        l_motor.dc(-100)
    elif cmd == b"rev":
        r_motor.dc(-100)
        l_motor.dc(100)
    elif cmd == b"bye":
        raise SystemExit
    elif cmd == b"stp":
        l_motor.stop()
        r_motor.stop()
    elif cmd == b"mid":
        t_motor.run_target(200, 0)
    elif cmd == b"rig":
        t_motor.run_target(200, 35)
    elif cmd == b"lfe":
        t_motor.run_target(200, -35)

