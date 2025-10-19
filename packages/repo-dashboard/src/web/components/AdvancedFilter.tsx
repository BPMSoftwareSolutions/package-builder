import React, { useState, useEffect } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date-range' | 'text';
  values?: string[];
  value?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
}

interface AdvancedFilterProps {
  options: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  onSavePreset?: (preset: FilterPreset) => void;
  presets?: FilterPreset[];
}

export default function AdvancedFilter({
  options,
  onFilterChange,
  onSavePreset,
  presets = [],
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleFilterChange = (optionId: string, value: any) => {
    const updated = { ...filters, [optionId]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      filters,
    };

    onSavePreset?.(preset);
    setPresetName('');
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    onFilterChange(preset.filters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="advanced-filter-container">
      <div className="filter-header">
        <h3>Filters</h3>
        <button
          className="filter-toggle"
          onClick={() => setShowPresets(!showPresets)}
          title="Toggle presets"
        >
          ⭐ Presets
        </button>
      </div>

      <div className="filter-options">
        {options.map(option => (
          <div key={option.id} className="filter-option">
            <label htmlFor={`filter-${option.id}`}>{option.label}</label>

            {option.type === 'select' && (
              <select
                id={`filter-${option.id}`}
                value={filters[option.id] || ''}
                onChange={e => handleFilterChange(option.id, e.target.value)}
              >
                <option value="">All</option>
                {option.values?.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            )}

            {option.type === 'text' && (
              <input
                id={`filter-${option.id}`}
                type="text"
                placeholder={`Search ${option.label.toLowerCase()}...`}
                value={filters[option.id] || ''}
                onChange={e => handleFilterChange(option.id, e.target.value)}
              />
            )}

            {option.type === 'date-range' && (
              <div className="date-range-inputs">
                <input
                  type="date"
                  value={filters[`${option.id}-from`] || ''}
                  onChange={e =>
                    handleFilterChange(`${option.id}-from`, e.target.value)
                  }
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters[`${option.id}-to`] || ''}
                  onChange={e =>
                    handleFilterChange(`${option.id}-to`, e.target.value)
                  }
                  placeholder="To"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="filter-actions">
        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset
        </button>
        {onSavePreset && (
          <button
            className="btn-save-preset"
            onClick={() => setShowPresets(!showPresets)}
          >
            💾 Save as Preset
          </button>
        )}
      </div>

      {showPresets && (
        <div className="presets-panel">
          <h4>Filter Presets</h4>
          {presets.length > 0 && (
            <div className="presets-list">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  className="preset-item"
                  onClick={() => handleLoadPreset(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          {onSavePreset && (
            <div className="save-preset-form">
              <input
                type="text"
                placeholder="Preset name"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
              />
              <button onClick={handleSavePreset}>Save</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

