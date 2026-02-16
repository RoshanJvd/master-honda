
/**
 * Mock Database client for browser compatibility.
 * Replaces Prisma which is a server-side only library.
 */
export const db = {
  $transaction: async (cb: any) => await cb(db),
  workshopTransaction: {
    create: async (data: any) => {
      console.log("Mock DB: Transaction Created", data);
      return { id: 'MOCK-ID' };
    }
  },
  sparePart: {
    update: async (data: any) => {
      console.log("Mock DB: Part Updated", data);
      return { id: data.where.id, quantityInStock: 10 };
    }
  }
};

export async function processWorkshopJob(data: any) {
  console.log("Mock DB: Processing Job", data);
  return { id: 'MOCK-JOB-ID' };
}
