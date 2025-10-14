"""
Gap Detector for Reflexive AI Education System

Identifies weak topics by comparing current skills to screening requirements and prioritizing gaps.
"""

from typing import List, Dict, Any, Tuple
from dataclasses import dataclass


@dataclass
class SkillGap:
    """Represents a detected skill gap"""
    module_id: str
    module_title: str
    current_score: float
    target_score: float
    gap_severity: str  # "critical", "high", "medium", "low"
    attempts: int
    avg_time: float
    avg_hints: float
    recommendation: str


class GapDetector:
    """
    Detects learning gaps by comparing current performance to screening requirements.
    
    Key responsibilities:
    - Compare current skills to screening requirements
    - Identify underperforming topics
    - Prioritize gaps by severity
    - Generate recommendations for improvement
    """
    
    def __init__(self, target_score: float = 80.0):
        """
        Initialize the gap detector.
        
        Args:
            target_score: Minimum score required for mastery (default: 80.0)
        """
        self.target_score = target_score
        
        # Define screening topics and their importance
        self.screening_topics = {
            "python_basics": {
                "title": "Python Basics",
                "importance": "critical",
                "weight": 1.5
            },
            "functions_and_syntax": {
                "title": "Functions & Syntax",
                "importance": "critical",
                "weight": 1.5
            },
            "oop_fundamentals": {
                "title": "OOP Fundamentals",
                "importance": "high",
                "weight": 1.3
            },
            "errors_and_debugging": {
                "title": "Errors & Debugging",
                "importance": "high",
                "weight": 1.3
            },
            "comprehensions_and_generators": {
                "title": "Comprehensions & Generators",
                "importance": "medium",
                "weight": 1.0
            },
            "numpy_intro": {
                "title": "NumPy Intro",
                "importance": "medium",
                "weight": 1.0
            },
            "flask_intro": {
                "title": "Flask Intro",
                "importance": "medium",
                "weight": 1.0
            }
        }
    
    def detect_gaps(
        self,
        skill_fingerprint: Dict[str, Any],
        screening_topics: List[str] = None
    ) -> List[SkillGap]:
        """
        Detect gaps by comparing current skills to screening requirements.
        
        Args:
            skill_fingerprint: Skill fingerprint from PerformanceAnalyzer
            screening_topics: Optional list of topics to check (defaults to all)
            
        Returns:
            List of SkillGap objects, sorted by severity
        """
        if screening_topics is None:
            screening_topics = list(self.screening_topics.keys())
        
        gaps = []
        topic_mastery = skill_fingerprint.get("topic_mastery", {})
        
        for topic_id in screening_topics:
            if topic_id not in self.screening_topics:
                continue
            
            topic_info = self.screening_topics[topic_id]
            mastery = topic_mastery.get(topic_id)
            
            if mastery is None:
                # Topic not attempted yet
                gaps.append(SkillGap(
                    module_id=topic_id,
                    module_title=topic_info["title"],
                    current_score=0.0,
                    target_score=self.target_score,
                    gap_severity="critical",
                    attempts=0,
                    avg_time=0.0,
                    avg_hints=0.0,
                    recommendation=f"Start with {topic_info['title']} - not yet attempted"
                ))
            elif mastery["avg_score"] < self.target_score:
                # Topic attempted but below target
                gap_size = self.target_score - mastery["avg_score"]
                severity = self._calculate_severity(
                    gap_size,
                    topic_info["importance"],
                    mastery["total_attempts"]
                )
                
                gaps.append(SkillGap(
                    module_id=topic_id,
                    module_title=topic_info["title"],
                    current_score=mastery["avg_score"],
                    target_score=self.target_score,
                    gap_severity=severity,
                    attempts=mastery["total_attempts"],
                    avg_time=mastery["avg_time"],
                    avg_hints=mastery["avg_hints"],
                    recommendation=self._generate_recommendation(
                        topic_id,
                        mastery,
                        gap_size
                    )
                ))
        
        # Sort by severity and weighted gap size
        gaps.sort(key=lambda g: (
            self._severity_rank(g.gap_severity),
            -(g.target_score - g.current_score) * self.screening_topics[g.module_id]["weight"]
        ))
        
        return gaps
    
    def _calculate_severity(
        self,
        gap_size: float,
        importance: str,
        attempts: int
    ) -> str:
        """
        Calculate gap severity based on multiple factors.
        
        Args:
            gap_size: Difference between target and current score
            importance: Topic importance level
            attempts: Number of attempts made
            
        Returns:
            Severity level: "critical", "high", "medium", or "low"
        """
        # Base severity on gap size
        if gap_size >= 40:
            base_severity = "critical"
        elif gap_size >= 25:
            base_severity = "high"
        elif gap_size >= 15:
            base_severity = "medium"
        else:
            base_severity = "low"
        
        # Adjust for importance
        if importance == "critical" and base_severity != "critical":
            severity_levels = ["low", "medium", "high", "critical"]
            current_index = severity_levels.index(base_severity)
            base_severity = severity_levels[min(current_index + 1, 3)]
        
        # Adjust for multiple failed attempts
        if attempts >= 3 and base_severity == "low":
            base_severity = "medium"
        
        return base_severity
    
    def _severity_rank(self, severity: str) -> int:
        """Convert severity to numeric rank for sorting"""
        ranks = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        return ranks.get(severity, 4)
    
    def _generate_recommendation(
        self,
        topic_id: str,
        mastery: Dict[str, Any],
        gap_size: float
    ) -> str:
        """
        Generate a personalized recommendation for addressing the gap.
        
        Args:
            topic_id: Module ID
            mastery: Mastery data for the topic
            gap_size: Size of the gap
            
        Returns:
            Recommendation string
        """
        topic_title = self.screening_topics[topic_id]["title"]
        
        if mastery["total_attempts"] == 1:
            return f"Retry {topic_title} workshops - first attempt scored {mastery['avg_score']:.0f}%"
        elif mastery["avg_hints"] > 2:
            return f"Review {topic_title} fundamentals before retrying - high hint usage detected"
        elif mastery["avg_time"] > 600:  # More than 10 minutes average
            return f"Practice {topic_title} for speed - currently taking {mastery['avg_time']/60:.1f} min average"
        elif gap_size > 30:
            return f"Focus on {topic_title} - significant gap of {gap_size:.0f} points"
        else:
            return f"Polish {topic_title} skills - close to target, need {gap_size:.0f} more points"
    
    def prioritize_next_workshops(
        self,
        gaps: List[SkillGap],
        max_recommendations: int = 3
    ) -> List[Tuple[str, str]]:
        """
        Prioritize which workshops to tackle next.
        
        Args:
            gaps: List of detected gaps
            max_recommendations: Maximum number of recommendations to return
            
        Returns:
            List of (module_id, recommendation) tuples
        """
        recommendations = []
        
        for gap in gaps[:max_recommendations]:
            recommendations.append((gap.module_id, gap.recommendation))
        
        return recommendations
    
    def generate_gap_report(self, gaps: List[SkillGap]) -> str:
        """
        Generate a human-readable gap report.
        
        Args:
            gaps: List of detected gaps
            
        Returns:
            Formatted report string
        """
        if not gaps:
            return "🎉 No gaps detected! All topics are at or above target mastery level."
        
        report = ["# Skill Gap Analysis\n"]
        report.append(f"Target Score: {self.target_score}%\n")
        report.append(f"Total Gaps Detected: {len(gaps)}\n\n")
        
        # Group by severity
        by_severity = {}
        for gap in gaps:
            if gap.gap_severity not in by_severity:
                by_severity[gap.gap_severity] = []
            by_severity[gap.gap_severity].append(gap)
        
        for severity in ["critical", "high", "medium", "low"]:
            if severity not in by_severity:
                continue
            
            severity_gaps = by_severity[severity]
            icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}[severity]
            
            report.append(f"## {icon} {severity.upper()} Priority\n")
            for gap in severity_gaps:
                report.append(f"### {gap.module_title}\n")
                report.append(f"- Current Score: {gap.current_score:.1f}%\n")
                report.append(f"- Target Score: {gap.target_score:.1f}%\n")
                report.append(f"- Gap: {gap.target_score - gap.current_score:.1f} points\n")
                report.append(f"- Attempts: {gap.attempts}\n")
                if gap.attempts > 0:
                    report.append(f"- Avg Time: {gap.avg_time:.0f}s\n")
                    report.append(f"- Avg Hints: {gap.avg_hints:.1f}\n")
                report.append(f"- **Recommendation**: {gap.recommendation}\n\n")
        
        return "".join(report)

