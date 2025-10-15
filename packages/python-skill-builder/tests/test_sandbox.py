"""
Unit tests for sandbox validation
Tests all features from features.json -> backend.sandbox
"""
import pytest
from app import validate_source, run_user_and_tests, SAFE_BUILTINS


class TestSandboxASTValidation:
    """Test AST validation features"""
    
    def test_sandbox_ast_validation_blocks_import(self):
        """Blocks import statements for non-whitelisted modules"""
        code = "import os"
        with pytest.raises(ValueError, match="not allowed"):
            validate_source(code)

    def test_sandbox_ast_validation_blocks_import_from(self):
        """Blocks import from statements for non-whitelisted modules"""
        code = "from os import path"
        with pytest.raises(ValueError, match="not allowed"):
            validate_source(code)
    
    def test_sandbox_ast_validation_blocks_open(self):
        """Blocks open() calls - Note: With statement is blocked by AST"""
        code = """
def read_file():
    with open('test.txt') as f:
        return f.read()
"""
        # With statement is in DISALLOWED_NODES
        with pytest.raises(ValueError, match="disallowed"):
            validate_source(code)
    
    def test_sandbox_ast_validation_blocks_eval_in_user_code(self):
        """Blocks eval() in user code - Note: eval not in SAFE_BUILTINS"""
        code = """
def dangerous():
    return eval('1 + 1')
"""
        # AST allows this, but runtime will fail because eval is not in SAFE_BUILTINS
        validate_source(code)

        test_code = """
def grade(ns):
    if 'dangerous' in ns:
        try:
            result = ns['dangerous']()
            return {'score': 0, 'max_score': 100, 'feedback': 'eval should not be available'}
        except Exception as e:
            if 'eval' in str(e):
                return {'score': 100, 'max_score': 100, 'feedback': 'eval blocked correctly'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Function missing'}
"""
        result = run_user_and_tests(code, test_code)
        assert result['score'] == 100

    def test_sandbox_ast_validation_blocks_exec_in_user_code(self):
        """Blocks exec() in user code - Note: exec not in SAFE_BUILTINS"""
        code = """
def dangerous():
    exec('print("hello")')
    return True
"""
        # AST allows this, but runtime will fail because exec is not in SAFE_BUILTINS
        validate_source(code)

        test_code = """
def grade(ns):
    if 'dangerous' in ns:
        try:
            result = ns['dangerous']()
            return {'score': 0, 'max_score': 100, 'feedback': 'exec should not be available'}
        except Exception as e:
            if 'exec' in str(e):
                return {'score': 100, 'max_score': 100, 'feedback': 'exec blocked correctly'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Function missing'}
"""
        result = run_user_and_tests(code, test_code)
        assert result['score'] == 100

    def test_sandbox_ast_validation_blocks___import___in_user_code(self):
        """Blocks __import__ in user code - Note: __import__ not in user SAFE_BUILTINS"""
        code = """
def dangerous():
    os = __import__('os')
    return os.listdir('.')
"""
        # AST allows this, but runtime will fail because __import__ is not in user SAFE_BUILTINS
        validate_source(code)

        test_code = """
def grade(ns):
    if 'dangerous' in ns:
        try:
            result = ns['dangerous']()
            return {'score': 0, 'max_score': 100, 'feedback': '__import__ should be restricted'}
        except (NameError, ImportError) as e:
            # Either __import__ not found or import not allowed
            if '__import__' in str(e) or 'not allowed' in str(e):
                return {'score': 100, 'max_score': 100, 'feedback': '__import__ blocked correctly'}
        except Exception as e:
            return {'score': 0, 'max_score': 100, 'feedback': f'Unexpected error: {e}'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Function missing'}
"""
        result = run_user_and_tests(code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_ast_validation_allows_attribute(self):
        """Allows ast.Attribute (method calls)"""
        code = """
def test_func():
    s = "hello"
    return s.upper()
"""
        # Should not raise
        validate_source(code)
    
    def test_sandbox_ast_validation_allows_try(self):
        """Allows ast.Try (exception handling)"""
        code = """
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0
"""
        # Should not raise
        validate_source(code)
    
    def test_sandbox_ast_validation_allows_raise(self):
        """Allows ast.Raise (raising exceptions)"""
        code = """
def validate_input(x):
    if x < 0:
        raise ValueError("Must be positive")
    return x
"""
        # Should not raise
        validate_source(code)

    def test_sandbox_ast_validation_allows_lambda(self):
        """Allows ast.Lambda (lambda functions)"""
        code = """
def test_func():
    square = lambda x: x * x
    return square(5)
"""
        # Should not raise
        validate_source(code)

    def test_sandbox_ast_validation_lambda_in_functional_code(self):
        """Allows lambda functions in functional programming patterns"""
        code = """
def process_numbers(nums):
    doubled = list(map(lambda x: x * 2, nums))
    evens = list(filter(lambda x: x % 2 == 0, nums))
    return doubled, evens
"""
        # Should not raise
        validate_source(code)

        # Test that it actually works
        test_code = """
def grade(ns):
    if 'process_numbers' in ns:
        try:
            doubled, evens = ns['process_numbers']([1, 2, 3, 4, 5])
            if doubled == [2, 4, 6, 8, 10] and evens == [2, 4]:
                return {'score': 100, 'max_score': 100, 'feedback': 'Lambda functions work correctly'}
            return {'score': 0, 'max_score': 100, 'feedback': f'Wrong result: doubled={doubled}, evens={evens}'}
        except Exception as e:
            return {'score': 0, 'max_score': 100, 'feedback': f'Error: {e}'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Function missing'}
"""
        result = run_user_and_tests(code, test_code)
        assert result['score'] == 100


class TestSandboxSafeBuiltins:
    """Test safe builtins features"""
    
    def test_sandbox_safe_builtins_provides_basic_functions(self):
        """Provides len, range, sum, min, max, abs"""
        assert 'len' in SAFE_BUILTINS
        assert 'range' in SAFE_BUILTINS
        assert 'sum' in SAFE_BUILTINS
        assert 'min' in SAFE_BUILTINS
        assert 'max' in SAFE_BUILTINS
        assert 'abs' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_provides_itertools_functions(self):
        """Provides enumerate, zip, sorted, all, any"""
        assert 'enumerate' in SAFE_BUILTINS
        assert 'zip' in SAFE_BUILTINS
        assert 'sorted' in SAFE_BUILTINS
        assert 'all' in SAFE_BUILTINS
        assert 'any' in SAFE_BUILTINS

    def test_sandbox_safe_builtins_provides_functional_programming_functions(self):
        """Provides map, filter for functional programming"""
        assert 'map' in SAFE_BUILTINS
        assert 'filter' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_provides_type_constructors(self):
        """Provides list, dict, set, tuple, str, int, float, bool"""
        assert 'list' in SAFE_BUILTINS
        assert 'dict' in SAFE_BUILTINS
        assert 'set' in SAFE_BUILTINS
        assert 'tuple' in SAFE_BUILTINS
        assert 'str' in SAFE_BUILTINS
        assert 'int' in SAFE_BUILTINS
        assert 'float' in SAFE_BUILTINS
        assert 'bool' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_provides_utility_functions(self):
        """Provides print, isinstance, type"""
        assert 'print' in SAFE_BUILTINS
        assert 'isinstance' in SAFE_BUILTINS
        assert 'type' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_provides_exception_classes(self):
        """Provides Exception, ValueError, TypeError"""
        assert 'Exception' in SAFE_BUILTINS
        assert 'ValueError' in SAFE_BUILTINS
        assert 'TypeError' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_provides_more_exception_classes(self):
        """Provides KeyError, IndexError, AttributeError"""
        assert 'KeyError' in SAFE_BUILTINS
        assert 'IndexError' in SAFE_BUILTINS
        assert 'AttributeError' in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_blocks_file_io(self):
        """Blocks file I/O functions"""
        assert 'open' not in SAFE_BUILTINS
        assert 'file' not in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_blocks_network_functions(self):
        """Blocks network functions"""
        assert 'socket' not in SAFE_BUILTINS
        assert 'urllib' not in SAFE_BUILTINS
    
    def test_sandbox_safe_builtins_blocks_os_module(self):
        """Blocks os module access"""
        assert 'os' not in SAFE_BUILTINS
        assert 'sys' not in SAFE_BUILTINS


class TestSandboxNamespaceIsolation:
    """Test namespace isolation features"""
    
    def test_sandbox_namespace_isolation_user_has_restricted_builtins(self, sample_user_code, sample_test_code):
        """User namespace has restricted builtins"""
        result = run_user_and_tests(sample_user_code, sample_test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_user_has___source__(self, sample_test_code):
        """User namespace includes __source__ with submitted code"""
        user_code = """
def test_func():
    return [x*x for x in range(10)]
"""
        test_code = """
def grade(ns):
    source = ns.get('__source__', '')
    if '__source__' not in ns:
        return {'score': 0, 'max_score': 100, 'feedback': '__source__ not found'}
    if 'test_func' in source:
        return {'score': 100, 'max_score': 100, 'feedback': 'Source available'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Source incorrect'}
"""
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_test_has_extended_builtins(self, sample_user_code):
        """Test namespace has extended builtins"""
        test_code = """
def grade(ns):
    # Test namespace should have __import__
    if '__import__' not in __builtins__:
        return {'score': 0, 'max_score': 100, 'feedback': '__import__ not available'}
    return {'score': 100, 'max_score': 100, 'feedback': 'Extended builtins available'}
"""
        result = run_user_and_tests(sample_user_code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_test_has___import_____name_____file__(self, sample_user_code):
        """Test namespace includes __import__, __name__, __file__"""
        test_code = """
def grade(ns):
    if '__import__' not in __builtins__:
        return {'score': 0, 'max_score': 100, 'feedback': '__import__ missing'}
    if '__name__' not in __builtins__:
        return {'score': 0, 'max_score': 100, 'feedback': '__name__ missing'}
    if '__file__' not in __builtins__:
        return {'score': 0, 'max_score': 100, 'feedback': '__file__ missing'}
    return {'score': 100, 'max_score': 100, 'feedback': 'All required builtins present'}
"""
        result = run_user_and_tests(sample_user_code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_test_has_inspect_module(self, sample_user_code):
        """Test namespace includes inspect module"""
        test_code = """
def grade(ns):
    # Check if inspect is available in the test namespace
    try:
        import inspect as insp
        return {'score': 100, 'max_score': 100, 'feedback': 'inspect module available'}
    except:
        return {'score': 0, 'max_score': 100, 'feedback': 'inspect module not available'}
"""
        result = run_user_and_tests(sample_user_code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_user_cannot_access_test_namespace(self):
        """User code cannot access test namespace"""
        user_code = """
def hack():
    # Try to access test namespace - should fail
    return grade
"""
        test_code = """
def grade(ns):
    if 'hack' in ns:
        try:
            result = ns['hack']()
            return {'score': 0, 'max_score': 100, 'feedback': 'Security breach!'}
        except:
            return {'score': 100, 'max_score': 100, 'feedback': 'Isolated correctly'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Function missing'}
"""
        result = run_user_and_tests(user_code, test_code)
        assert result['score'] == 100
    
    def test_sandbox_namespace_isolation_test_can_access_user_namespace(self, sample_user_code):
        """Test code can access user namespace via grade(ns)"""
        test_code = """
def grade(ns):
    if 'even_squares' in ns:
        return {'score': 100, 'max_score': 100, 'feedback': 'Can access user namespace'}
    return {'score': 0, 'max_score': 100, 'feedback': 'Cannot access user namespace'}
"""
        result = run_user_and_tests(sample_user_code, test_code)
        assert result['score'] == 100

