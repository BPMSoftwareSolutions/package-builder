"""
Performance Analyzer for Reflexive AI Education System

Analyzes submission patterns, detects syntax/logic errors, and tracks topic-specific performance.
"""

import ast
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import statistics


class ErrorType(Enum):
    """Types of errors that can be detected in submissions"""
    SYNTAX = "syntax"
    LOGIC = "logic"
    RUNTIME = "runtime"
    EDGE_CASE = "edge_case"


@dataclass
class SubmissionAnalysis:
    """Analysis result for a single submission"""
    workshop_id: str
    module_id: str
    score: int
    time_seconds: int
    hints_used: int
    has_syntax_error: bool = False
    has_logic_error: bool = False
    has_runtime_error: bool = False
    error_types: List[ErrorType] = field(default_factory=list)
    detected_patterns: List[str] = field(default_factory=list)
    feedback: str = ""
    timestamp: Optional[str] = None


class PerformanceAnalyzer:
    """
    Analyzes user submissions to detect patterns, errors, and learning progress.
    
    Key responsibilities:
    - Analyze code submissions for syntax and logic errors
    - Detect Python patterns (comprehensions, loops, OOP, etc.)
    - Track topic-specific performance
    - Generate skill fingerprints
    - Calculate learning velocity
    """
    
    def __init__(self):
        """Initialize the performance analyzer"""
        self.pattern_detectors = {
            "list_comprehension": lambda node: isinstance(node, ast.ListComp),
            "dict_comprehension": lambda node: isinstance(node, ast.DictComp),
            "set_comprehension": lambda node: isinstance(node, ast.SetComp),
            "generator_expression": lambda node: isinstance(node, ast.GeneratorExp),
            "for_loop": lambda node: isinstance(node, ast.For),
            "while_loop": lambda node: isinstance(node, ast.While),
            "class_definition": lambda node: isinstance(node, ast.ClassDef),
            "function_definition": lambda node: isinstance(node, ast.FunctionDef),
            "property_decorator": lambda node: (
                isinstance(node, ast.FunctionDef) and 
                any(isinstance(d, ast.Name) and d.id == "property" for d in node.decorator_list)
            ),
            "try_except": lambda node: isinstance(node, ast.Try),
            "with_statement": lambda node: isinstance(node, ast.With),
            "lambda": lambda node: isinstance(node, ast.Lambda),
        }
    
    def analyze_submission(
        self,
        code: str,
        workshop_id: str,
        module_id: str,
        score: int,
        time_seconds: int,
        hints_used: int
    ) -> SubmissionAnalysis:
        """
        Analyze a code submission and return detailed analysis.
        
        Args:
            code: The submitted code
            workshop_id: ID of the workshop
            module_id: ID of the module
            score: Score achieved (0-100)
            time_seconds: Time taken in seconds
            hints_used: Number of hints used
            
        Returns:
            SubmissionAnalysis object with detailed analysis
        """
        analysis = SubmissionAnalysis(
            workshop_id=workshop_id,
            module_id=module_id,
            score=score,
            time_seconds=time_seconds,
            hints_used=hints_used,
            timestamp=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        )
        
        # Detect syntax errors
        try:
            tree = ast.parse(code)
            analysis.has_syntax_error = False
            
            # Detect patterns in the code
            analysis.detected_patterns = self._detect_patterns(tree)
            
        except SyntaxError as e:
            analysis.has_syntax_error = True
            analysis.error_types.append(ErrorType.SYNTAX)
            analysis.feedback = f"Syntax error: {str(e)}"
            return analysis
        
        # Detect logic errors based on score
        if score < 70:
            analysis.has_logic_error = True
            analysis.error_types.append(ErrorType.LOGIC)
            if score < 50:
                analysis.feedback = "Significant logic errors detected. Review the problem requirements."
            else:
                analysis.feedback = "Some logic errors detected. Check edge cases and requirements."
        elif score < 100:
            analysis.feedback = "Good attempt! Minor improvements needed for full marks."
        else:
            analysis.feedback = "Excellent work!"
        
        return analysis
    
    def _detect_patterns(self, tree: ast.AST) -> List[str]:
        """
        Detect Python patterns in the AST.
        
        Args:
            tree: AST of the code
            
        Returns:
            List of detected pattern names
        """
        detected = []
        
        for node in ast.walk(tree):
            for pattern_name, detector in self.pattern_detectors.items():
                if detector(node) and pattern_name not in detected:
                    detected.append(pattern_name)
        
        return detected
    
    def generate_skill_fingerprint(self, user_sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a skill fingerprint from user session history.
        
        Args:
            user_sessions: List of session dictionaries with module_id, score, time, etc.
            
        Returns:
            Dictionary containing skill fingerprint with topic mastery scores
        """
        if not user_sessions:
            return {
                "total_sessions": 0,
                "topic_mastery": {},
                "overall_avg_score": 0,
                "overall_avg_time": 0,
                "overall_hints_used": 0,
                "generated_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
        
        # Group sessions by module
        module_sessions = {}
        for session in user_sessions:
            module_id = session["module_id"]
            if module_id not in module_sessions:
                module_sessions[module_id] = []
            module_sessions[module_id].append(session)
        
        # Calculate topic mastery
        topic_mastery = {}
        for module_id, sessions in module_sessions.items():
            scores = [s["score"] for s in sessions]
            times = [s["time_seconds"] for s in sessions]
            hints = [s["hints_used"] for s in sessions]
            
            topic_mastery[module_id] = {
                "avg_score": statistics.mean(scores),
                "total_attempts": len(sessions),
                "avg_time": statistics.mean(times),
                "avg_hints": statistics.mean(hints),
                "best_score": max(scores),
                "latest_score": scores[-1]
            }
        
        # Calculate overall metrics
        all_scores = [s["score"] for s in user_sessions]
        all_times = [s["time_seconds"] for s in user_sessions]
        all_hints = [s["hints_used"] for s in user_sessions]
        
        return {
            "total_sessions": len(user_sessions),
            "topic_mastery": topic_mastery,
            "overall_avg_score": statistics.mean(all_scores),
            "overall_avg_time": statistics.mean(all_times),
            "overall_hints_used": statistics.mean(all_hints),
            "generated_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
    
    def identify_weak_areas(
        self,
        fingerprint: Dict[str, Any],
        threshold: float = 70.0
    ) -> List[str]:
        """
        Identify weak areas from a skill fingerprint.
        
        Args:
            fingerprint: Skill fingerprint dictionary
            threshold: Score threshold below which a topic is considered weak
            
        Returns:
            List of module IDs that are weak areas
        """
        weak_areas = []
        topic_mastery = fingerprint.get("topic_mastery", {})
        
        for module_id, mastery in topic_mastery.items():
            if mastery["avg_score"] < threshold:
                weak_areas.append(module_id)
        
        # Sort by score (weakest first)
        weak_areas.sort(
            key=lambda m: topic_mastery[m]["avg_score"]
        )
        
        return weak_areas
    
    def calculate_learning_velocity(
        self,
        sessions: List[Dict[str, Any]],
        module_id: str
    ) -> float:
        """
        Calculate learning velocity for a specific module.
        
        Learning velocity is the rate of improvement over time.
        Positive values indicate improvement, negative values indicate decline.
        
        Args:
            sessions: List of session dictionaries
            module_id: Module to calculate velocity for
            
        Returns:
            Learning velocity as a float (score improvement per attempt)
        """
        module_sessions = [s for s in sessions if s["module_id"] == module_id]
        
        if len(module_sessions) < 2:
            return 0.0
        
        # Calculate score improvement from first to last
        scores = [s["score"] for s in module_sessions]
        first_score = scores[0]
        last_score = scores[-1]
        
        # Velocity is improvement per attempt
        velocity = (last_score - first_score) / len(scores)
        
        return velocity

