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
    ast.Global, ast.Nonlocal, ast.With, ast.AsyncWith
    # Removed Try, Raise, Attribute to allow basic Python operations
    # Removed Lambda to allow functional programming patterns (issue #31)
)

# Allowed imports for AOP approaches and specific exercises
ALLOWED_IMPORTS = {
    'functools': ['wraps'],  # Required for decorators
    'time': ['sleep', 'time', 'perf_counter'],  # Required for timing/retry decorators
    'numpy': None,  # Allow all numpy imports (for numpy exercises)
}

SAFE_BUILTINS = {
    "len": len, "range": range, "sum": sum, "min": min, "max": max, "abs": abs,
    "enumerate": enumerate, "zip": zip, "sorted": sorted, "all": all, "any": any,
    "map": map, "filter": filter,  # Required for functional programming with lambda
    "list": list, "dict": dict, "set": set, "tuple": tuple, "str": str, "int": int,
    "float": float, "bool": bool, "print": print, "isinstance": isinstance, "type": type,
    "repr": repr, "getattr": getattr, "setattr": setattr, "hasattr": hasattr,  # Object attribute access
    "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
    "KeyError": KeyError, "IndexError": IndexError, "AttributeError": AttributeError,
    "NameError": NameError, "ImportError": ImportError,  # Required for error handling in tests
    "__build_class__": __build_class__,  # Required for class definitions
    "property": property,  # Required for @property decorator
    "classmethod": classmethod,  # Required for @classmethod decorator
    "staticmethod": staticmethod,  # Required for @staticmethod decorator
    "super": super  # Required for super() calls in inheritance
}

