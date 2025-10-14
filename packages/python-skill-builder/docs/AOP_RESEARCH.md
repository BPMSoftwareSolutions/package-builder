# Aspect-Oriented Programming (AOP) Research for Python Skill Builder

## Executive Summary

This document outlines the research and planning for adding **Aspect-Oriented Programming (AOP)** approaches to all workshops in the Python Skill Builder application. AOP is a programming paradigm that aims to increase modularity by allowing the separation of cross-cutting concerns.

## What is Aspect-Oriented Programming?

### Core Concepts

**Aspect-Oriented Programming (AOP)** is a programming paradigm that complements Object-Oriented Programming (OOP) by separating **cross-cutting concerns** from the main business logic.

**Cross-cutting concerns** are aspects of a program that affect multiple modules but don't fit naturally into a single module:
- Logging
- Validation
- Authentication/Authorization
- Caching
- Timing/Performance monitoring
- Error handling
- Transaction management
- Auditing

### AOP in Python: Decorators

Python implements AOP primarily through **decorators**, which allow you to wrap functions or methods with additional behavior without modifying their core logic.

**Key AOP Terms:**
- **Aspect**: The cross-cutting concern (e.g., logging, validation)
- **Advice**: The action taken by an aspect (e.g., log before execution)
- **Join Point**: A point in program execution where an aspect can be applied (e.g., function call)
- **Pointcut**: A set of join points where advice should be applied

## AOP Patterns in Python

### 1. Validation Aspect
```python
from functools import wraps

def validate_list(fn):
    @wraps(fn)
    def wrapper(nums):
        if not isinstance(nums, list):
            raise TypeError('Input must be a list')
        if not all(isinstance(x, int) for x in nums):
            raise TypeError('All elements must be integers')
        return fn(nums)
    return wrapper

@validate_list
def even_squares(nums):
    return [n**2 for n in nums if n%2==0]
```

### 2. Logging Aspect
```python
from functools import wraps
import time

def log_execution(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"[LOG] Calling {fn.__name__} with args={args}, kwargs={kwargs}")
        result = fn(*args, **kwargs)
        print(f"[LOG] {fn.__name__} returned {result}")
        return result
    return wrapper

@log_execution
def fizzbuzz(n):
    # implementation
    pass
```

### 3. Timing Aspect
```python
from functools import wraps
import time

def timer(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = fn(*args, **kwargs)
        elapsed = time.time() - start
        print(f"[TIMER] {fn.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def safe_divide(a, b, default=0):
    # implementation
    pass
```

### 4. Caching Aspect (Memoization)
```python
from functools import wraps

def memoize(fn):
    cache = {}
    @wraps(fn)
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapper

@memoize
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

### 5. Retry Aspect
```python
from functools import wraps
import time

def retry(max_attempts=3, delay=1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"[RETRY] Attempt {attempt+1} failed: {e}")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3)
def parse_int(s):
    return int(s)
```

### 6. Audit Aspect (for OOP)
```python
from functools import wraps

def audit(fn):
    @wraps(fn)
    def wrapper(self, *args, **kwargs):
        print(f"[AUDIT] {self.__class__.__name__}.{fn.__name__} called")
        result = fn(self, *args, **kwargs)
        print(f"[AUDIT] {self.__class__.__name__}.{fn.__name__} completed")
        return result
    return wrapper

class Vehicle:
    def __init__(self, vin):
        self._vin = vin
    
    @audit
    @property
    def vin(self):
        return self._vin
```

## Current Workshop Structure

### Existing Modules (7 total)
1. **python_basics** (2 workshops)
   - basics_01: Even Squares (2 approaches: comprehension, loop)
   - basics_02: FizzBuzz (2 approaches: if_elif, string_concat)

2. **functions_and_syntax** (2 workshops)
   - fx_01: Safe Divider (1 approach)
   - fx_02: *args/**kwargs Echo (1 approach)

3. **oop_fundamentals** (2 workshops)
   - oop_01: Vehicle → Truck (1 approach)
   - oop_02: classmethod vs staticmethod (1 approach)

4. **errors_and_debugging** (2 workshops)
   - err_01: Custom Exception (1 approach)
   - err_02: try/except/else/finally (1 approach)

5. **comprehensions_and_generators** (2 workshops)
   - cg_01: Dict Comp (1 approach)
   - cg_02: Generator (1 approach)

6. **numpy_intro** (2 workshops)
   - np_01: Elementwise ops (1 approach)
   - np_02: (not examined)

7. **flask_intro** (2 workshops)
   - (not examined)

**Total Workshops:** 14 workshops across 7 modules

## Proposed AOP Approaches by Workshop

### Module 1: python_basics

#### basics_01: Even Squares
**New Approach:** `aop_validation_guard`
- **Concept:** Input validation aspect
- **Pattern:** Decorator that validates input before execution
- **Learning Goal:** Separate validation logic from business logic
- **Starter Code:**
```python
from functools import wraps

