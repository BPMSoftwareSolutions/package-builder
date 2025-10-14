Awesome—here’s your **Week 1 curriculum pack** as drop-in JSON modules. Add these files to `ai-python-trainer-mvp/modules/` and replace `module_index.json` with the updated one below. Each module has 2 workshops with prompts, starter code, click-to-reveal hints, and a `grade(ns)` test harness.

---

# 1) Update catalog

## `modules/module_index.json` (replace)

```json
{
  "modules": [
    { "id": "python_basics", "title": "Python Basics", "summary": "Syntax, control flow, functions, comprehensions.", "estimatedMinutes": 25, "workshopCount": 2 },

    { "id": "functions_and_syntax", "title": "Functions & Syntax", "summary": "Arguments, defaults, *args/**kwargs, returns.", "estimatedMinutes": 25, "workshopCount": 2 },
    { "id": "oop_fundamentals", "title": "OOP Fundamentals", "summary": "Classes, inheritance, properties, __repr__.", "estimatedMinutes": 30, "workshopCount": 2 },
    { "id": "errors_and_debugging", "title": "Errors & Debugging", "summary": "try/except/else/finally, custom exceptions, logging mindset.", "estimatedMinutes": 25, "workshopCount": 2 },
    { "id": "comprehensions_and_generators", "title": "Comprehensions & Generators", "summary": "List/dict/set comps and generator expressions.", "estimatedMinutes": 25, "workshopCount": 2 },
    { "id": "numpy_intro", "title": "NumPy Intro", "summary": "Arrays, vectorization, shapes.", "estimatedMinutes": 25, "workshopCount": 2 },
    { "id": "flask_intro", "title": "Flask Intro", "summary": "Routing, parameters, JSON responses.", "estimatedMinutes": 30, "workshopCount": 2 }
  ]
}
```

---

# 2) New modules

## `modules/functions_and_syntax.json`

```json
{
  "id": "functions_and_syntax",
  "title": "Functions & Syntax",
  "description": "Master function signatures, defaults, *args/**kwargs, and returns.",
  "workshops": [
    {
      "id": "fx_01",
      "title": "Safe Divider (defaults + error guard)",
      "timeLimitMinutes": 7,
      "prompt": "Implement safe_divide(a, b, default=0) that returns a/b. If b==0, return default.",
      "starterCode": "def safe_divide(a, b, default=0):\n    # TODO: handle division by zero via default\n    pass\n",
      "hints": [
        "Hint 1: Use 'if b == 0:' early-return the default.",
        "Hint 2: No exceptions needed for this one.",
        "Hint 3: Make 'default' a keyword with a sensible default."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  if 'safe_divide' not in ns: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  f=ns['safe_divide']\n  try:\n    if f(6,3)!=2: return {'score':40,'max_score':max_score,'feedback':'6/3 should be 2'}\n    if f(1,0)!=0: return {'score':60,'max_score':max_score,'feedback':'Default when b==0 should be used'}\n    if f(1,0,default=99)!=99: return {'score':80,'max_score':max_score,'feedback':'Keyword default not applied'}\n    return {'score':100,'max_score':max_score,'feedback':'Great!'}\n  except Exception as e:\n    return {'score':0,'max_score':max_score,'feedback':str(e)}\n"
    },
    {
      "id": "fx_02",
      "title": "*args/**kwargs Echo",
      "timeLimitMinutes": 8,
      "prompt": "Implement echo_signature(*args, **kwargs) that returns a tuple: (list(args), sorted list of (key,value) pairs by key).",
      "starterCode": "def echo_signature(*args, **kwargs):\n    # TODO: return (list(args), sorted list of (key,value))\n    pass\n",
      "hints": [
        "Hint 1: list(args) gives a list of positional args.",
        "Hint 2: kwargs.items() can be sorted by key.",
        "Hint 3: return a tuple (.., ..)."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  if 'echo_signature' not in ns: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  f=ns['echo_signature']\n  p,k=f(1,2,a=3,b=4)\n  if p!=[1,2]: return {'score':50,'max_score':max_score,'feedback':'Positional args wrong'}\n  if k!=[('a',3),('b',4)]: return {'score':80,'max_score':max_score,'feedback':'Keyword sorting wrong'}\n  return {'score':100,'max_score':max_score,'feedback':'Nice!'}\n"
    }
  ]
}
```