def validate_source(code: str):
    """
    Validate user code using AST parsing.
    Raises ValueError if code contains disallowed constructs.
    Allows specific safe imports defined in ALLOWED_IMPORTS.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"SyntaxError: {e}")

    for node in ast.walk(tree):
        # Check for disallowed nodes (excluding Import/ImportFrom which we handle separately)
        if isinstance(node, DISALLOWED_NODES):
            raise ValueError(f"Use of disallowed language feature in this exercise: {node.__class__.__name__}")

        # Check imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name
                if module not in ALLOWED_IMPORTS:
                    raise ValueError(f"Import of '{module}' is not allowed. Only {list(ALLOWED_IMPORTS.keys())} are permitted.")

        if isinstance(node, ast.ImportFrom):
            module = node.module
            if module not in ALLOWED_IMPORTS:
                raise ValueError(f"Import from '{module}' is not allowed. Only {list(ALLOWED_IMPORTS.keys())} are permitted.")

            # Check specific imports if restrictions exist
            allowed_names = ALLOWED_IMPORTS[module]
            if allowed_names is not None:  # None means all imports allowed
                for alias in node.names:
                    if alias.name not in allowed_names:
                        raise ValueError(f"Import of '{alias.name}' from '{module}' is not allowed. Only {allowed_names} are permitted.")

    return tree

def extract_expected_results(tests_code: str):
    """
    Extract expected test results from test code.
    Looks for patterns like:
    - if result != [4, 16]:
    - expected = [...]; if result != expected:

    Args:
        tests_code: Test harness code

    Returns:
        dict mapping function names to lists of expected results
    """
    import re
    expected = {}

    # Extract function name from pattern: if 'funcname' not in ns:
    func_pattern = r"if\s+'(\w+)'\s+not\s+in\s+ns"
    func_matches = re.findall(func_pattern, tests_code)
    func_name = func_matches[0] if func_matches else 'unknown'

    # First, try to find variable assignments like: expected=['1','2','Fizz',...]
    var_pattern = r'expected\s*=\s*(\[.*?\])'
    var_matches = re.findall(var_pattern, tests_code)

    for match in var_matches:
        try:
            # Safely evaluate the list literal
            expected_value = eval(match)
            if isinstance(expected_value, list):
                if func_name not in expected:
                    expected[func_name] = []
                expected[func_name].append(expected_value)
        except:
            pass

    # Also look for direct patterns like: if result != [4, 16]:
    pattern = r'if\s+result\d*\s*!=\s*(\[.*?\])'
    matches = re.findall(pattern, tests_code)

    for match in matches:
        try:
            # Safely evaluate the list literal
            expected_value = eval(match)
            if isinstance(expected_value, list):
                if func_name not in expected:
                    expected[func_name] = []
                expected[func_name].append(expected_value)
        except:
            pass

    return expected


def run_user_and_tests(user_code: str, tests_code: str):
    """
    Execute user code and test harness in sandboxed environment.

    Args:
        user_code: User's submitted code
        tests_code: Test harness that defines grade(user_ns) function

    Returns:
        dict with score, max_score, feedback, and execution_results
    """
    import inspect
    import builtins
    import functools
    import time

    # 1) validate user code AST
    validate_source(user_code)

    # 2) Create a restricted __import__ that only allows whitelisted modules
    def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name in ALLOWED_IMPORTS or (fromlist and any(f in ALLOWED_IMPORTS for f in fromlist)):
            return builtins.__import__(name, globals, locals, fromlist, level)
        raise ImportError(f"Import of '{name}' is not allowed")

    # 3) prepare sandboxes with allowed modules
    user_builtins = SAFE_BUILTINS.copy()
    user_builtins["__import__"] = restricted_import  # Restricted import for user code

    user_ns = {
        "__builtins__": user_builtins,
        "__source__": user_code,  # Provide source code for pattern detection
        "__name__": "__main__"  # Required for class definitions
    }

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

    # Extract expected results from test code only if score is not perfect
    # (to avoid showing expected results when code is correct)
    expected_results = {}
    if score < max_score:
        expected_results = extract_expected_results(tests_code)

    # Capture execution results for visualizations
    execution_results = capture_execution_results(user_ns, user_code, expected_results)

    return {
        "score": score,
        "max_score": max_score,
        "feedback": feedback,
        "execution_results": execution_results
    }


def _serialize_arguments(args_tuple):
    """
    Serialize function arguments for display.

    Args:
        args_tuple: Tuple of arguments passed to function

    Returns:
        List of serialized arguments (as strings or JSON objects)
    """
    serialized = []
    for arg in args_tuple:
        if isinstance(arg, (list, tuple)):
            serialized.append(list(arg))
        elif isinstance(arg, dict):
            serialized.append(arg)
        elif isinstance(arg, str):
            serialized.append(arg)
        elif isinstance(arg, (int, float, bool)):
            serialized.append(arg)
        elif arg is None:
            serialized.append(None)
        else:
            # For other types, convert to string
            serialized.append(str(arg))
    return serialized


def capture_execution_results(user_ns, user_code="", expected_results=None):
    """
    Capture execution results from user namespace for visualization.

    Args:
        user_ns: User namespace after code execution
        user_code: The user's submitted code (for visualization)
        expected_results: dict mapping function names to expected results (optional)

    Returns:
        dict with captured execution data (functions, classes, variables, user_code)
    """
    if expected_results is None:
        expected_results = {}

    results = {
        "functions": {},
        "classes": {},
        "variables": {},
        "user_code": user_code
    }

    # Capture user-defined functions
    for name, obj in user_ns.items():
        if name.startswith("__"):
            continue

        if callable(obj) and not isinstance(obj, type):
            # It's a function
            func_info = {
                "name": name,
                "type": "function"
            }

            # Try to capture return value by calling with various test inputs
            test_inputs = [
                (),  # No arguments
                ([],),  # Empty list
                ([1, 2, 3, 4, 5],),  # List with numbers
                ("test",),  # String
                (5,),  # Single number
                (0,),  # Zero
            ]

            for test_input in test_inputs:
                try:
                    return_value = obj(*test_input)
                    # Serialize the return value
                    if isinstance(return_value, (list, tuple)):
                        func_info["return_value"] = list(return_value)
                        func_info["return_type"] = "list" if isinstance(return_value, list) else "tuple"
                    elif isinstance(return_value, dict):
                        func_info["return_value"] = return_value
                        func_info["return_type"] = "dict"
                    else:
                        func_info["return_value"] = str(return_value) if return_value is not None else None
                        func_info["return_type"] = type(return_value).__name__

                    # Serialize the arguments that were passed
                    func_info["arguments"] = _serialize_arguments(test_input)

                    # If we got a meaningful result (non-empty for lists/tuples), break
                    # Otherwise, try the next test input
                    if isinstance(return_value, (list, tuple)):
                        if len(return_value) > 0:
                            # Got meaningful data, stop trying
                            break
                        # Empty result, try next input
                    else:
                        # Non-list result, accept it
                        break
                except (TypeError, ValueError, AttributeError):
                    # This test input didn't work, try the next one
                    continue
                except Exception:
                    # Any other error, skip to next test input
                    continue

            # Add expected results if available for this function
            if name in expected_results:
                func_info["expected_results"] = expected_results[name]

            results["functions"][name] = func_info
        elif isinstance(obj, type):
            # It's a class
            class_info = {
                "name": name,
                "type": "class",
                "methods": []
            }

            # Capture class methods
            for attr_name in dir(obj):
                if not attr_name.startswith("_"):
                    attr = getattr(obj, attr_name)
                    if callable(attr):
                        class_info["methods"].append(attr_name)

            results["classes"][name] = class_info
        elif not callable(obj):
            # It's a variable - capture type and string representation
            try:
                results["variables"][name] = {
                    "name": name,
                    "type": type(obj).__name__,
                    "value": str(obj) if len(str(obj)) < 100 else str(obj)[:97] + "..."
                }
            except:
                results["variables"][name] = {
                    "name": name,
                    "type": type(obj).__name__,
                    "value": "<unable to serialize>"
                }

    return results

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
      "elapsed_ms": 5,
      "execution_results": {...},
      "visualizations": [...]
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

        # Add visualization configurations if present
        visualizations = ws.get("visualizations", [])
        if visualizations:
            result["visualizations"] = visualizations

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

