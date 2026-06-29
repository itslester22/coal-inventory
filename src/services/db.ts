import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { CoalBatch, SaleTransaction, Employee, PayrollRecord, User } from '../types';

// Helper for generating dynamic mock dates relative to today
const getPastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App & Services
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Always returns true as we now use Firestore/Firebase exclusively
export const isUsingFirebase = () => true;

// --- Mock Data Definitions ---
const DEFAULT_BATCHES: CoalBatch[] = [
  {
    id: 'batch-1',
    supplierName: 'Glencore Coal Operations',
    classification: 'Premium Anthracite',
    supplierPrice: 110,
    salePrice: 185,
    initialQuantity: 100,
    currentQuantity: 82,
    dateReceived: getPastDate(12),
    notes: 'Premium high-energy density anthracite. Low ash content.'
  },
  {
    id: 'batch-2',
    supplierName: 'Peabody Energy Corp',
    classification: 'Medium Bituminous',
    supplierPrice: 80,
    salePrice: 135,
    initialQuantity: 250,
    currentQuantity: 195,
    dateReceived: getPastDate(8),
    notes: 'Standard metallurgical coal. Good coking properties.'
  },
  {
    id: 'batch-3',
    supplierName: 'BHP Billiton Alliance',
    classification: 'Standard Lignite',
    supplierPrice: 45,
    salePrice: 75,
    initialQuantity: 500,
    currentQuantity: 440,
    dateReceived: getPastDate(4),
    notes: 'Steam coal. Primarily for local electric utility plants.'
  },
  {
    id: 'batch-4',
    supplierName: 'Arch Resources Inc',
    classification: 'Sub-Bituminous',
    supplierPrice: 65,
    salePrice: 110,
    initialQuantity: 150,
    currentQuantity: 12,
    dateReceived: getPastDate(15),
    notes: 'Sub-bituminous. Lower sulfur content.'
  }
];