---

## `modules/oop_fundamentals.json`

```json
{
  "id": "oop_fundamentals",
  "title": "OOP Fundamentals",
  "description": "Classes, inheritance, properties, and readable reprs.",
  "workshops": [
    {
      "id": "oop_01",
      "title": "Vehicle → Truck (inheritance + property)",
      "timeLimitMinutes": 10,
      "prompt": "Create class Vehicle(vin) with read-only property vin. Subclass Truck(Vehicle) with capacity (int). __repr__ should return 'Truck(VIN, capacity=...)'.",
      "starterCode": "class Vehicle:\n    def __init__(self, vin):\n        pass\n\nclass Truck(Vehicle):\n    def __init__(self, vin, capacity):\n        pass\n    \n    def __repr__(self):\n        pass\n",
      "hints": [
        "Hint 1: Use @property for vin (no setter).",
        "Hint 2: In Truck.__init__, call super().__init__(vin).",
        "Hint 3: __repr__ returns a developer-friendly string."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  try:\n    V=ns['Vehicle']; T=ns['Truck']\n  except KeyError:\n    return {'score':0,'max_score':max_score,'feedback':'Classes missing'}\n  t=T('VIN1',1000)\n  if getattr(t,'vin',None)!='VIN1': return {'score':60,'max_score':max_score,'feedback':'vin property incorrect'}\n  if 'Truck(VIN1' not in repr(t): return {'score':80,'max_score':max_score,'feedback':'__repr__ format expected to include VIN and capacity'}\n  return {'score':100,'max_score':max_score,'feedback':'Good OOP work!'}\n"
    },
    {
      "id": "oop_02",
      "title": "classmethod vs staticmethod",
      "timeLimitMinutes": 8,
      "prompt": "Implement class Counter with: (a) class attribute total=0; (b) classmethod from_list(lst) that returns sum(lst); (c) staticmethod is_positive(x) -> bool.",
      "starterCode": "class Counter:\n    total = 0\n    @classmethod\n    def from_list(cls, lst):\n        # TODO\n        pass\n    @staticmethod\n    def is_positive(x):\n        # TODO\n        pass\n",
      "hints": [
        "Hint 1: classmethod receives cls.",
        "Hint 2: staticmethod has no cls/self.",
        "Hint 3: You can update Counter.total inside from_list."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  C=ns.get('Counter')\n  if C is None: return {'score':0,'max_score':max_score,'feedback':'Class missing'}\n  s=C.from_list([1,2,3])\n  if s!=6: return {'score':60,'max_score':max_score,'feedback':'from_list must sum values'}\n  if not C.is_positive(5) or C.is_positive(-1): return {'score':80,'max_score':max_score,'feedback':'is_positive incorrect'}\n  return {'score':100,'max_score':max_score,'feedback':'Solid!'}\n"
    }
  ]
}
```

---

## `modules/errors_and_debugging.json`

