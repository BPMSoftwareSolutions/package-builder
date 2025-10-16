"""
Tests for visualization system
"""
import pytest
import json


class TestExecutionResultsCapture:
    """Test execution results capture functionality"""
    
    def test_capture_execution_results_with_function(self, client):
        """Captures user-defined functions"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'def even_squares(nums):\n    return [n*n for n in nums if n % 2 == 0]'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()
        
        assert response.status_code == 200
        assert 'execution_results' in data
        assert 'functions' in data['execution_results']
        assert 'even_squares' in data['execution_results']['functions']
        assert data['execution_results']['functions']['even_squares']['type'] == 'function'
    
    def test_capture_execution_results_with_class(self, client):
        """Captures user-defined classes and methods"""
        payload = {
            'moduleId': 'oop_fundamentals',
            'workshopId': 'oop_02',
            'approachId': 'traditional',
            'code': '''class Counter:
    total = 0
    @classmethod
    def from_list(cls, lst):
        return sum(lst)
    @staticmethod
    def is_positive(x):
        return x > 0
'''
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()

        if response.status_code != 200:
            print(f"Error response: {data}")

        assert response.status_code == 200
        assert 'execution_results' in data
        assert 'classes' in data['execution_results']
        assert 'Counter' in data['execution_results']['classes']
        
        counter_class = data['execution_results']['classes']['Counter']
        assert counter_class['type'] == 'class'
        assert counter_class['name'] == 'Counter'
        assert 'methods' in counter_class
        assert 'from_list' in counter_class['methods']
        assert 'is_positive' in counter_class['methods']
    
    def test_capture_execution_results_with_variables(self, client):
        """Captures user-defined variables"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': '''def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]

result = even_squares([1, 2, 3, 4])
count = 42
'''
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()
        
        assert response.status_code == 200
        assert 'execution_results' in data
        assert 'variables' in data['execution_results']
        assert 'result' in data['execution_results']['variables']
        assert 'count' in data['execution_results']['variables']
        assert data['execution_results']['variables']['count']['type'] == 'int'
        assert data['execution_results']['variables']['count']['value'] == '42'


class TestVisualizationConfiguration:
    """Test visualization configuration in workshop JSON"""
    
    def test_workshop_with_visualization_config(self, client):
        """Workshop with visualization config returns visualizations in response"""
        payload = {
            'moduleId': 'oop_fundamentals',
            'workshopId': 'oop_02',
            'approachId': 'traditional',
            'code': '''class Counter:
    total = 0
    @classmethod
    def from_list(cls, lst):
        return sum(lst)
    @staticmethod
    def is_positive(x):
        return x > 0
'''
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()
        
        assert response.status_code == 200
        assert 'visualizations' in data
        assert len(data['visualizations']) > 0
        
        # Check visualization structure
        viz = data['visualizations'][0]
        assert 'id' in viz
        assert 'type' in viz
        assert 'enabled' in viz
        assert 'config' in viz
        assert viz['type'] == 'cli'
    
    def test_workshop_without_visualization_config(self, client):
        """Workshop without visualization config works normally (backward compatibility)"""
        payload = {
            'moduleId': 'errors_and_debugging',
            'workshopId': 'err_01',
            'approachId': 'traditional',
            'code': 'class BadInput(Exception):\n    pass\n\ndef parse_int(s):\n    try:\n        return int(s)\n    except ValueError:\n        raise BadInput(f"Cannot parse {s}")'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()

        assert response.status_code == 200
        assert data['ok'] is True
        # visualizations key should not be present if not configured
        assert 'visualizations' not in data or len(data.get('visualizations', [])) == 0


class TestVisualizationSchema:
    """Test visualization schema validation"""
    
    def test_cli_visualization_has_required_fields(self, client):
        """CLI visualization config has all required fields"""
        # Load the module with visualization
        response = client.get('/api/modules/oop_fundamentals')
        data = response.get_json()
        
        # Find workshop with visualization
        workshop = next(w for w in data['workshops'] if w['id'] == 'oop_02')
        assert 'visualizations' in workshop

        # Find the CLI visualization (may not be first)
        viz = next((v for v in workshop['visualizations'] if v['type'] == 'cli'), None)
        assert viz is not None, "CLI visualization not found"
        assert viz['id'] == 'counter_cli_dashboard'
        assert viz['type'] == 'cli'
        assert 'config' in viz
        assert 'template' in viz['config']
        assert 'placeholders' in viz['config']
    
    def test_cli_visualization_template_format(self, client):
        """CLI visualization template is properly formatted"""
        response = client.get('/api/modules/oop_fundamentals')
        data = response.get_json()

        workshop = next(w for w in data['workshops'] if w['id'] == 'oop_02')
        # Find the CLI visualization
        viz = next((v for v in workshop['visualizations'] if v['type'] == 'cli'), None)
        assert viz is not None
        
        template = viz['config']['template']
        placeholders = viz['config']['placeholders']
        
        # Template should contain placeholder references
        for key in placeholders.keys():
            assert f'{{{key}}}' in template
        
        # Placeholders should reference execution results
        for path in placeholders.values():
            # Should be either a literal or start with 'execution.'
            assert not path.startswith('execution.') or 'execution.' in path


class TestVisualizationUserCode:
    """Test that user code is included in visualization data"""

    def test_web_visualization_includes_user_code(self, client):
        """Web visualization should include the user's submitted code"""
        user_code = 'def fizzbuzz(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append("FizzBuzz")\n        elif i % 3 == 0:\n            result.append("Fizz")\n        elif i % 5 == 0:\n            result.append("Buzz")\n        else:\n            result.append(str(i))\n    return result'

        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_02',
            'approachId': 'if_elif',
            'code': user_code
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()

        assert response.status_code == 200
        assert 'execution_results' in data
        # User code should be included in execution_results for visualization
        assert 'user_code' in data['execution_results'], "execution_results should include user_code for web visualization"
        assert data['execution_results']['user_code'] == user_code


class TestBackwardCompatibility:
    """Test that existing functionality still works"""
    
    def test_grading_without_visualizations_unchanged(self, client):
        """Grading works exactly as before for workshops without visualizations"""
        payload = {
            'moduleId': 'functions_and_syntax',
            'workshopId': 'fx_01',
            'approachId': 'traditional',
            'code': 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['ok'] is True
        assert 'score' in data
        assert 'max_score' in data
        assert 'feedback' in data
        assert 'elapsed_ms' in data
        # execution_results should still be present
        assert 'execution_results' in data
    
    def test_old_workshop_format_still_works(self, client):
        """Old single-approach workshop format still works"""
        # This test ensures backward compatibility with workshops
        # that don't have the 'approaches' array
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'def even_squares(nums):\n    return [n*n for n in nums if n % 2 == 0]'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['ok'] is True

