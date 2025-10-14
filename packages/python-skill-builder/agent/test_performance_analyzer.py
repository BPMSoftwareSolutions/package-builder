"""
Unit tests for Performance Analyzer

Tests the analysis of submission patterns, error detection, and topic-specific performance tracking.
"""

import pytest
import ast
from .performance_analyzer import PerformanceAnalyzer, ErrorType, SubmissionAnalysis


class TestPerformanceAnalyzer:
    """Test suite for PerformanceAnalyzer"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.analyzer = PerformanceAnalyzer()
    
    def test_analyze_submission_basic(self):
        """Test basic submission analysis"""
        code = """
def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]
"""
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="basics_01",
            module_id="python_basics",
            score=100,
            time_seconds=120,
            hints_used=0
        )
        
        assert isinstance(result, SubmissionAnalysis)
        assert result.score == 100
        assert result.time_seconds == 120
        assert result.hints_used == 0
        assert result.has_syntax_error is False
        assert len(result.detected_patterns) > 0
    
    def test_detect_syntax_error(self):
        """Test detection of syntax errors"""
        code = """
def broken_func():
    return [n*n for n in nums if n % 2 == 0
"""  # Missing closing bracket
        
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="basics_01",
            module_id="python_basics",
            score=0,
            time_seconds=60,
            hints_used=1
        )
        
        assert result.has_syntax_error is True
        assert ErrorType.SYNTAX in result.error_types
    
    def test_detect_logic_error_from_low_score(self):
        """Test detection of logic errors from low scores"""
        code = """
def even_squares(nums):
    return [n for n in nums if n % 2 == 0]  # Missing square operation
"""
        
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="basics_01",
            module_id="python_basics",
            score=50,
            time_seconds=180,
            hints_used=2
        )
        
        assert result.has_logic_error is True
        assert ErrorType.LOGIC in result.error_types
    
    def test_detect_comprehension_pattern(self):
        """Test detection of list comprehension patterns"""
        code = """
def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]
"""
        
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="basics_01",
            module_id="python_basics",
            score=100,
            time_seconds=120,
            hints_used=0
        )
        
        assert "list_comprehension" in result.detected_patterns
    
    def test_detect_loop_pattern(self):
        """Test detection of loop patterns"""
        code = """
def sum_evens(nums):
    total = 0
    for n in nums:
        if n % 2 == 0:
            total += n
    return total
"""
        
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="basics_02",
            module_id="python_basics",
            score=100,
            time_seconds=150,
            hints_used=0
        )
        
        assert "for_loop" in result.detected_patterns
    
    def test_detect_class_pattern(self):
        """Test detection of OOP patterns"""
        code = """
class Vehicle:
    def __init__(self, vin):
        self._vin = vin
    
    @property
    def vin(self):
        return self._vin
"""
        
        result = self.analyzer.analyze_submission(
            code=code,
            workshop_id="oop_01",
            module_id="oop_fundamentals",
            score=100,
            time_seconds=200,
            hints_used=1
        )
        
        assert "class_definition" in result.detected_patterns
        assert "property_decorator" in result.detected_patterns
    
    def test_generate_skill_fingerprint_empty(self):
        """Test skill fingerprint generation with no sessions"""
        fingerprint = self.analyzer.generate_skill_fingerprint([])
        
        assert fingerprint is not None
        assert fingerprint["total_sessions"] == 0
        assert len(fingerprint["topic_mastery"]) == 0
    
    def test_generate_skill_fingerprint_single_topic(self):
        """Test skill fingerprint generation with single topic"""
        sessions = [
            {
                "module_id": "python_basics",
                "workshop_id": "basics_01",
                "score": 80,
                "time_seconds": 120,
                "hints_used": 1,
                "timestamp": "2025-10-14T10:00:00Z"
            },
            {
                "module_id": "python_basics",
                "workshop_id": "basics_02",
                "score": 90,
                "time_seconds": 100,
                "hints_used": 0,
                "timestamp": "2025-10-14T11:00:00Z"
            }
        ]
        
        fingerprint = self.analyzer.generate_skill_fingerprint(sessions)
        
        assert fingerprint["total_sessions"] == 2
        assert "python_basics" in fingerprint["topic_mastery"]
        assert fingerprint["topic_mastery"]["python_basics"]["avg_score"] == 85
        assert fingerprint["topic_mastery"]["python_basics"]["total_attempts"] == 2
    
    def test_generate_skill_fingerprint_multiple_topics(self):
        """Test skill fingerprint generation with multiple topics"""
        sessions = [
            {
                "module_id": "python_basics",
                "workshop_id": "basics_01",
                "score": 80,
                "time_seconds": 120,
                "hints_used": 1,
                "timestamp": "2025-10-14T10:00:00Z"
            },
            {
                "module_id": "oop_fundamentals",
                "workshop_id": "oop_01",
                "score": 60,
                "time_seconds": 300,
                "hints_used": 3,
                "timestamp": "2025-10-14T11:00:00Z"
            }
        ]
        
        fingerprint = self.analyzer.generate_skill_fingerprint(sessions)
        
        assert fingerprint["total_sessions"] == 2
        assert "python_basics" in fingerprint["topic_mastery"]
        assert "oop_fundamentals" in fingerprint["topic_mastery"]
        assert fingerprint["topic_mastery"]["python_basics"]["avg_score"] == 80
        assert fingerprint["topic_mastery"]["oop_fundamentals"]["avg_score"] == 60
    
    def test_identify_weak_areas(self):
        """Test identification of weak areas from fingerprint"""
        fingerprint = {
            "total_sessions": 4,
            "topic_mastery": {
                "python_basics": {"avg_score": 85, "total_attempts": 2},
                "oop_fundamentals": {"avg_score": 60, "total_attempts": 2},
                "comprehensions_and_generators": {"avg_score": 50, "total_attempts": 2}
            }
        }
        
        weak_areas = self.analyzer.identify_weak_areas(fingerprint, threshold=70)
        
        assert len(weak_areas) == 2
        assert "oop_fundamentals" in weak_areas
        assert "comprehensions_and_generators" in weak_areas
    
    def test_calculate_learning_velocity(self):
        """Test calculation of learning velocity"""
        sessions = [
            {
                "module_id": "python_basics",
                "workshop_id": "basics_01",
                "score": 60,
                "time_seconds": 180,
                "hints_used": 2,
                "timestamp": "2025-10-14T10:00:00Z"
            },
            {
                "module_id": "python_basics",
                "workshop_id": "basics_01",
                "score": 80,
                "time_seconds": 120,
                "hints_used": 1,
                "timestamp": "2025-10-14T11:00:00Z"
            },
            {
                "module_id": "python_basics",
                "workshop_id": "basics_01",
                "score": 95,
                "time_seconds": 90,
                "hints_used": 0,
                "timestamp": "2025-10-14T12:00:00Z"
            }
        ]
        
        velocity = self.analyzer.calculate_learning_velocity(sessions, "python_basics")
        
        assert velocity > 0  # Positive velocity indicates improvement
        assert isinstance(velocity, float)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

