#!/usr/bin/env python3
"""
Validate that all features in features.json have corresponding tests.
Run this as part of pre-commit hook or CI/CD pipeline.
"""
import json
import sys
import os
import re
from pathlib import Path


def load_features():
    """Load features.json"""
    features_path = Path(__file__).parent.parent / 'features.json'
    with open(features_path, encoding='utf-8') as f:
        return json.load(f)


def find_test_files():
    """Find all test files"""
    tests_dir = Path(__file__).parent
    return list(tests_dir.glob('test_*.py'))


def extract_test_functions(test_file):
    """Extract test function names from a test file"""
    with open(test_file, encoding='utf-8') as f:
        content = f.read()
    
    # Find all test functions
    pattern = r'def (test_\w+)\(.*?\):'
    return re.findall(pattern, content)


def validate_backend_api_coverage(features, test_functions):
    """Validate API endpoint test coverage"""
    endpoints = features['features']['backend']['api']['endpoints']
    missing = []

    for endpoint in endpoints:
        path = endpoint['path'].replace('/', '_').replace('<', '').replace('>', '')
        method = endpoint['method'].lower()

        # Check for various test naming patterns
        patterns = [
            f"test_{method}{path}",
            f"test_{method}_api{path}",
            f"test_post_api_grade",  # Special case for POST /api/grade
            f"test_get_api_modules",  # Special case for GET /api/modules
        ]

        # Check if any test function contains the relevant keywords
        found = False
        for test_func in test_functions:
            if method in test_func and path.replace('_', '') in test_func.replace('_', ''):
                found = True
                break

        if not found:
            missing.append({
                'feature': f"{method.upper()} {endpoint['path']}",
                'expected_test': patterns[0],
                'test_cases': endpoint['testCases']
            })

    return missing


def validate_sandbox_coverage(features, test_functions):
    """Validate sandbox feature test coverage"""
    sandbox_features = features['features']['backend']['sandbox']['features']
    missing = []

    for feature in sandbox_features:
        feature_name = feature['name'].lower().replace(' ', '_').replace('-', '_')

        # Check if any test function contains the relevant keywords
        found = False
        keywords = feature_name.split('_')
        for test_func in test_functions:
            if 'sandbox' in test_func and all(kw in test_func for kw in keywords if len(kw) > 2):
                found = True
                break

        if not found:
            missing.append({
                'feature': f"Sandbox: {feature['name']}",
                'expected_test': f"test_sandbox_{feature_name}",
                'test_cases': feature['testCases']
            })

    return missing


def validate_grading_coverage(features, test_functions):
    """Validate grading feature test coverage"""
    grading_features = features['features']['backend']['grading']['features']
    missing = []

    for feature in grading_features:
        feature_name = feature['name'].lower().replace(' ', '_').replace('-', '_')

        # Check if any test function contains the relevant keywords
        found = False
        keywords = feature_name.split('_')
        for test_func in test_functions:
            if 'grading' in test_func and all(kw in test_func for kw in keywords if len(kw) > 2):
                found = True
                break

        if not found:
            missing.append({
                'feature': f"Grading: {feature['name']}",
                'expected_test': f"test_grading_{feature_name}",
                'test_cases': feature['testCases']
            })

    return missing


def main():
    """Main validation function"""
    print("🔍 Validating test coverage against features.json...\n")
    
    # Load features
    features = load_features()
    
    # Find all test files
    test_files = find_test_files()
    print(f"Found {len(test_files)} test files")
    
    # Extract all test functions
    all_test_functions = []
    for test_file in test_files:
        test_funcs = extract_test_functions(test_file)
        all_test_functions.extend(test_funcs)
        print(f"  {test_file.name}: {len(test_funcs)} tests")
    
    print(f"\nTotal test functions: {len(all_test_functions)}\n")
    
    # Validate coverage
    missing_tests = []
    
    print("Validating backend API coverage...")
    missing_tests.extend(validate_backend_api_coverage(features, all_test_functions))
    
    print("Validating sandbox coverage...")
    missing_tests.extend(validate_sandbox_coverage(features, all_test_functions))
    
    print("Validating grading coverage...")
    missing_tests.extend(validate_grading_coverage(features, all_test_functions))
    
    # Report results
    if missing_tests:
        print(f"\n❌ FAILED: {len(missing_tests)} features are missing tests:\n")
        for item in missing_tests:
            print(f"  Feature: {item['feature']}")
            print(f"  Expected test: {item['expected_test']}")
            print(f"  Test cases to implement:")
            for tc in item['test_cases'][:3]:  # Show first 3
                print(f"    - {tc}")
            if len(item['test_cases']) > 3:
                print(f"    ... and {len(item['test_cases']) - 3} more")
            print()
        
        sys.exit(1)
    else:
        print("\n✅ SUCCESS: All features have corresponding tests!\n")
        sys.exit(0)


if __name__ == '__main__':
    main()

