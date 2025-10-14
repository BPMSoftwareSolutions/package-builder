# 🧠 Python Skill Builder - Reflexive AI Education System

An experimental approach to learning Python where an AI agent acts as Engineer, Instructor, and Evaluator - building the training platform, generating content, and adapting based on your performance.

**Related Issue**: [#25 - Learn by Building the Learner](https://github.com/BPMSoftwareSolutions/package-builder/issues/25)

---

## 🎯 Overview

This is a **reflexive feedback loop** where:

1. The agent builds the educational platform
2. You use the platform to learn Python
3. The agent analyzes your performance and gaps
4. The agent generates new curriculum to fill those gaps
5. The platform evolves alongside your skillset

**Goal**: Determine if this co-evolutionary approach is more effective than traditional static training.

---

## 🏗️ Architecture

### Core Components

```
packages/python-skill-builder/
├── agent/                          # AI Agent Components
│   ├── __init__.py
│   ├── performance_analyzer.py     # Analyzes submissions & tracks performance
│   ├── gap_detector.py             # Identifies weak topics
│   ├── metrics_collector.py        # Tracks & persists learning data
│   ├── report_generator.py         # Generates skill reports
│   └── test_performance_analyzer.py # Unit tests
├── data/                           # Data Storage
│   └── learning_sessions.json      # Session history
├── reports/                        # Generated Reports
│   └── skill_fingerprint.md        # Latest skill assessment
├── modules/                        # Training Content (to be created)
│   └── *.json                      # Workshop definitions
├── static/                         # Frontend (to be created)
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── app.py                          # Flask backend (to be created)
├── skills-manifest.yml             # Skill definitions
├── repo-scanner.py                 # Scans repos for skills
├── gap-filler.py                   # Generates learning content
└── README.md                       # This file
```

### Component Responsibilities

#### 1. **Performance Analyzer** (`agent/performance_analyzer.py`)
- Analyzes code submissions for syntax and logic errors
- Detects Python patterns (comprehensions, loops, OOP, etc.)
- Tracks topic-specific performance
- Generates skill fingerprints
- Calculates learning velocity

#### 2. **Gap Detector** (`agent/gap_detector.py`)
- Compares current skills to screening requirements
- Identifies underperforming topics
- Prioritizes gaps by severity (critical, high, medium, low)
- Generates personalized recommendations

#### 3. **Metrics Collector** (`agent/metrics_collector.py`)
- Records session data (score, time, hints, code)
- Persists data to JSON
- Calculates session statistics
- Generates progress visualizations

#### 4. **Report Generator** (`agent/report_generator.py`)
- Generates comprehensive skill fingerprint reports
- Creates learning trajectory visualizations
- Provides quick session feedback
- Produces interview readiness assessments

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Create virtual environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or: source .venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies**:
   ```bash
   pip install flask pytest
   ```

3. **Run tests**:
   ```bash
   python -m pytest agent/test_performance_analyzer.py -v
   ```

---

## 📊 How It Works

### The Reflexive Learning Loop

```
┌──────────────────────┐
│ Python Trainer App   │
│ (UI + Grader + JSON) │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────────┐
│ You Complete a Workshop  │
│ (e.g. Decorators)        │
└─────────┬────────────────┘
          │ submits code
          ▼
┌─────────────────────────────┐
│ Agent Evaluates + Scores    │
│ → Feedback + Hints          │
└─────────┬───────────────────┘
          │ updates
          ▼
┌─────────────────────────────┐
│ Agent Learns Missing Skill  │
│ (e.g. "Flask JSON route")   │
│ Creates New Module/Example  │
└─────────┬───────────────────┘
          │ commits via PR
          ▼
┌─────────────────────────────┐
│ Trainer App Evolves         │
│ (new workshop available)    │
└─────────────────────────────┘
```

### Personalized Learning Metrics

| Metric | Meaning |
|--------|---------|
| `avg_time_per_workshop` | How long you take on average |
| `hint_usage_rate` | When you request help; indicates confidence level |
| `first_pass_score` | Baseline before hints |
| `second_pass_score` | Retention rate |
| `new_skill_modules_added` | How much the agent expanded your curriculum |
| `topic_mastery_curve` | Learning velocity per topic |
| `error_pattern_frequency` | Common mistakes (syntax, logic, etc.) |

---

## 📈 Implementation Status

### ✅ Phase 1: Self-Study MVP (Completed)
- ✅ Performance Analyzer with comprehensive tests
- ✅ Gap Detector with severity prioritization
- ✅ Metrics Collector with JSON persistence
- ✅ Report Generator with skill fingerprints
- ✅ ADR documentation
- ⏳ Flask app integration (pending)

### ⏳ Phase 2: Adaptive Content Generation (In Progress)
- ⏳ Content Generator (AI-driven workshop creation)
- ⏳ Exercise Templates (topic-specific patterns)
- ⏳ PR Creator (automated PR submission)
- ⏳ Integration testing

### 📋 Phase 3: Full Self-Teaching System (Planned)
- 📋 Mistake Analyzer (error pattern detection)
- 📋 Difficulty Adjuster (dynamic difficulty scaling)
- 📋 Meta-Workshop Generator (self-improvement exercises)
- 📋 Mock Test Generator (personalized assessments)
- 📋 Learning Trajectory Visualization
- 📋 Interview Readiness Report

---

## 🧪 Testing

### Run Unit Tests
```bash
python -m pytest agent/test_performance_analyzer.py -v
```

### Test Coverage
- ✅ Performance Analyzer: 11/11 tests passing
- ⏳ Gap Detector: Tests to be added
- ⏳ Metrics Collector: Tests to be added
- ⏳ Report Generator: Tests to be added

---

## 📚 Usage Examples

### Example 1: Analyze a Submission

```python
from agent.performance_analyzer import PerformanceAnalyzer

analyzer = PerformanceAnalyzer()

code = """
def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]
"""

result = analyzer.analyze_submission(
    code=code,
    workshop_id="basics_01",
    module_id="python_basics",
    score=100,
    time_seconds=120,
    hints_used=0
)

print(f"Score: {result.score}")
print(f"Patterns detected: {result.detected_patterns}")
print(f"Feedback: {result.feedback}")
```

### Example 2: Generate Skill Fingerprint

```python
from agent.performance_analyzer import PerformanceAnalyzer
from agent.metrics_collector import MetricsCollector

collector = MetricsCollector()
analyzer = PerformanceAnalyzer()

# Get all sessions
sessions = collector.get_all_sessions()

# Generate fingerprint
fingerprint = analyzer.generate_skill_fingerprint(sessions)

print(f"Total sessions: {fingerprint['total_sessions']}")
print(f"Overall avg score: {fingerprint['overall_avg_score']:.1f}%")
print(f"Topics mastered: {len(fingerprint['topic_mastery'])}")
```

### Example 3: Detect Gaps

```python
from agent.gap_detector import GapDetector
from agent.performance_analyzer import PerformanceAnalyzer
from agent.metrics_collector import MetricsCollector

collector = MetricsCollector()
analyzer = PerformanceAnalyzer()
detector = GapDetector(target_score=80.0)

# Generate fingerprint
sessions = collector.get_all_sessions()
fingerprint = analyzer.generate_skill_fingerprint(sessions)

# Detect gaps
gaps = detector.detect_gaps(fingerprint)

# Get recommendations
recommendations = detector.prioritize_next_workshops(gaps, max_recommendations=3)

for module_id, recommendation in recommendations:
    print(f"- {module_id}: {recommendation}")
```

### Example 4: Generate Report

```python
from agent.report_generator import ReportGenerator

generator = ReportGenerator()

# Generate comprehensive skill fingerprint report
report = generator.generate_skill_fingerprint_report(
    output_file="reports/skill_fingerprint.md"
)

print("Report generated successfully!")
```

---

## 🔬 Experiment Design

### Hypothesis
**Reflexive AI education (adaptive, agent-generated content) will produce faster skill acquisition and better retention than static training modules.**

### Variables
- **Independent**: Training approach (static vs reflexive)
- **Dependent**: Learning velocity, retention rate, final mock test score, time to mastery
- **Control**: Same screening topics, same initial modules, same time budget (2 weeks)

### Comparison with Static Approach
This reflexive approach will be compared with the static training course (Issue #23) to determine which is more effective.

---

## 📖 Documentation

- **ADR**: [ADR-0025: Reflexive AI Education System Architecture](../../docs/adr/ADR-0025-reflexive-ai-education-system.md)
- **Related Issues**:
  - [#25 - Learn by Building the Learner](https://github.com/BPMSoftwareSolutions/package-builder/issues/25)
  - [#23 - Python Training Course MVP (Static)](https://github.com/BPMSoftwareSolutions/package-builder/issues/23)
  - [#24 - Phase 1: Deploy Working Flask App](https://github.com/BPMSoftwareSolutions/package-builder/issues/24)

---

## 🤝 Contributing

This is an experimental project. Contributions welcome!

1. Follow TDD approach (write tests first)
2. Link all changes to GitHub issues
3. Use conventional commit messages
4. Create ADRs for architectural changes

---

## 📝 License

Internal BPM Software Solutions project.

---

**Status**: Phase 1 Complete, Phase 2 In Progress  
**Last Updated**: 2025-10-14

