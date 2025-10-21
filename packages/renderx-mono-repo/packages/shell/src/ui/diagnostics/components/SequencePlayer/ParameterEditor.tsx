/**
 * ParameterEditor Component
 * 
 * Simple JSON textarea for parameter input with validation.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import React, { useState, useCallback } from 'react';
import { validateParameters } from '../../services';

export interface ParameterEditorProps {
  /** Current parameter value as JSON string */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export const ParameterEditor: React.FC<ParameterEditorProps> = ({
  value,
  onChange,
  disabled,
  placeholder = '{\n  "key": "value"\n}'
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = useCallback((newValue: string) => {
    onChange(newValue);

    // Validate on change
    if (newValue.trim()) {
      const result = validateParameters(newValue);
      setValidationError(result.valid ? null : result.error || 'Invalid JSON');
    } else {
      setValidationError(null);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    // Validate on blur
    if (value.trim()) {
      const result = validateParameters(value);
      setValidationError(result.valid ? null : result.error || 'Invalid JSON');
    }
  }, [value]);

  return (
    <div className="parameter-editor">
      <label className="parameter-editor-label">
        Parameters (JSON)
      </label>
      <textarea
        className={`parameter-editor-textarea ${validationError ? 'parameter-editor-error' : ''}`}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={6}
        spellCheck={false}
      />
      {validationError && (
        <div className="parameter-editor-error-message">
          ⚠️ {validationError}
        </div>
      )}
      <div className="parameter-editor-hint">
        Leave empty for no parameters, or enter a JSON object
      </div>
    </div>
  );
};

