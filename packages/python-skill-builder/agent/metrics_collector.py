"""
Metrics Collector for Reflexive AI Education System

Tracks learning metrics (time, score, hints used) and stores session history.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, asdict


@dataclass
class SessionMetrics:
    """Metrics for a single learning session"""
    session_id: str
    module_id: str
    workshop_id: str
    score: int
    max_score: int
    time_seconds: int
    hints_used: int
    timestamp: str
    code_submitted: Optional[str] = None
    feedback: Optional[str] = None
    error_types: List[str] = None
    detected_patterns: List[str] = None
    
    def __post_init__(self):
        if self.error_types is None:
            self.error_types = []
        if self.detected_patterns is None:
            self.detected_patterns = []


class MetricsCollector:
    """
    Collects and persists learning metrics for the reflexive education system.
    
    Key responsibilities:
    - Record session data
    - Calculate session metrics
    - Update learning trajectory
    - Persist data to JSON
    - Generate progress visualizations
    """
    
    def __init__(self, data_file: str = "data/learning_sessions.json"):
        """
        Initialize the metrics collector.
        
        Args:
            data_file: Path to the JSON file for storing session data
        """
        self.data_file = Path(data_file)
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing data or initialize
        if self.data_file.exists():
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        else:
            self.data = {
                "sessions": [],
                "metadata": {
                    "created_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                    "version": "1.0",
                    "description": "Learning session history for reflexive AI education system"
                }
            }
            self._save()
    
    def record_session(
        self,
        module_id: str,
        workshop_id: str,
        score: int,
        max_score: int,
        time_seconds: int,
        hints_used: int,
        code_submitted: Optional[str] = None,
        feedback: Optional[str] = None,
        error_types: Optional[List[str]] = None,
        detected_patterns: Optional[List[str]] = None
    ) -> SessionMetrics:
        """
        Record a new learning session.
        
        Args:
            module_id: ID of the module
            workshop_id: ID of the workshop
            score: Score achieved
            max_score: Maximum possible score
            time_seconds: Time taken in seconds
            hints_used: Number of hints used
            code_submitted: Optional submitted code
            feedback: Optional feedback message
            error_types: Optional list of error types detected
            detected_patterns: Optional list of patterns detected
            
        Returns:
            SessionMetrics object
        """
        session_id = f"{module_id}_{workshop_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        
        session = SessionMetrics(
            session_id=session_id,
            module_id=module_id,
            workshop_id=workshop_id,
            score=score,
            max_score=max_score,
            time_seconds=time_seconds,
            hints_used=hints_used,
            timestamp=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            code_submitted=code_submitted,
            feedback=feedback,
            error_types=error_types or [],
            detected_patterns=detected_patterns or []
        )
        
        # Add to sessions list
        self.data["sessions"].append(asdict(session))
        self._save()
        
        return session
    
    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """
        Get all recorded sessions.
        
        Returns:
            List of session dictionaries
        """
        return self.data["sessions"]
    
    def get_sessions_by_module(self, module_id: str) -> List[Dict[str, Any]]:
        """
        Get all sessions for a specific module.
        
        Args:
            module_id: Module ID to filter by
            
        Returns:
            List of session dictionaries
        """
        return [s for s in self.data["sessions"] if s["module_id"] == module_id]
    
    def get_sessions_by_workshop(self, workshop_id: str) -> List[Dict[str, Any]]:
        """
        Get all sessions for a specific workshop.
        
        Args:
            workshop_id: Workshop ID to filter by
            
        Returns:
            List of session dictionaries
        """
        return [s for s in self.data["sessions"] if s["workshop_id"] == workshop_id]
    
    def calculate_session_stats(self) -> Dict[str, Any]:
        """
        Calculate overall session statistics.
        
        Returns:
            Dictionary with session statistics
        """
        sessions = self.data["sessions"]
        
        if not sessions:
            return {
                "total_sessions": 0,
                "total_time_seconds": 0,
                "avg_score": 0,
                "avg_time": 0,
                "avg_hints": 0,
                "total_modules": 0,
                "total_workshops": 0
            }
        
        total_time = sum(s["time_seconds"] for s in sessions)
        avg_score = sum(s["score"] for s in sessions) / len(sessions)
        avg_time = total_time / len(sessions)
        avg_hints = sum(s["hints_used"] for s in sessions) / len(sessions)
        
        unique_modules = len(set(s["module_id"] for s in sessions))
        unique_workshops = len(set(s["workshop_id"] for s in sessions))
        
        return {
            "total_sessions": len(sessions),
            "total_time_seconds": total_time,
            "avg_score": avg_score,
            "avg_time": avg_time,
            "avg_hints": avg_hints,
            "total_modules": unique_modules,
            "total_workshops": unique_workshops
        }
    
    def visualize_progress(self, output_file: Optional[str] = None) -> str:
        """
        Generate a markdown visualization of learning progress.
        
        Args:
            output_file: Optional file path to save the visualization
            
        Returns:
            Markdown string with progress visualization
        """
        sessions = self.data["sessions"]
        stats = self.calculate_session_stats()
        
        lines = ["# Learning Progress Visualization\n\n"]
        lines.append(f"**Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n")
        
        lines.append("## Overall Statistics\n\n")
        lines.append(f"- **Total Sessions**: {stats['total_sessions']}\n")
        lines.append(f"- **Total Time**: {stats['total_time_seconds'] / 60:.1f} minutes\n")
        lines.append(f"- **Average Score**: {stats['avg_score']:.1f}%\n")
        lines.append(f"- **Average Time per Session**: {stats['avg_time']:.0f} seconds\n")
        lines.append(f"- **Average Hints Used**: {stats['avg_hints']:.1f}\n")
        lines.append(f"- **Modules Attempted**: {stats['total_modules']}\n")
        lines.append(f"- **Workshops Attempted**: {stats['total_workshops']}\n\n")
        
        if sessions:
            lines.append("## Recent Sessions\n\n")
            lines.append("| Timestamp | Module | Workshop | Score | Time | Hints |\n")
            lines.append("|-----------|--------|----------|-------|------|-------|\n")
            
            # Show last 10 sessions
            for session in sessions[-10:]:
                timestamp = session["timestamp"][:19].replace('T', ' ')
                module = session["module_id"]
                workshop = session["workshop_id"]
                score = f"{session['score']}/{session['max_score']}"
                time = f"{session['time_seconds']}s"
                hints = session["hints_used"]
                
                lines.append(f"| {timestamp} | {module} | {workshop} | {score} | {time} | {hints} |\n")
            
            lines.append("\n")
        
        # Module breakdown
        if sessions:
            lines.append("## Performance by Module\n\n")
            
            module_stats = {}
            for session in sessions:
                module_id = session["module_id"]
                if module_id not in module_stats:
                    module_stats[module_id] = {
                        "scores": [],
                        "times": [],
                        "hints": []
                    }
                module_stats[module_id]["scores"].append(session["score"])
                module_stats[module_id]["times"].append(session["time_seconds"])
                module_stats[module_id]["hints"].append(session["hints_used"])
            
            for module_id, stats in module_stats.items():
                avg_score = sum(stats["scores"]) / len(stats["scores"])
                avg_time = sum(stats["times"]) / len(stats["times"])
                avg_hints = sum(stats["hints"]) / len(stats["hints"])
                
                lines.append(f"### {module_id}\n")
                lines.append(f"- Attempts: {len(stats['scores'])}\n")
                lines.append(f"- Avg Score: {avg_score:.1f}%\n")
                lines.append(f"- Avg Time: {avg_time:.0f}s\n")
                lines.append(f"- Avg Hints: {avg_hints:.1f}\n\n")
        
        markdown = "".join(lines)
        
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown)
        
        return markdown
    
    def _save(self):
        """Save data to JSON file"""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