```json
{
  "id": "errors_and_debugging",
  "title": "Errors & Debugging",
  "description": "Use try/except/else/finally and custom exceptions to write robust code.",
  "workshops": [
    {
      "id": "err_01",
      "title": "Custom Exception",
      "timeLimitMinutes": 7,
      "prompt": "Define BadInput(Exception). Implement parse_int(s) that returns int(s) or raises BadInput on failure.",
      "starterCode": "class BadInput(Exception):\n    pass\n\ndef parse_int(s):\n    # TODO: convert to int, else raise BadInput\n    pass\n",
      "hints": [
        "Hint 1: Wrap int(s) in try/except.",
        "Hint 2: On ValueError, raise BadInput instead."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  if 'parse_int' not in ns: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  f=ns['parse_int']; Bad=ns.get('BadInput')\n  if f('10')!=10: return {'score':60,'max_score':max_score,'feedback':'Should parse valid int'}\n  try:\n    f('x')\n  except Bad:\n    return {'score':100,'max_score':max_score,'feedback':'Correct exception raised'}\n  except Exception:\n    return {'score':80,'max_score':max_score,'feedback':'Wrong exception type'}\n  return {'score':40,'max_score':max_score,'feedback':'Did not raise on invalid input'}\n"
    },
    {
      "id": "err_02",
      "title": "try/except/else/finally",
      "timeLimitMinutes": 10,
      "prompt": "Implement open_and_count(path) that opens a text file, returns number of lines. On FileNotFoundError return -1. Always set a variable 'closed' to True in finally (return both count, closed).",
      "starterCode": "def open_and_count(path):\n    closed=False\n    # TODO: try to open file, count lines; handle not found; ensure closed=True in finally\n    pass\n",
      "hints": [
        "Hint 1: Use try/except FileNotFoundError.",
        "Hint 2: Use finally to toggle closed=True.",
        "Hint 3: Return (count, closed)."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('open_and_count')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  # create temp file\n  import os, tempfile\n  fd, p = tempfile.mkstemp(text=True)\n  os.write(fd, b'a\\n b\\n c')\n  os.close(fd)\n  c, closed = f(p)\n  if c<2: return {'score':60,'max_score':max_score,'feedback':'Count seems wrong'}\n  if closed is not True: return {'score':80,'max_score':max_score,'feedback':'Must set closed=True in finally'}\n  c2, closed2 = f('no_such_file.txt')\n  if c2!=-1: return {'score':90,'max_score':max_score,'feedback':'Return -1 when missing'}\n  return {'score':100,'max_score':max_score,'feedback':'Great'}\n"
    }
  ]
}
```

---

## `modules/comprehensions_and_generators.json`

```json
{
  "id": "comprehensions_and_generators",
  "title": "Comprehensions & Generators",
  "description": "Write concise, efficient data transforms with comps and generator expressions.",
  "workshops": [
    {
      "id": "cg_01",
      "title": "Dict Comp (word lengths)",
      "timeLimitMinutes": 7,
      "prompt": "Implement word_lengths(words) that returns {word:len(word)} for words list.",
      "starterCode": "def word_lengths(words):\n    # TODO: dict comprehension\n    pass\n",
      "hints": [
        "Hint 1: {k:v for ...}.",
        "Hint 2: Remember len(word)."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('word_lengths')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  d=f(['hi','car'])\n  if d!={'hi':2,'car':3}: return {'score':60,'max_score':max_score,'feedback':'Check dict comp'}\n  return {'score':100,'max_score':max_score,'feedback':'Nice!'}\n"
    },
    {
      "id": "cg_02",
      "title": "Generator (even stream)",
      "timeLimitMinutes": 8,
      "prompt": "Implement gen_evens(n) that yields even numbers from 0..n inclusive.",
      "starterCode": "def gen_evens(n):\n    # TODO: use yield in a loop\n    pass\n",
      "hints": [
        "Hint 1: use 'yield' inside a for.",
        "Hint 2: even if i % 2 == 0."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  g=ns.get('gen_evens')\n  if not g: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  out=list(g(6))\n  if out!=[0,2,4,6]: return {'score':60,'max_score':max_score,'feedback':'Generator or filter incorrect'}\n  return {'score':100,'max_score':max_score,'feedback':'Great!'}\n"
    }
  ]
}
```

---

## `modules/numpy_intro.json`

