#!/usr/bin/env python3
"""
Unit tests for generate_combined_readme.py
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
from io import StringIO

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_combined_readme import (
    GitHubAPIClient,
    RepositoryFilter,
    ReadmeCombiner
)


class TestRepositoryFilter(unittest.TestCase):
    """Test RepositoryFilter class."""
    
    def test_matches_patterns_exact_match(self):
        """Test exact pattern matching."""
        self.assertTrue(RepositoryFilter.matches_patterns("renderx-core", ["renderx-core"]))
        self.assertFalse(RepositoryFilter.matches_patterns("renderx-core", ["renderx-utils"]))
    
    def test_matches_patterns_glob(self):
        """Test glob pattern matching."""
        self.assertTrue(RepositoryFilter.matches_patterns("renderx-core", ["renderx-*"]))
        self.assertTrue(RepositoryFilter.matches_patterns("renderx-utils", ["renderx-*"]))
        self.assertFalse(RepositoryFilter.matches_patterns("musical-conductor", ["renderx-*"]))
    
    def test_matches_patterns_case_insensitive(self):
        """Test case-insensitive pattern matching."""
        self.assertTrue(RepositoryFilter.matches_patterns("RenderX-Core", ["renderx-*"], case_insensitive=True))
        self.assertTrue(RepositoryFilter.matches_patterns("renderx-core", ["RENDERX-*"], case_insensitive=True))
    
    def test_matches_patterns_case_sensitive(self):
        """Test case-sensitive pattern matching."""
        # On Windows, fnmatch is case-insensitive by default
        # On Unix, fnmatch is case-sensitive
        import platform
        if platform.system() == "Windows":
            # Windows fnmatch is case-insensitive
            self.assertTrue(RepositoryFilter.matches_patterns("RenderX-Core", ["renderx-*"], case_insensitive=False))
        else:
            # Unix fnmatch is case-sensitive
            self.assertFalse(RepositoryFilter.matches_patterns("RenderX-Core", ["renderx-*"], case_insensitive=False))
    
    def test_filter_repositories(self):
        """Test filtering repositories."""
        repos = [
            {"name": "renderx-core"},
            {"name": "renderx-utils"},
            {"name": "musical-conductor"},
            {"name": "svg-editor"}
        ]
        
        filtered = RepositoryFilter.filter_repositories(repos, ["renderx-*"])
        self.assertEqual(len(filtered), 2)
        self.assertEqual(filtered[0]["name"], "renderx-core")
        self.assertEqual(filtered[1]["name"], "renderx-utils")
    
    def test_filter_repositories_multiple_patterns(self):
        """Test filtering with multiple patterns."""
        repos = [
            {"name": "renderx-core"},
            {"name": "renderx-utils"},
            {"name": "musical-conductor"},
            {"name": "svg-editor"}
        ]
        
        filtered = RepositoryFilter.filter_repositories(repos, ["renderx-*", "musical-*"])
        self.assertEqual(len(filtered), 3)


class TestReadmeCombiner(unittest.TestCase):
    """Test ReadmeCombiner class."""
    
    def test_generate_toc(self):
        """Test table of contents generation."""
        repos = [
            {"name": "renderx-core"},
            {"name": "renderx-utils"}
        ]
        
        toc = ReadmeCombiner.generate_toc(repos)
        self.assertIn("## Table of Contents", toc)
        self.assertIn("- [renderx-core](#renderx-core)", toc)
        self.assertIn("- [renderx-utils](#renderx-utils)", toc)
    
    def test_generate_combined_readme(self):
        """Test combined README generation."""
        repos = [
            {
                "name": "renderx-core",
                "description": "Core rendering engine",
                "html_url": "https://github.com/org/renderx-core",
                "topics": ["rendering", "graphics"]
            }
        ]
        
        readme_contents = {
            "renderx-core": "# RenderX Core\n\nThis is the core rendering engine."
        }
        
        combined = ReadmeCombiner.generate_combined_readme("TestOrg", repos, readme_contents)
        
        self.assertIn("# Combined README - TestOrg", combined)
        self.assertIn("## Table of Contents", combined)
        self.assertIn("## renderx-core", combined)
        self.assertIn("Core rendering engine", combined)
        self.assertIn("https://github.com/org/renderx-core", combined)
        self.assertIn("rendering, graphics", combined)
        self.assertIn("# RenderX Core", combined)
    
    def test_generate_combined_readme_missing_readme(self):
        """Test combined README with missing README."""
        repos = [
            {
                "name": "renderx-core",
                "description": "Core rendering engine",
                "html_url": "https://github.com/org/renderx-core",
                "topics": []
            }
        ]
        
        readme_contents = {}
        
        combined = ReadmeCombiner.generate_combined_readme("TestOrg", repos, readme_contents)
        
        self.assertIn("*No README found*", combined)


class TestGitHubAPIClient(unittest.TestCase):
    """Test GitHubAPIClient class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = GitHubAPIClient("test_token", "TestOrg")
    
    @patch('generate_combined_readme.requests.get')
    def test_make_request_success(self, mock_get):
        """Test successful API request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"name": "test"}
        mock_response.headers = {
            "X-RateLimit-Remaining": "60",
            "X-RateLimit-Reset": "1234567890"
        }
        mock_get.return_value = mock_response
        
        result = self.client._make_request("/test")
        
        self.assertEqual(result, {"name": "test"})
        self.assertEqual(self.client.rate_limit_remaining, 60)
    
    @patch('generate_combined_readme.requests.get')
    def test_make_request_not_found(self, mock_get):
        """Test 404 response."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.headers = {}
        mock_get.return_value = mock_response

        result = self.client._make_request("/test")

        self.assertIsNone(result)
    
    @patch('generate_combined_readme.requests.get')
    def test_make_request_retry(self, mock_get):
        """Test retry logic."""
        mock_response_fail = Mock()
        mock_response_fail.status_code = 500
        mock_response_fail.headers = {}

        mock_response_success = Mock()
        mock_response_success.status_code = 200
        mock_response_success.json.return_value = {"name": "test"}
        mock_response_success.headers = {
            "X-RateLimit-Remaining": "60",
            "X-RateLimit-Reset": "1234567890"
        }

        mock_get.side_effect = [mock_response_fail, mock_response_success]

        result = self.client._make_request("/test", max_retries=2)

        self.assertEqual(result, {"name": "test"})
    
    @patch('generate_combined_readme.GitHubAPIClient._make_request')
    def test_get_repositories(self, mock_request):
        """Test getting repositories."""
        # First call returns repos, second call returns empty list to stop pagination
        mock_request.side_effect = [
            [
                {"name": "repo1"},
                {"name": "repo2"}
            ],
            []  # Empty list to stop pagination
        ]

        repos = self.client.get_repositories()

        self.assertEqual(len(repos), 2)
        self.assertEqual(repos[0]["name"], "repo1")
    
    @patch('generate_combined_readme.GitHubAPIClient._make_request')
    def test_get_readme_success(self, mock_request):
        """Test getting README successfully."""
        import base64
        readme_content = "# Test README"
        encoded = base64.b64encode(readme_content.encode()).decode()
        
        mock_request.return_value = {"content": encoded}
        
        result = self.client.get_readme("test-repo")
        
        self.assertEqual(result, readme_content)
    
    @patch('generate_combined_readme.GitHubAPIClient._make_request')
    def test_get_readme_not_found(self, mock_request):
        """Test README not found."""
        mock_request.return_value = None
        
        result = self.client.get_readme("test-repo")
        
        self.assertIsNone(result)


