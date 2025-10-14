import json
import sys

files = [
    'modules/python_basics.json',
    'modules/functions_and_syntax.json',
    'modules/oop_fundamentals.json',
    'modules/errors_and_debugging.json',
    'modules/comprehensions_and_generators.json',
    'modules/numpy_intro.json',
    'modules/flask_intro.json',
    'features.json'
]

print("Validating JSON files...")
all_valid = True

for file in files:
    try:
        with open(file, 'r') as f:
            data = json.load(f)
        print(f"✓ {file}: Valid JSON")
        
        # Check if it's a module file
        if file.startswith('modules/') and file != 'modules/module_index.json':
            # Count approaches
            total_approaches = 0
            for workshop in data.get('workshops', []):
                if 'approaches' in workshop:
                    total_approaches += len(workshop['approaches'])
                    print(f"  - {workshop['id']}: {len(workshop['approaches'])} approaches")
            print(f"  Total approaches in {file}: {total_approaches}")
    except json.JSONDecodeError as e:
        print(f"✗ {file}: Invalid JSON - {e}")
        all_valid = False
    except Exception as e:
        print(f"✗ {file}: Error - {e}")
        all_valid = False

if all_valid:
    print("\n✅ All JSON files are valid!")
    sys.exit(0)
else:
    print("\n❌ Some JSON files have errors!")
    sys.exit(1)

