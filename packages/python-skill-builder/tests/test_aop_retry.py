"""
Test suite for AOP retry decorator functionality
Tests that the retry decorator properly retries failed operations
"""
import pytest
from app import run_user_and_tests


class TestAOPRetryDecorator:
    """Test the retry decorator with exponential backoff"""
    
    def test_retry_decorator_succeeds_on_valid_input(self):
        """Retry decorator should allow successful calls to pass through"""
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
                        raise
                    else:
                        time.sleep(delay * (2 ** (attempt - 1)))
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
        
        test_code = """
def grade(ns):
    max_score = 100
    parse_int = ns.get('parse_int')
    
    if not parse_int:
        return {'score': 0, 'max_score': max_score, 'feedback': 'parse_int function missing'}
    
    # Test valid input
    result = parse_int('42')
    if result != 42:
        return {'score': 50, 'max_score': max_score, 'feedback': f'Expected 42, got {result}'}
    
    return {'score': 100, 'max_score': max_score, 'feedback': 'Valid input works!'}
"""
        
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 100
    
    def test_retry_decorator_raises_after_max_attempts(self):
        """Retry decorator should raise exception after max attempts"""
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
                        raise
                    else:
                        time.sleep(delay * (2 ** (attempt - 1)))
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
        
        test_code = """
def grade(ns):
    max_score = 100
    parse_int = ns.get('parse_int')
    BadInput = ns.get('BadInput')
    
    if not parse_int:
        return {'score': 0, 'max_score': max_score, 'feedback': 'parse_int function missing'}
    
    if not BadInput:
        return {'score': 20, 'max_score': max_score, 'feedback': 'BadInput exception missing'}
    
    # Test that invalid input raises exception
    try:
        result = parse_int('abc')
        return {'score': 40, 'max_score': max_score, 'feedback': 'Should raise BadInput for invalid input'}
    except BadInput as e:
        if 'abc' in str(e):
            return {'score': 100, 'max_score': max_score, 'feedback': 'Correctly raises BadInput after retries!'}
        else:
            return {'score': 60, 'max_score': max_score, 'feedback': 'BadInput raised but message incorrect'}
    except Exception as e:
        return {'score': 50, 'max_score': max_score, 'feedback': f'Wrong exception type: {type(e).__name__}'}
"""
        
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 100
    
    def test_retry_decorator_uses_wraps(self):
        """Retry decorator should use @wraps to preserve function metadata"""
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
                        raise
                    else:
                        time.sleep(delay * (2 ** (attempt - 1)))
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
        
        test_code = """
def grade(ns):
    max_score = 100
    source = ns.get('__source__', '')
    
    if '@retry' not in source:
        return {'score': 0, 'max_score': max_score, 'feedback': 'Must use @retry decorator'}
    
    if 'wraps' not in source:
        return {'score': 50, 'max_score': max_score, 'feedback': 'Must use @wraps from functools'}
    
    return {'score': 100, 'max_score': max_score, 'feedback': 'Decorator pattern used correctly!'}
"""
        
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 100
    
    def test_retry_decorator_missing_implementation_fails(self):
        """Incomplete retry decorator should fail tests"""
        user_code = """
from functools import wraps
import time

def retry(max_attempts=3, delay=0.1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # TODO: loop through attempts
            # On last attempt, re-raise exception
            # Otherwise, sleep with exponential backoff
            pass
        return wrapper
    return decorator

class BadInput(Exception):
    pass

@retry(max_attempts=3)
def parse_int(s):
    # TODO: convert to int or raise BadInput
    pass
"""
        
        test_code = """
def grade(ns):
    max_score = 100
    parse_int = ns.get('parse_int')
    
    if not parse_int:
        return {'score': 0, 'max_score': max_score, 'feedback': 'parse_int function missing'}
    
    # Test valid input
    result = parse_int('42')
    if result != 42:
        return {'score': 0, 'max_score': max_score, 'feedback': f'Expected 42, got {result}'}
    
    return {'score': 100, 'max_score': max_score, 'feedback': 'Valid input works!'}
"""
        
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 0  # Should fail because implementation is incomplete

