"""
Pytest configuration and fixtures for Python Skill Builder tests
"""
import json
import pytest
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app


@pytest.fixture
def app():
    """Create Flask app for testing"""
    flask_app.config['TESTING'] = True
    return flask_app


@pytest.fixture
def client(app):
    """Create Flask test client"""
    return app.test_client()


@pytest.fixture
def features():
    """Load features.json for test validation"""
    features_path = os.path.join(os.path.dirname(__file__), '..', 'features.json')
    with open(features_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture
def api_endpoints(features):
    """Extract API endpoints from features.json"""
    return features['features']['backend']['api']['endpoints']


@pytest.fixture
def sandbox_features(features):
    """Extract sandbox features from features.json"""
    return features['features']['backend']['sandbox']['features']


@pytest.fixture
def grading_features(features):
    """Extract grading features from features.json"""
    return features['features']['backend']['grading']['features']


@pytest.fixture
def sample_user_code():
    """Sample valid user code for testing"""
    return """
def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]
"""


@pytest.fixture
def sample_test_code():
    """Sample test harness code"""
    return """
def grade(ns):
    max_score = 100
    if 'even_squares' not in ns:
        return {'score': 0, 'max_score': max_score, 'feedback': 'Function missing'}
    
    f = ns['even_squares']
    try:
        result = f([1, 2, 3, 4])
        if result != [4, 16]:
            return {'score': 60, 'max_score': max_score, 'feedback': 'Expected [4, 16] for [1, 2, 3, 4]'}
        
        result2 = f([1, 3, 5])
        if result2 != []:
            return {'score': 80, 'max_score': max_score, 'feedback': 'No evens should return empty list'}
        
        return {'score': 100, 'max_score': max_score, 'feedback': 'Perfect!'}
    except Exception as e:
        return {'score': 0, 'max_score': max_score, 'feedback': str(e)}
"""


@pytest.fixture
def module_data():
    """Load module index for testing"""
    module_path = os.path.join(os.path.dirname(__file__), '..', 'modules', 'module_index.json')
    with open(module_path, 'r', encoding='utf-8') as f:
        return json.load(f)

