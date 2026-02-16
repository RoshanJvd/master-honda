
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, X, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { Sale, ServiceJob } from '../types';
import Logo from './Logo.tsx';
import { logger } from '../services/logger.ts';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Sale | ServiceJob | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, data }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!data) return null;

  const isService = 'serviceType' in data;
  const invoiceNumber = data.id.startsWith('INV-') ? data.id : `INV-${data.id.replace(/\D/g, '')}`;
  const date = 'date' in data ? data.date : new Date().toISOString().split('T')[0];

  const calculateTotal = () => {
    if (isService) {
      const partsTotal = data.partsUsed?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0;
      const extraServicesTotal = data.additionalServices?.reduce((acc, s) => acc + s.price, 0) || 0;
      return data.servicePrice + extraServicesTotal + partsTotal;
    }
    return data.total;
  };

  const triggerPrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Stop event from closing the modal
    
    setIsProcessing(true);
    logger.info("Initializing Printer Hardware (78mm Profile)", { id: invoiceNumber });
    
    // Tiny timeout to allow UI state (loading spinner) to render before browser blocks the UI thread with the print dialog
    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-honda-dark/95 backdrop-blur-md print:hidden" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:max-w-none print:fixed print:inset-0 print:z-[300] print:bg-white print:overflow-visible"
          >
            {/* Header / Actions */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between print:hidden sticky top-0 bg-white z-[50]">
              <div className="flex flex-col">
                <span className="font-outfit font-bold text-gray-800 text-[10px] uppercase tracking-tighter">Wide Thermal</span>
                <span className="text-[8px] text-green-600 font-bold uppercase tracking-widest">78mm Active</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={triggerPrint}
                  disabled={isProcessing}
                  className="p-2.5 bg-honda-dark text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 font-bold text-[10px] disabled:opacity-50"
                > 
                  {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                  PRINT RECEIPT
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }} 
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                > 
                  <X size={20} /> 
                </button>
              </div>
            </div>

            {/* Document Content - Optimized for 78mm wide strip */}
            <div className="p-6 overflow-y-auto print:p-0 print:overflow-visible thermal-invoice bg-white">
              {/* Receipt Header */}
              <div className="flex flex-col items-center text-center gap-1 mb-4 print:mb-2">
                <div className="scale-[0.8] mb-2 print:mb-0">
                  <Logo size="sm" showText={false} />
                </div>
                <div className="text-center">
                  <h1 className="text-[18px] font-outfit font-bold text-black print:text-[14pt] tracking-tight">MASTER HONDA</h1>
                  <p className="text-[10px] text-gray-600 print:text-[9pt] print:text-black font-bold uppercase">Highway Road, Fort Abbas</p>
                  <p className="text-[11px] font-bold text-black print:text-[10pt]">+92 349 3700048</p>
                </div>
              </div>

              {/* Transaction ID & Date */}
              <div className="border-y border-dashed border-black/20 py-3 mb-4 print:py-2 print:mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 print:text-[9pt] print:text-black">
                  <span>Invoice ID:</span>
                  <span className="text-black font-mono">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mt-1 print:text-[9pt] print:text-black">
                  <span>Issue Date:</span>
                  <span className="text-black">{date}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4 print:mb-2 space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 print:text-[9pt] print:text-black">
                  <span>Customer:</span>
                  <span className="text-black font-bold truncate max-w-[180px]">{data.customerName}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 print:text-[9pt] print:text-black">
                  <span>Bike Unit:</span>
                  <span className="text-black font-bold truncate">{data.bikeModel}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 mb-6 print:space-y-1 print:mb-3">
                <div className="border-b border-black pb-1">
                  <div className="flex justify-between text-[9px] font-black uppercase print:text-[8pt]">
                    <span>Description</span>
                    <span>Amt (Rs)</span>
                  </div>
                </div>
                
                {/* Services Section */}
                {isService && (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-black text-[11px] print:text-[10pt] leading-tight">{data.serviceType}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase print:text-[7pt] print:text-black">Primary Service</p>
                      </div>
                      <span className="font-bold text-black text-[11px] print:text-[10pt]">{data.servicePrice.toLocaleString()}</span>
                    </div>
                    {data.additionalServices?.map((s, idx) => (
                      <div key={`extra-${idx}`} className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-black text-[11px] print:text-[10pt] leading-tight">{s.name}</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase print:text-[7pt] print:text-black">Additional Labor</p>
                        </div>
                        <span className="font-bold text-black text-[11px] print:text-[10pt]">{s.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Parts Section */}
                {(isService ? data.partsUsed : data.items)?.map((item, idx) => (
                  <div key={`part-${idx}`} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-black text-[11px] print:text-[10pt] leading-tight">{item.partName}</p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase print:text-[7pt] print:text-black">Qty: {item.quantity} x {item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-black text-[11px] print:text-[10pt]">{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="border-t border-dashed border-black pt-3 mt-4 print:mt-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[11px] font-black uppercase print:text-[10pt]">Grand Total</span>
                  <span className="text-[20px] font-bold text-black print:text-[16pt]">Rs. {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="mt-8 text-center space-y-1 print:mt-4">
                <p className="text-[10px] font-bold text-black print:text-[9pt]">Visit Again Master Honda</p>
                <p className="text-[8px] text-gray-400 italic print:text-[7pt] print:text-black">"The Power of Dreams"</p>
                
                <div className="pt-6 print:pt-4 flex flex-col items-center">
                  <div className="w-24 h-[1px] bg-black mb-1"></div>
                  <span className="text-[8px] font-bold text-black uppercase print:text-[7pt]">Authorized Signature</span>
                </div>
              </div>
              
              <div className="hidden print:block text-center mt-4 opacity-10">
                <p className="text-[6pt] text-black font-mono">********************************</p>
                <p className="text-[6pt] text-black uppercase tracking-[0.3em]">Master Honda Enterprise OS</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;
