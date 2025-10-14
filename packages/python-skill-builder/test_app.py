"""
Quick test script to verify Flask app functionality
"""
import json
import sys

# Test 1: Check if modules directory exists
print("Test 1: Checking modules directory...")
import os
if os.path.exists("modules/module_index.json"):
    print("✓ modules/module_index.json exists")
    with open("modules/module_index.json", "r") as f:
        data = json.load(f)
        print(f"✓ Found {len(data['modules'])} modules")
else:
    print("✗ modules/module_index.json not found")
    sys.exit(1)

# Test 2: Check all module files exist
print("\nTest 2: Checking module files...")
for module in data['modules']:
    module_file = f"modules/{module['id']}.json"
    if os.path.exists(module_file):
        print(f"✓ {module_file} exists")
    else:
        print(f"✗ {module_file} missing")
        sys.exit(1)

# Test 3: Validate module JSON structure
print("\nTest 3: Validating module structure...")
for module in data['modules']:
    module_file = f"modules/{module['id']}.json"
    with open(module_file, "r") as f:
        mod_data = json.load(f)
        if 'workshops' in mod_data and len(mod_data['workshops']) > 0:
            print(f"✓ {module['id']}: {len(mod_data['workshops'])} workshops")
        else:
            print(f"✗ {module['id']}: No workshops found")
            sys.exit(1)

# Test 4: Test grading logic with sample code
print("\nTest 4: Testing grading logic...")
from app import run_user_and_tests

# Test even_squares function
user_code = """
def even_squares(nums):
    return [n*n for n in nums if n % 2 == 0]
"""

test_code = """
def grade(ns):
    max_score=100
    if 'even_squares' not in ns: return {'score':0,'max_score':max_score,'feedback':'Function missing'}
    f=ns['even_squares']
    try:
        result=f([1,2,3,4])
        if result!=[4,16]: return {'score':60,'max_score':max_score,'feedback':'Expected [4,16] for [1,2,3,4]'}
        result2=f([1,3,5])
        if result2!=[]: return {'score':80,'max_score':max_score,'feedback':'No evens should return empty list'}
        return {'score':100,'max_score':max_score,'feedback':'Perfect!'}
    except Exception as e:
        return {'score':0,'max_score':max_score,'feedback':str(e)}
"""

try:
    result = run_user_and_tests(user_code, test_code)
    if result['score'] == 100:
        print(f"✓ Grading works: {result['score']}/{result['max_score']} - {result['feedback']}")
    else:
        print(f"✗ Unexpected score: {result}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Grading failed: {e}")
    sys.exit(1)

# Test 5: Test invalid code (should be caught by sandbox)
print("\nTest 5: Testing sandbox security...")
invalid_code = """
import os
def hack():
    return os.listdir('.')
"""

try:
    result = run_user_and_tests(invalid_code, test_code)
    print(f"✗ Sandbox failed - should have blocked import")
    sys.exit(1)
except ValueError as e:
    if "disallowed" in str(e).lower():
        print(f"✓ Sandbox blocked disallowed code: {e}")
    else:
        print(f"✗ Unexpected error: {e}")
        sys.exit(1)

print("\n" + "="*50)
print("✅ All tests passed! Flask app is ready to run.")
print("="*50)
print("\nTo start the app:")
print("  python app.py")
print("\nThen open: http://127.0.0.1:5000")

