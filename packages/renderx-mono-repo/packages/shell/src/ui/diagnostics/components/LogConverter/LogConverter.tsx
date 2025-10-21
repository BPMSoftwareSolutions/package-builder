/**
 * Log Converter Component
 * 
 * Converts console log format to JSON for Sequence Player.
 * Part of Issue #305.
 */

import React, { useState } from 'react';
import { convertLogToJson } from '../../services/log-converter.service';
import type { ParsedExecution } from '../../types';

interface LogConverterProps {
  onConvert?: (executions: ParsedExecution[]) => void;
}

export const LogConverter: React.FC<LogConverterProps> = ({ onConvert }) => {
  const [logContent, setLogContent] = useState('');
  const [convertedJson, setConvertedJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);

  const handleConvert = () => {
    if (!logContent.trim()) {
      setError('Please paste log content first');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const executions = convertLogToJson(logContent);
      const json = JSON.stringify(executions, null, 2);
      setConvertedJson(json);
      setExecutionCount(executions.length);
      
      if (onConvert) {
        onConvert(executions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleClear = () => {
    setLogContent('');
    setConvertedJson('');
    setError(null);
    setExecutionCount(0);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(convertedJson);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([convertedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-sequences-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setLogContent(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="log-converter">
      <div className="converter-header">
        <h3>🔄 Log Converter</h3>
        <p>Convert console logs to JSON format for Sequence Player</p>
      </div>

      {error && (
        <div className="error-message" style={{ 
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '4px',
          color: '#ff6b6b'
        }}>
          ❌ {error}
        </div>
      )}

      <div className="converter-input-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <label htmlFor="log-file-upload" style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(100, 100, 255, 0.2)',
            border: '1px solid rgba(100, 100, 255, 0.4)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            📁 Upload Log File
          </label>
          <input
            id="log-file-upload"
            type="file"
            accept=".log,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleConvert}
            disabled={isConverting || !logContent.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isConverting ? '#666' : 'rgba(0, 200, 100, 0.2)',
              border: '1px solid rgba(0, 200, 100, 0.4)',
              borderRadius: '4px',
              cursor: isConverting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              color: 'inherit'
            }}
          >
            {isConverting ? '⏳ Converting...' : '🔄 Convert to JSON'}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 100, 100, 0.2)',
              border: '1px solid rgba(255, 100, 100, 0.4)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'inherit'
            }}
          >
            🗑️ Clear
          </button>
        </div>

        <textarea
          value={logContent}
          onChange={(e) => setLogContent(e.target.value)}
          placeholder="Paste console log content here...

Example:
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: -2s79fo
ExecutionQueue.ts:40 🎼 ExecutionQueue: Enqueued &quot;Canvas Component Resize Move&quot; with priority NORMAL
..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '0.75rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {convertedJson && (
        <div className="converter-output-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4>✅ Converted JSON ({executionCount} sequence{executionCount !== 1 ? 's' : ''})</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCopyJson}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(100, 100, 255, 0.2)',
                  border: '1px solid rgba(100, 100, 255, 0.4)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'inherit'
                }}
              >
                📋 Copy JSON
              </button>
              <button
                onClick={handleDownloadJson}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(100, 200, 100, 0.2)',
                  border: '1px solid rgba(100, 200, 100, 0.4)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'inherit'
                }}
              >
                💾 Download JSON
              </button>
            </div>
          </div>

          <textarea
            value={convertedJson}
            readOnly
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(0, 100, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '4px',
              color: 'inherit',
              resize: 'vertical'
            }}
          />

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(100, 100, 255, 0.1)', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              💡 <strong>Tip:</strong> Copy this JSON and paste it into the Sequence Player (select "JSON" format)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

