
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Inventory from './pages/Inventory.tsx';
import AIAssistant from './pages/AIAssistant.tsx';
import Workshop from './pages/Workshop.tsx';
import Sales from './pages/Sales.tsx';
import Logo from './components/Logo.tsx';
import { View, Part, Sale, ServiceJob, User, StaffAccount, InventoryLog, AppNotification, Technician, DailyReport } from './types.ts';
import { INITIAL_INVENTORY, INITIAL_SALES, INITIAL_WORKSHOP } from './constants.tsx';
// Fix: Added TrendingUp to the lucide-react imports to resolve "Cannot find name 'TrendingUp'" error
import { Bell, User as UserIcon, LogOut, ShieldCheck, X, Activity, Database, Server, Trash2, CheckCheck, Clock, AlertTriangle, Wrench, Lock, Eye, EyeOff, Menu, Check, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from './services/logger.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mh_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    const saved = localStorage.getItem('mh_staff_accounts');
    return saved ? JSON.parse(saved) : [
      { id: 'S1', name: 'Zeeshan Ali', email: 'zeeshan@atlashonda.com', username: 'zeeshan123', password: 'password123', role: 'USER', createdAt: new Date().toISOString() }
    ];
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('mh_technicians');
    return saved ? JSON.parse(saved) : [
      { id: 'T1', name: 'Carlos Sainz', specialization: 'Master Mechanic', status: 'ACTIVE', joinedDate: '2023-01-15' },
      { id: 'T2', name: 'Dave Miller', specialization: 'Electrical Expert', status: 'ACTIVE', joinedDate: '2023-03-20' },
      { id: 'T3', name: 'Aslam Pervaiz', specialization: 'Engine Overhaul', status: 'ACTIVE', joinedDate: '2023-05-10' }
    ];
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('mh_notifications');
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : [
      { id: 'n1', type: 'SYSTEM', title: 'System Online', message: 'Master Honda OS v2.5 initialized successfully.', timestamp: new Date().toISOString(), isRead: false, priority: 'LOW' }
    ];
  });
  
  const [parts, setParts] = useState<Part[]>(() => {
    const saved = localStorage.getItem('mh_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('mh_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  
  const [workshop, setWorkshop] = useState<ServiceJob[]>(() => {
    const saved = localStorage.getItem('mh_workshop');
    return saved ? JSON.parse(saved) : INITIAL_WORKSHOP;
  });

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => {
    const saved = localStorage.getItem('mh_inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('mh_daily_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastClosedDate, setLastClosedDate] = useState<string>(() => {
    return localStorage.getItem('mh_last_closed_date') || new Date().toISOString().split('T')[0];
  });

  // Auto-Closing check on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastClosedDate !== today) {
      logger.info("System detected date change. Performing auto-archive of previous session.");
      handleCloseDay(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mh_inventory', JSON.stringify(parts));
    localStorage.setItem('mh_sales', JSON.stringify(sales));
    localStorage.setItem('mh_workshop', JSON.stringify(workshop));
    localStorage.setItem('mh_inventory_logs', JSON.stringify(inventoryLogs));
    localStorage.setItem('mh_notifications', JSON.stringify(notifications));
    localStorage.setItem('mh_staff_accounts', JSON.stringify(staffAccounts));
    localStorage.setItem('mh_technicians', JSON.stringify(technicians));
    localStorage.setItem('mh_daily_reports', JSON.stringify(dailyReports));
    localStorage.setItem('mh_last_closed_date', lastClosedDate);
  }, [parts, sales, workshop, inventoryLogs, notifications, staffAccounts, technicians, dailyReports, lastClosedDate]);

  const handleCloseDay = (isAuto: boolean = false) => {
    const today = new Date().toISOString().split('T')[0];
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);
    const workshopTotal = workshop.filter(w => w.status === 'COMPLETED').reduce((acc, w) => {
      const partsTotal = w.partsUsed?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;
      const extraServicesTotal = w.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0;
      return acc + w.servicePrice + extraServicesTotal + partsTotal;
    }, 0);

    const partsSoldVolume = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);

    const report: DailyReport = {
      id: `DR-${Date.now()}`,
      date: lastClosedDate,
      closedAt: new Date().toISOString(),
      totalSales: salesTotal,
      totalWorkshop: workshopTotal,
      grossRevenue: salesTotal + workshopTotal,
      salesCount: sales.length,
      jobsCount: workshop.filter(w => w.status === 'COMPLETED').length,
      partsSoldVolume
    };

    setDailyReports(prev => [report, ...prev]);
    setSales([]);
    setWorkshop([]);
    setLastClosedDate(today);
    
    if (isAuto) {
      setNotifications(prev => [{
        id: `sys-${Date.now()}`,
        type: 'SYSTEM',
        title: 'Auto-Shift Closure',
        message: `Previous shift (${report.date}) archived automatically. Today's counter reset to 0.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'HIGH'
      }, ...prev]);
    } else {
      logger.success("Day closed successfully. All counters reset.");
    }
  };

  const handleClearAllData = () => {
    logger.warn("Initiating Global Data Reset");
    localStorage.clear();
    window.location.reload();
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    logger.info("Notifications cleared");
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingInAsAdmin) {
      if (loginForm.username === '@dmin102' && loginForm.password === '1223334444') {
        const admin: User = { id: 'A1', name: 'Master Honda', email: 'ceo@honda.jp', username: '@dmin102', role: 'SUPER_ADMIN', createdAt: new Date().toISOString() };
        setUser(admin);
        localStorage.setItem('mh_user', JSON.stringify(admin));
        logger.success("Super Admin authenticated");
      }
    } else {
      const account = staffAccounts.find(a => a.username === loginForm.username && a.password === loginForm.password);
      if (account) {
        const { password, ...sessionUser } = account;
        setUser(sessionUser);
        localStorage.setItem('mh_user', JSON.stringify(sessionUser));
        logger.success("Staff session initiated");
      }
    }
  };

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingInAsAdmin, setIsLoggingInAsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateStock = useCallback((partId: string, change: number, reason: InventoryLog['reason'], refId?: string) => {
    setParts(prevParts => {
      const part = prevParts.find(p => p.id === partId);
      if (!part) return prevParts;
      const newStock = part.stock + change;
      if (newStock < 0) throw new Error(`Insufficient stock for ${part.name}`);
      const log: InventoryLog = { id: `LOG-${Date.now()}`, partId, partName: part.name, change, reason, referenceId: refId, date: new Date().toISOString(), user: user?.name || 'System' };
      setInventoryLogs(prev => [log, ...prev]);
      return prevParts.map(p => p.id === partId ? { ...p, stock: newStock, lastUpdated: new Date().toISOString().split('T')[0] } : p);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-honda-dark flex items-center justify-center p-6 flex-col">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-honda-red" />
          <div className="text-center mb-10 flex flex-col items-center">
            <Logo size="lg" showText={false} />
            <h2 className="text-2xl font-outfit font-bold text-honda-dark mt-6">Master Honda OS</h2>
            <p className="text-gray-400 mt-2 text-sm font-medium">Internal Management Access</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              <button type="button" onClick={() => setIsLoggingInAsAdmin(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!isLoggingInAsAdmin ? 'bg-white shadow-sm text-honda-dark' : 'text-gray-400'}`}>Staff Access</button>
              <button type="button" onClick={() => setIsLoggingInAsAdmin(true)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isLoggingInAsAdmin ? 'bg-white shadow-sm text-honda-red' : 'text-gray-400'}`}>Admin</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Username" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Password" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-honda-red">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-honda-dark text-white rounded-2xl font-bold shadow-xl hover:bg-honda-red transition-all">Sign In</button>
          </form>
        </motion.div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} userRole={user.role} isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 min-h-screen flex flex-col lg:ml-64">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-honda-dark hover:bg-gray-100 rounded-xl transition-colors"><Menu size={24} /></button>
             <div className="flex items-center gap-3 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <Activity size={12} className="text-green-500" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Terminal Operational</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-colors relative ${showNotifications ? 'bg-gray-100 text-honda-red' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-honda-red rounded-full border border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-outfit font-bold text-gray-800">Notifications</h4>
                        {unreadCount > 0 && (
                          <button onClick={markAllNotificationsRead} className="text-[10px] font-bold text-honda-red uppercase hover:underline">Clear All</button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-4 border-b border-gray-50 flex gap-4 hover:bg-gray-50 transition-colors group ${!n.isRead ? 'bg-red-50/30' : ''}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                n.type === 'LOW_STOCK' ? 'bg-amber-100 text-amber-600' : 
                                n.type === 'REVENUE' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {n.type === 'LOW_STOCK' ? <AlertTriangle size={18}/> : n.type === 'REVENUE' ? <TrendingUp size={18}/> : <Info size={18}/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-honda-dark leading-tight">{n.title}</p>
                                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                <p className="text-[9px] font-bold text-gray-300 mt-2 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                              <button onClick={() => deleteNotification(n.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-honda-red transition-all">
                                <X size={14}/>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center text-gray-400 italic text-sm">No new notifications</div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 text-center">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enterprise OS v2.5</p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-honda-dark leading-none">{user.name}</p>
                  <p className="text-[10px] font-bold text-honda-red uppercase mt-1 tracking-tighter">{user.role}</p>
               </div>
               <button onClick={() => { setUser(null); localStorage.removeItem('mh_user'); }} className="w-10 h-10 bg-honda-dark rounded-xl flex items-center justify-center text-white font-bold hover:bg-honda-red transition-all shadow-md active:scale-95 transition-transform"><LogOut size={18}/></button>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-screen-2xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {currentView === 'dashboard' && (
                <Dashboard 
                  parts={parts} sales={sales} workshop={workshop} user={user} isAdmin={user.role === 'SUPER_ADMIN'}
                  staffAccounts={staffAccounts} setStaffAccounts={setStaffAccounts} technicians={technicians} setTechnicians={setTechnicians}
                  dailyReports={dailyReports} onNavigate={setCurrentView} onClearAllData={handleClearAllData} onCloseDay={handleCloseDay}
                />
              )}
              {currentView === 'inventory' && <Inventory parts={parts} setParts={setParts} logs={inventoryLogs} updateStock={updateStock} isAdmin={user.role === 'SUPER_ADMIN'} />}
              {currentView === 'sales' && <Sales sales={sales} setSales={setSales} parts={parts} updateStock={updateStock} />}
              {currentView === 'workshop' && <Workshop workshop={workshop} setWorkshop={setWorkshop} parts={parts} updateStock={updateStock} technicians={technicians} />}
              {currentView === 'assistant' && <AIAssistant inventory={parts} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="mt-auto py-8 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Powered by TROTECH PVT</p></footer>
      </main>
    </div>
  );
};

export default App;
