// apps/backend/src/services/ProductionService.ts
import { OrderRepository } from '../repositories/OrderRepository';

export class ProductionService {
  public static async getProductionQueue() {
    const { orders } = await OrderRepository.findAll({ limit: 100 });

    const columns = [
      { id: "pending", name: "Awaiting PDF", count: 0, items: [] as any[] },
      { id: "rendering", name: "Rendering", count: 0, items: [] as any[] },
      { id: "printing", name: "Printing", count: 0, items: [] as any[] },
      { id: "qc", name: "Quality Check", count: 0, items: [] as any[] },
      { id: "ready", name: "Ready to Ship", count: 0, items: [] as any[] },
    ];

    orders.forEach((o: any, idx: number) => {
      const colIdx = idx % 5;
      const col = columns[colIdx]!;
      col.count++;
      col.items.push({
        id: o.orderNumber || o.id,
        size: o.dimensions || '8x8"',
        pages: `${o.pageCount || 40} Pages • Hardcover`,
        dueDate: 'Oct 28',
        thumbnail: o.thumbnail,
      });
    });

    return { columns };
  }

  public static async advanceStatus(orderId: string, targetStatus: string) {
    return await OrderRepository.updateStatus(orderId, targetStatus);
  }
}

export default ProductionService;