class TestIntegration(unittest.TestCase):
    """Integration tests."""
    
    @patch('generate_combined_readme.GitHubAPIClient.get_repositories')
    @patch('generate_combined_readme.GitHubAPIClient.get_readme')
    def test_full_workflow(self, mock_get_readme, mock_get_repos):
        """Test full workflow."""
        mock_get_repos.return_value = [
            {
                "name": "renderx-core",
                "description": "Core engine",
                "html_url": "https://github.com/org/renderx-core",
                "topics": ["rendering"]
            },
            {
                "name": "renderx-utils",
                "description": "Utilities",
                "html_url": "https://github.com/org/renderx-utils",
                "topics": ["utils"]
            }
        ]
        
        mock_get_readme.side_effect = [
            "# RenderX Core\nCore rendering engine",
            "# RenderX Utils\nUtility functions"
        ]
        
        client = GitHubAPIClient("test_token", "TestOrg")
        repos = client.get_repositories()
        filtered = RepositoryFilter.filter_repositories(repos, ["renderx-*"])
        
        readme_contents = {}
        for repo in filtered:
            readme = client.get_readme(repo["name"])
            if readme:
                readme_contents[repo["name"]] = readme
        
        combined = ReadmeCombiner.generate_combined_readme("TestOrg", filtered, readme_contents)
        
        self.assertIn("# Combined README - TestOrg", combined)
        self.assertIn("renderx-core", combined)
        self.assertIn("renderx-utils", combined)
        self.assertIn("# RenderX Core", combined)
        self.assertIn("# RenderX Utils", combined)


if __name__ == "__main__":
    unittest.main()

