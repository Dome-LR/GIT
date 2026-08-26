import time

i=0

with open("output.txt", "a") as f:
    while (i<5):
        i+=1
        print(f'{i}) Hello Docker', file=f)

while (True):
    i+=1
    print(f"{i} Hello Docker")
    time.sleep(5)