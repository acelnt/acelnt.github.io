import json
import sys
import time
import random
import os

try:
    col = sys.stdout.shell
except:
    pass

c = ["SYNC", "stdin", "BUILTIN", "STRING", "console", "COMMENT", "stdout", "TODO", "stderr", "hit", "DEFINITION", "KEYWORD", "ERROR", "sel"]

Path = input("Enter path to Json: \n>")
if Path == "":
    files = os.listdir()
    number = 0
    file = "TA.json"
    for i in files:
        if "TA" in i:
            if not i == "TA.json":
                try:
                    num = int(i[4:-6])
                    if num > number:
                        number = num
                        file = i
                except:
                    pass
    Path = file

print(Path)
if Path in os.listdir():    
    file = open(Path, "r")
else:
    exit()
data = json.loads(file.read())

node = data["first"]
nodes = data["nodes"]
if data["first"] == "" or not (data["first"] in nodes):
    node = random.choice(list(nodes))
    
vals = {}

def doop():
    print()
    if node in nodes:
        for i in nodes[node]["body"]:
            print(func(i), end="")
        options(nodes[node]["options"])

def options(ops):
    global node
    good = False
    while not good:
        try:
            print()
            shown = []
            for i in ops:
                if "logic" in ops[i] and func(ops[i]["logic"]):
                    shown.append(i)
                    print("(" + str(len(shown)) + ")", i)
            if not(len(shown) == 0):
              selection = int(input(">")) -1
            else:
              exit()
            good = True
        except:
            good = False
    try:
        node = ops[shown[selection]]["link"]
    except:
        pass
    doop()
            
def func(fnc):
    if type(fnc) is str:
        if fnc.isdigit():
            return float(fnc)
        elif fnc == "true":
            return True
        elif fnc == "false":
            return False
        else:
            return fnc
    elif type(fnc) is dict:
        for i in fnc:
            params = []
            run = i
            for i2 in fnc[i]:
                params.append(func(i2))
            try:
                return globals()[run](*params)
            except:
                return ""

def add(*args):
    try:
        total = 0
        for i in args:
            total += i
        return total
    except:
        return ""

def subtract(*args):
    try:
        total = args.pop(0)
        for i in args:
            total -= i
        return total
    except:
        return ""

def multiply(*args):
    try:
        total = args.pop(0)
        for i in args:
            total *= i
        return total
    except:
        return ""

def divide(*args):
    try:
        total = args.pop(0)
        for i in args:
            total /= i
        return total
    except:
        return ""

def inp(word, *q):
    return input(word)

def set(k, v, *q):
    vals[k] = v
    return ""

def clear(*q):
    print("\n"*49)
    print("\n"*49)
    return ""

def colour(n, *q):
    try:
        col.write(c[int(n)])
    except:
        pass
    return ""

def equal(v1, v2, *q):
    try:
        return v1 == v2
    except:
        return False

def nl(*q):
    print("\n")
    return ""

def wait(s, *q):
    try:
        time.sleep(s)
    except:
        pass
    return ""

def enter(*q):
    input("")
    return ""

def greater(a, b, *q):
    try:
        return a > b
    except:
        return False

def less(a, b, *q):
    try:
        return a < b
    except:
        return False

def AND(*args):
    for i in args:
        if not i:
            return False
    return True

def NOT(arg):
    return not(arg)

def OR(*args):
    for i in args:
        if i:
            return True
    return False

def get(k, *q):
    try:
        return vals[k]
    except:
        return None
    
doop()
