import React, { useState } from 'react';
import type { CoalBatch, SaleTransaction } from '../types';
import { addSale, updateSaleStatus, deleteSale } from '../services/db';
import { ShoppingBag, Search, Plus, Printer, Trash2, Eye, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface POSProps {
  batches: CoalBatch[];
  sales: SaleTransaction[];
  onRefreshData: () => void;
}

export const POS: React.FC<POSProps> = ({ batches, sales, onRefreshData }) => {
  // POS Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Credit' | 'Cheque'>('Cash');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<SaleTransaction | null>(null);
  const [showInvoicePrintAdmin, setShowInvoicePrintAdmin] = useState(false); // Toggle to show/hide costs for admin
  const [receiptSale, setReceiptSale] = useState<SaleTransaction | null>(null);

  // Available batches that actually have stock
  const stockBatches = batches.filter(b => b.currentQuantity > 0);
  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Dynamic filter dropdown list from actual sales
  const uniqueClassifications = Array.from(new Set(sales.map(s => s.batchClassification).filter(Boolean)));

  // Form calculations
  const grossSubtotal = selectedBatch && quantity > 0 ? quantity * selectedBatch.salePrice : 0;
  const costSubtotal = selectedBatch && quantity > 0 ? quantity * selectedBatch.supplierPrice : 0;
  const netProfitSubtotal = grossSubtotal - costSubtotal;
  const profitMarginPercent = grossSubtotal > 0 ? (netProfitSubtotal / grossSubtotal) * 100 : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!customerName.trim()) {
      setFormError('Please enter customer name');
      return;
    }
    if (!selectedBatchId) {
      setFormError('Please select an inventory batch');
      return;
    }
    if (quantity <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }
    if (selectedBatch && quantity > selectedBatch.currentQuantity) {
      setFormError(`Insufficient stock! Selected batch only has ${selectedBatch.currentQuantity} Units left.`);
      return;
    }

    try {
      if (!selectedBatch) return;

      const saleData = {
        batchId: selectedBatch.id,
        batchClassification: selectedBatch.classification,
        quantity,
        supplierPrice: selectedBatch.supplierPrice,
        salePrice: selectedBatch.salePrice,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || "",
        dateSold: new Date().toISOString(),
        paymentMethod,
        status
      };

      const result = await addSale(saleData);
      setSuccessMsg(`Sale successfully logged! Invoice: #${result.id.slice(5).toUpperCase()}`);
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setQuantity(0);
      setSelectedBatchId('');
      onRefreshData();

      // Clear success message after 4s
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError('Failed to process sale. Check database.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateSaleStatus(id, newStatus);
      onRefreshData();
    } catch (err) {
      alert('Error updating transaction status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction record? This will also return the sold quantity to inventory.')) {
      try {
        await deleteSale(id);
        onRefreshData();
      } catch (err) {
        alert('Error deleting transaction');
      }
    }
  };

  // Filter Sales list
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClassification = filterClassification === 'All' || s.batchClassification === filterClassification;
    const matchesPayment = filterPayment === 'All' || s.paymentMethod === filterPayment;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    
    return matchesSearch && matchesClassification && matchesPayment && matchesStatus;
  });

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
  };

  return (
    <div className="pos-layout">
      
      {/* Left Column: POS Form */}
      <div className="glass-panel pos-cart-summary">
        <h3 className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
          <ShoppingBag size={20} color="var(--color-primary)" />
          New Sale Terminal
        </h3>

        {formError && (
          <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> {formError}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--border-radius-sm)', color: '#a7f3d0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Acme Industrial Group"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="+63 912 345 6789"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit (Invoice Terms)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Inventory Batch</label>
            <select 
              className="form-select"
              value={selectedBatchId}
              onChange={e => {
                setSelectedBatchId(e.target.value);
                setQuantity(0);
              }}
            >
              <option value="">-- Choose available stock batch --</option>
              {stockBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.classification} - {b.supplierName.split(' ')[0]} [Remaining: {b.currentQuantity} Units @ {formatCurrency(b.salePrice)}/Unit]
                </option>
              ))}
              {stockBatches.length === 0 && (
                <option disabled>No batches available! Add stock first.</option>
              )}
            </select>
          </div>

          {selectedBatch && (
            <div style={{ display: 'flex', gap: '1rem', padding: '0.85rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--text-muted)' }}>Supplier Buy Price: </span>
                <strong style={{ color: '#fff' }}>{formatCurrency(selectedBatch.supplierPrice)}/U</strong>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--text-muted)' }}>Selling Price: </span>
                <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(selectedBatch.salePrice)}/U</strong>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--text-muted)' }}>Profit Spread: </span>
                <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedBatch.salePrice - selectedBatch.supplierPrice)}/U</strong>
              </div>
            </div>
          )}

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">Quantity (Units)</label>
              <input 
                type="number" 
                step="any"
                min="0.1"
                className="form-input" 
                placeholder="0.00"
                value={quantity || ''}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select 
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending (Unpaid)</option>
              </select>
            </div>
          </div>

          {/* Pricing Preview Panel */}
          {selectedBatch && quantity > 0 && (
            <div style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(7, 8, 11, 0.4)' }}>
              <div className="pos-total-row">
                <span>Gross Sale Value:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(grossSubtotal)}</span>
              </div>
              <div className="pos-total-row" style={{ marginTop: '0.25rem' }}>
                <span>Supplier Cost of Goods:</span>
                <span style={{ color: 'var(--color-warning)' }}>-{formatCurrency(costSubtotal)}</span>
              </div>
              
              <div className="pos-total-row" style={{ marginTop: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span>Projected Net Profit:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{formatCurrency(netProfitSubtotal)}</span>
              </div>
              
              <div className="pos-total-row grand-total">
                <span>Invoice Total:</span>
                <span>{formatCurrency(grossSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                <span>Projected Profit Margin:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{profitMarginPercent.toFixed(1)}%</span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
            disabled={!selectedBatchId || quantity <= 0}
          >
            <Plus size={18} /> Record Transaction
          </button>
        </form>
      </div>

      {/* Right Column: History & Filtering */}
      <div className="glass-panel table-card">
        <div className="table-header-row">
          <h3 className="table-title">Sales Ledger</h3>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search customer, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="form-select btn-sm"
            value={filterClassification}
            onChange={e => setFilterClassification(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="All">All Classifications</option>
            {uniqueClassifications.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select 
            className="form-select btn-sm"
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit">Credit</option>
          </select>

          <select 
            className="form-select btn-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: '110px' }}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Sales Table */}
        <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          <table>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Details</th>
                <th>Gross</th>
                <th>Net Sales</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                    #{sale.id.slice(5, 11).toUpperCase()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{sale.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(sale.dateSold).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#fff', marginRight: '0.4rem' }}>
                        {sale.batchClassification}
                      </span>
                      <strong style={{ color: '#fff' }}>{sale.quantity} U</strong> @ {formatCurrency(sale.salePrice)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {formatCurrency(sale.grossAmount)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                    {formatCurrency(sale.netAmount)}
                  </td>
                  <td>
                    <select 
                      className={`form-select btn-sm badge badge-${sale.status.toLowerCase()}`}
                      value={sale.status}
                      onChange={e => handleStatusChange(sale.id, e.target.value)}
                      style={{ border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', fontWeight: 600 }}
                    >
                      <option value="Paid" style={{ color: 'var(--color-success)', backgroundColor: 'var(--bg-secondary)' }}>Paid</option>
                      <option value="Pending" style={{ color: 'var(--color-primary)', backgroundColor: 'var(--bg-secondary)' }}>Pending</option>
                      <option value="Cancelled" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--bg-secondary)' }}>Cancelled</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-icon-only" 
                        title="View Invoice" 
                        onClick={() => {
                          setSelectedInvoice(sale);
                          setShowInvoicePrintAdmin(false);
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn btn-icon-only" 
                        title="Print Receipt" 
                        onClick={() => setReceiptSale(sale)}
                        style={{ color: 'rgba(16, 185, 129, 0.7)' }}
                      >
                        <Printer size={15} />
                      </button>
                      <button 
                        className="btn btn-icon-only" 
                        title="Delete record" 
                        onClick={() => handleDelete(sale.id)}
                        style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No sales matches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Print Modal */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Receipt Details</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className={`btn btn-sm ${showInvoicePrintAdmin ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowInvoicePrintAdmin(!showInvoicePrintAdmin)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Info size={13} /> {showInvoicePrintAdmin ? 'Admin View' : 'Customer View'}
                </button>
                <button className="modal-close" onClick={() => setSelectedInvoice(null)}>
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="printable-area invoice-preview-card">
              <div className="invoice-header">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px', color: '#111827' }}>
                    ULING NI FE POS
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    100 Industrial Bulk Ave, Suite 400<br />
                    Manila, Philippines | +63 (2) 812-3456
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
                    INVOICE
                  </h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    #{selectedInvoice.id.slice(5).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="invoice-meta">
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Billed To:</span>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginTop: '0.25rem' }}>{selectedInvoice.customerName}</div>
                  {selectedInvoice.customerPhone && (
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.15rem' }}>{selectedInvoice.customerPhone}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Invoice Details:</span>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem' }}>
                    <strong>Date:</strong> {new Date(selectedInvoice.dateSold).toLocaleDateString()}<br />
                    <strong>Time:</strong> {new Date(selectedInvoice.dateSold).toLocaleTimeString()}<br />
                    <strong>Payment:</strong> {selectedInvoice.paymentMethod}
                  </div>
                </div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item & Specifications</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    {showInvoicePrintAdmin && <th style={{ textAlign: 'right' }}>Cost Basis</th>}
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111827' }}>Wholesale Coal Stock</div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.15rem' }}>
                        Classification: {selectedInvoice.batchClassification}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedInvoice.salePrice)}</td>
                    {showInvoicePrintAdmin && (
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-warning)' }}>
                        {formatCurrency(selectedInvoice.supplierPrice)}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{selectedInvoice.quantity} Units</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(selectedInvoice.grossAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '50%', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                  Terms & Conditions:<br />
                  All industrial wholesale sales are subject to standard delivery safety protocols. Payments terms are immediate unless credit agreements are specified on setup.
                </div>
                
                <div className="invoice-summary">
                  <div className="invoice-total-row">
                    <span style={{ color: '#4b5563' }}>Subtotal:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedInvoice.grossAmount)}</span>
                  </div>
                  <div className="invoice-total-row">
                    <span style={{ color: '#4b5563' }}>Tax / VAT (0%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>₱0.00</span>
                  </div>
                  
                  {showInvoicePrintAdmin && (
                    <>
                      <div className="invoice-total-row" style={{ color: 'var(--color-warning)' }}>
                        <span>Supplier Cost Basis:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatCurrency(selectedInvoice.supplierCost)}</span>
                      </div>
                      <div className="invoice-total-row" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                        <span>Net Profit Yield:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>+{formatCurrency(selectedInvoice.netAmount)}</span>
                      </div>
                    </>
                  )}

                  <div className="invoice-total-row bold">
                    <span>Grand Total:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedInvoice.grossAmount)}</span>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: selectedInvoice.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: selectedInvoice.status === 'Paid' ? '#065f46' : '#92400e', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Payment Status: {selectedInvoice.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
              
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Thermal Receipt Modal */}
      {receiptSale && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Sales Receipt</h2>
              <button className="modal-close" onClick={() => setReceiptSale(null)}>✕</button>
            </div>

            <div className="receipt-print">
              <div className="receipt-content">
                {/* Header */}
                <div className="receipt-header">
                  <div className="receipt-company">ULING NI FE</div>
                  <div className="receipt-tagline">Coal & Industrial Supply</div>
                  <div className="receipt-address">100 Industrial Bulk Ave, Suite 400</div>
                  <div className="receipt-address">Manila, Philippines | +63 (2) 812-3456</div>
                </div>

                <div className="receipt-separator" />

                {/* Metadata */}
                <div className="receipt-meta">
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-label">Receipt ID</span>
                    <span className="receipt-meta-sep">:</span>
                    <span className="receipt-meta-value">#{receiptSale.id.slice(5).toUpperCase()}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-label">Date</span>
                    <span className="receipt-meta-sep">:</span>
                    <span className="receipt-meta-value">{new Date(receiptSale.dateSold).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-label">Customer</span>
                    <span className="receipt-meta-sep">:</span>
                    <span className="receipt-meta-value">{receiptSale.customerName}</span>
                  </div>
                </div>

                <div className="receipt-separator" />

                {/* Items Table */}
                <table className="receipt-items">
                  <thead>
                    <tr>
                      <th className="receipt-th-left">Item</th>
                      <th className="receipt-th-right">Qty</th>
                      <th className="receipt-th-right">Price</th>
                      <th className="receipt-th-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="receipt-td-left">{receiptSale.batchClassification}</td>
                      <td className="receipt-td-right">{receiptSale.quantity}</td>
                      <td className="receipt-td-right">{formatCurrency(receiptSale.salePrice)}</td>
                      <td className="receipt-td-right">{formatCurrency(receiptSale.grossAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="receipt-separator" />

                {/* Totals */}
                <div className="receipt-totals">
                  <div className="receipt-total-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(receiptSale.grossAmount)}</span>
                  </div>
                  {receiptSale.supplierCost > 0 && (
                    <div className="receipt-total-row" style={{ color: 'var(--color-warning)', fontSize: '0.7rem' }}>
                      <span>Cost of Goods</span>
                      <span>-{formatCurrency(receiptSale.supplierCost)}</span>
                    </div>
                  )}
                  <div className="receipt-total-row receipt-grand-total">
                    <span>TOTAL</span>
                    <span>{formatCurrency(receiptSale.grossAmount)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="receipt-payment">
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-label">Paid via</span>
                    <span className="receipt-meta-sep">:</span>
                    <span className="receipt-meta-value">{receiptSale.paymentMethod}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-label">Amount</span>
                    <span className="receipt-meta-sep">:</span>
                    <span className="receipt-meta-value">{formatCurrency(receiptSale.grossAmount)}</span>
                  </div>
                </div>

                <div className="receipt-separator" />

                {/* Footer */}
                <div className="receipt-footer">
                  <div>Thank you for your business!</div>
                  <div>Please visit again.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setReceiptSale(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
