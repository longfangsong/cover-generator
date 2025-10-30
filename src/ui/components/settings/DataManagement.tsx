/**
 * DataManagement Component
 * Export and delete user data
 */

import React, { useState } from 'react';
import { BrowserStorageService } from '../../../infra/storage';
import './DataManagement.css';

export const DataManagement: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const storage = new BrowserStorageService();

  const handleExportData = async () => {
    try {
      setExporting(true);
      setMessage(null);

      const exportData = await storage.exportData();
      
      // Create blob and download
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ 
        type: 'success', 
        text: 'Data exported successfully!' 
      });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to export data. Please try again.' 
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteData = async () => {
    try {
      setDeleting(true);
      setMessage(null);

      await storage.clearAll();

      setMessage({ 
        type: 'success', 
        text: 'All data deleted successfully!' 
      });
      setShowDeleteConfirm(false);

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete data. Please try again.' 
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="data-management">
      <h3>Data Management</h3>
      
      <div className="data-section">
        <h4>Export Data</h4>
        <p className="section-description">
          Download all your data (profiles, cover letters, settings) as a JSON file.
          You can use this as a backup or to transfer data between devices.
        </p>
        <button
          className="export-button"
          onClick={handleExportData}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : '📥 Export All Data'}
        </button>
      </div>

      <div className="data-section danger-zone">
        <h4>Danger Zone</h4>
        <p className="section-description">
          Permanently delete all your data including profiles, cover letters, and settings.
          This action cannot be undone.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            className="delete-button"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete All Data
          </button>
        ) : (
          <div className="delete-confirm">
            <p className="confirm-warning">
              ⚠️ Are you sure? This will permanently delete all your data!
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-delete-button"
                onClick={handleDeleteData}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`data-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};
