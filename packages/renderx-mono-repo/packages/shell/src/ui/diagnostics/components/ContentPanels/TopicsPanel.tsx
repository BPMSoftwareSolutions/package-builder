import React from 'react';

export interface TopicsPanelProps {
  topicsMap: Map<string, any>;
  searchTerm: string;
  expandedItems: Set<string>;
  loading: boolean;
  conductor: any;
  onToggleExpanded: (topicName: string) => void;
  onTestTopic: (topicName: string) => void;
}

export const TopicsPanel: React.FC<TopicsPanelProps> = ({
  topicsMap,
  searchTerm,
  expandedItems,
  loading,
  conductor,
  onToggleExpanded,
  onTestTopic
}) => {
  const topics = Array.from(topicsMap.entries());
  const filteredTopics = topics.filter(([topic]) =>
    !searchTerm || topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Topics</h3>
        <span className="panel-badge">{filteredTopics.length}</span>
      </div>
      <div className="panel-content">
        {filteredTopics.map(([topicName, topicDef]) => (
          <div key={topicName} className="topic-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                className={`topic-name expandable ${expandedItems.has(topicName) ? 'expanded' : ''}`}
                onClick={() => onToggleExpanded(topicName)}
                style={{ flex: 1 }}
              >
                {topicName}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onTestTopic(topicName)}
                disabled={loading || !conductor}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                Test
              </button>
            </div>
            <div className="topic-routes">
              {topicDef.routes.length} route(s) • {topicDef.visibility || 'public'}
            </div>
            <div className={`expandable-content ${expandedItems.has(topicName) ? 'expanded' : ''}`}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Routes:</strong>
                {topicDef.routes.map((route: any, idx: number) => (
                  <div key={idx} style={{ marginLeft: '1rem', fontSize: '0.8125rem' }}>
                    → <span className="code">{route.pluginId}</span> / <span className="code">{route.sequenceId}</span>
                  </div>
                ))}
              </div>
              {topicDef.notes && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Notes:</strong> {topicDef.notes}
                </div>
              )}
              {topicDef.perf && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Performance:</strong>
                  {topicDef.perf.throttleMs && ` throttle: ${topicDef.perf.throttleMs}ms`}
                  {topicDef.perf.debounceMs && ` debounce: ${topicDef.perf.debounceMs}ms`}
                  {topicDef.perf.dedupeWindowMs && ` dedupe: ${topicDef.perf.dedupeWindowMs}ms`}
                </div>
              )}
              {topicDef.payloadSchema && (
                <div>
                  <strong>Payload Schema:</strong>
                  <pre style={{
                    fontSize: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(topicDef.payloadSchema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

