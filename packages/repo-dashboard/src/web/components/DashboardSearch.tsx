import React, { useState, useEffect, useCallback } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  path?: string;
  icon?: string;
}

interface DashboardSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function DashboardSearch({
  onSearch,
  onResultSelect,
  placeholder = 'Search dashboard...',
  debounceMs = 300,
}: DashboardSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        try {
          setLoading(true);
          const searchResults = await onSearch(query);
          setResults(searchResults);
          setSelectedIndex(-1);
        } catch (err) {
          console.error('Search error:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onResultSelect(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="dashboard-search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search dashboard"
          aria-autocomplete="list"
          aria-expanded={showResults && results.length > 0}
        />
        {loading && <span className="search-spinner">⏳</span>}
        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results" role="listbox">
          {results.map((result, index) => (
            <button
              key={result.id}
              className={`search-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelectResult(result)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {result.icon && <span className="result-icon">{result.icon}</span>}
              <div className="result-content">
                <div className="result-title">{result.title}</div>
                {result.description && (
                  <div className="result-description">{result.description}</div>
                )}
              </div>
              <span className="result-category">{result.category}</span>
            </button>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && !loading && (
        <div className="search-no-results">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

