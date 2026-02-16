
import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Trash2, CheckCircle, FileText, AlertCircle, Package, ShieldAlert } from 'lucide-react';
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
      logger.warn("Sales validation failed", { errors });
      return;
    }

    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const total = subtotal; // VAT 10% REMOVED
    const saleId = `S${Date.now()}`;

    try {
      logger.info("Commencing sales transaction", { saleId });
      
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
      logger.error("Sales Transaction Aborted", { error: err.message });
      alert(`System Error: The transaction was aborted to prevent stock mismatch. ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-honda-dark tracking-tight">Sales Hub</h1>
          <p className="text-gray-500">Atomic transaction processing and stock integrity</p>
        </div>
        {!isNewSale && (
          <button 
            onClick={() => setIsNewSale(true)}
            className="flex items-center gap-2 bg-honda-red text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-honda-red/20"
          >
            <Plus size={20} /> New Counter Sale
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isNewSale ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-premium">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-outfit font-bold text-xl text-gray-800">Part Catalog</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search parts..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredParts.map(part => (
                    <button 
                      key={part.id}
                      onClick={() => addToCart(part)}
                      disabled={part.stock <= 0}
                      className="p-5 border border-gray-100 rounded-2xl text-left hover:border-honda-red/20 hover:bg-gray-50/50 transition-all flex justify-between items-center group disabled:opacity-40"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{part.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                          Stock: {part.stock} • Rs. {part.price.toLocaleString()}
                        </p>
                      </div>
                      <Plus size={20} className="text-honda-red opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-premium border border-gray-100 h-fit sticky top-24">
              <h3 className="font-outfit font-bold text-xl text-gray-800 mb-8 flex items-center gap-3">
                <ShoppingCart size={24} className="text-honda-red" />
                Checkout Terminal
              </h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Client Details</label>
                  <input 
                    placeholder="Customer Name"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-transparent focus:border-honda-red/10"
                    value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                  />
                </div>
                <input 
                  placeholder="Bike Model (e.g. CG125)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-transparent focus:border-honda-red/10"
                  value={customer.bike}
                  onChange={e => setCustomer({...customer, bike: e.target.value})}
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 space-y-1">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-honda-red uppercase">
                      <ShieldAlert size={12} /> {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 mb-10 min-h-[100px]">
                {cart.map(item => (
                  <div key={item.partId} className="flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-bold text-gray-800">x{item.quantity} {item.partName}</p>
                      <p className="text-[10px] font-bold text-gray-400">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.partId)} className="p-2 text-gray-400 hover:text-honda-red opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-300 gap-2">
                    <Package size={32} strokeWidth={1}/>
                    <p className="text-xs font-medium">Cart is empty</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-800">Rs. {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-2xl font-outfit font-bold border-t border-gray-100 pt-4 text-honda-dark">
                  <span>Total</span>
                  <span>Rs. {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button 
                  onClick={completeSale}
                  disabled={cart.length === 0}
                  className="w-full py-5 bg-honda-red text-white rounded-2xl font-bold shadow-lg shadow-honda-red/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                >
                  <CheckCircle size={20}/> Process Transaction
                </button>
                <button onClick={() => setIsNewSale(false)} className="w-full py-4 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Discard Session</button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[32px] shadow-premium border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    <th className="px-8 py-5">TXN ID</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Unit Model</th>
                    <th className="px-8 py-5">Gross Amount</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-mono font-bold text-gray-400">{sale.id}</td>
                      <td className="px-8 py-5 font-bold text-honda-dark">{sale.customerName}</td>
                      <td className="px-8 py-5 text-sm text-gray-500">{sale.bikeModel}</td>
                      <td className="px-8 py-5 font-bold text-honda-dark">Rs. {sale.total.toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 uppercase">
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setActiveInvoice(sale)}
                          className="p-3 text-honda-blue hover:bg-honda-blue/5 rounded-xl transition-all"
                        >
                          <FileText size={20}/>
                        </button>
                      </td>
                    </tr>
                  ))}
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
