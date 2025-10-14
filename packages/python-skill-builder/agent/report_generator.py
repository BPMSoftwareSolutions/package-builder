"""
Report Generator for Reflexive AI Education System

Generates skill fingerprint reports showing strengths, weaknesses, and recommendations.
"""

from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timezone
from .performance_analyzer import PerformanceAnalyzer
from .gap_detector import GapDetector, SkillGap
from .metrics_collector import MetricsCollector


class ReportGenerator:
    """
    Generates comprehensive reports for the reflexive learning system.
    
    Key responsibilities:
    - Generate skill fingerprint reports
    - Create learning trajectory visualizations
    - Produce interview readiness assessments
    - Generate recommendations for next steps
    """
    
    def __init__(
        self,
        performance_analyzer: Optional[PerformanceAnalyzer] = None,
        gap_detector: Optional[GapDetector] = None,
        metrics_collector: Optional[MetricsCollector] = None
    ):
        """
        Initialize the report generator.
        
        Args:
            performance_analyzer: Optional PerformanceAnalyzer instance
            gap_detector: Optional GapDetector instance
            metrics_collector: Optional MetricsCollector instance
        """
        self.performance_analyzer = performance_analyzer or PerformanceAnalyzer()
        self.gap_detector = gap_detector or GapDetector()
        self.metrics_collector = metrics_collector or MetricsCollector()
    
    def generate_skill_fingerprint_report(
        self,
        output_file: str = "reports/skill_fingerprint.md"
    ) -> str:
        """
        Generate a comprehensive skill fingerprint report.
        
        Args:
            output_file: Path to save the report
            
        Returns:
            Markdown report string
        """
        # Get all sessions
        sessions = self.metrics_collector.get_all_sessions()
        
        # Generate skill fingerprint
        fingerprint = self.performance_analyzer.generate_skill_fingerprint(sessions)
        
        # Detect gaps
        gaps = self.gap_detector.detect_gaps(fingerprint)
        
        # Build report
        lines = ["# 🧠 Skill Fingerprint Report\n\n"]
        lines.append(f"**Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n")
        lines.append("---\n\n")
        
        # Executive Summary
        lines.append("## 📊 Executive Summary\n\n")
        lines.append(f"- **Total Sessions**: {fingerprint['total_sessions']}\n")
        lines.append(f"- **Overall Average Score**: {fingerprint['overall_avg_score']:.1f}%\n")
        lines.append(f"- **Average Time per Session**: {fingerprint['overall_avg_time']:.0f} seconds\n")
        lines.append(f"- **Average Hints Used**: {fingerprint['overall_hints_used']:.1f}\n")
        lines.append(f"- **Topics Attempted**: {len(fingerprint['topic_mastery'])}\n")
        lines.append(f"- **Skill Gaps Detected**: {len(gaps)}\n\n")
        
        # Overall Assessment
        overall_score = fingerprint['overall_avg_score']
        if overall_score >= 85:
            assessment = "🟢 **Excellent** - You're performing very well!"
        elif overall_score >= 75:
            assessment = "🟡 **Good** - Solid progress, some areas need attention"
        elif overall_score >= 60:
            assessment = "🟠 **Fair** - Significant improvement needed"
        else:
            assessment = "🔴 **Needs Work** - Focus on fundamentals"
        
        lines.append(f"**Overall Assessment**: {assessment}\n\n")
        lines.append("---\n\n")
        
        # Topic Mastery Breakdown
        lines.append("## 📚 Topic Mastery Breakdown\n\n")
        
        if fingerprint['topic_mastery']:
            # Sort by average score (descending)
            sorted_topics = sorted(
                fingerprint['topic_mastery'].items(),
                key=lambda x: x[1]['avg_score'],
                reverse=True
            )
            
            for module_id, mastery in sorted_topics:
                score = mastery['avg_score']
                
                # Determine status icon
                if score >= 80:
                    icon = "✅"
                elif score >= 70:
                    icon = "⚠️"
                else:
                    icon = "❌"
                
                lines.append(f"### {icon} {module_id}\n\n")
                lines.append(f"- **Average Score**: {score:.1f}%\n")
                lines.append(f"- **Best Score**: {mastery['best_score']:.0f}%\n")
                lines.append(f"- **Latest Score**: {mastery['latest_score']:.0f}%\n")
                lines.append(f"- **Total Attempts**: {mastery['total_attempts']}\n")
                lines.append(f"- **Average Time**: {mastery['avg_time']:.0f}s ({mastery['avg_time']/60:.1f} min)\n")
                lines.append(f"- **Average Hints**: {mastery['avg_hints']:.1f}\n\n")
                
                # Trend analysis
                if mastery['latest_score'] > mastery['avg_score']:
                    lines.append("📈 **Trend**: Improving\n\n")
                elif mastery['latest_score'] < mastery['avg_score']:
                    lines.append("📉 **Trend**: Declining (review recommended)\n\n")
                else:
                    lines.append("➡️ **Trend**: Stable\n\n")
        else:
            lines.append("*No topics attempted yet. Start with Python Basics!*\n\n")
        
        lines.append("---\n\n")
        
        # Strengths
        lines.append("## 💪 Strengths\n\n")
        strengths = [
            (module_id, mastery)
            for module_id, mastery in fingerprint['topic_mastery'].items()
            if mastery['avg_score'] >= 80
        ]
        
        if strengths:
            strengths.sort(key=lambda x: x[1]['avg_score'], reverse=True)
            for module_id, mastery in strengths:
                lines.append(f"- **{module_id}**: {mastery['avg_score']:.1f}% average\n")
            lines.append("\n")
        else:
            lines.append("*No topics at mastery level yet. Keep practicing!*\n\n")
        
        # Weaknesses (Gaps)
        lines.append("## 🎯 Areas for Improvement\n\n")
        
        if gaps:
            lines.append(self.gap_detector.generate_gap_report(gaps))
        else:
            lines.append("*No significant gaps detected! All topics are at target level.*\n\n")
        
        lines.append("---\n\n")
        
        # Recommendations
        lines.append("## 🚀 Next Steps\n\n")
        
        if gaps:
            priority_workshops = self.gap_detector.prioritize_next_workshops(gaps, max_recommendations=3)
            lines.append("### Recommended Focus Areas (Priority Order):\n\n")
            for i, (module_id, recommendation) in enumerate(priority_workshops, 1):
                lines.append(f"{i}. **{module_id}**: {recommendation}\n")
            lines.append("\n")
        else:
            lines.append("🎉 **Congratulations!** You've achieved mastery in all topics.\n\n")
            lines.append("Consider:\n")
            lines.append("- Taking the mock screening test\n")
            lines.append("- Reviewing advanced topics\n")
            lines.append("- Practicing with real-world projects\n\n")
        
        lines.append("---\n\n")
        
        # Learning Insights
        lines.append("## 💡 Learning Insights\n\n")
        
        if fingerprint['overall_hints_used'] > 2:
            lines.append("- **Hint Usage**: You're using hints frequently. Try to solve problems independently first.\n")
        elif fingerprint['overall_hints_used'] < 1:
            lines.append("- **Hint Usage**: Great job solving problems independently!\n")
        
        if fingerprint['overall_avg_time'] > 600:
            lines.append("- **Time Management**: Average time is high. Practice for speed and efficiency.\n")
        elif fingerprint['overall_avg_time'] < 300:
            lines.append("- **Time Management**: Excellent speed! Make sure you're not rushing through problems.\n")
        
        if fingerprint['total_sessions'] < 5:
            lines.append("- **Practice Volume**: Complete more workshops to build consistency.\n")
        elif fingerprint['total_sessions'] >= 20:
            lines.append("- **Practice Volume**: Excellent dedication! You're putting in the work.\n")
        
        lines.append("\n---\n\n")
        lines.append("*This report was generated by the Reflexive AI Education System*\n")
        
        report = "".join(lines)
        
        # Save to file
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        return report
    
    def generate_quick_feedback(self, session_data: Dict[str, Any]) -> str:
        """
        Generate quick feedback after a single session.
        
        Args:
            session_data: Session data dictionary
            
        Returns:
            Feedback string
        """
        score = session_data['score']
        time_seconds = session_data['time_seconds']
        hints_used = session_data['hints_used']
        
        feedback_lines = []
        
        # Score feedback
        if score >= 90:
            feedback_lines.append("🌟 Excellent work!")
        elif score >= 75:
            feedback_lines.append("👍 Good job!")
        elif score >= 60:
            feedback_lines.append("📚 Keep practicing!")
        else:
            feedback_lines.append("💪 Don't give up! Review the material and try again.")
        
        # Time feedback
        if time_seconds < 180:
            feedback_lines.append("⚡ Great speed!")
        elif time_seconds > 600:
            feedback_lines.append("⏱️ Take your time, but try to be more efficient.")
        
        # Hints feedback
        if hints_used == 0:
            feedback_lines.append("🎯 Solved independently!")
        elif hints_used > 2:
            feedback_lines.append("💡 Try to use fewer hints next time.")
        
        return " ".join(feedback_lines)

