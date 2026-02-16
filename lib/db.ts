
/**
 * Database client singleton for Master Honda.
 * Ensures only one connection pool is established in development.
 */
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Fixed: Replaced 'global' with 'globalThis' to fix "Cannot find name 'global'" error
export const db = (globalThis as any).prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = db;

/**
 * Example of an atomic transaction for processing a Workshop Transaction
 * to ensure stock mismatch never happens.
 */
export async function processWorkshopJob(data: {
  serviceId: string;
  handledById: string;
  parts: { id: string; qty: number }[];
  total: number;
}) {
  return await db.$transaction(async (tx) => {
    // 1. Create the transaction record
    const job = await tx.workshopTransaction.create({
      data: {
        serviceId: data.serviceId,
        handledById: data.handledById,
        totalAmount: data.total,
        status: 'COMPLETED',
        partsUsed: {
          create: data.parts.map(p => ({
            sparePartId: p.id,
            quantity: p.qty
          }))
        }
      }
    });

    // 2. Deduct stock for each part used
    for (const part of data.parts) {
      const updatedPart = await tx.sparePart.update({
        where: { id: part.id },
        data: {
          quantityInStock: {
            decrement: part.qty
          }
        }
      });

      // 3. Safety check
      if (updatedPart.quantityInStock < 0) {
        throw new Error(`Insufficient stock for part: ${updatedPart.partName}`);
      }
    }

    return job;
  });
}
