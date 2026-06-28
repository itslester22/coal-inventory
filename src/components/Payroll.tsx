import React, { useState } from 'react';
import type { Employee, PayrollRecord } from '../types';
import { 
  addEmployee, updateEmployee, deleteEmployee,
  addPayroll, updatePayrollStatus, deletePayroll,
  calculateMonthsBetween
} from '../services/db';
import { Users, CreditCard, Plus, Edit, Trash2, Search, Printer, Eye, AlertTriangle } from 'lucide-react';

interface PayrollProps {
  employees: Employee[];
  payroll: PayrollRecord[];
  onRefreshData: () => void;
}

export const Payroll: React.FC<PayrollProps> = ({ employees, payroll, onRefreshData }) => {
  const [subTab, setSubTab] = useState<'employees' | 'payroll'>('employees');
  
  // Search state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [payrollSearch, setPayrollSearch] = useState('');

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PayrollRecord | null>(null);

  // Form: Employee Profile
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empRateType, setEmpRateType] = useState<'Hourly' | 'Monthly' | 'Bi-Weekly' | 'Daily'>('Hourly');
  const [empRateValue, setEmpRateValue] = useState<number>(0);
  const [empStatus, setEmpStatus] = useState<'Active' | 'Inactive'>('Active');
  const [empJoinedDate, setEmpJoinedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form: Record Payroll Transaction
  const [payEmployeeId, setPayEmployeeId] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [payHoursWorked, setPayHoursWorked] = useState<number>(0);
  const [payDaysWorked, setPayDaysWorked] = useState<number>(0);
  const [payDeductions, setPayDeductions] = useState<number>(0);
  const [payDatePaid, setPayDatePaid] = useState(new Date().toISOString().split('T')[0]);
  const [payStatus, setPayStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [payNotes, setPayNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [customGrossPayStr, setCustomGrossPayStr] = useState<string>('');
  const [proRateMonthly, setProRateMonthly] = useState(false);
  const [autoCalcDays, setAutoCalcDays] = useState(false);
  const [workingDays, setWorkingDays] = useState<boolean[]>([false, true, true, true, true, true, true]); // Sun=0..Sat=6
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [excludeDateInput, setExcludeDateInput] = useState('');

  // --- Calculations ---
  const totalWagesPaid = payroll.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netPay, 0);
  const activeEmployeeCount = employees.filter(e => e.status === 'Active').length;

  // Selected employee helper for payroll logging
  const chosenEmployee = employees.find(e => e.id === payEmployeeId);

  const countWorkingDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (workingDays[current.getDay()] && !excludedDates.includes(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const autoCountedDays = autoCalcDays && chosenEmployee?.rateType === 'Daily'
    ? countWorkingDays(payPeriodStart, payPeriodEnd) : payDaysWorked;
  const calculatedGross = chosenEmployee 
    ? (chosenEmployee.rateType === 'Hourly' 
        ? payHoursWorked * chosenEmployee.rateValue 
        : chosenEmployee.rateType === 'Daily'
          ? autoCountedDays * chosenEmployee.rateValue
          : chosenEmployee.rateType === 'Bi-Weekly'
            ? chosenEmployee.rateValue / 2
            : proRateMonthly
              ? calculateMonthsBetween(payPeriodStart, payPeriodEnd) * chosenEmployee.rateValue
              : chosenEmployee.rateValue)
    : 0;
  const customGrossPayVal = customGrossPayStr === '' ? null : parseFloat(customGrossPayStr);
  const finalGrossPay = customGrossPayVal !== null && !isNaN(customGrossPayVal) ? customGrossPayVal : calculatedGross;
  const calculatedNet = Math.max(0, finalGrossPay - payDeductions);

  const openAddEmpModal = () => {
    setEmpName('');
    setEmpRole('');
    setEmpRateType('Hourly');
    setEmpRateValue(0);
    setEmpStatus('Active');
    setEmpJoinedDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsEmpModalOpen(true);
  };

  const openEditEmpModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpRole(emp.role);
    setEmpRateType(emp.rateType);
    setEmpRateValue(emp.rateValue);
    setEmpStatus(emp.status);
    setEmpJoinedDate(emp.joinedDate);
    setFormError('');
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!empName.trim()) {
      setFormError('Employee name is required');
      return;
    }
    if (!empRole.trim()) {
      setFormError('Job description/role is required');
      return;
    }
    if (empRateValue <= 0) {
      setFormError('Salary/Wage rate value must be greater than zero');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          name: empName.trim(),
          role: empRole.trim(),
          rateType: empRateType,
          rateValue: empRateValue,
          status: empStatus,
          joinedDate: empJoinedDate
        });
        setEditingEmployee(null);
      } else {
        await addEmployee({
          name: empName.trim(),
          role: empRole.trim(),
          rateType: empRateType,
          rateValue: empRateValue,
          status: empStatus,
          joinedDate: empJoinedDate
        });
        setIsEmpModalOpen(false);
      }
      onRefreshData();
    } catch (err) {
      setFormError('Database write failed.');
    }
  };

  const handleEmpDelete = async (id: string) => {
    if (window.confirm('Delete employee? Past payroll calculations will remain, but employee will be deleted.')) {
      try {
        await deleteEmployee(id);
        onRefreshData();
      } catch (err) {
        alert('Failed to delete employee profile');
      }
    }
  };

  const openPayrollModal = () => {
    setPayEmployeeId('');
    // Defaults to past fortnight
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 14);
    
    setPayPeriodStart(start.toISOString().split('T')[0]);
    setPayPeriodEnd(end.toISOString().split('T')[0]);
    setPayHoursWorked(80); // default bi-weekly hours
    setPayDaysWorked(0);
    setPayDeductions(0);
    setPayDatePaid(new Date().toISOString().split('T')[0]);
    setPayStatus('Paid');
    setPayNotes('');
    setCustomGrossPayStr('');
    setProRateMonthly(false);
    setAutoCalcDays(false);
    setWorkingDays([false, true, true, true, true, true, true]);
    setExcludedDates([]);
    setExcludeDateInput('');
    setFormError('');
    setIsPayrollModalOpen(true);
  };

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!payEmployeeId) {
      setFormError('Please select an employee');
      return;
    }
    if (!payPeriodStart || !payPeriodEnd) {
      setFormError('Please input payroll cycle period dates');
      return;
    }
    
    const emp = employees.find(e => e.id === payEmployeeId);
    if (!emp) return;

    if (emp.rateType === 'Hourly' && (!payHoursWorked || payHoursWorked <= 0)) {
      setFormError('Hourly employees require hours worked logs');
      return;
    }
    if (emp.rateType === 'Daily' && (!payDaysWorked || payDaysWorked <= 0)) {
      setFormError('Daily wage employees require days worked');
      return;
    }

    try {
      await addPayroll({
        employeeId: emp.id,
        employeeName: emp.name,
        periodStart: payPeriodStart,
        periodEnd: payPeriodEnd,
        hoursWorked: emp.rateType === 'Hourly' ? payHoursWorked : 0,
        daysWorked: emp.rateType === 'Daily' ? payDaysWorked : 0,
        deductions: payDeductions,
        datePaid: payDatePaid,
        status: payStatus,
        notes: payNotes.trim() || "",
        grossPay: finalGrossPay
      });
      setIsPayrollModalOpen(false);
      onRefreshData();
    } catch (err) {
      setFormError('Database payroll write failed.');
    }
  };

  const handlePayrollStatusChange = async (id: string, newStatus: any) => {
    try {
      await updatePayrollStatus(id, newStatus);
      onRefreshData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handlePayrollDelete = async (id: string) => {
    if (window.confirm('Delete payroll record? This deletes the expense log from calculations.')) {
      try {
        await deletePayroll(id);
        onRefreshData();
      } catch (err) {
        alert('Failed to delete payroll record');
      }
    }
  };

  // Filters
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
    e.role.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredPayroll = payroll.filter(p => 
    p.employeeName.toLowerCase().includes(payrollSearch.toLowerCase())
  );

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
  };

  return (
    <div className="payroll-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Mini Stats Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-info-glow)', color: 'var(--color-info)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff Roster Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {activeEmployeeCount} Active <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / {employees.length} Total</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--color-info)' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cumulative Labor Costs</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(totalWagesPaid)}
            </div>
          </div>
        </div>
      </div>

      {/* Subnav tab selectors */}
      <div className="tab-subnav">
        <button 
          className={`tab-subnav-btn ${subTab === 'employees' ? 'active' : ''}`}
          onClick={() => setSubTab('employees')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={16} /> Employee Roster
        </button>
        <button 
          className={`tab-subnav-btn ${subTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setSubTab('payroll')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <CreditCard size={16} /> Payroll & Wage Ledger
        </button>
      </div>

      {/* Employee Roster Grid */}
      {subTab === 'employees' && (
        <div className="glass-panel table-card">
          <div className="table-header-row">
            <h3 className="table-title">Employee Roster</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddEmpModal}>
              <Plus size={16} /> Register Employee
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search staff, role..."
                value={employeeSearch}
                onChange={e => setEmployeeSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Staff Name</th>
                  <th>Role Designation</th>
                  <th>Contract rate basis</th>
                  <th>Status</th>
                  <th>Hire Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      #{emp.id.toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>
                      <strong style={{ color: '#fff' }}>{formatCurrency(emp.rateValue)}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / {emp.rateType === 'Hourly' ? 'Hour' : emp.rateType === 'Daily' ? 'Day' : emp.rateType === 'Bi-Weekly' ? '2 Weeks' : 'Month'}</span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-paid' : 'badge-cancelled'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>{new Date(emp.joinedDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon-only" title="Edit Profile" onClick={() => openEditEmpModal(emp)}>
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-icon-only" 
                          title="Delete staff record" 
                          onClick={() => handleEmpDelete(emp.id)}
                          style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                      No employees registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payroll Log Grid */}
      {subTab === 'payroll' && (
        <div className="glass-panel table-card">
          <div className="table-header-row">
            <h3 className="table-title">Payroll Transaction Logs</h3>
            <button className="btn btn-primary btn-sm" onClick={openPayrollModal}>
              <Plus size={16} /> Disburse Payroll
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Filter by employee name..."
                value={payrollSearch}
                onChange={e => setPayrollSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employee</th>
                  <th>Work Log</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Disbursed</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.map(pay => (
                  <tr key={pay.id}>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(pay.periodStart).toLocaleDateString()} - {new Date(pay.periodEnd).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{pay.employeeName}</div>
                    </td>
                    <td>
                      {pay.hoursWorked > 0 ? (
                        <span><strong style={{ color: '#fff' }}>{pay.hoursWorked} hrs</strong> logged</span>
                      ) : pay.daysWorked > 0 ? (
                        <span><strong style={{ color: '#fff' }}>{pay.daysWorked} days</strong> worked</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Salary flat-rate</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(pay.grossPay)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger)' }}>
                      -{formatCurrency(pay.deductions)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-success)' }}>
                      {formatCurrency(pay.netPay)}
                    </td>
                    <td>{new Date(pay.datePaid).toLocaleDateString()}</td>
                    <td>
                      <select 
                        className={`form-select btn-sm badge badge-${pay.status.toLowerCase()}`}
                        value={pay.status}
                        onChange={e => handlePayrollStatusChange(pay.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', fontWeight: 600 }}
                      >
                        <option value="Paid" style={{ color: 'var(--color-success)', backgroundColor: 'var(--bg-secondary)' }}>Paid</option>
                        <option value="Pending" style={{ color: 'var(--color-primary)', backgroundColor: 'var(--bg-secondary)' }}>Pending</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon-only" title="View Payslip" onClick={() => setSelectedPaySlip(pay)}>
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-icon-only" 
                          title="Delete payroll record" 
                          onClick={() => handlePayrollDelete(pay.id)}
                          style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPayroll.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                      No payroll records processed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee register modal */}
      {(isEmpModalOpen || editingEmployee) && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEmployee ? 'Edit Employee Profile' : 'Register New Staff Member'}
              </h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setIsEmpModalOpen(false);
                  setEditingEmployee(null);
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleEmpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Employee Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Miller"
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Role & Department</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Heavy Loader Operator"
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Compensation Basis</label>
                  <select 
                    className="form-select"
                    value={empRateType}
                    onChange={e => setEmpRateType(e.target.value as any)}
                  >
                    <option value="Hourly">Hourly rate contract</option>
                    <option value="Daily">Daily wage rate</option>
                    <option value="Monthly">Monthly fixed salary contract</option>
                    <option value="Bi-Weekly">Bi-Weekly (every 15th, half monthly)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Rate Value (₱ PHP)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    className="form-input" 
                    placeholder="0.00"
                    value={empRateValue === 0 ? '' : empRateValue}
                    onChange={e => {
                      const val = e.target.value;
                      setEmpRateValue(val === '' ? 0 : parseFloat(val));
                    }}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Staff Status</label>
                  <select 
                    className="form-select"
                    value={empStatus}
                    onChange={e => setEmpStatus(e.target.value as any)}
                  >
                    <option value="Active">Active Employee</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={empJoinedDate}
                    onChange={e => setEmpJoinedDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsEmpModalOpen(false);
                    setEditingEmployee(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Apply Changes' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Log Payroll Payout</h2>
              <button className="modal-close" onClick={() => setIsPayrollModalOpen(false)}>
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handlePayrollSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div className="form-group">
                <label className="form-label">Select Employee Profile</label>
                <select 
                  className="form-select"
                  value={payEmployeeId}
                  onChange={e => { setPayEmployeeId(e.target.value); setCustomGrossPayStr(''); setProRateMonthly(false); setAutoCalcDays(false); setWorkingDays([false, true, true, true, true, true, true]); setExcludedDates([]); }}
                >
                  <option value="">-- Choose active employee --</option>
                  {employees.filter(emp => emp.status === 'Active').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) [{formatCurrency(emp.rateValue)}/{emp.rateType === 'Hourly' ? 'hr' : emp.rateType === 'Daily' ? 'day' : emp.rateType === 'Bi-Weekly' ? '2wks' : 'mo'}]
                    </option>
                  ))}
                </select>
              </div>

              {chosenEmployee && (
                <div style={{ display: 'flex', gap: '1rem', padding: '0.85rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Contract Basis: </span>
                    <strong style={{ color: '#fff' }}>{chosenEmployee.rateType} contract</strong>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Standard rate: </span>
                    <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(chosenEmployee.rateValue)}</strong>
                  </div>
                </div>
              )}

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Cycle Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={payPeriodStart}
                    onChange={e => { setPayPeriodStart(e.target.value); setCustomGrossPayStr(''); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cycle End Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={payPeriodEnd}
                    onChange={e => { setPayPeriodEnd(e.target.value); setCustomGrossPayStr(''); }}
                  />
                </div>
              </div>

              {chosenEmployee?.rateType === 'Monthly' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={proRateMonthly}
                      onChange={e => { setProRateMonthly(e.target.checked); setCustomGrossPayStr(''); }}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Pro-rate by days in period
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {proRateMonthly
                      ? `Calculating: ${formatCurrency(calculateMonthsBetween(payPeriodStart, payPeriodEnd) * chosenEmployee.rateValue)}`
                      : `Flat monthly rate: ${formatCurrency(chosenEmployee.rateValue)}`}
                  </span>
                </div>
              )}

              {chosenEmployee?.rateType === 'Daily' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={autoCalcDays}
                      onChange={e => { setAutoCalcDays(e.target.checked); setCustomGrossPayStr(''); }}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Auto-count working days
                  </label>
                </div>
              )}

              {autoCalcDays && chosenEmployee?.rateType === 'Daily' && (
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                    Working Days of the Week
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <label key={day} style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        cursor: 'pointer', fontSize: '0.8rem', color: '#fff',
                        padding: '0.3rem 0.5rem',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: workingDays[i] ? 'rgba(255,96,151,0.15)' : 'rgba(255,255,255,0.03)',
                        border: workingDays[i] ? '1px solid rgba(255,96,151,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.15s'
                      }}>
                        <input
                          type="checkbox"
                          checked={workingDays[i]}
                          onChange={() => {
                            const next = [...workingDays];
                            next[i] = !next[i];
                            setWorkingDays(next);
                          }}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>

                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                    Excluded Dates (Holidays / Days Off)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={excludeDateInput}
                      onChange={e => setExcludeDateInput(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={!excludeDateInput}
                      onClick={() => {
                        if (excludeDateInput && !excludedDates.includes(excludeDateInput)) {
                          setExcludedDates([...excludedDates, excludeDateInput]);
                          setExcludeDateInput('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {excludedDates.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {excludedDates.map(d => (
                        <span key={d} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.75rem', padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--border-radius-sm)',
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#fca5a5'
                        }}>
                          {new Date(d).toLocaleDateString()}
                          <button
                            type="button"
                            onClick={() => setExcludedDates(excludedDates.filter(x => x !== d))}
                            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0, fontSize: '0.8rem', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group-row">
                {chosenEmployee?.rateType === 'Hourly' && (
                  <div className="form-group">
                    <label className="form-label">Hours Logged</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="form-input" 
                      placeholder="80"
                      value={payHoursWorked === 0 ? '' : payHoursWorked}
                      onChange={e => { setPayHoursWorked(e.target.value === '' ? 0 : parseInt(e.target.value) || 0); setCustomGrossPayStr(''); }}
                    />
                  </div>
                )}
                {chosenEmployee?.rateType === 'Daily' && (
                  <div className="form-group">
                    <label className="form-label">Days Worked</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="form-input" 
                      placeholder="e.g. 22"
                      value={autoCalcDays ? autoCountedDays : (payDaysWorked === 0 ? '' : payDaysWorked)}
                      onChange={e => { setPayDaysWorked(e.target.value === '' ? 0 : parseInt(e.target.value) || 0); setCustomGrossPayStr(''); }}
                      disabled={autoCalcDays}
                    />
                    {autoCalcDays && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.2rem', display: 'block' }}>
                        Auto-calculated from working days and exclusions
                      </span>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Deductions (Taxes, Advances)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    className="form-input" 
                    placeholder="0.00"
                    value={payDeductions === 0 ? '' : payDeductions}
                    onChange={e => setPayDeductions(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={payDatePaid}
                    onChange={e => setPayDatePaid(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Payout Status</label>
                  <select 
                    className="form-select"
                    value={payStatus}
                    onChange={e => setPayStatus(e.target.value as any)}
                  >
                    <option value="Paid">Disbursed (Paid)</option>
                    <option value="Pending">Pending Audit</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payroll Notes / Adjustments</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Regular cycle payout. Includes bonuses / deductions..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                />
              </div>

              {chosenEmployee && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Gross Labor Pay (₱) [Override]</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    placeholder={calculatedGross > 0 ? formatCurrency(calculatedGross) : '0.00'}
                    value={customGrossPayStr}
                    onChange={e => setCustomGrossPayStr(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Standard contract formula: <strong>{formatCurrency(calculatedGross)}</strong>. Type above to override.
                  </span>
                </div>
              )}

              {/* Live Payroll Calculation Preview */}
              {chosenEmployee && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(7, 8, 11, 0.4)' }}>
                  <div className="pos-total-row">
                    <span>Gross Labor Pay:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(finalGrossPay)}</span>
                  </div>
                  <div className="pos-total-row" style={{ marginTop: '0.25rem' }}>
                    <span>Deductions / Withholdings:</span>
                    <span style={{ color: 'var(--color-danger)' }}>-{formatCurrency(payDeductions)}</span>
                  </div>
                  
                  <div className="pos-total-row grand-total" style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
                    <span>Net Disbursed Pay:</span>
                    <span style={{ color: 'var(--color-info)' }}>{formatCurrency(calculatedNet)}</span>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsPayrollModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!payEmployeeId}>
                  Confirm & Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Slip Print Modal */}
      {selectedPaySlip && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Pay Slip Receipt</h2>
              <button className="modal-close" onClick={() => setSelectedPaySlip(null)}>
                ✕
              </button>
            </div>

            <div className="printable-area payslip-card">
              <div className="payslip-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>COAL SYSTEM INC.</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>Staff Payroll Disbursement Slip</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ color: '#111827', fontSize: '0.9rem', fontWeight: 700 }}>PAY SLIP DEPOSIT</h4>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>Reference: #{selectedPaySlip.id.slice(4).toUpperCase()}</p>
                </div>
              </div>

              <div className="payslip-details-grid">
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Employee Name:</span>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginTop: '0.15rem' }}>{selectedPaySlip.employeeName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Disbursement Date:</span>
                  <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem', marginTop: '0.15rem' }}>{new Date(selectedPaySlip.datePaid).toLocaleDateString()}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Payroll Cycle Period:</span>
                  <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.15rem' }}>
                    {new Date(selectedPaySlip.periodStart).toLocaleDateString()} - {new Date(selectedPaySlip.periodEnd).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Work Log details:</span>
                  <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.15rem' }}>
                    {selectedPaySlip.hoursWorked > 0 ? `${selectedPaySlip.hoursWorked} Hours Logged` : selectedPaySlip.daysWorked > 0 ? `${selectedPaySlip.daysWorked} Days Worked` : 'Salary Agreement'}
                  </div>
                </div>
              </div>

              <div className="payslip-breakdown">
                <div className="breakdown-col">
                  <h4 style={{ fontSize: '0.8rem', color: '#374151', textTransform: 'uppercase', fontWeight: 700 }}>Earnings</h4>
                  <div className="breakdown-row">
                    <span style={{ color: '#4b5563' }}>Base labor wage:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111827' }}>{formatCurrency(selectedPaySlip.grossPay)}</span>
                  </div>
                  {selectedPaySlip.notes && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Notes: {selectedPaySlip.notes}
                    </div>
                  )}
                </div>

                <div className="breakdown-col">
                  <h4 style={{ fontSize: '0.8rem', color: '#374151', textTransform: 'uppercase', fontWeight: 700 }}>Withholdings</h4>
                  <div className="breakdown-row">
                    <span style={{ color: '#4b5563' }}>Total Deductions:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ef4444' }}>-{formatCurrency(selectedPaySlip.deductions)}</span>
                  </div>
                </div>
              </div>

              <div className="payslip-footer">
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Payment Method:</span>
                  <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>Direct Deposit / Ledger Entry</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Net salary payout:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981', fontSize: '1.25rem' }}>{formatCurrency(selectedPaySlip.netPay)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', fontSize: '0.75rem', color: '#6b7280' }}>
                <div style={{ width: '40%', borderTop: '1px solid #d1d5db', paddingTop: '0.4rem', textAlign: 'center' }}>
                  Supervisor Signature
                </div>
                <div style={{ width: '40%', borderTop: '1px solid #d1d5db', paddingTop: '0.4rem', textAlign: 'center' }}>
                  Employee Signature
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPaySlip(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Pay Slip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