const DEFAULT_SALES: SaleTransaction[] = [
  {
    id: 'sale-1',
    batchId: 'batch-1',
    batchClassification: 'Premium Anthracite',
    quantity: 8,
    supplierPrice: 110,
    salePrice: 185,
    grossAmount: 1480,
    supplierCost: 880,
    netAmount: 600,
    customerName: 'Alpha Steel Works Corp',
    customerPhone: '+1-555-0199',
    dateSold: getPastDate(7) + 'T10:15:30Z',
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 'sale-2',
    batchId: 'batch-2',
    batchClassification: 'Medium Bituminous',
    quantity: 25,
    supplierPrice: 80,
    salePrice: 135,
    grossAmount: 3375,
    supplierCost: 2000,
    netAmount: 1375,
    customerName: 'Apex Brick & Ceramic Kiln',
    customerPhone: '+1-555-0144',
    dateSold: getPastDate(6) + 'T14:32:00Z',
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 'sale-3',
    batchId: 'batch-2',
    batchClassification: 'Medium Bituminous',
    quantity: 30,
    supplierPrice: 80,
    salePrice: 135,
    grossAmount: 4050,
    supplierCost: 2400,
    netAmount: 1650,
    customerName: 'Metro Power Station',
    customerPhone: '+1-555-0168',
    dateSold: getPastDate(5) + 'T09:11:45Z',
    paymentMethod: 'Cheque',
    status: 'Paid'
  },
  {
    id: 'sale-4',
    batchId: 'batch-1',
    batchClassification: 'Premium Anthracite',
    quantity: 10,
    supplierPrice: 110,
    salePrice: 185,
    grossAmount: 1850,
    supplierCost: 1100,
    netAmount: 750,
    customerName: 'Standard Iron Smelting Ltd',
    customerPhone: '+1-555-0177',
    dateSold: getPastDate(4) + 'T11:45:00Z',
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 'sale-5',
    batchId: 'batch-3',
    batchClassification: 'Standard Lignite',
    quantity: 60,
    supplierPrice: 45,
    salePrice: 75,
    grossAmount: 4500,
    supplierCost: 2700,
    netAmount: 1800,
    customerName: 'Municipal Utility District',
    customerPhone: '+1-555-0112',
    dateSold: getPastDate(3) + 'T16:20:10Z',
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 'sale-6',
    batchId: 'batch-4',
    batchClassification: 'Sub-Bituminous',
    quantity: 138,
    supplierPrice: 65,
    salePrice: 110,
    grossAmount: 15180,
    supplierCost: 8970,
    netAmount: 6210,
    customerName: 'Apex Brick & Ceramic Kiln',
    customerPhone: '+1-555-0144',
    dateSold: getPastDate(2) + 'T13:05:00Z',
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 'sale-7',
    batchId: 'batch-2',
    batchClassification: 'Medium Bituminous',
    quantity: 5,
    supplierPrice: 80,
    salePrice: 135,
    grossAmount: 675,
    supplierCost: 400,
    netAmount: 275,
    customerName: 'Rural Heat & Steam Co.',
    customerPhone: '+1-555-0182',
    dateSold: getPastDate(1) + 'T15:40:00Z',
    paymentMethod: 'Cash',
    status: 'Paid'
  },
  {
    id: 'sale-8',
    batchId: 'batch-3',
    batchClassification: 'Standard Lignite',
    quantity: 20,
    supplierPrice: 45,
    salePrice: 75,
    grossAmount: 1500,
    supplierCost: 900,
    netAmount: 600,
    customerName: 'Valley Cement Works',
    customerPhone: '+1-555-0129',
    dateSold: new Date().toISOString(),
    paymentMethod: 'Cash',
    status: 'Pending'
  }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'John Miller',
    role: 'Heavy Machinery & Loader Operator',
    rateType: 'Hourly',
    rateValue: 26.50,
    status: 'Active',
    joinedDate: getPastDate(180)
  },
  {
    id: 'emp-2',
    name: 'Sarah Jenkins',
    role: 'POS Dispatcher & Clerk',
    rateType: 'Hourly',
    rateValue: 19.00,
    status: 'Active',
    joinedDate: getPastDate(120)
  },
  {
    id: 'emp-3',
    name: 'Robert Chen',
    role: 'Logistics Operations Manager',
    rateType: 'Monthly',
    rateValue: 4200.00,
    status: 'Active',
    joinedDate: getPastDate(300)
  },
  {
    id: 'emp-4',
    name: 'Marcus Vance',
    role: 'Coal Delivery Truck Driver',
    rateType: 'Hourly',
    rateValue: 23.00,
    status: 'Active',
    joinedDate: getPastDate(90)
  },
  {
    id: 'emp-5',
    name: 'Elena Rostova',
    role: 'Quality Assurance & Safety Specialist',
    rateType: 'Monthly',
    rateValue: 4800.00,
    status: 'Active',
    joinedDate: getPastDate(60)
  }
];

const DEFAULT_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-1',
    employeeId: 'emp-1',
    employeeName: 'John Miller',
    periodStart: getPastDate(25),
    periodEnd: getPastDate(10),
    hoursWorked: 88,
    daysWorked: 0,
    grossPay: 2332.00,
    deductions: 280.00,
    netPay: 2052.00,
    datePaid: getPastDate(9),
    status: 'Paid',
    notes: 'Regular pay cycle. Includes 8 hours overtime.'
  },
  {
    id: 'pay-2',
    employeeId: 'emp-2',
    employeeName: 'Sarah Jenkins',
    periodStart: getPastDate(25),
    periodEnd: getPastDate(10),
    hoursWorked: 80,
    daysWorked: 0,
    grossPay: 1520.00,
    deductions: 150.00,
    netPay: 1370.00,
    datePaid: getPastDate(9),
    status: 'Paid',
    notes: 'Regular pay cycle.'
  },
  {
    id: 'pay-3',
    employeeId: 'emp-3',
    employeeName: 'Robert Chen',
    periodStart: getPastDate(30),
    periodEnd: getPastDate(1),
    hoursWorked: 0,
    daysWorked: 0,
    grossPay: 4200.00,
    deductions: 630.00,
    netPay: 3570.00,
    datePaid: getPastDate(1),
    status: 'Paid',
    notes: 'Monthly fixed salary payout.'
  },
  {
    id: 'pay-4',
    employeeId: 'emp-4',
    employeeName: 'Marcus Vance',
    periodStart: getPastDate(25),
    periodEnd: getPastDate(10),
    hoursWorked: 92,
    daysWorked: 0,
    grossPay: 2116.00,
    deductions: 210.00,
    netPay: 1906.00,
    datePaid: getPastDate(9),
    status: 'Paid',
    notes: 'Regular pay cycle. High delivery demand logistics.'
  }
];

