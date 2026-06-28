import React, { useState } from 'react';
import { 
  setupFirebaseDefaultData, 
  clearAllData 
} from '../services/db';
import { X, RefreshCw, Trash2, Server } from 'lucide-react';

interface FirebaseConfigModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ onClose, onRefreshData }) => {
  const [seeding, setSeeding] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSeedData = async () => {
    setSeeding(true);
    setOperationMessage(null);
    try {
      const result = await setupFirebaseDefaultData();
      if (result) {
        setOperationMessage({ 
          type: 'success', 
          text: 'Firestore database populated with realistic demo data successfully!' 
        });
        onRefreshData();
      } else {
        setOperationMessage({ 
          type: 'error', 
          text: 'Database already has data or could not be seeded.' 
        });
      }
    } catch {
      setOperationMessage({ type: 'error', text: 'An error occurred during database seeding.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleWipeData = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL data? This will permanently wipe out all users, inventory batches, sales receipts, employee rosters, and payroll logs from Firestore. This action cannot be undone.')) {
      return;
    }
    
    setWiping(true);
    setOperationMessage(null);
    try {
      const result = await clearAllData();
      if (result) {
        setOperationMessage({ 
          type: 'success', 
          text: 'Firestore database successfully wiped clean! You can now start entering your own actual data.' 
        });
        onRefreshData();
      } else {
        setOperationMessage({ 
          type: 'error', 
          text: 'Failed to clear Firestore. Check console errors.' 
        });
      }
    } catch {
      setOperationMessage({ type: 'error', text: 'An error occurred while wiping data.' });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={22} className="logo-icon" />
            Database Settings
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Status Panel */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem', 
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: 'var(--color-success-glow)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}>
              <Server color="var(--color-success)" size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, color: '#fff' }}>
                Active Database: Firebase Firestore
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                All inventory batches, sales transactions, payroll logs, and user credentials are saved directly to Firestore. Local Storage fallback is disabled.
              </p>
            </div>
          </div>

          {/* Operation Status Messages */}
          {operationMessage && (
            <div style={{ 
              padding: '0.65rem 0.85rem', 
              borderRadius: '6px', 
              fontSize: '0.8rem',
              backgroundColor: operationMessage.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)',
              color: operationMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              border: operationMessage.type === 'success' ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(239,68,68,0.1)'
            }}>
              {operationMessage.text}
            </div>
          )}

          {/* Control Actions */}
          <div style={{ 
            border: '1px dashed rgba(255,255,255,0.1)', 
            borderRadius: 'var(--border-radius-sm)', 
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: 'rgba(255,255,255,0.01)'
          }}>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 600 }}>Database Controls</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Manage data seeding for evaluation or wipe out all records to start fresh for real production usage.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleSeedData} 
                disabled={seeding || wiping}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {seeding ? <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : <Server size={14} />}
                {seeding ? 'Seeding...' : 'Seed Demo Data'}
              </button>

              <button 
                className="btn btn-danger btn-sm" 
                onClick={handleWipeData} 
                disabled={seeding || wiping}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {wiping ? <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : <Trash2 size={14} />}
                {wiping ? 'Clearing...' : 'Wipe Database Clean'}
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
