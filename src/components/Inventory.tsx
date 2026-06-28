import React, { useState } from 'react';
import type { CoalBatch } from '../types';
import { addBatch, updateBatch, deleteBatch } from '../services/db';
import { Layers, Plus, Search, Edit3, Trash2, ShieldAlert, BarChart3 } from 'lucide-react';

interface InventoryProps {
  batches: CoalBatch[];
  onRefreshData: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ batches, onRefreshData }) => {
  // Modal Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<CoalBatch | null>(null);
  
  const [supplierName, setSupplierName] = useState('');
  const [classification, setClassification] = useState('');
  const [supplierPrice, setSupplierPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');

  // Dynamic filter lists
  const uniqueClassifications = Array.from(new Set(batches.map(b => b.classification).filter(Boolean)));

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setSupplierName('');
    setClassification('');
    setSupplierPrice(0);
    setSalePrice(0);
    setInitialQuantity(0);
    setNotes('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (batch: CoalBatch) => {
    setEditingBatch(batch);
    setSupplierName(batch.supplierName);
    setClassification(batch.classification);
    setSupplierPrice(batch.supplierPrice);
    setSalePrice(batch.salePrice);
    setInitialQuantity(batch.initialQuantity);
    setNotes(batch.notes || '');
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!supplierName.trim()) {
      setFormError('Please enter supplier name');
      return;
    }
    if (!classification.trim()) {
      setFormError('Please enter classification (e.g. Premium Anthracite)');
      return;
    }
    if (supplierPrice <= 0 || salePrice <= 0) {
      setFormError('Prices must be greater than 0');
      return;
    }
    if (initialQuantity <= 0) {
      setFormError('Initial quantity must be greater than 0');
      return;
    }

    try {
      const batchData = {
        supplierName: supplierName.trim(),
        classification: classification.trim(),
        supplierPrice,
        salePrice,
        initialQuantity,
        notes: notes.trim() || ""
      };

      if (editingBatch) {
        // Keep current quantity proportional or update it
        // In this case, we'll keep the current quantity as is unless initial changed
        const currentQtyDiff = initialQuantity - editingBatch.initialQuantity;
        const newCurrentQty = Math.max(0, editingBatch.currentQuantity + currentQtyDiff);
        
        await updateBatch(editingBatch.id, {
          ...batchData,
          currentQuantity: newCurrentQty
        });
      } else {
        await addBatch({
          ...batchData,
          currentQuantity: initialQuantity,
          dateReceived: new Date().toISOString().split('T')[0]
        });
      }

      setShowAddModal(false);
      onRefreshData();
    } catch (err) {
      setFormError('Error saving batch to database.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory batch? Doing so will permanently wipe it from records.')) {
      try {
        await deleteBatch(id);
        onRefreshData();
      } catch (err) {
        alert('Failed to delete batch.');
      }
    }
  };

  // Filter batches list
  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClassification = filterClassification === 'All' || b.classification === filterClassification;
    
    let matchesStatus = true;
    if (stockStatus === 'Low') {
      matchesStatus = b.currentQuantity <= 15 && b.currentQuantity > 0;
    } else if (stockStatus === 'Out') {
      matchesStatus = b.currentQuantity === 0;
    } else if (stockStatus === 'Stocked') {
      matchesStatus = b.currentQuantity > 15;
    }

    return matchesSearch && matchesClassification && matchesStatus;
  });

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
  };

  // Stock Summary calculations
  const totalValuationCost = filteredBatches.reduce((sum, b) => sum + (b.currentQuantity * b.supplierPrice), 0);
  const totalValuationRetail = filteredBatches.reduce((sum, b) => sum + (b.currentQuantity * b.salePrice), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Inventory Stats Banner */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Total Cost Valuation</span>
            <BarChart3 size={18} color="var(--color-warning)" />
          </div>
          <h2 className="kpi-value" style={{ color: 'var(--color-warning)' }}>
            {formatCurrency(totalValuationCost)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Warehouse buy-in valuation basis</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Retail Valuation</span>
            <BarChart3 size={18} color="var(--color-primary)" />
          </div>
          <h2 className="kpi-value">
            {formatCurrency(totalValuationRetail)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Warehouse sell-out valuation basis</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Expected Profit Yield</span>
            <BarChart3 size={18} color="var(--color-success)" />
          </div>
          <h2 className="kpi-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(totalValuationRetail - totalValuationCost)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected profits upon final sale</span>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="glass-panel table-card">
        <div className="table-header-row">
          <h3 className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--color-primary)" />
            Inventory Stock Records
          </h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <Plus size={16} /> Import New Batch
          </button>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search supplier, classification, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="form-select btn-sm"
            value={filterClassification}
            onChange={e => setFilterClassification(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="All">All Classifications</option>
            {uniqueClassifications.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select 
            className="form-select btn-sm"
            value={stockStatus}
            onChange={e => setStockStatus(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="All">All Stock Levels</option>
            <option value="Stocked">Healthy Stock (&gt;15 U)</option>
            <option value="Low">Low Stock (&le;15 U)</option>
            <option value="Out">Out of Stock (0 U)</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Supplier</th>
                <th>Classification</th>
                <th>Supplier Price</th>
                <th>Selling Price</th>
                <th>Stock Quantity</th>
                <th>Import Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => {
                const isLowStock = batch.currentQuantity <= 15;
                const isOut = batch.currentQuantity === 0;

                return (
                  <tr key={batch.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      #{batch.id.slice(6).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{batch.supplierName}</div>
                      {batch.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }} title={batch.notes}>
                          {batch.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}>
                        {batch.classification}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(batch.supplierPrice)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/U</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                      {formatCurrency(batch.salePrice)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/U</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isOut ? 'var(--color-danger)' : (isLowStock ? 'var(--color-warning)' : '#fff') }}>
                          {batch.currentQuantity} U
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          / {batch.initialQuantity} U
                        </span>
                        {isOut ? (
                          <span className="badge badge-cancelled" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>Out</span>
                        ) : (
                          isLowStock && (
                            <span className="badge badge-pending" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <ShieldAlert size={10} /> Low
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td>{new Date(batch.dateReceived).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-icon-only" 
                          title="Edit batch properties" 
                          onClick={() => handleOpenEdit(batch)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="btn btn-icon-only" 
                          title="Wipe batch" 
                          onClick={() => handleDelete(batch.id)}
                          style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No inventory batches match filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inventory Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBatch ? 'Modify Batch Properties' : 'Import New Inventory Cargo'}
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Supplier Operations Corp</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Glencore Operations"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coal Classification (Custom Type)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Premium Anthracite, Steaming Grade-B"
                  value={classification}
                  onChange={e => setClassification(e.target.value)}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Supplier Price per Unit (Buy Cost)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    className="form-input" 
                    placeholder="₱0.00"
                    value={supplierPrice === 0 ? '' : supplierPrice}
                    onChange={e => setSupplierPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price per Unit (Your Price)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    className="form-input" 
                    placeholder="₱0.00"
                    value={salePrice === 0 ? '' : salePrice}
                    onChange={e => setSalePrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{editingBatch ? 'Stock Quantity (Units)' : 'Initial Quantity (Units)'}</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  className="form-input" 
                  placeholder="0"
                  value={initialQuantity === 0 ? '' : initialQuantity}
                  onChange={e => setInitialQuantity(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Specifications</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Cargo load details, chemical properties, ash levels..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBatch ? 'Update Specifications' : 'Log Import Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
