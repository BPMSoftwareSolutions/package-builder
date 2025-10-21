import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JSONViewerProps {
  data: any;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxHeight?: string;
}

export const JSONViewer: React.FC<JSONViewerProps> = ({
  data,
  title,
  collapsible = true,
  defaultExpanded = true,
  maxHeight = '400px'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="json-viewer">
      {title && (
        <div className="json-viewer-header">
          {collapsible && (
            <button
              className="json-viewer-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <span className="json-viewer-title">{title}</span>
          <button
            className="json-viewer-copy"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
      {(!collapsible || isExpanded) && (
        <div className="json-viewer-content" style={{ maxHeight }}>
          <pre className="json-viewer-pre">
            <code className="json-viewer-code">{jsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

