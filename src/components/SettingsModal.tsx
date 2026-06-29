import React, { useState, useEffect } from 'react';
import { clearAllData, saveBusinessSettingsToDB, type BusinessSettings } from '../services/db';
import { X, Settings, Building2, MapPin, Trash2, RefreshCw, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
  businessSettings: BusinessSettings;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ businessSettings, onClose, onRefreshData }) => {
  const [businessName, setBusinessName] = useState(businessSettings.businessName);
  const [businessAddress, setBusinessAddress] = useState(businessSettings.businessAddress);
  const [businessPhone, setBusinessPhone] = useState(businessSettings.businessPhone);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with props when they change
  useEffect(() => {
    setBusinessName(businessSettings.businessName);
    setBusinessAddress(businessSettings.businessAddress);
    setBusinessPhone(businessSettings.businessPhone);
  }, [businessSettings]);

  // Reset DB state
  const [showResetSection, setShowResetSection] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [wiping, setWiping] = useState(false);
  const [wipeMessage, setWipeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss save confirmation
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const settings: BusinessSettings = { businessName, businessAddress, businessPhone };
      await saveBusinessSettingsToDB(settings);
      setSaveSuccess(true);
      onRefreshData(); // Fetch the new data globally
    } catch (err) {
      console.error('Failed to save business settings to Firestore:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDB = async () => {
    setPasswordError('');
    if (password !== 'superadmin') {
      setPasswordError('Incorrect password. Access denied.');
      return;
    }

    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL inventory batches, sales records, employees, and payroll data from the database. This action CANNOT be undone. Continue?')) {
      return;
    }

    setWiping(true);
    setWipeMessage(null);
    try {
      const result = await clearAllData();
      if (result) {
        setWipeMessage({ type: 'success', text: 'Database wiped successfully. All records have been permanently deleted.' });
        setPassword('');
        onRefreshData();
      } else {
        setWipeMessage({ type: 'error', text: 'Failed to clear database. Check console for details.' });
      }
    } catch {
      setWipeMessage({ type: 'error', text: 'An unexpected error occurred while wiping the database.' });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} className="logo-icon" />
            System Settings
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Business Information ── */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '1.25rem',
            backgroundColor: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Building2 size={16} color="var(--color-primary)" />
              <h4 style={{ color: '#fff', fontWeight: 600, margin: 0 }}>Business Information</h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              This information appears on printed receipts and invoices.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Business Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. ULING NI FE"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                  <MapPin size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Address
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="e.g. 100 Industrial Bulk Ave, Suite 400, Manila"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Phone / Contact
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={businessPhone}
                  onChange={e => setBusinessPhone(e.target.value)}
                  placeholder="e.g. +63 (2) 812-3456"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveInfo}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {saving ? <RefreshCw size={13} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : <Save size={13} />}
                  {saving ? 'Saving...' : 'Save Info'}
                </button>
                {saveSuccess && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 500 }}>
                    <CheckCircle size={14} /> Saved!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Danger Zone: Reset Database ── */}
          <div style={{
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '1.25rem',
            backgroundColor: 'rgba(239,68,68,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showResetSection ? '1rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} color="var(--color-danger)" />
                <h4 style={{ color: 'var(--color-danger)', fontWeight: 600, margin: 0 }}>Reset Database</h4>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setShowResetSection(v => !v);
                  setPasswordError('');
                  setPassword('');
                  setWipeMessage(null);
                }}
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: 'var(--color-danger)',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  height: '26px',
                }}
              >
                {showResetSection ? 'Hide' : 'Show'}
              </button>
            </div>

            {showResetSection && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Permanently wipes <strong style={{ color: '#fff' }}>all</strong> inventory batches, sales records, employees, and payroll data. User accounts are preserved.
                  Enter the superadmin password to proceed.
                </p>

                {/* Password field */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Superadmin Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                      placeholder="Enter superadmin password"
                      style={{
                        paddingRight: '2.5rem',
                        borderColor: passwordError ? 'var(--color-danger)' : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute',
                        right: '0.65rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.35rem' }}>
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Operation message */}
                {wipeMessage && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    backgroundColor: wipeMessage.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)',
                    color: wipeMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                    border: wipeMessage.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  }}>
                    {wipeMessage.text}
                  </div>
                )}

                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleResetDB}
                  disabled={wiping || !password}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content' }}
                >
                  {wiping
                    ? <><RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} /> Wiping...</>
                    : <><Trash2 size={13} /> Wipe All Data</>}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
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
