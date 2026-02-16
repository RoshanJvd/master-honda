
export type UserRole = 'SUPER_ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface StaffAccount extends User {
  password: string;
}

export interface Technician {
  id: string;
  name: string;
  specialization: string;
  status: 'ACTIVE' | 'ON_BREAK' | 'OFF_DUTY';
  joinedDate: string;
}

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  category: 'Engine' | 'Braking' | 'Electrical' | 'Chassis' | 'Accessories';
  stock: number;
  price: number;
  costPrice?: number;
  minStock: number;
  lastUpdated: string;
}

export interface InventoryLog {
  id: string;
  partId: string;
  partName: string;
  change: number;
  reason: 'SALE' | 'WORKSHOP' | 'ADJUSTMENT' | 'RESTOCK';
  referenceId?: string;
  date: string;
  user: string;
}

export interface AppNotification {
  id: string;
  type: 'LOW_STOCK' | 'REVENUE' | 'WORKSHOP' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SaleItem {
  partId: string;
  partName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerName: string;
  bikeModel: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  status: 'PAID' | 'PENDING';
  createdBy: string;
}

export interface AdditionalService {
  name: string;
  price: number;
}

export interface ServiceJob {
  id: string;
  customerName: string;
  bikeModel: string;
  serviceType: string;
  servicePrice: number; // Primary labor cost
  mechanic: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED';
  startTime: string;
  date: string;
  partsUsed?: { partId: string; partName: string; quantity: number; price: number }[];
  additionalServices?: AdditionalService[];
}

export interface DailyReport {
  id: string;
  date: string;
  closedAt: string;
  totalSales: number;
  totalWorkshop: number;
  grossRevenue: number;
  salesCount: number;
  jobsCount: number;
  partsSoldVolume: number;
}

export type View = 'dashboard' | 'inventory' | 'sales' | 'workshop' | 'assistant' | 'settings';
