import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  title,
  maxHeight = '300px'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="code-block">
      {title && (
        <div className="code-block-header">
          <span className="code-block-title">{title}</span>
          <span className="code-block-language">{language}</span>
          <button
            className="code-block-copy"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <div className="code-block-content" style={{ maxHeight }}>
        <pre className="code-block-pre">
          <code className={`code-block-code language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
};

