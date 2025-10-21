"""
Unit tests for issue_migrator module
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from issue_migrator import (
    GitHubAPIClient,
    IssueExtractor,
    IssueTransformer,
    IssueMigrator,
    migrate_issues
)


class TestGitHubAPIClient:
    """Tests for GitHubAPIClient."""
    
    def test_init(self):
        """Test client initialization."""
        client = GitHubAPIClient("test-token")
        assert client.token == "test-token"
        assert client.base_url == "https://api.github.com"
        assert client.session is not None
    
    def test_get_headers(self):
        """Test header generation."""
        client = GitHubAPIClient("test-token")
        headers = client._get_headers()
        
        assert headers["Authorization"] == "token test-token"
        assert "Accept" in headers
        assert "User-Agent" in headers
    
    @patch('issue_migrator.requests.Session.get')
    def test_get_request(self, mock_get):
        """Test GET request."""
        mock_response = Mock()
        mock_response.json.return_value = {"key": "value"}
        mock_response.headers = {"X-RateLimit-Remaining": "60", "X-RateLimit-Reset": "1234567890"}
        mock_get.return_value = mock_response
        
        client = GitHubAPIClient("test-token")
        result = client.get("/repos/owner/repo")
        
        assert result == {"key": "value"}
        assert client.rate_limit_remaining == 60


class TestIssueExtractor:
    """Tests for IssueExtractor."""
    
    @patch.object(GitHubAPIClient, 'get')
    def test_fetch_issues(self, mock_get):
        """Test fetching issues."""
        mock_issues = [
            {"number": 1, "title": "Issue 1", "state": "open"},
            {"number": 2, "title": "Issue 2", "state": "closed"},
        ]
        mock_get.return_value = mock_issues
        
        client = GitHubAPIClient("test-token")
        extractor = IssueExtractor(client)
        issues = extractor.fetch_issues("owner/repo", limit=10)
        
        assert len(issues) == 2
        assert issues[0]["title"] == "Issue 1"
    
    @patch.object(GitHubAPIClient, 'get')
    def test_fetch_issues_pagination(self, mock_get):
        """Test pagination handling."""
        # First page returns 100 items, second page returns 50
        mock_get.side_effect = [
            [{"number": i, "title": f"Issue {i}"} for i in range(1, 101)],
            [{"number": i, "title": f"Issue {i}"} for i in range(101, 151)],
        ]
        
        client = GitHubAPIClient("test-token")
        extractor = IssueExtractor(client)
        issues = extractor.fetch_issues("owner/repo", limit=150)
        
        assert len(issues) == 150


class TestIssueTransformer:
    """Tests for IssueTransformer."""
    
    def test_transform_issue_basic(self):
        """Test basic issue transformation."""
        issue = {
            "number": 1,
            "title": "Test Issue",
            "body": "Test body",
            "state": "open",
            "html_url": "https://github.com/owner/repo/issues/1",
            "user": {"login": "testuser"},
            "created_at": "2025-01-01T00:00:00Z",
            "labels": [{"name": "bug"}, {"name": "enhancement"}],
            "assignees": [{"login": "assignee1"}],
            "milestone": None,
        }
        
        transformed = IssueTransformer.transform_issue(issue, "owner/repo")
        
        assert transformed["title"] == "Test Issue"
        assert "Test body" in transformed["body"]
        assert "owner/repo" in transformed["body"]
        assert "testuser" in transformed["body"]
        assert "bug" in transformed["labels"]
        assert "enhancement" in transformed["labels"]
        assert "migrated-from-repo" in transformed["labels"]
        assert transformed["state"] == "open"
    
    def test_transform_issue_with_milestone(self):
        """Test transformation with milestone."""
        issue = {
            "number": 1,
            "title": "Test Issue",
            "body": "Test body",
            "state": "open",
            "html_url": "https://github.com/owner/repo/issues/1",
            "user": {"login": "testuser"},
            "created_at": "2025-01-01T00:00:00Z",
            "labels": [],
            "assignees": [],
            "milestone": {"title": "v1.0"},
        }
        
        transformed = IssueTransformer.transform_issue(issue, "owner/repo")
        
        assert transformed["milestone"] == "v1.0"


class TestIssueMigrator:
    """Tests for IssueMigrator."""
    
    def test_init(self):
        """Test migrator initialization."""
        client = GitHubAPIClient("test-token")
        migrator = IssueMigrator(client)
        
        assert migrator.migrated_count == 0
        assert migrator.failed_count == 0
        assert len(migrator.migration_log) == 0
    
    def test_migrate_issue_dry_run(self):
        """Test dry run migration."""
        client = GitHubAPIClient("test-token")
        migrator = IssueMigrator(client)
        
        transformed_issue = {
            "title": "Test Issue",
            "body": "Test body",
            "labels": ["bug"],
            "assignees": [],
            "original_number": 1,
            "original_repo": "owner/repo",
        }
        
        result = migrator.migrate_issue("target/repo", transformed_issue, dry_run=True)
        
        assert result is True
        assert migrator.migrated_count == 0
        assert len(migrator.migration_log) == 1
        assert migrator.migration_log[0]["status"] == "dry_run"
    
    @patch.object(GitHubAPIClient, 'post')
    def test_migrate_issue_success(self, mock_post):
        """Test successful issue migration."""
        mock_post.return_value = {
            "number": 100,
            "html_url": "https://github.com/target/repo/issues/100"
        }
        
        client = GitHubAPIClient("test-token")
        migrator = IssueMigrator(client)
        
        transformed_issue = {
            "title": "Test Issue",
            "body": "Test body",
            "labels": ["bug"],
            "assignees": [],
            "original_number": 1,
            "original_repo": "owner/repo",
        }
        
        result = migrator.migrate_issue("target/repo", transformed_issue, dry_run=False)
        
        assert result is True
        assert migrator.migrated_count == 1
        assert migrator.failed_count == 0
    
    @patch.object(GitHubAPIClient, 'post')
    def test_migrate_issue_failure(self, mock_post):
        """Test failed issue migration."""
        import requests
        mock_post.side_effect = requests.exceptions.RequestException("API Error")

        client = GitHubAPIClient("test-token")
        migrator = IssueMigrator(client)

        transformed_issue = {
            "title": "Test Issue",
            "body": "Test body",
            "labels": ["bug"],
            "assignees": [],
            "original_number": 1,
            "original_repo": "owner/repo",
        }

        result = migrator.migrate_issue("target/repo", transformed_issue, dry_run=False)

        assert result is False
        assert migrator.migrated_count == 0
        assert migrator.failed_count == 1
    
    def test_get_summary(self):
        """Test summary generation."""
        client = GitHubAPIClient("test-token")
        migrator = IssueMigrator(client)
        
        migrator.migrated_count = 5
        migrator.failed_count = 2
        
        summary = migrator.get_summary()
        
        assert summary["migrated"] == 5
        assert summary["failed"] == 2
        assert summary["total"] == 7
        assert "timestamp" in summary


class TestMigrateIssuesIntegration:
    """Integration tests for migrate_issues function."""

    @patch('issue_migrator.GitHubAPIClient')
    def test_migrate_issues_integration(self, mock_client_class):
        """Test full migration flow."""
        # Mock the client and its methods
        mock_client = Mock()
        mock_client_class.return_value = mock_client

        # Mock fetch_issues to return test data
        mock_client.get.return_value = [
            {
                "number": 1,
                "title": "Issue 1",
                "body": "Body 1",
                "state": "open",
                "html_url": "https://github.com/source/repo/issues/1",
                "user": {"login": "user1"},
                "created_at": "2025-01-01T00:00:00Z",
                "labels": [],
                "assignees": [],
                "milestone": None,
                "pull_request": None,
            }
        ]

        # Mock post to return successful issue creation
        mock_client.post.return_value = {
            "number": 100,
            "html_url": "https://github.com/target/repo/issues/100"
        }

        summary = migrate_issues("source/repo", "target/repo", "test-token", dry_run=False, limit=1)

        assert summary["migrated"] == 1
        assert summary["failed"] == 0
    
    @patch('issue_migrator.IssueExtractor.fetch_issues')
    def test_migrate_issues_skip_prs(self, mock_fetch):
        """Test that pull requests are skipped."""
        mock_fetch.return_value = [
            {
                "number": 1,
                "title": "PR 1",
                "body": "PR body",
                "state": "open",
                "html_url": "https://github.com/source/repo/pull/1",
                "user": {"login": "user1"},
                "created_at": "2025-01-01T00:00:00Z",
                "labels": [],
                "assignees": [],
                "milestone": None,
                "pull_request": {"url": "..."},  # This marks it as a PR
            }
        ]
        
        summary = migrate_issues("source/repo", "target/repo", "test-token", dry_run=True)
        
        assert summary["migrated"] == 0
        assert summary["failed"] == 0

