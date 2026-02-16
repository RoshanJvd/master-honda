
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wrench, 
  MessageSquareText, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Part, Sale, ServiceJob } from './types';

export const INITIAL_INVENTORY: Part[] = [
  { id: '1', name: 'Engine Oil 10W-30 (1L)', partNumber: '08232-M99-K1L', category: 'Engine', stock: 45, price: 1850, minStock: 20, lastUpdated: '2024-05-20' },
  { id: '2', name: 'Front Brake Pad Set', partNumber: '06455-KRE-K01', category: 'Braking', stock: 12, price: 4200, minStock: 15, lastUpdated: '2024-05-20' },
  { id: '3', name: 'Spark Plug CPR7EA-9', partNumber: '31917-KPH-901', category: 'Electrical', stock: 80, price: 850, minStock: 30, lastUpdated: '2024-05-20' },
  { id: '4', name: 'Drive Chain Kit (DID)', partNumber: '06401-KWB-601', category: 'Chassis', stock: 8, price: 9500, minStock: 10, lastUpdated: '2024-05-20' },
  { id: '5', name: 'Air Filter Element', partNumber: '17210-K12-900', category: 'Engine', stock: 22, price: 2400, minStock: 15, lastUpdated: '2024-05-20' },
];

export const INITIAL_SALES: Sale[] = [
  { 
    id: 'S1', 
    customerName: 'Ahmad Khan', 
    bikeModel: 'CB150F', 
    items: [{ partId: '1', partName: 'Engine Oil 10W-30 (1L)', quantity: 1, price: 1850 }], 
    subtotal: 1850,
    tax: 0,
    total: 1850, 
    date: '2024-05-20', 
    status: 'PAID',
    createdBy: 'A1'
  },
  { 
    id: 'S2', 
    customerName: 'Zubair Ali', 
    bikeModel: 'CG125 Self', 
    items: [{ partId: '2', partName: 'Front Brake Pad Set', quantity: 1, price: 4200 }], 
    subtotal: 4200,
    tax: 0,
    total: 4200, 
    date: '2024-05-21', 
    status: 'PENDING',
    createdBy: 'A1'
  },
];

const today = new Date().toISOString().split('T')[0];

export const INITIAL_WORKSHOP: ServiceJob[] = [
  { id: 'W1', customerName: 'Haris Mansoor', bikeModel: 'CB150F', serviceType: 'Tuning', servicePrice: 1500, mechanic: 'Carlos', status: 'IN_PROGRESS', startTime: '09:00 AM', date: today },
  { id: 'W2', customerName: 'Saad Sultan', bikeModel: 'CD70 Dream', serviceType: 'Oil Change', servicePrice: 400, mechanic: 'Dave', status: 'QUEUED', startTime: '10:30 AM', date: today },
  { id: 'W3', customerName: 'Bilal Ahmed', bikeModel: 'CB125F', serviceType: 'Brake Service', servicePrice: 800, mechanic: 'Carlos', status: 'COMPLETED', startTime: '08:00 AM', date: today, partsUsed: [{ partId: '2', partName: 'Front Brake Pad Set', quantity: 1, price: 4200 }] },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'workshop', label: 'Workshop', icon: Wrench },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquareText },
];
