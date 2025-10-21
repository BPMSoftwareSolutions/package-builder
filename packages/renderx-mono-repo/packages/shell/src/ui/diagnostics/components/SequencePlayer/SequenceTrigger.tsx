/**
 * SequenceTrigger Component
 * 
 * UI to trigger sequence with parameters and show loading state.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import React, { useState, useCallback } from 'react';
import { ParameterEditor } from './ParameterEditor';
import { validateParameters } from '../../services';
import type { AvailableSequence } from '../../types';

export interface SequenceTriggerProps {
  /** The sequence to trigger */
  sequence: AvailableSequence | null;
  /** Whether execution is in progress */
  isExecuting: boolean;
  /** Callback to trigger the sequence */
  onTrigger: (sequence: AvailableSequence, parameters?: Record<string, any>) => void;
  /** Callback to cancel the trigger */
  onCancel: () => void;
}

export const SequenceTrigger: React.FC<SequenceTriggerProps> = ({
  sequence,
  isExecuting,
  onTrigger,
  onCancel
}) => {
  const [parameters, setParameters] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTrigger = useCallback(() => {
    if (!sequence) return;

    // Validate parameters
    const result = validateParameters(parameters);
    if (!result.valid) {
      setValidationError(result.error || 'Invalid parameters');
      return;
    }

    setValidationError(null);
    onTrigger(sequence, result.data);
  }, [sequence, parameters, onTrigger]);

  const handleCancel = useCallback(() => {
    setParameters('');
    setValidationError(null);
    onCancel();
  }, [onCancel]);

  if (!sequence) {
    return (
      <div className="sequence-trigger-empty">
        <span className="empty-icon">🎯</span>
        <span>Select a sequence from the list to trigger it</span>
      </div>
    );
  }

  return (
    <div className="sequence-trigger-container">
      <div className="sequence-trigger-header">
        <h3 className="sequence-trigger-title">
          Trigger Sequence
        </h3>
        <button
          className="button-secondary"
          onClick={handleCancel}
          disabled={isExecuting}
        >
          Cancel
        </button>
      </div>

      <div className="sequence-trigger-info">
        <div className="sequence-trigger-info-row">
          <span className="sequence-trigger-label">Sequence:</span>
          <span className="sequence-trigger-value">{sequence.sequenceName}</span>
        </div>
        <div className="sequence-trigger-info-row">
          <span className="sequence-trigger-label">ID:</span>
          <span className="sequence-trigger-value sequence-trigger-id">
            {sequence.sequenceId}
          </span>
        </div>
        <div className="sequence-trigger-info-row">
          <span className="sequence-trigger-label">Plugin:</span>
          <span className="sequence-trigger-value">{sequence.pluginId}</span>
        </div>
        {sequence.description && (
          <div className="sequence-trigger-info-row">
            <span className="sequence-trigger-label">Description:</span>
            <span className="sequence-trigger-value">{sequence.description}</span>
          </div>
        )}
      </div>

      <ParameterEditor
        value={parameters}
        onChange={setParameters}
        disabled={isExecuting}
      />

      {validationError && (
        <div className="sequence-trigger-error">
          ⚠️ {validationError}
        </div>
      )}

      <div className="sequence-trigger-actions">
        <button
          className="sequence-trigger-button"
          onClick={handleTrigger}
          disabled={isExecuting || !sequence.isMounted}
        >
          {isExecuting ? (
            <>
              <span className="spinner">⏳</span>
              <span>Executing...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Trigger Sequence</span>
            </>
          )}
        </button>
        {!sequence.isMounted && (
          <div className="sequence-trigger-warning">
            ⚠️ This sequence is not mounted and cannot be triggered
          </div>
        )}
      </div>
    </div>
  );
};

