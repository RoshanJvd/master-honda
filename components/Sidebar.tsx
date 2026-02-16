
import React from 'react';
import { NAV_ITEMS } from '../constants.tsx';
import { View, UserRole } from '../types.ts';
import Logo from './Logo.tsx';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  userRole: UserRole;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, userRole, isMobileOpen, onClose }) => {
  const content = (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-6 right-6 p-2 text-gray-400 hover:text-honda-red transition-colors"
        >
          <X size={24} />
        </button>
      )}
      
      <div className="p-8 border-b border-gray-50">
        <Logo size="md" />
      </div>
      
      <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          const isDisabled = userRole === 'USER' && (item.id === 'settings');
          if (isDisabled) return null;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold group ${
                isActive 
                  ? 'bg-honda-red text-white shadow-xl shadow-honda-red/20' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-honda-red'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-honda-red/10'}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="bg-honda-dark p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-honda-red/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Production Hub</p>
          <p className="text-xs font-bold text-white mb-4">TROTECH HQ Sync</p>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-honda-red" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 z-50">
        {content}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen z-[60] lg:hidden"
          >
            {content}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