// --- Firebase Auth Functions ---

// Creates the default admin account in Firebase Auth + Firestore.
// Only called when the user explicitly enters admin credentials and the
// account is confirmed to not exist yet — no unauthenticated reads needed.
const _seedDefaultAdmin = async (): Promise<void> => {
  const email = 'admin@ulingnife.com';
  const password = 'admin123';
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const authUser = userCredential.user;
    // Now that we're authenticated as the new user, writing to users/{uid}
    // is allowed by Firestore rules (request.auth.uid == userId).
    const userDocRef = doc(db, 'users', authUser.uid);
    await setDoc(userDocRef, {
      username: 'admin',
      email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    console.log('Default admin seeded successfully.');
  } catch (err: any) {
    if (err.code !== 'auth/email-already-in-use') {
      throw err;
    }
    // Already exists — that's fine, proceed to sign-in below.
  }
};

// Keep the named export so nothing else breaks if it's imported elsewhere.
export const seedDefaultAdmin = _seedDefaultAdmin;

export const loginUser = async (usernameOrEmail: string, password: string): Promise<User | null> => {
  const ADMIN_EMAIL = 'admin@ulingnife.com';

  // Map plain username to email. Only the known admin username can be resolved
  // without an authenticated Firestore read.
  const email = usernameOrEmail.includes('@')
    ? usernameOrEmail
    : usernameOrEmail === 'admin'
      ? ADMIN_EMAIL
      : usernameOrEmail;

  // Attempt sign-in first — no unauthenticated DB reads needed.
  let authUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    authUser = cred.user;
  } catch (err: any) {
    // Account missing + default admin credentials → seed and retry once.
    const notFound = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential';
    if (notFound && email === ADMIN_EMAIL && password === 'admin123') {
      await _seedDefaultAdmin();
      const retry = await signInWithEmailAndPassword(auth, email, password);
      authUser = retry.user;
    } else {
      throw err;
    }
  }

  // We are now authenticated — Firestore rules allow reading our own document.
  const userDocRef = doc(db, 'users', authUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    const role = data.role || 'user';
    if (role !== 'admin') {
      await firebaseSignOut(auth);
      throw new Error('Only admins can log in.');
    }
    return {
      id: authUser.uid,
      username: data.username,
      email: data.email,
      role,
      createdAt: data.createdAt
    };
  } else {
    await firebaseSignOut(auth);
    throw new Error('User profile not found. Contact your administrator.');
  }
};

export const registerUser = async (username: string, email: string, password: string, role: 'admin' | 'staff' | 'user' = 'user'): Promise<User> => {
  // Check if username is already taken in Firestore
  const usersRef = collection(db, 'users');
  const qUsername = query(usersRef, where('username', '==', username));
  const snapUsername = await getDocs(qUsername);
  if (!snapUsername.empty) {
    throw new Error('Username already exists');
  }

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const authUser = userCredential.user;

  // Write profile to Firestore
  const userDocRef = doc(db, 'users', authUser.uid);
  const newUserData = {
    username,
    email,
    role,
    createdAt: new Date().toISOString()
  };
  await setDoc(userDocRef, newUserData);

  return {
    id: authUser.uid,
    ...newUserData
  };
};

export const logoutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Subscribes components to Firebase auth changes
export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const role = data.role || 'user';
          if (role !== 'admin') {
            // Document exists but user is not admin — hard reject.
            await firebaseSignOut(auth);
            callback(null);
            return;
          }
          callback({
            id: authUser.uid,
            username: data.username,
            email: data.email,
            role,
            createdAt: data.createdAt
          });
        } else {
          // Document doesn't exist yet — could be mid-seeding (race condition).
          // Do NOT sign out; loginUser will complete the write and call
          // onLoginSuccess directly. Just report as unauthenticated to the UI.
          callback(null);
        }
      } catch (e) {
        // Permissions error or network issue — do NOT sign out, as the user
        // may be in the middle of the first-time seeding flow.
        console.error('Auth listener: error reading user profile:', e);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// --- Data Operations (CRUD) using only Firestore ---

// 1. Inventory Batches
export const getBatches = async (): Promise<CoalBatch[]> => {
  const q = query(collection(db, 'inventory'), orderBy('dateReceived', 'desc'));
  const querySnapshot = await getDocs(q);
  const data: CoalBatch[] = [];
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as CoalBatch);
  });
  return data;
};

