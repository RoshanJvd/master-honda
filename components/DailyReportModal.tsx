
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, X, CheckCircle2, FileText, Loader2, TrendingUp, Package, Wrench, Briefcase } from 'lucide-react';
import { DailyReport } from '../types';
import Logo from './Logo.tsx';
import { logger } from '../services/logger.ts';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DailyReport | null;
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, data }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!data) return null;

  const triggerPrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    logger.info("Initializing Daily Ledger PDF Generation", { date: data.date });
    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-honda-dark/95 backdrop-blur-md print:hidden" />
          
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:max-w-none print:fixed print:inset-0 print:z-[300] print:bg-white">
            
            <div className="p-4 border-b border-gray-100 flex items-center justify-between print:hidden">
              <span className="text-[10px] font-bold text-honda-red uppercase tracking-widest">Master Honda Ledger</span>
              <div className="flex gap-2">
                <button onClick={triggerPrint} className="p-2 bg-honda-dark text-white rounded-xl hover:bg-black flex items-center gap-2 font-bold text-[10px]">
                  {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />} SAVE REPORT
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
            </div>

            <div className="p-8 print:p-0 thermal-invoice">
              <div className="text-center mb-6">
                <div className="scale-[0.8] mb-2"><Logo size="sm" showText={false} /></div>
                <h1 className="text-[18px] font-outfit font-bold text-black uppercase tracking-tight">DAILY SHIFT REPORT</h1>
                <p className="text-[11px] font-bold text-gray-600 uppercase mt-1">FOR: {new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              <div className="border-y border-dashed border-black py-4 mb-6 space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase"><span>Status:</span><span className="text-green-600">SHIFT CLOSED</span></div>
                <div className="flex justify-between text-[11px] font-bold uppercase"><span>Timestamp:</span><span>{new Date(data.closedAt).toLocaleTimeString()}</span></div>
                <div className="flex justify-between text-[11px] font-bold uppercase"><span>Ledger ID:</span><span className="font-mono">{data.id}</span></div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-[10px] font-black uppercase text-center border-b border-black pb-1 mb-3">Revenue Summary</h3>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Parts Sales ({data.salesCount})</span>
                  <span className="font-bold text-black text-[12px]">Rs. {data.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Workshop ({data.jobsCount})</span>
                  <span className="font-bold text-black text-[12px]">Rs. {data.totalWorkshop.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Parts Volume</span>
                  <span className="font-bold text-black text-[12px]">{data.partsSoldVolume} units</span>
                </div>
              </div>

              <div className="bg-black/5 p-4 rounded-xl border border-black/10 mb-8">
                 <div className="flex justify-between items-center">
                   <span className="text-[12px] font-black uppercase">Gross Total</span>
                   <span className="text-[20px] font-bold">Rs. {data.grossRevenue.toLocaleString()}</span>
                 </div>
              </div>

              <div className="text-center space-y-4">
                 <p className="text-[10px] font-bold text-gray-500 uppercase italic">"Ensuring absolute accountability"</p>
                 <div className="pt-8 flex flex-col items-center">
                   <div className="w-32 h-[1px] bg-black mb-1"></div>
                   <span className="text-[8px] font-bold text-black uppercase">Official Seal & Signature</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DailyReportModal;
