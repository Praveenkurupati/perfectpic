// apps/backend/src/services/ProductionService.ts
import { OrderRepository } from '../repositories/OrderRepository';
import { printRenderQueue, QueueManager } from '../queues/QueueManager';
import { logger } from '../utils/logger';

export class ProductionService {
  /**
   * Retrieves live production fulfillment kanban pipeline and queue statistics.
   * Replaces modulo simulation with true database document status mappings and active queue jobs.
   */
  public static async getProductionQueue() {
    const { orders } = await OrderRepository.findAll({ limit: 200 });

    const columns = [
      { id: "pending", name: "Awaiting PDF", count: 0, items: [] as any[] },
      { id: "rendering", name: "Rendering", count: 0, items: [] as any[] },
      { id: "printing", name: "Printing", count: 0, items: [] as any[] },
      { id: "qc", name: "Quality Check", count: 0, items: [] as any[] },
      { id: "ready", name: "Ready to Ship", count: 0, items: [] as any[] },
    ];

    const flatQueue: any[] = [];

    // Map order database status to kanban fulfillment column
    const mapStatusToColumnId = (status?: string): string => {
      const s = (status || '').toLowerCase();
      if (s === 'rendering' || s === 'queued_render') return 'rendering';
      if (s === 'printing' || s === 'in_production') return 'printing';
      if (s === 'qc' || s === 'quality_check' || s === 'inspected') return 'qc';
      if (s === 'ready' || s === 'ready_to_ship' || s === 'dispatched' || s === 'delivered') return 'ready';
      return 'pending'; // default: 'created', 'paid', 'pending'
    };

    const colMap: Record<string, typeof columns[0]> = {
      pending: columns[0]!,
      rendering: columns[1]!,
      printing: columns[2]!,
      qc: columns[3]!,
      ready: columns[4]!,
    };

    orders.forEach((o: any) => {
      const orderNum = o.orderNumber || o.id || o._id;
      const status = (o.status || 'pending').toLowerCase();
      const colId = mapStatusToColumnId(status);
      const targetCol = colMap[colId] || columns[0]!;

      const item = {
        id: String(orderNum),
        orderNumber: String(orderNum),
        title: o.title || 'Archival Photobook',
        customerName: o.customerName || o.shippingAddress?.fullName || 'Customer',
        dimensions: o.dimensions || '8.25" × 8.25"',
        pages: o.pageCount || 40,
        status: colId,
        dueDate: o.estimatedDeliveryDate || 'Standard Delivery',
        thumbnail: o.thumbnail || (o.items && o.items[0]?.thumbnail),
        createdAt: o.createdAt,
      };

      targetCol.count++;
      targetCol.items.push(item);
      flatQueue.push(item);
    });

    const queueStats = await QueueManager.getAllStats();

    return {
      columns,
      queue: flatQueue,
      stats: queueStats,
      totalOrders: orders.length,
    };
  }

  /**
   * Advances order through the fulfillment pipeline.
   * If advancing to 'rendering', automatically enqueues asynchronous 300 DPI compile job.
   */
  public static async advanceStatus(orderId: string, targetStatus: string) {
    logger.info(`[Production] Advancing order ${orderId} to status: ${targetStatus}`);

    const updated = await OrderRepository.updateStatus(orderId, targetStatus, {
      notes: `Production stage updated to: ${targetStatus}`,
    });

    // If order enters rendering stage, trigger asynchronous 300 DPI print worker
    if (targetStatus === 'rendering') {
      try {
        const job = await printRenderQueue.add('render-order-pdf', {
          orderId,
          customerEmail: (updated as any)?.customerEmail,
        });
        logger.info(`[Production] Dispatched render job ${job.id} for order ${orderId}`);
      } catch (queueErr: any) {
        logger.warn(`Could not enqueue print render job for ${orderId}:`, queueErr?.message);
      }
    }

    return updated;
  }
}

export default ProductionService;