```json
{
  "id": "numpy_intro",
  "title": "NumPy Intro",
  "description": "Vector operations, elementwise arithmetic, shapes.",
  "workshops": [
    {
      "id": "np_01",
      "title": "Elementwise ops",
      "timeLimitMinutes": 8,
      "prompt": "Implement vec_add(a,b) using NumPy arrays to return elementwise sum as a Python list.",
      "starterCode": "def vec_add(a, b):\n    # TODO: import numpy and do elementwise add; return list\n    pass\n",
      "hints": [
        "Hint 1: import numpy as np inside function (AST guard limits globals).",
        "Hint 2: np.array(a) + np.array(b).",
        "Hint 3: Convert back with .tolist()."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('vec_add')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  out=f([1,2,3],[4,5,6])\n  if out!=[5,7,9]: return {'score':60,'max_score':max_score,'feedback':'Elementwise add wrong'}\n  return {'score':100,'max_score':max_score,'feedback':'Vectorized!'}\n"
    },
    {
      "id": "np_02",
      "title": "Dot product",
      "timeLimitMinutes": 8,
      "prompt": "Implement dot(a,b) returning integer dot product using NumPy.",
      "starterCode": "def dot(a, b):\n    # TODO: use np.dot\n    pass\n",
      "hints": [
        "Hint 1: np.dot(np.array(a), np.array(b)).",
        "Hint 2: Return int() for plain integer result."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('dot')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  if f([1,2,3],[4,5,6])!=32: return {'score':60,'max_score':max_score,'feedback':'Expected 32'}\n  return {'score':100,'max_score':max_score,'feedback':'Good dot!'}\n"
    }
  ]
}
```

---

## `modules/flask_intro.json`

```json
{
  "id": "flask_intro",
  "title": "Flask Intro",
  "description": "Basic routes, params, and JSON responses.",
  "workshops": [
    {
      "id": "fl_01",
      "title": "Hello Route (string param)",
      "timeLimitMinutes": 8,
      "prompt": "Write a function make_greeting(name) -> 'Hello, {name}'. (We simulate Flask logic here; focus on pure function.)",
      "starterCode": "def make_greeting(name):\n    # TODO: format string\n    pass\n",
      "hints": [
        "Hint 1: f-strings are concise.",
        "Hint 2: Ensure exact punctuation."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('make_greeting')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  if f('Ford')!='Hello, Ford': return {'score':60,'max_score':max_score,'feedback':'String format mismatch'}\n  return {'score':100,'max_score':max_score,'feedback':'Hi!'}\n"
    },
    {
      "id": "fl_02",
      "title": "Query Handling (simulate)",
      "timeLimitMinutes": 10,
      "prompt": "Implement echo_query(params: dict) that returns {'ok': True, 'q': params.get('q','')}.",
      "starterCode": "def echo_query(params):\n    # TODO: use dict.get\n    pass\n",
      "hints": [
        "Hint 1: params is a dict; use get('q','').",
        "Hint 2: Return a dict exactly as specified."
      ],
      "tests": "def grade(ns):\n  max_score=100\n  f=ns.get('echo_query')\n  if not f: return {'score':0,'max_score':max_score,'feedback':'Function missing'}\n  if f({'q':'ping'})!={'ok':True,'q':'ping'}: return {'score':60,'max_score':max_score,'feedback':'Wrong dict result'}\n  if f({})!={'ok':True,'q':''}: return {'score':80,'max_score':max_score,'feedback':'Default missing'}\n  return {'score':100,'max_score':max_score,'feedback':'Clean!'}\n"
    }
  ]
}
```

---

## Pro tips

* You can **toggle difficulty** by tweaking tests (e.g., add edge cases).
* To unlock more Python features in the sandbox, loosen `DISALLOWED_NODES` in `app.py` one at a time (or run code in a container for full freedom).
* For pacing, set **time boxes** in each module (`timeLimitMinutes`) to match your daily plan.

