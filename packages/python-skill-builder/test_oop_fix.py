"""Test script to verify AOP retry code works in sandbox"""
import sys
sys.path.insert(0, '.')

from app import run_user_and_tests

# Test the retry decorator code
user_code = """
from functools import wraps
import time

def retry(max_attempts=3, delay=0.1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        print(f"[RETRY] Failed after {attempt} attempts.")
                        raise
                    else:
                        wait_time = delay * (2 ** (attempt - 1))
                        print(f"[RETRY] Attempt {attempt} failed with {e}. Retrying in {wait_time:.2f}s...")
                        time.sleep(wait_time)
        return wrapper
    return decorator


class BadInput(Exception):
    pass


@retry(max_attempts=3)
def parse_int(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        raise BadInput(f"Invalid integer input: {s}")
"""

# Test harness for retry decorator
test_code = """
def grade(ns):
    max_score = 100
    retry = ns.get('retry')
    parse_int = ns.get('parse_int')
    BadInput = ns.get('BadInput')

    if not retry:
        return {'score': 0, 'max_score': max_score, 'feedback': 'retry decorator missing'}
    if not parse_int:
        return {'score': 20, 'max_score': max_score, 'feedback': 'parse_int function missing'}
    if not BadInput:
        return {'score': 40, 'max_score': max_score, 'feedback': 'BadInput exception missing'}

    # Test successful parse
    result = parse_int('42')
    if result != 42:
        return {'score': 60, 'max_score': max_score, 'feedback': 'parse_int should return 42 for "42"'}

    # Test that decorator is applied
    source = ns.get('__source__', '')
    if '@retry' not in source or 'wraps' not in source:
        return {'score': 80, 'max_score': max_score, 'feedback': 'Use @retry decorator with @wraps'}

    return {'score': 100, 'max_score': max_score, 'feedback': 'Perfect! Retry decorator works.'}
"""

print("Testing AOP retry code in sandbox...")
try:
    result = run_user_and_tests(user_code, test_code)
    print(f"✓ Test passed!")
    print(f"  Score: {result['score']}/{result['max_score']}")
    print(f"  Feedback: {result['feedback']}")
except Exception as e:
    print(f"✗ Test failed: {e}")
    import traceback
    traceback.print_exc()

