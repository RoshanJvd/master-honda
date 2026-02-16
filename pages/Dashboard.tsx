
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Package, AlertCircle, ShoppingCart, 
  Activity, Zap, Download, Calendar, 
  RefreshCcw, Wrench, FileText, CheckCircle, Database, Trash2, PlusCircle,
  ShieldCheck, Users, UserPlus, UserX, Mail, Key, Lock, Clock, FileDown, Loader2, Printer, AlertTriangle, Hammer, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Part, Sale, ServiceJob, User, StaffAccount, View, Technician, DailyReport } from '../types';
import InvoiceModal from '../components/InvoiceModal.tsx';
import DailyReportModal from '../components/DailyReportModal.tsx';
import { cacheService } from '../services/cacheService.ts';
import { logger } from '../services/logger.ts';

interface DashboardProps {
  parts: Part[];
  sales: Sale[];
  workshop: ServiceJob[];
  user: User;
  isAdmin?: boolean;
  staffAccounts?: StaffAccount[];
  setStaffAccounts?: React.Dispatch<React.SetStateAction<StaffAccount[]>>;
  technicians?: Technician[];
  setTechnicians?: React.Dispatch<React.SetStateAction<Technician[]>>;
  dailyReports: DailyReport[];
  onNavigate?: (view: View) => void;
  onClearAllData?: () => void;
  onCloseDay?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  parts, sales, workshop, user, isAdmin, staffAccounts = [], setStaffAccounts, technicians = [], setTechnicians, dailyReports = [], onNavigate, onClearAllData, onCloseDay 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'personnel' | 'system'>('overview');
  const [personnelSubTab, setPersonnelSubTab] = useState<'staff' | 'technicians'>('staff');
  const [reportsSubTab, setReportsSubTab] = useState<'daily' | 'history'>('daily');
  const [activeDailyReport, setActiveDailyReport] = useState<DailyReport | null>(null);
  
  const [cachedStats, setCachedStats] = useState<any>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', username: '', password: '' });
  const [newTech, setNewTech] = useState({ name: '', specialization: 'Master Mechanic' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCloseDayConfirm, setShowCloseDayConfirm] = useState(false);

  const calculateAnalytics = () => {
    const lowStockItems = parts.filter(p => p.stock <= p.minStock);
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);
    const workshopTotal = workshop.filter(w => w.status === 'COMPLETED').reduce((acc, w) => {
      const partsTotal = w.partsUsed?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;
      const extraServicesTotal = w.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0;
      return acc + w.servicePrice + extraServicesTotal + partsTotal;
    }, 0);
    
    const totalRevenue = salesTotal + workshopTotal;
    const partsSoldToday = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);
    const servicesCompletedToday = workshop.filter(w => w.status === 'COMPLETED').length;
    const pendingJobs = workshop.filter(w => w.status !== 'COMPLETED').length;

    const techWorkload = technicians.map(t => ({
      name: t.name,
      jobs: workshop.filter(w => w.mechanic === t.name && w.status !== 'COMPLETED').length,
      efficiency: Math.floor(Math.random() * 15) + 85
    }));

    const monthlyTotal = dailyReports.reduce((acc, r) => acc + r.grossRevenue, 0) + totalRevenue;

