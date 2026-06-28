import React, { useState } from 'react';
import type { CoalBatch, SaleTransaction, Employee, PayrollRecord } from '../types';
import { 
  TrendingUp, 
  Layers, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  batches: CoalBatch[];
  sales: SaleTransaction[];
  employees: Employee[];
  payroll: PayrollRecord[];
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  batches, 
  sales, 
  employees, 
  payroll, 
  setActiveTab 
}) => {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // --- Calculations ---
  
  // Non-cancelled sales
  const activeSales = sales.filter(s => s.status !== 'Cancelled');
  
  // KPI Metrics
  const totalGrossSales = activeSales.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalSupplierCost = activeSales.reduce((sum, s) => sum + s.supplierCost, 0);
  const totalPayrollCost = payroll.reduce((sum, p) => sum + p.netPay, 0);
  const totalNetProfit = totalGrossSales - totalSupplierCost - totalPayrollCost;
  
  const totalUnitsInStock = batches.reduce((sum, b) => sum + b.currentQuantity, 0);
  
  const inventoryValueCost = batches.reduce((sum, b) => sum + (b.currentQuantity * b.supplierPrice), 0);
  const inventoryValueRetail = batches.reduce((sum, b) => sum + (b.currentQuantity * b.salePrice), 0);
  const potentialProfit = inventoryValueRetail - inventoryValueCost;

  // Active employees count
  const activeEmployeesCount = employees.filter(e => e.status === 'Active').length;

  // Low stock batches (current quantity <= 15 units)
  const lowStockThreshold = 15;
  const lowStockBatches = batches.filter(b => b.currentQuantity <= lowStockThreshold);

  // --- SVG Chart 1: Sales vs Profit Trend (Last 7 Days) ---
  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  };

  const dates = getLast7Days();
  const trendData = dates.map(date => {
    const daySales = activeSales.filter(s => s.dateSold.startsWith(date));
    const gross = daySales.reduce((sum, s) => sum + s.grossAmount, 0);
    const net = daySales.reduce((sum, s) => sum + s.netAmount, 0);
    
    return {
      date,
      displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      gross,
      net
    };
  });

  // SVG dimensions
  const chartW = 550;
  const chartH = 220;
  const paddingX = 45;
  const paddingY = 25;

  // Calculate scales
  const maxVal = Math.max(...trendData.map(d => Math.max(d.gross, d.net, 500))); // Min max of 500 for scaling empty charts
  const yScale = (val: number) => chartH - paddingY - (val / maxVal) * (chartH - 2 * paddingY);
  const xScale = (index: number) => paddingX + (index / 6) * (chartW - 2 * paddingX);

  // Build SVG Path points
  const grossPoints = trendData.map((d, i) => `${xScale(i)},${yScale(d.gross)}`).join(' ');
  const netPoints = trendData.map((d, i) => `${xScale(i)},${yScale(d.net)}`).join(' ');

  // Filled Area paths
  const grossAreaPoints = `${xScale(0)},${chartH - paddingY} ${grossPoints} ${xScale(6)},${chartH - paddingY}`;
  const netAreaPoints = `${xScale(0)},${chartH - paddingY} ${netPoints} ${xScale(6)},${chartH - paddingY}`;

  // --- SVG Chart 2: Dynamic Inventory Breakdown by Classification ---
  const classificationStockMap: Record<string, { stock: number, capacity: number }> = {};
  batches.forEach(b => {
    const cls = b.classification || 'Unclassified';
    if (!classificationStockMap[cls]) {
      classificationStockMap[cls] = { stock: 0, capacity: 0 };
    }
    classificationStockMap[cls].stock += b.currentQuantity;
    classificationStockMap[cls].capacity += b.initialQuantity;
  });
  
  const classificationStock = Object.keys(classificationStockMap).map(cls => {
    const data = classificationStockMap[cls];
    return {
      classification: cls,
      stock: data.stock,
      capacity: data.capacity,
      percentage: data.capacity > 0 ? (data.stock / data.capacity) * 100 : 0
    };
  });

  // Formatter helper (Pesos currency format)
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const chartColors = ['#c084fc', '#60a5fa', '#f472b6', '#fb923c', '#34d399', '#f87171', '#fbbf24'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* KPI Section */}
      <div className="kpi-grid">
        
        {/* KPI 1: Gross Sales */}
        <div className="glass-panel kpi-card" style={{ '--card-border-top': 'var(--color-primary)' } as React.CSSProperties}>
          <div className="kpi-header">
            <span>Gross Sales</span>
            <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'var(--color-primary-glow)', '--icon-color': 'var(--color-primary)' } as React.CSSProperties}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div>
            <h2 className="kpi-value">{formatCurrency(totalGrossSales)}</h2>
            <div className="kpi-footer">
              <span className="kpi-trend-up" style={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={14} style={{ marginRight: '2px' }} /> Active
              </span>
              <span style={{ color: 'var(--text-muted)' }}>From {activeSales.length} invoices</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Net Profit */}
        <div className="glass-panel kpi-card" style={{ '--card-border-top': 'var(--color-success)' } as React.CSSProperties}>
          <div className="kpi-header">
            <span>Net Profit</span>
            <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'var(--color-success-glow)', '--icon-color': 'var(--color-success)' } as React.CSSProperties}>
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <h2 className="kpi-value" style={{ color: totalNetProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {formatCurrency(totalNetProfit)}
            </h2>
            <div className="kpi-footer">
              <span style={{ color: totalNetProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                {totalGrossSales > 0 ? ((totalNetProfit / totalGrossSales) * 100).toFixed(1) : 0}% margin
              </span>
              <span style={{ color: 'var(--text-muted)' }}>After costs & wages</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Stock Volume */}
        <div className="glass-panel kpi-card" style={{ '--card-border-top': 'var(--color-warning)' } as React.CSSProperties}>
          <div className="kpi-header">
            <span>Stock Remaining</span>
            <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(249, 115, 22, 0.1)', '--icon-color': 'var(--color-warning)' } as React.CSSProperties}>
              <Layers size={18} />
            </div>
          </div>
          <div>
            <h2 className="kpi-value">{totalUnitsInStock.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Units</span></h2>
            <div className="kpi-footer">
              <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                {formatCurrency(inventoryValueCost)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>Supplier valuation</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Payroll & Labor */}
        <div className="glass-panel kpi-card" style={{ '--card-border-top': 'var(--color-info)' } as React.CSSProperties}>
          <div className="kpi-header">
            <span>Payroll Disbursed</span>
            <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'var(--color-info-glow)', '--icon-color': 'var(--color-info)' } as React.CSSProperties}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <h2 className="kpi-value">{formatCurrency(totalPayrollCost)}</h2>
            <div className="kpi-footer">
              <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{activeEmployeesCount} Employees</span>
              <span style={{ color: 'var(--text-muted)' }}>Active on ledger</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts section */}
      <div className="dashboard-middle-section">
        
        {/* Chart 1: Sales Trends (SVG) */}
        <div className="glass-panel chart-card">
          <div className="chart-header">
            <h3 className="chart-title">7-Day Sales & Profit Margin</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: 'var(--color-primary)' }} />
                <span>Gross Revenue</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>Net Sales (Margin)</span>
              </div>
            </div>
          </div>

          <div className="svg-chart-container" style={{ position: 'relative' }}>
            <svg 
              viewBox={`0 0 ${chartW} ${chartH}`} 
              width="100%" 
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00"/>
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0.00"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (chartH - 2 * paddingY);
                const labelVal = maxVal * (1 - ratio);
                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartW - paddingX} 
                      y2={y} 
                      stroke="rgba(255, 255, 255, 0.04)" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 4} 
                      fill="var(--text-muted)" 
                      fontSize="9" 
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {formatCurrency(labelVal)}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal Dates Axis */}
              {trendData.map((d, i) => {
                const x = xScale(i);
                return (
                  <g key={i}>
                    <text 
                      x={x} 
                      y={chartH - paddingY + 16} 
                      fill="var(--text-muted)" 
                      fontSize="9" 
                      textAnchor="middle"
                      fontFamily="var(--font-sans)"
                    >
                      {d.displayDate}
                    </text>
                    <line 
                      x1={x} 
                      y1={chartH - paddingY} 
                      x2={x} 
                      y2={chartH - paddingY + 4} 
                      stroke="rgba(255, 255, 255, 0.1)" 
                    />
                  </g>
                );
              })}

              {/* Filled Areas */}
              <polygon points={grossAreaPoints} fill="url(#grossGrad)" />
              <polygon points={netAreaPoints} fill="url(#netGrad)" />

              {/* Line Paths */}
              <polyline 
                fill="none" 
                stroke="var(--color-primary)" 
                strokeWidth="2.5" 
                points={grossPoints} 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline 
                fill="none" 
                stroke="var(--color-success)" 
                strokeWidth="2.5" 
                points={netPoints} 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Hover Targets */}
              {trendData.map((d, i) => {
                const x = xScale(i);
                const grossY = yScale(d.gross);
                const netY = yScale(d.net);
                
                return (
                  <g 
                    key={i} 
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  >
                    {/* Hover Vertical Line */}
                    {hoveredTrendIndex === i && (
                      <line 
                        x1={x} 
                        y1={paddingY} 
                        x2={x} 
                        y2={chartH - paddingY} 
                        stroke="rgba(245, 158, 11, 0.25)" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 3" 
                      />
                    )}

                    {/* Data Points */}
                    <circle 
                      cx={x} 
                      cy={grossY} 
                      r={hoveredTrendIndex === i ? 6 : 4} 
                      fill="var(--bg-secondary)" 
                      stroke="var(--color-primary)" 
                      strokeWidth="2" 
                    />
                    <circle 
                      cx={x} 
                      cy={netY} 
                      r={hoveredTrendIndex === i ? 6 : 4} 
                      fill="var(--bg-secondary)" 
                      stroke="var(--color-success)" 
                      strokeWidth="2" 
                    />

                    {/* Invisible hover intercept bar */}
                    <rect 
                      x={x - 20} 
                      y={paddingY} 
                      width={40} 
                      height={chartH - 2 * paddingY} 
                      fill="transparent" 
                      style={{ cursor: 'pointer' }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip Card overlay on hover */}
            {hoveredTrendIndex !== null && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: xScale(hoveredTrendIndex) > chartW / 2 ? `${xScale(hoveredTrendIndex) - 170}px` : `${xScale(hoveredTrendIndex) + 20}px`,
                backgroundColor: 'rgba(7, 8, 11, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
                fontSize: '0.75rem',
                minWidth: '150px',
                pointerEvents: 'none'
              }}>
                <div style={{ fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                  {trendData[hoveredTrendIndex].displayDate}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.2rem 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gross Sales:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatCurrency(trendData[hoveredTrendIndex].gross)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.2rem 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Margin:</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{formatCurrency(trendData[hoveredTrendIndex].net)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Dynamic Classification Breakdown */}
        <div className="glass-panel chart-card" style={{ minHeight: '350px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Stock Volume by Classification</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', justifyContent: 'center', height: '100%' }}>
            {classificationStock.map((cs, i) => {
              const pillColor = chartColors[i % chartColors.length];

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500 }}>
                    <span style={{ color: pillColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pillColor }} />
                      {cs.classification}
                    </span>
                    <span>
                      <strong style={{ color: '#fff' }}>{cs.stock.toLocaleString()} U</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> / {cs.capacity.toLocaleString()} U</span>
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${cs.percentage}%`, 
                      height: '100%', 
                      backgroundColor: pillColor, 
                      borderRadius: '50px',
                      boxShadow: cs.percentage > 0 ? `0 0 8px ${pillColor}` : 'none',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              );
            })}
            
            {classificationStock.length === 0 && (
              <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No stock classifications found.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Low Stock Alerts & Recent Activity Grid */}
      <div className="dashboard-bottom-section">
        
        {/* Bottom Left: Recent Sales */}
        <div className="glass-panel table-card">
          <div className="table-header-row">
            <h3 className="table-title">Recent Transactions</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('POS')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Open POS <ArrowUpRight size={14} />
            </button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Classification</th>
                  <th>Qty (Units)</th>
                  <th>Gross Amount</th>
                  <th>Net Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      #{sale.id.slice(5, 11).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 500, color: '#fff' }}>{sale.customerName}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}>
                        {sale.batchClassification}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sale.quantity} U</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{formatCurrency(sale.grossAmount)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                      {formatCurrency(sale.netAmount)}
                    </td>
                    <td>
                      <span className={`badge badge-${sale.status.toLowerCase()}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeSales.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No recent sales found. Create transactions in the POS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: Low Stock Warnings */}
        <div className="glass-panel table-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--color-danger)" />
            Stock Alerts
          </h3>

          <div className="stock-warning-list">
            {lowStockBatches.map(batch => (
              <div key={batch.id} className="warning-item">
                <AlertTriangle size={16} className="warning-icon" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>Low Stock: {batch.classification}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                    Batch #{batch.id.slice(6)} from {batch.supplierName.split(' ')[0]} has only <strong style={{ color: 'var(--color-danger)' }}>{batch.currentQuantity} Units</strong> remaining.
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('Inventory')}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Restock
                </button>
              </div>
            ))}

            {lowStockBatches.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--color-success)', 
                padding: '2.5rem 1rem', 
                border: '1px dashed rgba(16, 185, 129, 0.2)', 
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--color-success-glow)',
                fontSize: '0.85rem'
              }}>
                ✓ All inventory items are well-stocked.
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div style={{ 
            marginTop: 'auto', 
            padding: '1rem', 
            borderRadius: 'var(--border-radius-sm)', 
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Valuation Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Selling Valuation:</span>
              <span style={{ color: '#fff', fontWeight: 500 }}>{formatCurrency(inventoryValueRetail)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Supplier Cost Basis (Buy):</span>
              <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>{formatCurrency(inventoryValueCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Unrealized Profit Margin:</span>
              <span style={{ color: 'var(--color-success)' }}>{formatCurrency(potentialProfit)}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
