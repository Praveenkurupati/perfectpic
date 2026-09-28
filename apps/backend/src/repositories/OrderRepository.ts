// apps/backend/src/repositories/OrderRepository.ts
import mongoose from 'mongoose';
import { Order, IOrder } from '../db/models/Order';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

const mockOrders = [
  {
    id: 'PP-8491',
    orderNumber: 'PP-8491',
    title: 'Paris Journey Hardcover',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    customerPhone: '+919876543210',
    date: '2026-09-25',
    createdAt: new Date('2026-09-25T10:30:00.000Z'),
    amount: 1999,
    total: 1999,
    status: 'production',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 40,
    dimensions: '8.25" × 8.25"',
  },
  {
    id: 'PP-7201',
    orderNumber: 'PP-7201',
    title: 'Our 1st Anniversary Keepsake',
    customerName: 'Rahul Verma',
    customerEmail: 'rahul@example.com',
    customerPhone: '+919876543211',
    date: '2026-08-14',
    createdAt: new Date('2026-08-14T14:15:00.000Z'),
    amount: 1999,
    total: 1999,
    status: 'delivered',
    thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 36,
    dimensions: '8.25" × 8.25"',
  },
  {
    id: 'PP-6350',
    orderNumber: 'PP-6350',
    title: 'Annapurna Base Camp Sanctuary',
    customerName: 'Ananya Rao',
    customerEmail: 'ananya@example.com',
    customerPhone: '+919876543212',
    date: '2026-07-02',
    createdAt: new Date('2026-07-02T09:00:00.000Z'),
    amount: 2999,
    total: 2999,
    status: 'dispatched',
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 48,
    dimensions: '10" × 10"',
  },
];

export class OrderRepository {
  public static async findAll(filter: { status?: string; search?: string; limit?: number; skip?: number }) {
    const { status, search, limit = 50, skip = 0 } = filter;

    try {
      if (isDbConnected()) {
        const query: any = {};
        if (status && status !== 'all') {
          query.status = new RegExp(`^${status}$`, 'i');
        }
        if (search) {
          const s = new RegExp(search.trim(), 'i');
          query.$or = [{ orderNumber: s }, { title: s }, { customerName: s }, { customerEmail: s }];
        }

        const orders = await Order.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        const total = await Order.countDocuments(query);
        return { orders, total };
      }
    } catch (err: any) {
      logger.error('OrderRepository findAll error:', err.message);
    }

    let filtered = [...mockOrders];
    if (status && status !== 'all') {
      filtered = filtered.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }
    return { orders: filtered, total: filtered.length };
  }

  public static async findById(idParam: string) {
    try {
      if (isDbConnected()) {
        let query: any = { orderNumber: idParam };
        if (mongoose.isValidObjectId(idParam)) {
          query = { $or: [{ _id: idParam }, { orderNumber: idParam }] };
        }
        const order = await Order.findOne(query);
        if (order) return order;
      }
    } catch (err: any) {
      logger.error('OrderRepository findById error:', err.message);
    }

    return mockOrders.find((o) => o.id === idParam || o.orderNumber === idParam) || null;
  }

  public static async create(orderData: any) {
    const orderNumber = orderData.orderNumber || 'PP-' + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      ...orderData,
      orderNumber,
      amount: orderData.amount || orderData.total || 1999,
      total: orderData.total || orderData.amount || 1999,
      status: orderData.status || 'confirmed',
    };

    if (isDbConnected()) {
      return await Order.create(payload);
    }

    const inMem = {
      id: orderNumber,
      _id: orderNumber,
      ...payload,
      createdAt: new Date(),
    };
    mockOrders.unshift(inMem as any);
    return inMem;
  }

  public static async updateStatus(idParam: string, status: string) {
    if (isDbConnected()) {
      let query: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        query = { $or: [{ _id: idParam }, { orderNumber: idParam }] };
      }
      return await Order.findOneAndUpdate(query, { status }, { new: true });
    }

    const index = mockOrders.findIndex((o) => o.id === idParam || o.orderNumber === idParam);
    if (index !== -1) {
      mockOrders[index]!.status = status;
      return mockOrders[index];
    }
    return null;
  }

  public static async getDashboardStats() {
    let totalRevenue = 1864500;
    let totalOrders = 1247;
    let pendingPrints = 23;
    let activeTickets = 8;
    let recent = mockOrders;

    if (isDbConnected()) {
      try {
        const count = await Order.countDocuments();
        if (count > 0) totalOrders = count;

        const agg = await Order.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
        ]);
        if (agg && agg.length > 0 && agg[0].totalRevenue) {
          totalRevenue = agg[0].totalRevenue;
        }

        const pending = await Order.countDocuments({ status: { $in: ['pending', 'production', 'printing'] } });
        pendingPrints = pending;

        const docs = await Order.find().sort({ createdAt: -1 }).limit(5);
        if (docs.length > 0) recent = docs as any;
      } catch (err: any) {
        logger.error('Error fetching aggregate dashboard stats:', err.message);
      }
    }

    const revenueData = [
      { month: "Jan", revenue: 120000, orders: 85 },
      { month: "Feb", revenue: 145000, orders: 98 },
      { month: "Mar", revenue: 160000, orders: 110 },
      { month: "Apr", revenue: 190000, orders: 135 },
      { month: "May", revenue: 220000, orders: 160 },
      { month: "Jun", revenue: 260000, orders: 185 },
      { month: "Jul", revenue: 310000, orders: 215 },
    ];

    return {
      stats: [
        { label: "Total Orders", value: totalOrders.toLocaleString('en-IN'), trend: "+12%", trendUp: true },
        { label: "Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, trend: "+8%", trendUp: true },
        { label: "Pending Prints", value: pendingPrints.toString(), trend: "-5%", trendUp: true },
        { label: "Active Tickets", value: activeTickets.toString(), trend: "+2", trendUp: false },
      ],
      recentOrders: recent,
      revenueData,
    };
  }
}

export default OrderRepository;