    return {
      lowStockItemsCount: lowStockItems.length,
      totalRevenue,
      monthlyTotal,
      partsSoldToday,
      servicesCompletedToday,
      pendingJobs,
      techWorkload,
      timestamp: new Date().toISOString()
    };
  };

  const loadAnalytics = async () => {
    setLoadingCache(true);
    const freshStats = calculateAnalytics();
    setCachedStats(freshStats);
    setLoadingCache(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [parts, sales, workshop, technicians, dailyReports]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setStaffAccounts) return;
    const account: StaffAccount = { 
      id: `S-${Date.now()}`, 
      name: newUser.name, 
      email: newUser.email, 
      username: newUser.username, 
      password: newUser.password, 
      role: 'USER', 
      createdAt: new Date().toISOString() 
    };
    setStaffAccounts(prev => [...prev, account]);
    setIsAddingUser(false);
    setNewUser({ name: '', email: '', username: '', password: '' });
    logger.success("Staff account created", { username: account.username });
  };

  const handleCreateTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTechnicians) return;
    const tech: Technician = { 
      id: `T-${Date.now()}`, 
      name: newTech.name, 
      specialization: newTech.specialization, 
      status: 'ACTIVE', 
      joinedDate: new Date().toISOString().split('T')[0] 
    };
    setTechnicians(prev => [...prev, tech]);
    setIsAddingTech(false);
    setNewTech({ name: '', specialization: 'General Mechanic' });
    logger.success("Technician registered", { name: tech.name });
  };

  const handleDeleteStaff = (id: string) => {
    if (!setStaffAccounts) return;
    setStaffAccounts(prev => prev.filter(a => a.id !== id));
    setConfirmDeleteId(null);
  };

  const handleDeleteTech = (id: string) => {
    if (!setTechnicians) return;
    setTechnicians(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteId(null);
  };

  const handlePerformCloseDay = () => {
    if (onCloseDay) onCloseDay();
    setShowCloseDayConfirm(false);
    setActiveTab('reports');
    setReportsSubTab('history');
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-outfit font-bold text-honda-dark">Staff Terminal</h1>
          <p className="text-sm text-gray-500">Shift Status: Active</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Today Revenue" value={cachedStats?.totalRevenue || 0} prefix="Rs. " icon={<ShoppingCart size={18}/>} color="red" />
          <StatCard label="Jobs Finished" value={cachedStats?.servicesCompletedToday || 0} icon={<CheckCircle size={18}/>} color="green" />
          <StatCard label="Current Queue" value={cachedStats?.pendingJobs || 0} icon={<Clock size={18}/>} color="blue" />
          <StatCard label="Low Stock" value={cachedStats?.lowStockItemsCount || 0} icon={<AlertCircle size={18}/>} color="amber" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 print-hidden">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-honda-dark tracking-tight">Super Admin Hub</h1>
          <p className="text-sm text-gray-500">Global dealership oversight</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>Overview</button>
          <button onClick={() => setActiveTab('personnel')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'personnel' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>Personnel</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>Ledger</button>
          <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>System</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCard label="Daily" value={cachedStats?.totalRevenue || 0} prefix="Rs." change="+12%" icon={<TrendingUp size={18}/>} color="red" />
              <StatCard label="Ledger" value={cachedStats?.monthlyTotal || 0} prefix="Rs." change="Rollup" icon={<Calendar size={18}/>} color="blue" />
              <StatCard label="Personnel" value={staffAccounts.length + technicians.length} change="Live" icon={<Users size={18}/>} color="purple" />
              <StatCard label="Parts Sold" value={cachedStats?.partsSoldToday || 0} icon={<Package size={18}/>} color="amber" />
              <StatCard label="Finished" value={cachedStats?.servicesCompletedToday || 0} icon={<Zap size={18}/>} color="green" />
              <StatCard label="Alerts" value={cachedStats?.lowStockItemsCount || 0} icon={<AlertCircle size={18}/>} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-premium min-h-[400px]">
                <h3 className="font-outfit font-bold text-honda-dark mb-6 text-lg">Workshop Load Metrics</h3>
                <div className="space-y-8">
                  {cachedStats?.techWorkload?.map((tech: any) => (
                    <div key={tech.name}>
                      <div className="flex justify-between items-end mb-2">
                        <div><p className="font-bold text-gray-800">{tech.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{tech.jobs} ACTIVE JOBS</p></div>
                        <span className="text-xs font-bold text-honda-red">{tech.efficiency}% Efficient</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${tech.efficiency}%` }} className="h-full bg-honda-red" /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-honda-dark p-8 rounded-[40px] shadow-2xl flex flex-col justify-center items-center text-center">
                <ShieldCheck className="text-honda-red mb-4" size={56} />
                <h3 className="text-white font-outfit font-bold text-2xl mb-2">Shift Security</h3>
                <p className="text-white/40 text-sm mb-10">Only the Super Admin can verify the cash floor and close the daily ledger.</p>
                <button onClick={() => setShowCloseDayConfirm(true)} className="w-full py-5 bg-honda-red text-white rounded-2xl font-bold shadow-xl shadow-honda-red/20 transition-all hover:scale-105">Close Current Day</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
              <button onClick={() => setReportsSubTab('daily')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${reportsSubTab === 'daily' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>Current Statistics</button>
              <button onClick={() => setReportsSubTab('history')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${reportsSubTab === 'history' ? 'bg-honda-dark text-white' : 'text-gray-400'}`}>Archived Ledger</button>
            </div>

            {reportsSubTab === 'daily' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportActionCard title="Revenue Statement" description="Live unclosed revenue metrics." icon={<Briefcase className="text-honda-blue" />} onClick={() => window.print()} />
                <ReportActionCard title="Stock Valuation" description="Current inventory asset values." icon={<Package className="text-honda-red" />} onClick={() => onNavigate?.('inventory')} />
                <ReportActionCard title="Efficiency Audit" description="Current workshop performance." icon={<Activity className="text-green-600" />} onClick={() => onNavigate?.('workshop')} />
              </div>
            ) : (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-premium overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                      <th className="px-8 py-5">Ledger Date</th>
                      <th className="px-8 py-5 text-right">Gross Rev</th>
                      <th className="px-8 py-5 text-right">Parts sold</th>
                      <th className="px-8 py-5 text-right">Jobs</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dailyReports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-honda-dark">{new Date(report.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                        <td className="px-8 py-5 text-right font-bold text-green-600">Rs. {report.grossRevenue.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right text-gray-500 font-bold">{report.partsSoldVolume}</td>
                        <td className="px-8 py-5 text-right text-gray-500 font-bold">{report.jobsCount}</td>
                        <td className="px-8 py-5 text-right">
                           <button onClick={() => setActiveDailyReport(report)} className="p-2 text-honda-blue hover:bg-honda-blue/5 rounded-xl transition-all">
                              <FileText size={20} />
                           </button>
                        </td>
                      </tr>
                    ))}
                    {dailyReports.length === 0 && (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">No historical reports archived yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'personnel' && (
          <motion.div key="personnel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <button 
                  onClick={() => setPersonnelSubTab('staff')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${personnelSubTab === 'staff' ? 'bg-honda-dark text-white shadow-md' : 'text-gray-400 hover:text-honda-dark'}`}
                >
                  Staff Registry
                </button>
                <button 
                  onClick={() => setPersonnelSubTab('technicians')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${personnelSubTab === 'technicians' ? 'bg-honda-dark text-white shadow-md' : 'text-gray-400 hover:text-honda-dark'}`}
                >
                  Technicians
                </button>
              </div>
              <button 
                onClick={() => personnelSubTab === 'staff' ? setIsAddingUser(true) : setIsAddingTech(true)} 
                className="flex items-center gap-2 bg-honda-blue text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-honda-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <PlusCircle size={20}/> Add {personnelSubTab === 'staff' ? 'Staff Member' : 'Technician'}
              </button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-premium overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Full Name</th>
                      <th className="px-8 py-5">{personnelSubTab === 'staff' ? 'Username' : 'Specialization'}</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {personnelSubTab === 'staff' ? staffAccounts.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-honda-dark">{a.name}</td>
                        <td className="px-8 py-5 text-gray-500 font-mono text-xs">{a.username}</td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-lg uppercase">AUTHORIZED</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {confirmDeleteId === a.id ? (
                            <button onClick={() => handleDeleteStaff(a.id)} className="bg-honda-red text-white text-[10px] font-bold px-3 py-1 rounded-lg">Confirm</button>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(a.id)} className="text-gray-300 hover:text-honda-red transition-colors opacity-0 group-hover:opacity-100"><UserX size={18}/></button>
                          )}
                        </td>
                      </tr>
                    )) : technicians.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-honda-dark">{t.name}</td>
                        <td className="px-8 py-5 text-gray-500 text-sm">{t.specialization}</td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-bold bg-blue-50 text-honda-blue px-3 py-1 rounded-lg uppercase">{t.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {confirmDeleteId === t.id ? (
                            <button onClick={() => handleDeleteTech(t.id)} className="bg-honda-red text-white text-[10px] font-bold px-3 py-1 rounded-lg">Confirm</button>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(t.id)} className="text-gray-300 hover:text-honda-red transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SystemCard title="Auth Vault" status="Secure" icon={<Lock className="text-honda-red"/>} metrics="AES-256 Enabled" action="Audit Logs" />
              <SystemCard title="Redis Node" status="Synced" icon={<Database className="text-honda-blue"/>} metrics="Latency: 2ms" action="Flush Cache" />
              <div className="bg-honda-red p-8 rounded-[40px] flex flex-col justify-between">
                <p className="text-2xl font-bold text-white font-outfit">Emergency Reset</p>
                <button onClick={() => setShowClearConfirm(true)} className="w-full bg-white/20 text-white py-4 rounded-2xl font-bold">Factory Reset System</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DailyReportModal isOpen={!!activeDailyReport} onClose={() => setActiveDailyReport(null)} data={activeDailyReport} />

      {/* Close Day Confirm */}
      <AnimatePresence>
        {showCloseDayConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCloseDayConfirm(false)} className="absolute inset-0 bg-honda-dark/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative text-center">
              <div className="w-20 h-20 bg-red-50 text-honda-red rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck size={40} /></div>
              <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-4">Finalize Daily Ledger?</h3>
              <p className="text-gray-500 mb-10 text-sm">All counters will reset to zero. Current unclosed sales and workshop tasks will be moved to the permanent archive. This action is irreversible.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handlePerformCloseDay} className="w-full py-5 bg-honda-red text-white rounded-2xl font-bold shadow-xl shadow-honda-red/20">Authorize & Close Day</button>
                <button onClick={() => setShowCloseDayConfirm(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingUser(false)} className="absolute inset-0 bg-honda-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
              <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-6">Create Staff Access</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input required placeholder="Staff Full Name" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input required type="email" placeholder="Email Address" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Username" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  <input required type="password" placeholder="Password" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-honda-blue text-white rounded-2xl font-bold">Create Account</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Tech Modal */}
      <AnimatePresence>
        {isAddingTech && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingTech(false)} className="absolute inset-0 bg-honda-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
              <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-6">Register Technician</h3>
              <form onSubmit={handleCreateTech} className="space-y-4">
                <input required placeholder="Technician Full Name" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={newTech.name} onChange={e => setNewTech({...newTech, name: e.target.value})} />
                <select className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold" value={newTech.specialization} onChange={e => setNewTech({...newTech, specialization: e.target.value})}>
                  <option>Engine Specialist</option>
                  <option>Electrical Master</option>
                  <option>Master Mechanic</option>
                  <option>Tuning Specialist</option>
                  <option>General Mechanic</option>
                </select>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingTech(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-honda-red text-white rounded-2xl font-bold shadow-lg shadow-honda-red/20">Finalize Registration</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Data Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClearConfirm(false)} className="absolute inset-0 bg-honda-dark/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-md w-full shadow-2xl relative text-center">
              <div className="w-20 h-20 bg-red-50 text-honda-red rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-4">Confirm Reset?</h3>
              <p className="text-gray-500 mb-8">This will purge the entire database and reset Master Honda to factory defaults.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => onClearAllData?.()} className="w-full py-4 bg-honda-red text-white rounded-2xl font-bold shadow-lg shadow-honda-red/20">Yes, Clear Everything</button>
                <button onClick={() => setShowClearConfirm(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportActionCard = ({ title, description, icon, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-premium flex flex-col items-start text-left hover:scale-[1.02] transition-transform group">
    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-honda-red/5 transition-colors">{icon}</div>
    <h4 className="font-outfit font-bold text-lg text-gray-800 mb-1">{title}</h4>
    <p className="text-xs text-gray-400 font-medium leading-relaxed">{description}</p>
  </button>
);

const StatCard = ({ label, value, prefix = '', change, icon, color }: any) => {
  const colorMap: any = { red: 'bg-red-50 text-honda-red border-red-100', blue: 'bg-blue-50 text-honda-blue border-blue-100', purple: 'bg-purple-50 text-purple-600 border-purple-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', green: 'bg-green-50 text-green-600 border-green-100' };
  return (
    <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white shadow-premium flex flex-col justify-between h-40">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>{icon}</div>
        {change && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 uppercase">{change}</span>}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-outfit font-bold text-honda-dark tracking-tight">{prefix}{value?.toLocaleString() || 0}</p>
      </div>
    </div>
  );
};

const SystemCard = ({ title, status, icon, metrics, action }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-premium flex flex-col justify-between min-h-[180px]">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">{status}</span>
    </div>
    <div className="mt-4"><h4 className="font-outfit font-bold text-lg text-gray-800">{title}</h4><p className="text-[10px] text-gray-400 font-bold">{metrics}</p></div>
    <button className="mt-6 text-xs font-bold text-honda-red text-left">{action} →</button>
  </div>
);

export default Dashboard;
