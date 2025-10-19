#!/usr/bin/env python3
"""
Features Manager - CRUD operations for features.json
Manages feature inventory for the repo-dashboard package
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime


class FeaturesManager:
    """Manages CRUD operations on features.json"""

    def __init__(self, features_file: str = "features.json"):
        """Initialize the features manager with path to features.json"""
        self.features_file = Path(features_file)
        if not self.features_file.exists():
            raise FileNotFoundError(f"Features file not found: {self.features_file}")
        self.data = self._load_features()

    def _load_features(self) -> Dict[str, Any]:
        """Load features from JSON file"""
        with open(self.features_file, 'r') as f:
            return json.load(f)

    def _save_features(self) -> None:
        """Save features to JSON file"""
        self.data['metadata']['lastUpdated'] = datetime.now().strftime("%Y-%m-%d")
        with open(self.features_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    def list_categories(self) -> List[str]:
        """List all feature categories"""
        return list(self.data.get('features', {}).keys())

    def get_category(self, category: str) -> Optional[Dict[str, Any]]:
        """Get all features in a category"""
        return self.data.get('features', {}).get(category)

    def list_features(self, category: str) -> List[str]:
        """List all feature names in a category"""
        cat_data = self.get_category(category)
        if not cat_data:
            return []
        
        features = cat_data.get('features', [])
        return [f.get('name', 'Unknown') for f in features]

    def get_feature(self, category: str, feature_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific feature by category and name"""
        cat_data = self.get_category(category)
        if not cat_data:
            return None
        
        features = cat_data.get('features', [])
        for feature in features:
            if feature.get('name') == feature_name:
                return feature
        return None

    def add_feature(self, category: str, feature: Dict[str, Any]) -> bool:
        """Add a new feature to a category"""
        if category not in self.data['features']:
            self.data['features'][category] = {
                'description': f'{category} features',
                'features': []
            }
        
        # Check if feature already exists
        if self.get_feature(category, feature.get('name')):
            print(f"Feature '{feature.get('name')}' already exists in {category}")
            return False
        
        self.data['features'][category]['features'].append(feature)
        self._save_features()
        return True

    def update_feature(self, category: str, feature_name: str, updates: Dict[str, Any]) -> bool:
        """Update an existing feature"""
        feature = self.get_feature(category, feature_name)
        if not feature:
            print(f"Feature '{feature_name}' not found in {category}")
            return False
        
        feature.update(updates)
        self._save_features()
        return True

    def delete_feature(self, category: str, feature_name: str) -> bool:
        """Delete a feature from a category"""
        cat_data = self.get_category(category)
        if not cat_data:
            return False
        
        features = cat_data.get('features', [])
        for i, feature in enumerate(features):
            if feature.get('name') == feature_name:
                features.pop(i)
                self._save_features()
                return True
        return False

    def search_features(self, query: str) -> List[tuple]:
        """Search for features by name or description"""
        results = []
        for category, cat_data in self.data.get('features', {}).items():
            features = cat_data.get('features', [])
            for feature in features:
                name = feature.get('name', '').lower()
                desc = feature.get('description', '').lower()
                if query.lower() in name or query.lower() in desc:
                    results.append((category, feature))
        return results

    def get_test_cases(self, category: str, feature_name: str) -> List[str]:
        """Get test cases for a feature"""
        feature = self.get_feature(category, feature_name)
        if not feature:
            return []
        return feature.get('testCases', [])

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about features"""
        total_features = 0
        total_test_cases = 0
        implemented = 0
        
        for category, cat_data in self.data.get('features', {}).items():
            features = cat_data.get('features', [])
            total_features += len(features)
            
            for feature in features:
                if feature.get('status') == 'implemented':
                    implemented += 1
                test_cases = feature.get('testCases', [])
                total_test_cases += len(test_cases)
        
        return {
            'total_features': total_features,
            'total_test_cases': total_test_cases,
            'implemented_features': implemented,
            'categories': len(self.data.get('features', {}))
        }

    def print_feature(self, category: str, feature_name: str) -> None:
        """Pretty print a feature"""
        feature = self.get_feature(category, feature_name)
        if not feature:
            print(f"Feature '{feature_name}' not found in {category}")
            return
        
        print(f"\n{'='*60}")
        print(f"Feature: {feature.get('name')}")
        print(f"Category: {category}")
        print(f"Status: {feature.get('status')}")
        print(f"File: {feature.get('file', 'N/A')}")
        print(f"Description: {feature.get('description', 'N/A')}")
        
        test_cases = feature.get('testCases', [])
        if test_cases:
            print(f"\nTest Cases ({len(test_cases)}):")
            for i, tc in enumerate(test_cases, 1):
                print(f"  {i}. {tc}")
        print(f"{'='*60}\n")


def main():
    """CLI interface for features manager"""
    if len(sys.argv) < 2:
        print("Usage: python features_manager.py <command> [args]")
        print("\nCommands:")
        print("  list-categories              - List all feature categories")
        print("  list-features <category>     - List features in a category")
        print("  get <category> <feature>     - Get feature details")
        print("  search <query>               - Search features")
        print("  test-cases <category> <feature> - Get test cases for a feature")
        print("  stats                        - Show feature statistics")
        return

    manager = FeaturesManager()
    command = sys.argv[1]

    if command == "list-categories":
        categories = manager.list_categories()
        print(f"Feature Categories ({len(categories)}):")
        for cat in categories:
            print(f"  - {cat}")

    elif command == "list-features" and len(sys.argv) > 2:
        category = sys.argv[2]
        features = manager.list_features(category)
        print(f"Features in '{category}' ({len(features)}):")
        for feat in features:
            print(f"  - {feat}")

    elif command == "get" and len(sys.argv) > 3:
        category = sys.argv[2]
        feature_name = " ".join(sys.argv[3:])
        manager.print_feature(category, feature_name)

    elif command == "search" and len(sys.argv) > 2:
        query = " ".join(sys.argv[2:])
        results = manager.search_features(query)
        print(f"Search results for '{query}' ({len(results)}):")
        for category, feature in results:
            print(f"  [{category}] {feature.get('name')}")

    elif command == "test-cases" and len(sys.argv) > 3:
        category = sys.argv[2]
        feature_name = " ".join(sys.argv[3:])
        test_cases = manager.get_test_cases(category, feature_name)
        print(f"Test cases for '{feature_name}':")
        for i, tc in enumerate(test_cases, 1):
            print(f"  {i}. {tc}")

    elif command == "stats":
        stats = manager.get_statistics()
        print("\nFeature Statistics:")
        print(f"  Total Features: {stats['total_features']}")
        print(f"  Implemented: {stats['implemented_features']}")
        print(f"  Total Test Cases: {stats['total_test_cases']}")
        print(f"  Categories: {stats['categories']}\n")

    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()

