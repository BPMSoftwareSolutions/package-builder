import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 style={{ marginTop: '1.5rem', marginBottom: '1rem' }} {...props} />,
          h2: ({ node, ...props }) => <h2 style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }} {...props} />,
          h3: ({ node, ...props }) => <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
          p: ({ node, ...props }) => <p style={{ marginBottom: '1rem', lineHeight: '1.6' }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }} {...props} />,
          ol: ({ node, ...props }) => <ol style={{ marginLeft: '2rem', marginBottom: '1rem' }} {...props} />,
          li: ({ node, ...props }) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
          code: ({ node, inline, ...props }) => 
            inline ? (
              <code
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--accent-color)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
                {...props}
              />
            ) : (
              <code
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  padding: '1rem',
                  borderRadius: '4px',
                  display: 'block',
                  overflow: 'auto',
                  marginBottom: '1rem',
                  fontFamily: 'monospace',
                }}
                {...props}
              />
            ),
          pre: ({ node, ...props }) => <pre style={{ margin: 0 }} {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: '4px solid var(--accent-color)',
                paddingLeft: '1rem',
                marginLeft: 0,
                marginBottom: '1rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1rem',
              }}
              {...props}
            />
          ),
          thead: ({ node, ...props }) => (
            <thead
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '2px solid var(--border-color)',
              }}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: 600,
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
              }}
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              style={{
                color: 'var(--accent-color)',
                textDecoration: 'none',
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

