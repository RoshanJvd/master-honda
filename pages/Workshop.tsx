
import React, { useState, useMemo } from 'react';
import { 
  Wrench, Clock, CheckCircle2, User, MoreHorizontal, 
  AlertCircle, Plus, Trash2, Search, TrendingUp, Calendar, CheckCircle, FileText, PlusCircle, Hammer,
  Package
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ServiceJob, Part, InventoryLog, Technician, AdditionalService } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from '../components/InvoiceModal.tsx';
import { logger } from '../services/logger.ts';

interface WorkshopProps {
  workshop: ServiceJob[];
  setWorkshop: React.Dispatch<React.SetStateAction<ServiceJob[]>>;
  parts: Part[];
  updateStock: (id: string, change: number, reason: InventoryLog['reason'], refId?: string) => void;
  technicians: Technician[];
}

const Workshop: React.FC<WorkshopProps> = ({ workshop, setWorkshop, parts, updateStock, technicians }) => {
  const [activeTab, setActiveTab] = useState<'floor' | 'analytics'>('floor');
  const [finishingJob, setFinishingJob] = useState<ServiceJob | null>(null);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; partName: string; quantity: number; price: number }[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<ServiceJob | null>(null);
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);

  const [newJob, setNewJob] = useState({
    customerName: '',
    bikeModel: '',
    serviceType: '',
    servicePrice: 400,
    mechanic: technicians[0]?.name || ''
  });

  const updateStatus = (id: string, newStatus: ServiceJob['status']) => {
    if (newStatus === 'COMPLETED') {
      const job = workshop.find(j => j.id === id);
      if (job) {
        setFinishingJob(job);
        setAdditionalServices([]);
        setSelectedParts([]);
      }
      return;
    }
    setWorkshop(prev => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
  };

  const handleCompleteFinishing = () => {
    if (!finishingJob) return;
    try {
      selectedParts.forEach(p => { 
        updateStock(p.partId, -p.quantity, 'WORKSHOP', finishingJob.id); 
      });
      
      const updatedJob: ServiceJob = { 
        ...finishingJob, 
        status: 'COMPLETED', 
        partsUsed: selectedParts,
        additionalServices: additionalServices
      };
      
      setWorkshop(prev => prev.map(job => job.id === finishingJob.id ? updatedJob : job));
      setFinishingJob(null);
      setSelectedParts([]);
      setAdditionalServices([]);
      setActiveInvoice(updatedJob);
      logger.success("Workshop Job Completed & Billed", { id: finishingJob.id });
    } catch (err: any) { 
      alert(`Reconciliation failed: ${err.message}`); 
    }
  };

  const addManualService = () => {
    if (!newServiceName || newServicePrice <= 0) return;
    setAdditionalServices(prev => [...prev, { name: newServiceName, price: newServicePrice }]);
    setNewServiceName('');
    setNewServicePrice(0);
  };

  const removeManualService = (index: number) => {
    setAdditionalServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.mechanic) return alert('Authorized Technician Selection Required');
    if (!newJob.serviceType) return alert('Service Type is required');
    const id = `W-${Date.now()}`;
    const job: ServiceJob = { ...newJob, id, status: 'QUEUED', startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: new Date().toISOString().split('T')[0] };
    setWorkshop(prev => [job, ...prev]);
    setIsAddingJob(false);
    setNewJob({ 
      customerName: '', 
      bikeModel: '', 
      serviceType: '', 
      servicePrice: 400, 
      mechanic: technicians[0]?.name || '' 
    });
  };

  const addPartToJob = (part: Part) => {
    const existing = selectedParts.find(p => p.partId === part.id);
    if (part.stock <= (existing?.quantity || 0)) return alert('Insufficient stock');
    setSelectedParts(prev => {
      if (existing) { return prev.map(p => p.partId === part.id ? { ...p, quantity: p.quantity + 1 } : p); }
      return [...prev, { partId: part.id, partName: part.name, quantity: 1, price: part.price }];
    });
  };

  const filteredParts = parts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const analytics = useMemo(() => {
    const completed = workshop.filter(j => j.status === 'COMPLETED');
    const today = new Date().toISOString().split('T')[0];
    const dailyRev = completed.filter(j => j.date === today).reduce((acc, j) => {
      const partsTotal = j.partsUsed?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;
      const extraServicesTotal = j.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0;
      return acc + j.servicePrice + partsTotal + extraServicesTotal;
    }, 0);
    const monthlyRev = completed.reduce((acc, j) => {
      const partsTotal = j.partsUsed?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;
      const extraServicesTotal = j.additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0;
      return acc + j.servicePrice + partsTotal + extraServicesTotal;
    }, 0);
    const serviceCounts: Record<string, number> = {};
    workshop.forEach(j => { serviceCounts[j.serviceType] = (serviceCounts[j.serviceType] || 0) + 1; });
    const serviceData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));
    return { dailyRev, monthlyRev, serviceData };
  }, [workshop]);

  const COLORS = ['#B02E15', '#171091', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-outfit font-bold text-honda-dark tracking-tight">Workshop Floor</h1><p className="text-gray-500">Live service tracking and technician assignments</p></div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex no-print">
            <button onClick={() => setActiveTab('floor')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'floor' ? 'bg-honda-dark text-white shadow-lg' : 'text-gray-400 hover:text-honda-dark'}`}>Floor Plan</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-honda-dark text-white shadow-lg' : 'text-gray-400 hover:text-honda-dark'}`}>Insights</button>
          </div>
          <button onClick={() => setIsAddingJob(true)} className="bg-honda-red text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-honda-red/20 flex items-center gap-2 no-print"><Plus size={20} /> New Service</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'floor' ? (
          <motion.div key="floor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatusColumn title="Queued" count={workshop.filter(j => j.status === 'QUEUED').length} icon={<Clock className="text-gray-400" size={20} />} jobs={workshop.filter(j => j.status === 'QUEUED')} onStatusUpdate={updateStatus} onViewInvoice={setActiveInvoice} />
            <StatusColumn title="In Progress" count={workshop.filter(j => j.status === 'IN_PROGRESS').length} icon={<Wrench className="text-honda-blue animate-pulse" size={20} />} jobs={workshop.filter(j => j.status === 'IN_PROGRESS')} onStatusUpdate={updateStatus} onViewInvoice={setActiveInvoice} />
            <StatusColumn title="Completed Today" count={workshop.filter(j => j.status === 'COMPLETED').length} icon={<CheckCircle2 className="text-green-500" size={20} />} jobs={workshop.filter(j => j.status === 'COMPLETED')} onStatusUpdate={updateStatus} onViewInvoice={setActiveInvoice} />
          </motion.div>
        ) : (
          <motion.div key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyticCard title="Daily Revenue" value={analytics.dailyRev} prefix="Rs. " icon={<TrendingUp size={20}/>} color="red" />
              <AnalyticCard title="Monthly Revenue" value={analytics.monthlyRev} prefix="Rs. " icon={<Calendar size={20}/>} color="blue" />
              <AnalyticCard title="Active Jobs" value={workshop.filter(w => w.status !== 'COMPLETED').length} icon={<Wrench size={20}/>} color="amber" />
              <AnalyticCard title="Efficiency" value={98.5} suffix="%" icon={<CheckCircle size={20}/>} color="green" />
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-premium">
              <h3 className="font-outfit font-bold text-gray-800 mb-6">Service Distribution</h3>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.serviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{analytics.serviceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingJob(false)} className="absolute inset-0 bg-honda-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
              <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-8">New Service Entry</h3>
              <form onSubmit={handleCreateJob} className="space-y-5">
                <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Customer Name" value={newJob.customerName} onChange={e => setNewJob({...newJob, customerName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Bike Model" value={newJob.bikeModel} onChange={e => setNewJob({...newJob, bikeModel: e.target.value})} />
                  <input required type="number" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Labor Charge" value={newJob.servicePrice} onChange={e => setNewJob({...newJob, servicePrice: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-1">Primary Service Type</label>
                   <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-honda-dark" placeholder="e.g. Engine Tuning, Chain Adjust" value={newJob.serviceType} onChange={e => setNewJob({...newJob, serviceType: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Manual Technician Selection</label>
                   <select className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-honda-dark" value={newJob.mechanic} onChange={e => setNewJob({...newJob, mechanic: e.target.value})}>
                     <option value="">Select Technician</option>
                     {technicians.map(tech => (
                       <option key={tech.id} value={tech.name}>{tech.name} ({tech.specialization})</option>
                     ))}
                   </select>
                </div>
                <button type="submit" className="w-full py-4 bg-honda-red text-white rounded-2xl font-bold">Add to Queue</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finishingJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFinishingJob(null)} className="absolute inset-0 bg-honda-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-6 lg:p-10 max-w-6xl w-full shadow-2xl relative flex flex-col max-h-[95vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-outfit font-bold text-honda-dark mb-1">Final Billing: {finishingJob.customerName}</h3>
                  <div className="flex gap-4">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Base Labor: Rs. {finishingJob.servicePrice.toLocaleString()}</p>
                    <p className="text-xs text-honda-red uppercase font-bold tracking-widest">{finishingJob.bikeModel}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
                {/* Parts Search */}
                <div className="flex flex-col overflow-hidden bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="text-honda-red" size={18} />
                    <h4 className="font-bold text-sm text-gray-800">Inventory Catalog</h4>
                  </div>
                  <input type="text" placeholder="Search spare parts..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm mb-4 outline-none focus:ring-2 focus:ring-honda-red/10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {filteredParts.map(part => (
                      <button key={part.id} onClick={() => addPartToJob(part)} disabled={part.stock <= 0} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-honda-red/20 flex justify-between items-center group disabled:opacity-50">
                        <div><p className="text-sm font-bold text-gray-800">{part.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">Rs. {part.price.toLocaleString()} • In Stock: {part.stock}</p></div>
                        <Plus size={18} className="text-honda-red opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Service Input */}
                <div className="flex flex-col overflow-hidden bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                   <div className="flex items-center gap-2 mb-4">
                    <Hammer className="text-honda-blue" size={18} />
                    <h4 className="font-bold text-sm text-gray-800">Add Extra Services</h4>
                  </div>
                  <div className="space-y-3 mb-4">
                    <input className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-honda-blue/10" placeholder="Service Name (e.g. Wash)" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                    <div className="flex gap-2">
                      <input type="number" className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-honda-blue/10" placeholder="Labor Fee" value={newServicePrice || ''} onChange={e => setNewServicePrice(Number(e.target.value))} />
                      <button onClick={addManualService} className="bg-honda-blue text-white px-4 rounded-2xl font-bold flex items-center justify-center hover:bg-honda-blue/90"><Plus size={20}/></button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {additionalServices.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div><p className="text-xs font-bold text-honda-dark">{s.name}</p><p className="text-[10px] text-gray-400 font-bold">Rs. {s.price.toLocaleString()}</p></div>
                        <button onClick={() => removeManualService(idx)} className="text-gray-300 hover:text-honda-red p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {additionalServices.length === 0 && <p className="text-center text-[10px] text-gray-400 font-bold uppercase py-10 italic">No extra labor added</p>}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-honda-dark p-6 rounded-[32px] flex flex-col overflow-hidden shadow-2xl">
                  <h4 className="text-white font-outfit font-bold text-lg mb-6">Master Bill Summary</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                       <p className="text-sm font-bold text-white">Primary: {finishingJob.serviceType}</p>
                       <span className="text-white font-bold text-sm">Rs. {finishingJob.servicePrice.toLocaleString()}</span>
                    </div>
                    {additionalServices.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xs font-medium text-white/80">{s.name}</p>
                        <span className="text-white/80 font-bold text-xs">Rs. {s.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {selectedParts.map(p => (
                      <div key={p.partId} className="flex justify-between items-center bg-honda-red/10 p-4 rounded-2xl border border-honda-red/10">
                        <p className="text-xs font-medium text-honda-red">x{p.quantity} {p.partName}</p>
                        <span className="text-honda-red font-bold text-xs">Rs. {(p.price * p.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center"><span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Grand Total</span><span className="text-3xl font-outfit font-bold text-white">Rs. {(finishingJob.servicePrice + additionalServices.reduce((a, b) => a + b.price, 0) + selectedParts.reduce((a, b) => a + (b.price * b.quantity), 0)).toLocaleString()}</span></div>
                    <div className="flex gap-3 mt-8">
                      <button onClick={() => setFinishingJob(null)} className="flex-1 py-4 text-gray-400 font-bold hover:text-white transition-colors">Discard</button>
                      <button onClick={handleCompleteFinishing} className="flex-[2] py-4 bg-honda-red text-white rounded-2xl font-bold shadow-lg shadow-honda-red/20">Finalize & Print</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <InvoiceModal isOpen={!!activeInvoice} onClose={() => setActiveInvoice(null)} data={activeInvoice} />
    </div>
  );
};

const StatusColumn = ({ title, count, icon, jobs, onStatusUpdate, onViewInvoice }: any) => (
  <div className="flex flex-col h-[calc(100vh-250px)]">
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</div><h3 className="font-outfit font-bold text-gray-800 text-lg">{title}</h3></div>
      <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-honda-red border border-honda-red/10 shadow-sm">{count} JOBS</span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
      {jobs.map((job: any) => (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={job.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-premium hover:shadow-xl group relative">
          <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest font-mono">{job.id}</span>
             <div className="bg-honda-red/5 px-2 py-1 rounded text-[8px] font-bold text-honda-red uppercase tracking-wider">{job.mechanic}</div>
          </div>
          <h4 className="font-outfit font-bold text-honda-dark text-lg mb-1">{job.customerName}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-6">{job.bikeModel} • {job.serviceType}</p>
          <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-honda-red animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Status Active</span>
            </div>
            <div className="flex gap-2">
              {job.status === 'QUEUED' && ( <button onClick={() => onStatusUpdate(job.id, 'IN_PROGRESS')} className="px-4 py-2 bg-honda-blue text-white rounded-xl text-[10px] font-bold">START WORK</button> )}
              {job.status === 'IN_PROGRESS' && ( <button onClick={() => onStatusUpdate(job.id, 'COMPLETED')} className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-green-500/20">BILL CUSTOMER</button> )}
              {job.status === 'COMPLETED' && ( <button onClick={() => onViewInvoice(job)} className="p-2 text-honda-blue hover:bg-honda-blue/5 rounded-lg border border-transparent hover:border-honda-blue/10"><FileText size={20}/></button> )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const AnalyticCard = ({ title, value, prefix = '', suffix = '', icon, color }: any) => {
  const colorMap: any = { red: 'bg-red-50 text-honda-red border-red-100', blue: 'bg-blue-50 text-honda-blue border-blue-100', green: 'bg-green-50 text-green-600 border-green-100', amber: 'bg-amber-50 text-amber-600 border-amber-100' };
  return (
    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-premium flex flex-col justify-between h-40">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>{icon}</div>
      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p><p className="text-xl font-outfit font-bold text-honda-dark tracking-tight">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</p></div>
    </div>
  );
};

export default Workshop;
