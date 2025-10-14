# Python Training Course - Interview Prep

A comprehensive Python training platform with 7 modules and 14 hands-on workshops designed to prepare you for technical screening interviews.

## 🎯 Overview

This interactive training app provides:
- **7 Core Modules** covering Python fundamentals to advanced topics
- **14 Hands-on Workshops** with real coding challenges
- **Automated Grading** with instant feedback
- **Progress Tracking** saved locally in your browser
- **Timed Challenges** to simulate interview conditions
- **Progressive Hints** to guide your learning

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd packages/python-skill-builder
   ```

2. **Create a virtual environment:**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app:**
   ```bash
   python app.py
   ```

5. **Open your browser:**
   ```
   http://127.0.0.1:5000
   ```

## 📚 Training Modules

### 1. Python Basics (25 min)
**Topics:** Syntax, control flow, functions, comprehensions
- Workshop 1: Even Squares (List Comprehension)
- Workshop 2: FizzBuzz Variant

### 2. Functions & Syntax (25 min)
**Topics:** Arguments, defaults, *args/**kwargs, returns
- Workshop 1: Safe Divider (defaults + error guard)
- Workshop 2: *args/**kwargs Echo

### 3. OOP Fundamentals (30 min)
**Topics:** Classes, inheritance, properties, __repr__
- Workshop 1: Vehicle → Truck (inheritance + property)
- Workshop 2: classmethod vs staticmethod

### 4. Errors & Debugging (25 min)
**Topics:** try/except/else/finally, custom exceptions
- Workshop 1: Custom Exception
- Workshop 2: try/except/else/finally

### 5. Comprehensions & Generators (25 min)
**Topics:** List/dict/set comps and generator expressions
- Workshop 1: Dict Comp (word lengths)
- Workshop 2: Generator (even stream)

### 6. NumPy Intro (25 min)
**Topics:** Arrays, vectorization, shapes
- Workshop 1: Elementwise ops
- Workshop 2: Dot product

### 7. Flask Intro (30 min)
**Topics:** Routing, parameters, JSON responses
- Workshop 1: Hello Route (string param)
- Workshop 2: Query Handling (simulate)

## 💡 How to Use

### Getting Started
1. Start with **Module 1: Python Basics**
2. Complete workshops in order for best learning progression
3. Each workshop has a time limit - try to complete within the time
4. Use hints sparingly (aim for max 2 per workshop)
5. Target 80%+ scores to mark workshops as complete

### Workshop Interface
- **Code Editor:** Write your solution in the provided editor
- **Hints:** Click to reveal hints progressively (use wisely!)
- **Timer:** Countdown timer to simulate interview pressure
- **Run & Grade:** Submit your code for instant feedback
- **Reset:** Start over with the starter code

### Keyboard Shortcuts
- `Tab` - Insert 4 spaces (proper Python indentation)
- `Ctrl+Enter` - Submit code for grading

### Progress Tracking
- Progress is automatically saved in your browser's localStorage
- Completion requires 80%+ score on a workshop
- Average scores and completion status shown on dashboard
- Progress persists across browser sessions

## 🎓 Learning Tips

### Best Practices
1. **Read the prompt carefully** - Understand what's being asked
2. **Start simple** - Get basic functionality working first
3. **Test edge cases** - Think about unusual inputs
4. **Use hints strategically** - Try solving independently first
5. **Review feedback** - Learn from mistakes in the grading feedback

### Time Management
- Most workshops: 7-10 minutes
- Don't rush - accuracy is more important than speed
- If stuck, use a hint rather than guessing
- Practice regularly to improve speed naturally

### Scoring
- **90-100%:** Excellent - Ready for interviews
- **80-89%:** Good - Minor improvements needed
- **60-79%:** Fair - Review the topic and retry
- **Below 60%:** Needs work - Study fundamentals and retry

## 🔧 Technical Details

### Architecture
- **Backend:** Flask (Python web framework)
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Storage:** Browser localStorage for progress
- **Security:** AST-based code sandbox for safe execution

### Code Sandbox
The app uses Python's AST (Abstract Syntax Tree) to validate and restrict code execution:
- **Allowed:** Basic Python syntax, loops, functions, classes
- **Restricted:** Imports, file I/O, network access, system calls
- **Safe builtins:** len, range, sum, min, max, sorted, etc.

### File Structure
```
packages/python-skill-builder/
├── app.py                    # Flask backend
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── modules/                  # Training content
│   ├── module_index.json     # Module catalog
│   ├── python_basics.json
│   ├── functions_and_syntax.json
│   ├── oop_fundamentals.json
│   ├── errors_and_debugging.json
│   ├── comprehensions_and_generators.json
│   ├── numpy_intro.json
│   └── flask_intro.json
└── static/                   # Frontend files
    ├── index.html            # Main UI
    ├── app.js                # Application logic
    └── styles.css            # Dark theme styling
```

## 🐛 Troubleshooting

### App won't start
- Ensure Python 3.8+ is installed: `python --version`
- Verify virtual environment is activated (you should see `(.venv)` in terminal)
- Check all dependencies installed: `pip list`

### Modules not loading
- Ensure you're in the correct directory: `packages/python-skill-builder`
- Check that `modules/` directory exists with JSON files
- Look for errors in browser console (F12)

### Code submission fails
- Check browser console for errors
- Verify Flask app is running (check terminal)
- Ensure code doesn't use restricted features (imports, etc.)

### Progress not saving
- Check browser localStorage is enabled
- Try a different browser if issues persist
- Progress is browser-specific (won't sync across devices)

## 🎯 Next Steps

After completing all modules:
1. **Review weak areas** - Check dashboard for low scores
2. **Retry workshops** - Aim for 90%+ on all workshops
3. **Practice speed** - Complete workshops faster
4. **Real interviews** - Apply your skills in actual screenings

## 📝 Related Issues

- Issue #24: Phase 1 - Deploy Working Flask Training App (this implementation)
- Issue #23: Python Training Course MVP (static approach)
- Issue #25: Learn by Building the Learner (reflexive AI education)

## 📄 License

Internal training tool for BPM Software Solutions.

---

**Good luck with your training! 🚀**

