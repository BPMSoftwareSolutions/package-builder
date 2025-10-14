"""
Flask Training App - Python Interview Prep
Provides API endpoints for training modules and code grading with sandboxed execution.
"""

from flask import Flask, send_from_directory, jsonify, request
import json
import ast
import time
import traceback

app = Flask(__name__, static_folder="static", static_url_path="")

# ------- Modules API -------
@app.get("/api/modules")
def list_modules():
    """Return catalog of all available training modules."""
    with open("modules/module_index.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.get("/api/modules/<mod_id>")
def get_module(mod_id):
    """Return specific module with all workshops."""
    try:
        with open(f"modules/{mod_id}.json", "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({"error": "Module not found"}), 404

# ------- Safe execution sandbox -------
DISALLOWED_NODES = (
    ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal, ast.With, ast.AsyncWith,
    ast.Lambda  # Removed Try, Raise, Attribute to allow basic Python operations
)

SAFE_BUILTINS = {
    "len": len, "range": range, "sum": sum, "min": min, "max": max, "abs": abs,
    "enumerate": enumerate, "zip": zip, "sorted": sorted, "all": all, "any": any,
    "list": list, "dict": dict, "set": set, "tuple": tuple, "str": str, "int": int,
    "float": float, "bool": bool, "print": print, "isinstance": isinstance, "type": type,
    "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
    "KeyError": KeyError, "IndexError": IndexError, "AttributeError": AttributeError
}

def validate_source(code: str):
    """
    Validate user code using AST parsing.
    Raises ValueError if code contains disallowed constructs.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"SyntaxError: {e}")
    
    for node in ast.walk(tree):
        if isinstance(node, DISALLOWED_NODES):
            raise ValueError(f"Use of disallowed language feature in this exercise: {node.__class__.__name__}")
    
    return tree

def run_user_and_tests(user_code: str, tests_code: str):
    """
    Execute user code and test harness in sandboxed environment.

    Args:
        user_code: User's submitted code
        tests_code: Test harness that defines grade(user_ns) function

    Returns:
        dict with score, max_score, and feedback
    """
    import inspect
    import builtins

    # 1) validate user code AST
    validate_source(user_code)

    # 2) prepare sandboxes
    user_ns = {"__builtins__": SAFE_BUILTINS}

    # Test namespace needs more builtins for inspect module to work
    # Create a copy of safe builtins and add necessary items for inspect
    test_builtins = SAFE_BUILTINS.copy()
    test_builtins["__import__"] = builtins.__import__  # Needed by inspect
    test_builtins["__name__"] = "__main__"
    test_builtins["__file__"] = "<tests>"

    test_ns = {
        "__builtins__": test_builtins,
        "inspect": inspect  # Allow tests to use inspect module
    }

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
    Grade a code submission.

    JSON body:
    {
      "moduleId": "python_basics",
      "workshopId": "basics_01",
      "approachId": "comprehension",  // Optional, for workshops with multiple approaches
      "code": "..."
    }

    Returns:
    {
      "ok": true,
      "score": 100,
      "max_score": 100,
      "feedback": "Great!",
      "elapsed_ms": 5
    }
    """
    data = request.get_json(force=True)
    mod_id = data.get("moduleId")
    ws_id = data.get("workshopId")
    approach_id = data.get("approachId")  # Optional
    code = data.get("code")

    if not mod_id or not ws_id or not code:
        return jsonify({"ok": False, "error": "Missing required fields"}), 400

    try:
        with open(f"modules/{mod_id}.json", "r", encoding="utf-8") as f:
            module = json.load(f)

        ws = next((w for w in module["workshops"] if w["id"] == ws_id), None)
        if not ws:
            return jsonify({"ok": False, "error": "Workshop not found"}), 404

        # Handle both old format (single approach) and new format (multiple approaches)
        if "approaches" in ws:
            # New format: multiple approaches
            if not approach_id:
                return jsonify({"ok": False, "error": "approachId required for multi-approach workshops"}), 400

            approach = next((a for a in ws["approaches"] if a["id"] == approach_id), None)
            if not approach:
                return jsonify({"ok": False, "error": "Approach not found"}), 404

            tests_code = approach["tests"]
        else:
            # Old format: single approach (backward compatibility)
            tests_code = ws["tests"]

        t0 = time.time()
        result = run_user_and_tests(code, tests_code)
        result["elapsed_ms"] = int((time.time() - t0) * 1000)

        return jsonify({"ok": True, **result})

    except FileNotFoundError:
        return jsonify({"ok": False, "error": "Module not found"}), 404
    except Exception as e:
        trace_lines = traceback.format_exc().splitlines()
        return jsonify({
            "ok": False,
            "error": str(e),
            "trace": trace_lines[-3:] if len(trace_lines) >= 3 else trace_lines
        }), 400

# ------- Frontend -------
@app.get("/")
def home():
    """Serve the main application page."""
    return send_from_directory("static", "index.html")

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)

