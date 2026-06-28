export interface CoalBatch {
  id: string;
  supplierName: string;
  classification: string;
  supplierPrice: number; // Cost per unit
  salePrice: number;     // Sale price per unit
  initialQuantity: number; // in Units
  currentQuantity: number; // in Units
  dateReceived: string;    // YYYY-MM-DD
  notes?: string;
}

export interface SaleTransaction {
  id: string;
  batchId: string;
  batchClassification: string;
  quantity: number;        // Units
  supplierPrice: number;   // Supplier cost per unit at time of sale
  salePrice: number;       // Sale price per unit
  grossAmount: number;     // quantity * salePrice
  supplierCost: number;    // quantity * supplierPrice
  netAmount: number;       // grossAmount - supplierCost (net profit)
  customerName: string;
  customerPhone?: string;
  dateSold: string;        // ISO timestamp or YYYY-MM-DD
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Credit' | 'Cheque';
  status: 'Paid' | 'Pending' | 'Cancelled';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  rateType: 'Hourly' | 'Monthly' | 'Bi-Weekly' | 'Daily';
  rateValue: number;       // Hourly rate or monthly base salary
  status: 'Active' | 'Inactive';
  joinedDate: string;      // YYYY-MM-DD
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;     // YYYY-MM-DD
  periodEnd: string;       // YYYY-MM-DD
  hoursWorked: number;     // 0 if monthly/daily rate
  daysWorked: number;      // 0 if hourly/monthly rate
  grossPay: number;
  deductions: number;      // taxes, advances, etc.
  netPay: number;          // grossPay - deductions
  datePaid: string;        // YYYY-MM-DD
  status: 'Paid' | 'Pending';
  notes?: string;
}

export interface DashboardStats {
  totalGrossSales: number;
  totalSupplierCost: number;
  totalPayrollCost: number;
  totalNetProfit: number;
  totalUnitsSold: number;
  totalUnitsInStock: number;
  inventoryValueCost: number;
  inventoryValueRetail: number;
  recentSales: SaleTransaction[];
  lowStockBatches: CoalBatch[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  createdAt: string;
}

