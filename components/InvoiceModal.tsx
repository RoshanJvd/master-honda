
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, Loader2 } from 'lucide-react';
import { Sale, ServiceJob } from '../types';
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
    e.stopPropagation();
    setIsProcessing(true);
    logger.info("Printing Invoice", { id: invoiceNumber });
    
    setTimeout(() => {
      window.print();
      setIsProcessing(false);
    }, 150);
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
            className="fixed inset-0 bg-honda-dark/90 backdrop-blur-sm print:hidden" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 10 }} 
            className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:max-w-none print:fixed print:inset-0 print:z-[300] print:bg-white"
          >
            {/* Header Controls */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between print:hidden bg-white z-[50]">
              <div className="flex flex-col">
                <span className="font-outfit font-bold text-gray-800 text-[10px] uppercase tracking-tighter">Thermal Print Preview</span>
                <span className="text-[8px] text-honda-red font-bold uppercase tracking-widest">Master Honda Official</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={triggerPrint}
                  disabled={isProcessing}
                  className="p-2.5 bg-honda-red text-white rounded-xl hover:bg-honda-red/90 transition-all flex items-center gap-2 font-bold text-[10px] disabled:opacity-50"
                > 
                  {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                  PRINT
                </button>
                <button 
                  onClick={onClose} 
                  className="p-2 text-gray-400 hover:text-honda-red transition-colors"
                > 
                  <X size={20} /> 
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-8 print:p-0 thermal-invoice bg-white">
              {/* Top Header */}
              <div className="text-center mb-6">
                <h1 className="text-[22px] font-black text-black tracking-tight leading-none mb-1">MASTER HONDA</h1>
                <p className="text-[9px] font-bold text-black uppercase">HIGHWAY ROAD, FORT ABBAS</p>
                <p className="text-[11px] font-bold text-black mt-0.5">+92 349 3700048</p>
              </div>

              {/* Transaction Metadata Box */}
              <div className="border border-dashed border-black p-3 mb-6 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-black">
                  <span className="uppercase">INVOICE ID:</span>
                  <span className="font-mono">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-black">
                  <span className="uppercase">ISSUE DATE:</span>
                  <span>{date}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-black border-t border-dashed border-black/10 pt-1.5 mt-1.5">
                  <span className="uppercase">CUSTOMER:</span>
                  <span className="truncate max-w-[160px]">{data.customerName.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-black">
                  <span className="uppercase">BIKE UNIT:</span>
                  <span className="truncate">{data.bikeModel.toUpperCase()}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 mb-6">
                <div className="border-b border-black pb-1">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span>DESCRIPTION</span>
                    <span>AMT (RS)</span>
                  </div>
                </div>
                
                {/* Labor / Services */}
                {isService && (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-black text-[12px]">{data.serviceType.toUpperCase()}</p>
                      </div>
                      <span className="font-bold text-black text-[12px]">{data.servicePrice.toLocaleString()}</span>
                    </div>
                    {data.additionalServices?.map((s, idx) => (
                      <div key={`s-${idx}`} className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-black text-[12px]">{s.name.toUpperCase()}</p>
                        </div>
                        <span className="font-bold text-black text-[12px]">{s.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Spare Parts */}
                {(isService ? data.partsUsed : data.items)?.map((item, idx) => (
                  <div key={`p-${idx}`} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-black text-[12px] leading-tight">{item.partName.toUpperCase()}</p>
                      <p className="text-[9px] text-black font-medium mt-0.5">QTY: {item.quantity} X {item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-black text-[12px]">{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Grand Total Box */}
              <div className="border border-dashed border-black p-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-black uppercase">GRAND TOTAL</span>
                  <span className="text-[24px] font-black text-black">Rs. {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Footer Section */}
              <div className="text-center space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-black">Visit Again Master Honda</p>
                  <p className="text-[9px] text-black italic font-medium">"The Power of Dreams"</p>
                </div>
                
                <div className="pt-8 flex flex-col items-center">
                   <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1">AUTHORIZED SIGNATURE</p>
                  <div className="w-40 border-b border-dashed border-black/50"></div>
                </div>
                
                <div className="pt-4 opacity-30">
                  <p className="text-[6px] text-black font-mono">**********************************</p>
                  <p className="text-[7px] text-black uppercase tracking-[0.4em] font-bold">MASTER HONDA ENTERPRISE OS</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;
