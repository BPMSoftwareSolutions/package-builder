/**
 * LogParser Component
 * 
 * Provides UI for inputting and parsing sequence execution logs.
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 */

import React, { useState } from 'react';
import type { LogInput } from '../../types';

export interface LogParserProps {
  onParse: (input: LogInput) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const LogParser: React.FC<LogParserProps> = ({ onParse, isLoading, error }) => {
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'json' | 'text'>('json');

  const handleParse = () => {
    if (!content.trim()) {
      return;
    }
    onParse({ content, format });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      // Auto-detect format based on file extension or content
      if (file.name.endsWith('.json') || text.trim().startsWith('{')) {
        setFormat('json');
      } else {
        setFormat('text');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setContent('');
  };

  return (
    <div className="log-parser">
      <div className="panel-header">
        <h3 className="panel-title">Log Input</h3>
      </div>
      
      <div className="log-parser-content">
        <div className="log-parser-controls">
          <div className="format-selector">
            <label>
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json')}
              />
              JSON
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                value="text"
                checked={format === 'text'}
                onChange={(e) => setFormat(e.target.value as 'text')}
              />
              Text
            </label>
          </div>
          
          <div className="file-upload">
            <input
              type="file"
              accept=".json,.txt,.log"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="log-file-input"
            />
            <label htmlFor="log-file-input" className="button-secondary">
              Upload File
            </label>
          </div>
        </div>

        <textarea
          className="log-input-area"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Paste ${format.toUpperCase()} log content here...`}
          rows={10}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            padding: '0.5rem',
            marginTop: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        />

        {error && (
          <div className="error-message" style={{ 
            color: 'var(--error-color)', 
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '4px'
          }}>
            ❌ {error}
          </div>
        )}

        <div className="log-parser-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleParse}
            disabled={!content.trim() || isLoading}
            className="button-primary"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: content.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: content.trim() && !isLoading ? 1 : 0.5
            }}
          >
            {isLoading ? 'Parsing...' : 'Parse Log'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={!content}
            className="button-secondary"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: content ? 'pointer' : 'not-allowed',
              opacity: content ? 1 : 0.5
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