export const addBatch = async (batch: Omit<CoalBatch, 'id'>): Promise<CoalBatch> => {
  const docRef = await addDoc(collection(db, 'inventory'), batch);
  return { ...batch, id: docRef.id };
};

export const updateBatch = async (id: string, updates: Partial<CoalBatch>): Promise<void> => {
  const docRef = doc(db, 'inventory', id);
  await updateDoc(docRef, updates as any);
};

export const deleteBatch = async (id: string): Promise<void> => {
  const docRef = doc(db, 'inventory', id);
  await deleteDoc(docRef);
};

// 2. Sales Transactions
export const getSales = async (): Promise<SaleTransaction[]> => {
  const q = query(collection(db, 'sales'), orderBy('dateSold', 'desc'));
  const querySnapshot = await getDocs(q);
  const data: SaleTransaction[] = [];
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as SaleTransaction);
  });
  return data;
};

export const addSale = async (sale: Omit<SaleTransaction, 'id' | 'grossAmount' | 'supplierCost' | 'netAmount'>): Promise<SaleTransaction> => {
  const grossAmount = sale.quantity * sale.salePrice;
  const supplierCost = sale.quantity * sale.supplierPrice;
  const netAmount = grossAmount - supplierCost;
  
  const completedSale = {
    ...sale,
    grossAmount,
    supplierCost,
    netAmount
  };

  // Adjust stock levels
  const batches = await getBatches();
  const batch = batches.find(b => b.id === sale.batchId);
  if (batch) {
    const newQty = Math.max(0, batch.currentQuantity - sale.quantity);
    await updateBatch(sale.batchId, { currentQuantity: newQty });
  }

  const docRef = await addDoc(collection(db, 'sales'), completedSale);
  return { ...completedSale, id: docRef.id } as SaleTransaction;
};

export const updateSaleStatus = async (id: string, status: 'Paid' | 'Pending' | 'Cancelled'): Promise<void> => {
  if (status === 'Cancelled') {
    const sales = await getSales();
    const sale = sales.find(s => s.id === id);
    if (sale && sale.status !== 'Cancelled') {
      const batches = await getBatches();
      const batch = batches.find(b => b.id === sale.batchId);
      if (batch) {
        await updateBatch(sale.batchId, { currentQuantity: batch.currentQuantity + sale.quantity });
      }
    }
  } else {
    const sales = await getSales();
    const sale = sales.find(s => s.id === id);
    if (sale && sale.status === 'Cancelled') {
      const batches = await getBatches();
      const batch = batches.find(b => b.id === sale.batchId);
      if (batch) {
        await updateBatch(sale.batchId, { currentQuantity: Math.max(0, batch.currentQuantity - sale.quantity) });
      }
    }
  }

  const docRef = doc(db, 'sales', id);
  await updateDoc(docRef, { status });
};

export const deleteSale = async (id: string): Promise<void> => {
  const sales = await getSales();
  const sale = sales.find(s => s.id === id);
  if (sale && sale.status !== 'Cancelled') {
    const batches = await getBatches();
    const batch = batches.find(b => b.id === sale.batchId);
    if (batch) {
      await updateBatch(sale.batchId, { currentQuantity: batch.currentQuantity + sale.quantity });
    }
  }

  const docRef = doc(db, 'sales', id);
  await deleteDoc(docRef);
};

// 3. Employees
export const getEmployees = async (): Promise<Employee[]> => {
  const q = collection(db, 'employees');
  const querySnapshot = await getDocs(q);
  const data: Employee[] = [];
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as Employee);
  });
  return data;
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  const docRef = await addDoc(collection(db, 'employees'), employee);
  return { ...employee, id: docRef.id };
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
  const docRef = doc(db, 'employees', id);
  await updateDoc(docRef, updates as any);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const docRef = doc(db, 'employees', id);
  await deleteDoc(docRef);
};

