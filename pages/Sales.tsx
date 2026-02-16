
import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Trash2, CheckCircle, FileText, Package, ShieldAlert } from 'lucide-react';
import { Part, Sale, SaleItem, InventoryLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from '../components/InvoiceModal.tsx';
import { SaleSchema } from '../lib/schema.ts';
import { logger } from '../services/logger.ts';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  parts: Part[];
  updateStock: (id: string, change: number, reason: InventoryLog['reason'], refId?: string) => void;
}

const Sales: React.FC<SalesProps> = ({ sales, setSales, parts, updateStock }) => {
  const [isNewSale, setIsNewSale] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', bike: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (part: Part) => {
    const existing = cart.find(i => i.partId === part.id);
    const qtyInCart = existing ? existing.quantity : 0;
    
    if (part.stock <= qtyInCart) {
      logger.warn("Inventory limit reached in cart", { part: part.name });
      alert(`Insufficient stock for ${part.name}`);
      return;
    }

    setCart(prev => {
      if (existing) {
        return prev.map(i => i.partId === part.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { partId: part.id, partName: part.name, quantity: 1, price: part.price }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.partId !== id));

  const completeSale = () => {
    setValidationErrors([]);
    
    const validation = SaleSchema.safeParse({
      customerName: customer.name,
      bikeModel: customer.bike,
      items: cart.map(i => ({ partId: i.partId, quantity: i.quantity }))
    });

    if (!validation.success) {
      const errors = validation.error.issues.map(e => e.message);
      setValidationErrors(errors);
      return;
    }

    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const total = subtotal;
    const saleId = `S${sales.length + 1}`;

    try {
      cart.forEach(item => {
        updateStock(item.partId, -item.quantity, 'SALE', saleId);
      });

      const newSale: Sale = {
        id: saleId,
        customerName: customer.name,
        bikeModel: customer.bike,
        items: cart,
        subtotal,
        tax: 0,
        total,
        date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        createdBy: 'Master Honda'
      };

      setSales(prev => [newSale, ...prev]);
      setIsNewSale(false);
      setCart([]);
      setCustomer({ name: '', bike: '' });
      setActiveInvoice(newSale);
      logger.success("Sales transaction finalized", { saleId });
    } catch (err: any) {
      alert(`Transaction failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-outfit font-black text-honda-dark tracking-tighter">Sales Hub</h1>
          <p className="text-gray-500 font-medium">Atomic transaction processing and stock integrity</p>
        </div>
        {!isNewSale && (
          <button 
            onClick={() => setIsNewSale(true)}
            className="flex items-center gap-2 bg-honda-red text-white px-8 py-4 rounded-3xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-honda-red/20"
          >
            <Plus size={20} /> New Counter Sale
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isNewSale ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catalog Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-premium">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-outfit font-bold text-xl text-gray-800">Part Catalog</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search parts..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredParts.map(part => (
                    <button 
                      key={part.id}
                      onClick={() => addToCart(part)}
                      disabled={part.stock <= 0}
                      className="p-6 border border-gray-100 rounded-[28px] text-left hover:border-honda-red/30 hover:bg-honda-red/[0.02] transition-all flex justify-between items-center group disabled:opacity-40"
                    >
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{part.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                          Stock: {part.stock} • Rs. {part.price.toLocaleString()}
                        </p>
                      </div>
                      <Plus size={20} className="text-honda-red opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Terminal */}
            <div className="bg-honda-dark p-10 rounded-[48px] shadow-2xl h-fit sticky top-24">
              <h3 className="font-outfit font-bold text-2xl text-white mb-8 flex items-center gap-3">
                <ShoppingCart size={28} className="text-honda-red" />
                Terminal
              </h3>
              
              <div className="space-y-4 mb-8">
                <input 
                  placeholder="Customer Name"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-honda-red/50 transition-colors"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                />
                <input 
                  placeholder="Bike Model (e.g. CB150F)"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-honda-red/50 transition-colors"
                  value={customer.bike}
                  onChange={e => setCustomer({...customer, bike: e.target.value})}
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="mb-6 p-5 bg-honda-red/10 rounded-2xl border border-honda-red/20">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-honda-red uppercase mb-1 last:mb-0">
                      <ShieldAlert size={12} /> {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 mb-10 min-h-[120px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.partId} className="flex justify-between items-center group bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">x{item.quantity} {item.partName}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.partId)} className="p-2 text-gray-500 hover:text-honda-red transition-all">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-white/20 gap-3">
                    <Package size={40} strokeWidth={1}/>
                    <p className="text-xs font-bold uppercase tracking-widest">Cart is empty</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Gross total</span>
                  <span className="text-3xl font-outfit font-black text-white">Rs. {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={completeSale}
                    disabled={cart.length === 0}
                    className="w-full py-5 bg-honda-red text-white rounded-2xl font-bold shadow-xl shadow-honda-red/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100"
                  >
                    Authorize & Finish
                  </button>
                  <button onClick={() => setIsNewSale(false)} className="w-full py-4 text-xs font-bold text-gray-500 hover:text-white transition-colors">Abort Transaction</button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[48px] shadow-premium border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                    <th className="px-10 py-8">TXN ID</th>
                    <th className="px-10 py-8">Client</th>
                    <th className="px-10 py-8">Unit Model</th>
                    <th className="px-10 py-8 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-all group">
                      <td className="px-10 py-8 text-xs font-mono font-black text-gray-400">{sale.id}</td>
                      <td className="px-10 py-8 font-black text-honda-dark uppercase tracking-tight">{sale.customerName}</td>
                      <td className="px-10 py-8">
                        <span className="text-xs font-bold text-gray-500 uppercase bg-gray-100 px-3 py-1.5 rounded-lg">{sale.bikeModel}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => setActiveInvoice(sale)}
                          className="p-4 text-honda-red hover:bg-honda-red/5 rounded-2xl transition-all border border-transparent hover:border-honda-red/10"
                        >
                          <FileText size={22}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-gray-300">
                          <ShoppingCart size={64} strokeWidth={1} />
                          <p className="font-bold uppercase tracking-widest text-xs">No transactions recorded in this shift</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvoiceModal 
        isOpen={!!activeInvoice}
        onClose={() => setActiveInvoice(null)}
        data={activeInvoice}
      />
    </div>
  );
};

export default Sales;
