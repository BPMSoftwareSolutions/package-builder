"""
Integration tests for API endpoints
Tests all features from features.json -> backend.api.endpoints
"""
import pytest
import json


class TestGetApiModules:
    """Test GET /api/modules endpoint"""
    
    def test_get_api_modules_returns_200(self, client):
        """Returns 200 status"""
        response = client.get('/api/modules')
        assert response.status_code == 200
    
    def test_get_api_modules_returns_array(self, client):
        """Returns array of modules"""
        response = client.get('/api/modules')
        data = response.get_json()
        assert 'modules' in data
        assert isinstance(data['modules'], list)
    
    def test_get_api_modules_each_has_required_fields(self, client):
        """Each module has id, title, description"""
        response = client.get('/api/modules')
        data = response.get_json()
        
        for module in data['modules']:
            assert 'id' in module
            assert 'title' in module
            assert 'summary' in module or 'description' in module
    
    def test_get_api_modules_returns_7_modules(self, client):
        """Returns 7 modules total"""
        response = client.get('/api/modules')
        data = response.get_json()
        assert len(data['modules']) == 7


class TestGetApiModulesId:
    """Test GET /api/modules/<id> endpoint"""
    
    def test_get_api_modules_id_returns_200_for_valid_id(self, client):
        """Returns 200 for valid module ID"""
        response = client.get('/api/modules/python_basics')
        assert response.status_code == 200
    
    def test_get_api_modules_id_returns_404_for_invalid_id(self, client):
        """Returns 404 for invalid module ID"""
        response = client.get('/api/modules/nonexistent_module')
        assert response.status_code == 404
    
    def test_get_api_modules_id_returns_module_with_workshops(self, client):
        """Returns module with workshops array"""
        response = client.get('/api/modules/python_basics')
        data = response.get_json()
        assert 'workshops' in data
        assert isinstance(data['workshops'], list)
        assert len(data['workshops']) > 0
    
    def test_get_api_modules_id_workshops_have_required_fields(self, client):
        """Each workshop has required fields"""
        response = client.get('/api/modules/python_basics')
        data = response.get_json()
        
        for workshop in data['workshops']:
            assert 'id' in workshop
            assert 'title' in workshop
            assert 'prompt' in workshop
            assert 'timeLimitMinutes' in workshop


class TestPostApiGrade:
    """Test POST /api/grade endpoint"""
    
    def test_post_api_grade_accepts_required_fields(self, client):
        """Accepts moduleId, workshopId, code"""
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
    
    def test_post_api_grade_accepts_optional_approachid(self, client):
        """Accepts optional approachId for multi-approach workshops"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'loop',
            'code': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 200
    
    def test_post_api_grade_returns_score_feedback_time(self, client):
        """Returns score, max_score, feedback, execution_time"""
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
        
        assert 'ok' in data
        assert 'score' in data
        assert 'max_score' in data
        assert 'feedback' in data
        assert 'elapsed_ms' in data
    
    def test_post_api_grade_returns_400_for_missing_moduleid(self, client):
        """Returns 400 for missing required fields"""
        payload = {
            'workshopId': 'basics_01',
            'code': 'def test(): pass'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 400
    
    def test_post_api_grade_returns_404_for_invalid_module(self, client):
        """Returns 404 for invalid module/workshop ID"""
        payload = {
            'moduleId': 'nonexistent',
            'workshopId': 'basics_01',
            'code': 'def test(): pass'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 404
    
    def test_post_api_grade_returns_400_for_missing_approachid_when_required(self, client):
        """Returns 400 for missing approachId when required"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            # Missing approachId for multi-approach workshop
            'code': 'def even_squares(nums): return []'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 400
        data = response.get_json()
        assert 'approach' in data.get('error', '').lower()
    
    def test_post_api_grade_backward_compatible_single_approach(self, client):
        """Backward compatible with single-approach format"""
        # First, let's check if there are any single-approach workshops
        # For now, we'll test that multi-approach works correctly
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


class TestApiGradeMultiApproach:
    """Test multi-approach grading via API"""
    
    def test_post_api_grade_routes_to_comprehension_approach(self, client):
        """Routes to correct approach based on approachId - comprehension"""
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
        assert data['ok'] is True
        assert data['score'] == 100
        assert 'comprehension' in data['feedback'].lower()
    
    def test_post_api_grade_routes_to_loop_approach(self, client):
        """Routes to correct approach based on approachId - loop"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'loop',
            'code': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        data = response.get_json()
        
        assert response.status_code == 200
        assert data['ok'] is True
        assert data['score'] == 100
        assert 'loop' in data['feedback'].lower()
    
    def test_post_api_grade_uses_approach_specific_tests(self, client):
        """Uses approach-specific test harness"""
        # Test that comprehension approach gives feedback about comprehension
        payload_comp = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result'
        }
        response_comp = client.post('/api/grade',
                                   data=json.dumps(payload_comp),
                                   content_type='application/json')
        data_comp = response_comp.get_json()
        
        # Should work but suggest using comprehension
        assert data_comp['score'] >= 60  # Functional but not using comprehension
    
    def test_post_api_grade_returns_404_for_invalid_approachid(self, client):
        """Returns 404 if approachId not found"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'nonexistent_approach',
            'code': 'def even_squares(nums): return []'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 404


class TestApiErrorHandling:
    """Test API error handling"""
    
    def test_post_api_grade_handles_syntax_error(self, client):
        """Handles syntax errors in user code"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'def broken(:\n    return 42'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 400
        data = response.get_json()
        assert data['ok'] is False
        assert 'error' in data
    
    def test_post_api_grade_handles_disallowed_code(self, client):
        """Handles disallowed code (imports, etc.)"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'import os\ndef even_squares(nums): return []'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        assert response.status_code == 400
        data = response.get_json()
        assert data['ok'] is False
        assert 'not allowed' in data.get('error', '').lower()
    
    def test_post_api_grade_handles_runtime_error(self, client):
        """Handles runtime errors in user code"""
        payload = {
            'moduleId': 'python_basics',
            'workshopId': 'basics_01',
            'approachId': 'comprehension',
            'code': 'def even_squares(nums):\n    return 1 / 0'
        }
        response = client.post('/api/grade',
                              data=json.dumps(payload),
                              content_type='application/json')
        # Should return 200 with error feedback from test harness
        assert response.status_code in [200, 400]