// 4. Payroll Records
export const getPayroll = async (): Promise<PayrollRecord[]> => {
  const q = query(collection(db, 'payroll'), orderBy('datePaid', 'desc'));
  const querySnapshot = await getDocs(q);
  const data: PayrollRecord[] = [];
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as PayrollRecord);
  });
  return data;
};

export const calculateMonthsBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  if (end < start) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const rawMonths = diffDays / 30.4375;
  const rounded = Math.round(rawMonths);
  if (rounded >= 1 && Math.abs(rawMonths - rounded) < 0.15) {
    return rounded;
  } else {
    return Math.max(0.01, Math.round(rawMonths * 100) / 100);
  }
};

export const addPayroll = async (record: Omit<PayrollRecord, 'id' | 'netPay'>): Promise<PayrollRecord> => {
  let grossPay = record.grossPay || 0;
  
  if (grossPay <= 0) {
    const employees = await getEmployees();
    const emp = employees.find(e => e.id === record.employeeId);
    if (emp) {
      if (emp.rateType === 'Hourly') {
        grossPay = record.hoursWorked * emp.rateValue;
      } else if (emp.rateType === 'Daily') {
        grossPay = record.daysWorked * emp.rateValue;
      } else if (emp.rateType === 'Bi-Weekly') {
        grossPay = emp.rateValue / 2;
      } else {
        grossPay = emp.rateValue;
      }
    }
  }

  const netPay = grossPay - record.deductions;
  const completedRecord = {
    ...record,
    grossPay,
    netPay
  };

  const docRef = await addDoc(collection(db, 'payroll'), completedRecord);
  return { ...completedRecord, id: docRef.id } as PayrollRecord;
};

export const updatePayrollStatus = async (id: string, status: 'Paid' | 'Pending'): Promise<void> => {
  const docRef = doc(db, 'payroll', id);
  await updateDoc(docRef, { status });
};

export const deletePayroll = async (id: string): Promise<void> => {
  const docRef = doc(db, 'payroll', id);
  await deleteDoc(docRef);
};

// 5. Bulk Setup Helper
export const setupFirebaseDefaultData = async (): Promise<boolean> => {
  try {
    const invSnap = await getDocs(collection(db, 'inventory'));
    if (!invSnap.empty) return false; // Already seeded

    console.log('Populating Firebase with default demo data...');
    
    // Add inventory batches
    for (const b of DEFAULT_BATCHES) {
      const { id: _id, ...data } = b;
      await addDoc(collection(db, 'inventory'), data);
    }

    // Add employees
    const empIdMapping: Record<string, string> = {};
    for (const e of DEFAULT_EMPLOYEES) {
      const { id, ...data } = e;
      const ref = await addDoc(collection(db, 'employees'), data);
      empIdMapping[id] = ref.id;
    }

    // Add payroll records mapping matching employee ids
    for (const p of DEFAULT_PAYROLL) {
      const { id: _id, ...data } = p;
      if (empIdMapping[p.employeeId]) {
        data.employeeId = empIdMapping[p.employeeId];
      }
      await addDoc(collection(db, 'payroll'), data);
    }

    // Add sales transactions
    for (const s of DEFAULT_SALES) {
      const { id: _id, ...data } = s;
      await addDoc(collection(db, 'sales'), data);
    }

    console.log('Firebase default data successfully set up!');
    return true;
  } catch (error) {
    console.error('Error populating default data in Firebase', error);
    return false;
  }
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    const collections = ['inventory', 'sales', 'employees', 'payroll', 'users'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      for (const docObj of snap.docs) {
        await deleteDoc(doc(db, colName, docObj.id));
      }
    }
    return true;
  } catch (e) {
    console.error('Error clearing Firebase database:', e);
    return false;
  }
};

export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
}

export const getBusinessSettingsFromDB = async (): Promise<BusinessSettings> => {
  try {
    const docRef = doc(db, 'settings', 'business');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BusinessSettings;
    }
  } catch (err) {
    console.error('Failed to get business settings from Firestore:', err);
  }
  return {
    businessName: 'ULING NI FE',
    businessAddress: '100 Industrial Bulk Ave, Suite 400',
    businessPhone: '+63 (2) 812-3456'
  };
};

export const saveBusinessSettingsToDB = async (settings: BusinessSettings): Promise<void> => {
  const docRef = doc(db, 'settings', 'business');
  await setDoc(docRef, settings);
};