def validate_list(fn):
    @wraps(fn)
    def wrapper(nums):
        if not isinstance(nums, list) or not all(isinstance(x, int) for x in nums):
            raise TypeError('Invalid input: must be list of ints')
        return fn(nums)
    return wrapper

@validate_list
def even_squares(nums):
    # TODO: return [n**2 for n in nums if n%2==0]
    pass
```

#### basics_02: FizzBuzz
**New Approach:** `aop_logging`
- **Concept:** Logging aspect
- **Pattern:** Decorator that logs function calls and results
- **Learning Goal:** Add observability without modifying core logic
- **Starter Code:**
```python
from functools import wraps

def log_execution(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"[LOG] Calling {fn.__name__} with n={args[0]}")
        result = fn(*args, **kwargs)
        print(f"[LOG] Returned {len(result)} items")
        return result
    return wrapper

@log_execution
def fizzbuzz(n):
    # TODO: implement FizzBuzz logic
    pass
```

### Module 2: functions_and_syntax

#### fx_01: Safe Divider
**New Approach:** `aop_timing`
- **Concept:** Performance timing aspect
- **Pattern:** Decorator that measures execution time
- **Learning Goal:** Monitor performance without cluttering code
- **Starter Code:**
```python
from functools import wraps
import time

def timer(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = fn(*args, **kwargs)
        elapsed = time.time() - start
        print(f"[TIMER] {fn.__name__} took {elapsed:.6f}s")
        return result
    return wrapper

@timer
def safe_divide(a, b, default=0):
    # TODO: implement safe division
    pass
```

#### fx_02: *args/**kwargs Echo
**New Approach:** `aop_type_checking`
- **Concept:** Type validation aspect
- **Pattern:** Decorator that validates argument types
- **Learning Goal:** Runtime type checking as a cross-cutting concern
- **Starter Code:**
```python
from functools import wraps

def validate_types(*expected_types):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for arg, expected in zip(args, expected_types):
                if not isinstance(arg, expected):
                    raise TypeError(f"Expected {expected}, got {type(arg)}")
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(int, int)
def echo_signature(*args, **kwargs):
    # TODO: return (list(args), sorted kwargs)
    pass
```

### Module 3: oop_fundamentals

#### oop_01: Vehicle → Truck
**New Approach:** `aop_audit`
- **Concept:** Audit logging aspect for methods
- **Pattern:** Decorator that logs method calls on class instances
- **Learning Goal:** Track object interactions for debugging/auditing
- **Starter Code:**
```python
from functools import wraps

def audit(fn):
    @wraps(fn)
    def wrapper(self, *args, **kwargs):
        print(f"[AUDIT] {self.__class__.__name__}.{fn.__name__} called")
        result = fn(self, *args, **kwargs)
        print(f"[AUDIT] {self.__class__.__name__}.{fn.__name__} completed")
        return result
    return wrapper

class Vehicle:
    def __init__(self, vin):
        self._vin = vin
    
    @audit
    @property
    def vin(self):
        return self._vin

class Truck(Vehicle):
    # TODO: implement with audit decorator
    pass
```

#### oop_02: classmethod vs staticmethod
**New Approach:** `aop_caching`
- **Concept:** Memoization aspect
- **Pattern:** Decorator that caches function results
- **Learning Goal:** Performance optimization through caching
- **Starter Code:**
```python
from functools import wraps

def memoize(fn):
    cache = {}
    @wraps(fn)
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapper

class Counter:
    total = 0
    
    @classmethod
    @memoize
    def from_list(cls, lst):
        # TODO: return sum(lst) with caching
        pass
    
    @staticmethod
    def is_positive(x):
        # TODO: return x > 0
        pass
```

### Module 4: errors_and_debugging

#### err_01: Custom Exception
**New Approach:** `aop_retry`
- **Concept:** Retry aspect with exponential backoff
- **Pattern:** Decorator that retries failed operations
- **Learning Goal:** Resilience through automatic retry logic
- **Starter Code:**
```python
from functools import wraps
import time

def retry(max_attempts=3, delay=0.1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay * (2 ** attempt))
            return wrapper
    return decorator

class BadInput(Exception):
    pass

@retry(max_attempts=3)
def parse_int(s):
    # TODO: convert to int or raise BadInput
    pass
```

#### err_02: try/except/else/finally
**New Approach:** `aop_error_handling`
- **Concept:** Centralized error handling aspect
- **Pattern:** Decorator that catches and transforms exceptions
- **Learning Goal:** Consistent error handling across functions
- **Starter Code:**
```python
from functools import wraps

def handle_errors(default_return=-1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except FileNotFoundError:
                print(f"[ERROR] File not found in {fn.__name__}")
                return (default_return, True)
            except Exception as e:
                print(f"[ERROR] Unexpected error: {e}")
                return (default_return, True)
        return wrapper
    return decorator

@handle_errors(default_return=-1)
def open_and_count(path):
    # TODO: open file, count lines, return (count, closed)
    pass
```

### Module 5: comprehensions_and_generators

#### cg_01: Dict Comp
**New Approach:** `aop_validation_decorator`
- **Concept:** Input/output validation aspect
- **Pattern:** Decorator that validates both inputs and outputs
- **Learning Goal:** Ensure data integrity at function boundaries
- **Starter Code:**
```python
from functools import wraps

def validate_io(input_check, output_check):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not input_check(*args, **kwargs):
                raise ValueError("Input validation failed")
            result = fn(*args, **kwargs)
            if not output_check(result):
                raise ValueError("Output validation failed")
            return result
        return wrapper
    return decorator

@validate_io(
    input_check=lambda words: isinstance(words, list),
    output_check=lambda d: isinstance(d, dict)
)
def word_lengths(words):
    # TODO: return {word: len(word)}
    pass
```

#### cg_02: Generator
**New Approach:** `aop_generator_logging`
- **Concept:** Generator monitoring aspect
- **Pattern:** Decorator that logs generator yields
- **Learning Goal:** Observe lazy evaluation in action
- **Starter Code:**
```python
from functools import wraps

def log_yields(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        gen = fn(*args, **kwargs)
        for value in gen:
            print(f"[YIELD] {fn.__name__} yielded {value}")
            yield value
    return wrapper

@log_yields
def gen_evens(n):
    # TODO: yield even numbers from 0 to n
    pass
```

## Implementation Scope

### Files to Modify
- `modules/python_basics.json` - Add 2 AOP approaches
- `modules/functions_and_syntax.json` - Add 2 AOP approaches
- `modules/oop_fundamentals.json` - Add 2 AOP approaches
- `modules/errors_and_debugging.json` - Add 2 AOP approaches
- `modules/comprehensions_and_generators.json` - Add 2 AOP approaches
- `modules/numpy_intro.json` - Add 2 AOP approaches (TBD)
- `modules/flask_intro.json` - Add 2 AOP approaches (TBD)

### Total New Approaches
- **14 new AOP approaches** (1 per workshop)
- Each approach includes:
  - Unique ID (e.g., `aop_validation_guard`)
  - Title
  - Description
  - Starter code with decorator pattern
  - 3 hints
  - Test harness that validates both functionality and decorator usage

### Estimated Effort
- **Research & Design:** 4 hours (COMPLETE)
- **Implementation per approach:** 30-45 minutes
- **Testing per approach:** 15-20 minutes
- **Total implementation:** ~14 hours
- **Documentation:** 2 hours
- **Total:** ~20 hours

## Benefits

1. **Educational Value:** Teaches advanced Python patterns (decorators, AOP)
2. **Real-World Skills:** AOP is used in production systems for logging, monitoring, security
3. **Code Quality:** Demonstrates separation of concerns and clean code principles
4. **Flexibility:** Users can learn multiple approaches to the same problem
5. **Interview Prep:** Decorator questions are common in Python interviews

## Risks & Considerations

1. **Complexity:** AOP may be too advanced for beginners
   - **Mitigation:** Make AOP approaches optional, not required for completion
   
2. **Sandbox Restrictions:** Some AOP patterns (e.g., file I/O decorators) may conflict with sandbox
   - **Mitigation:** Design AOP approaches that work within sandbox constraints
   
3. **Test Validation:** Need to verify decorator usage, not just functionality
   - **Mitigation:** Use `__source__` inspection in test harness

4. **Maintenance:** More approaches = more code to maintain
   - **Mitigation:** Follow consistent patterns, comprehensive documentation

## Next Steps

1. Create GitHub issue with detailed specification
2. Implement AOP approaches for python_basics module (pilot)
3. Test with users for feedback
4. Roll out to remaining modules
5. Update documentation and test suite
6. Add ESLint validation for new approaches

## References

- [Python Decorators Documentation](https://docs.python.org/3/glossary.html#term-decorator)
- [Aspect-Oriented Programming - Wikipedia](https://en.wikipedia.org/wiki/Aspect-oriented_programming)
- [functools.wraps Documentation](https://docs.python.org/3/library/functools.html#functools.wraps)

