
import { z } from 'zod';

export const PartSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  partNumber: z.string().min(5, "Valid Honda part number required"),
  category: z.enum(['Engine', 'Braking', 'Electrical', 'Chassis', 'Accessories']),
  stock: z.number().int().min(0),
  price: z.number().positive(),
  minStock: z.number().int().min(0),
});

export const SaleSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  bikeModel: z.string().min(2, "Bike model is required"),
  items: z.array(z.object({
    partId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, "At least one item required"),
});

export const ServiceJobSchema = z.object({
  customerName: z.string().min(2),
  bikeModel: z.string().min(2),
  serviceType: z.string().min(2, "Service type is required"),
  mechanic: z.string().min(2),
});
