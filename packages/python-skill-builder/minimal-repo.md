Love this. Let’s ship an MVP you can run today: a self-paced, AI-assisted Python training app with modules, timed workshops, hints, scoring, and a day-by-day dashboard.

Below is a complete, minimal repo you can drop into a folder and run.

Project: ai-python-trainer-mvp
What you get (MVP)

HTML dashboard that lists modules and tracks progress

Guided workshops with:

prompt, starter code, timebox

click-to-reveal hints (small, progressive)

Run & Grade to score your submission

Timers & local progress persistence

Python backend that:

serves modules (JSON)

safely executes user code in a restricted sandbox

runs module-provided tests to score answers

Run it
# 1) create & activate venv (optional but recommended)
python -m venv .venv && . .venv/Scripts/activate  # Windows
# or: source .venv/bin/activate                    # macOS/Linux

# 2) save files below into a folder named ai-python-trainer-mvp
pip install flask

# 3) run
python app.py

# 4) visit
http://127.0.0.1:5000

Repo layout
ai-python-trainer-mvp/
├── app.py
├── modules/
│   ├── module_index.json
│   └── python_basics.json
└── static/
    ├── index.html
    ├── app.js
    └── styles.css

app.py (Flask backend + safe runner)
from flask import Flask, send_from_directory, jsonify, request
import json, ast, time, traceback

app = Flask(__name__, static_folder="static", static_url_path="")

# ------- Modules API -------
@app.get("/api/modules")
def list_modules():
    with open("modules/module_index.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.get("/api/modules/<mod_id>")
def get_module(mod_id):
    with open(f"modules/{mod_id}.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

# ------- Safe execution sandbox -------
DISALLOWED_NODES = (
    ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal, ast.With, ast.AsyncWith,
    ast.Lambda, ast.Try, ast.Raise, ast.Attribute  # keep it simple for MVP
)

SAFE_BUILTINS = {
    "len": len, "range": range, "sum": sum, "min": min, "max": max, "abs": abs,
    "enumerate": enumerate, "zip": zip, "sorted": sorted, "all": all, "any": any
}

def validate_source(code: str):
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"SyntaxError: {e}")
    for node in ast.walk(tree):
        if isinstance(node, DISALLOWED_NODES):
            raise ValueError("Use of disallowed language feature in this exercise.")
    return tree

def run_user_and_tests(user_code: str, tests_code: str):
    # 1) validate user code AST
    validate_source(user_code)
    # 2) prepare sandboxes
    user_ns = {"__builtins__": SAFE_BUILTINS}
    test_ns = {"__builtins__": SAFE_BUILTINS}
    # 3) exec user code
    exec(compile(user_code, "<user>", "exec"), user_ns, user_ns)
    # 4) exec tests (must define grade(user_ns) -> dict(score:int, feedback:str))
    exec(compile(tests_code, "<tests>", "exec"), test_ns, test_ns)
    if "grade" not in test_ns or not callable(test_ns["grade"]):
        raise RuntimeError("Test script must define grade(user_ns) -> dict.")
    result = test_ns["grade"](user_ns)
    # normalize
    score = int(result.get("score", 0))
    feedback = str(result.get("feedback", ""))
    max_score = int(result.get("max_score", 100))
    return {"score": score, "max_score": max_score, "feedback": feedback}

@app.post("/api/grade")
def grade_submission():
    """
    JSON body:
    {
      "moduleId": "python_basics",
      "workshopId": "basics_01",
      "code": "..."
    }
    """
    data = request.get_json(force=True)
    mod_id = data["moduleId"]
    ws_id = data["workshopId"]
    code = data["code"]

    try:
        with open(f"modules/{mod_id}.json", "r", encoding="utf-8") as f:
            module = json.load(f)
        ws = next(w for w in module["workshops"] if w["id"] == ws_id)
        tests_code = ws["tests"]
        t0 = time.time()
        result = run_user_and_tests(code, tests_code)
        result["elapsed_ms"] = int((time.time() - t0) * 1000)
        return jsonify({"ok": True, **result})
    except StopIteration:
        return jsonify({"ok": False, "error": "Workshop not found"}), 404
    except Exception as e:
        return jsonify({"ok": False, "error": str(e), "trace": traceback.format_exc().splitlines()[-3:]}), 400

# ------- Frontend -------
@app.get("/")
def home():
    return send_from_directory("static", "index.html")

if __name__ == "__main__":
    app.run(debug=True)


MVP security note: the sandbox is intentionally restrictive. For a production training platform, run code in an isolated container/namespace (e.g., Firecracker/microVM or a job runner) and broaden allowed features per exercise.

modules/module_index.json (catalog)
{
  "modules": [
    {
      "id": "python_basics",
      "title": "Python Basics",
      "summary": "Syntax, control flow, functions, and list comprehensions.",
      "estimatedMinutes": 25,
      "workshopCount": 2
    }
  ]
}

modules/python_basics.json (example module with 2 workshops)
{
  "id": "python_basics",
  "title": "Python Basics",
  "description": "Core language skills: functions, loops, and list comprehensions.",
  "workshops": [
    {
      "id": "basics_01",
      "title": "Even Squares (List Comprehension)",
      "timeLimitMinutes": 7,
      "prompt": "Write a function even_squares(nums) -> list that returns the squares of even numbers from nums, preserving order.",
      "starterCode": "def even_squares(nums):\n    # TODO: return squares of evens, e.g., [1,2,3,4] -> [4,16]\n    pass\n",
      "hints": [
        "Hint 1: A list comprehension can include an if-clause.",
        "Hint 2: x*x is fine for squaring; no need for math.pow.",
        "Hint 3: Even means x % 2 == 0."
      ],
      "tests": "def grade(ns):\n    max_score = 100\n    fb = []\n    if 'even_squares' not in ns:\n  