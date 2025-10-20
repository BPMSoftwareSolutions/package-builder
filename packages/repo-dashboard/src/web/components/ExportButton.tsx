import React, { useState } from 'react';

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  formats?: ExportFormat[];
  onExport?: (format: ExportFormat) => void;
}

export default function ExportButton({
  data,
  filename = 'dashboard-export',
  formats = ['csv', 'json', 'pdf', 'excel'],
  onExport,
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    downloadFile(csv, `${filename}.csv`, 'text/csv');
    onExport?.('csv');
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
    onExport?.('json');
  };

  const exportToPDF = () => {
    alert('PDF export coming soon');
    onExport?.('pdf');
  };

  const exportToExcel = () => {
    alert('Excel export coming soon');
    onExport?.('excel');
  };

  const downloadFile = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
    }
    setShowMenu(false);
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Export data"
        aria-label="Export data"
        aria-expanded={showMenu}
      >
        📥 Export
      </button>

      {showMenu && (
        <div className="export-menu">
          {formats.includes('csv') && (
            <button
              className="export-menu-item"
              onClick={() => handleExport('csv')}
            >
              📄 CSV
            </button>
          )}
          {formats.includes('json') && (
            <button
              className="export-menu-item"
              onClick={() => handleExport('json')}
            >
              {} JSON
            </button>
          )}
          {formats.includes('pdf') && (
            <button
              className="export-menu-item"
              onClick={() => handleExport('pdf')}
            >
              📕 PDF
            </button>
          )}
          {formats.includes('excel') && (
            <button
              className="export-menu-item"
              onClick={() => handleExport('excel')}
            >
              📊 Excel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

