import React, { useState, useEffect } from 'react';
import { 
  getBatches, 
  getSales, 
  getEmployees, 
  getPayroll,
  logoutUser,
  onAuthStateChangedListener,
  getBusinessSettingsFromDB,
  type BusinessSettings
} from './services/db';
import type { CoalBatch, SaleTransaction, Employee, PayrollRecord, User } from './types';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Payroll } from './components/Payroll';
import { SettingsModal } from './components/SettingsModal';
import { Login } from './components/Login';

// Icons
import { 
  Flame, 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Users, 
  Calendar,
  Menu,
  Sun,
  Moon,
  LogOut,
  Settings
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Theme Toggle State - using sessionStorage to avoid localStorage completely
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (sessionStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // Application Data State
  const [batches, setBatches] = useState<CoalBatch[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'ULING NI FE',
    businessAddress: '100 Industrial Bulk Ave, Suite 400',
    businessPhone: '+63 (2) 812-3456'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Subscribe to Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Apply Theme class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    sessionStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch all data from DB when logged in
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bData, sData, eData, pData, settingsData] = await Promise.all([
          getBatches(),
          getSales(),
          getEmployees(),
          getPayroll(),
          getBusinessSettingsFromDB()
        ]);
        setBatches(bData);
        setSales(sData);
        setEmployees(eData);
        setPayroll(pData);
        setBusinessSettings(settingsData);
      } catch (err) {
        console.error('Failed to load application data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger, currentUser]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  // If verifying authentication, show loading screen
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#0a0b0e',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid rgba(255, 96, 151, 0.1)', 
          borderTopColor: 'var(--color-primary)', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying operator credentials...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If user is not authenticated, render Login screen
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Tab Header title and subtitles
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'Dashboard':
        return {
          title: 'Analytics Dashboard',
          subtitle: 'Real-time overview of sales margins, stockpiles, and operating metrics.'
        };
      case 'POS':
        return {
          title: 'POS Sales Terminal',
          subtitle: 'Create invoice agreements, sell inventory batches, and record payments.'
        };
      case 'Inventory':
        return {
          title: 'Inventory Yard',
          subtitle: 'Track incoming cargo logs, calculate profit yield spreads, and manage classifications.'
        };
      case 'Payroll':
        return {
          title: 'Staffing & Payroll Ledger',
          subtitle: 'Manage labor rates, record hours worked, and log employee wage distributions.'
        };
      default:
        return { title: 'System', subtitle: 'Management portal.' };
    }
  };

  const headerInfo = getHeaderInfo();

  const handleNavClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false); // Auto-close drawer on mobile nav
  };

  return (
    <div className="app-container">
      
      {/* Mobile Top Bar Header */}
      <div className="mobile-header-bar">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <Flame size={20} color="var(--color-primary)" fill="var(--color-primary)" />
          <span className="logo-text" style={{ fontSize: '1.1rem' }}>ULING NI FE</span>
        </div>
        <button 
          className="mobile-menu-btn" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Navigation Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <Flame className="logo-icon" size={26} fill="var(--color-primary)" />
          <span className="logo-text">ULING NI FE</span>
        </div>

        <ul className="nav-menu">
          <li>
            <div 
              className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('Dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'POS' ? 'active' : ''}`}
              onClick={() => handleNavClick('POS')}
            >
              <ShoppingBag size={18} />
              <span>POS Terminal</span>
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'Inventory' ? 'active' : ''}`}
              onClick={() => handleNavClick('Inventory')}
            >
              <Layers size={18} />
              <span>Inventory Yard</span>
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'Payroll' ? 'active' : ''}`}
              onClick={() => handleNavClick('Payroll')}
            >
              <Users size={18} />
              <span>Staff & Payroll</span>
            </div>
          </li>
        </ul>

        {/* User profile section and database status badge */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: '#fff', 
                textOverflow: 'ellipsis', 
                overflow: 'hidden', 
                whiteSpace: 'nowrap' 
              }}>
                {currentUser.username}
              </span>
              <span style={{ 
                fontSize: '0.7rem', 
                color: 'var(--color-primary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px', 
                fontWeight: 600 
              }}>
                {currentUser.role}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ 
                padding: '0.2rem 0.4rem', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.2rem',
                fontSize: '0.75rem'
              }}
              title="Sign out of system"
            >
              <LogOut size={12} />
              <span>Exit</span>
            </button>
          </div>

          <div
            className="nav-item"
            onClick={() => {
              setShowConfigModal(true);
              setIsMobileMenuOpen(false);
            }}
            title="Open system settings"
            style={{ cursor: 'pointer' }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header-dashboard">
          <div className="header-title-section">
            <h1>{headerInfo.title}</h1>
            <p>{headerInfo.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', height: '36px' }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid rgba(255,255,255,0.04)',
              height: '36px'
            }}>
              <Calendar size={14} color="var(--color-primary)" />
              <span>Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem', padding: '5rem 0' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255, 96, 151, 0.1)', 
              borderTopColor: 'var(--color-primary)', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching records...</span>
          </div>
        ) : (
          <>
            {activeTab === 'Dashboard' && (
              <Dashboard 
                batches={batches}
                sales={sales}
                employees={employees}
                payroll={payroll}
                setActiveTab={handleNavClick}
              />
            )}
            {activeTab === 'POS' && (
              <POS 
                batches={batches}
                sales={sales}
                businessSettings={businessSettings}
                onRefreshData={handleRefresh}
              />
            )}
            {activeTab === 'Inventory' && (
              <Inventory 
                batches={batches}
                onRefreshData={handleRefresh}
              />
            )}
            {activeTab === 'Payroll' && (
              <Payroll 
                employees={employees}
                payroll={payroll}
                onRefreshData={handleRefresh}
              />
            )}
          </>
        )}
      </main>

      {/* Settings modal */}
      {showConfigModal && (
        <SettingsModal
          businessSettings={businessSettings}
          onClose={() => setShowConfigModal(false)}
          onRefreshData={handleRefresh}
        />
      )}
    </div>
  );
};

export default App;
