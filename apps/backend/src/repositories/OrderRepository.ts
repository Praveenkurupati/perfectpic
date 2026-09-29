// apps/backend/src/repositories/OrderRepository.ts
import mongoose from 'mongoose';
import { Order, IOrder } from '../db/models/Order';
import { User } from '../db/models/User';
import { Product } from '../db/models/Product';
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
  public static async findAll(filter: { status?: string; search?: string; customerEmail?: string; limit?: number; skip?: number }) {
    const { status, search, customerEmail, limit = 50, skip = 0 } = filter;

    try {
      if (isDbConnected()) {
        const query: any = {};
        if (status && status !== 'all') {
          query.status = new RegExp(`^${status}$`, 'i');
        }
        if (customerEmail) {
          query.customerEmail = new RegExp(`^${customerEmail.trim()}$`, 'i');
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
    if (customerEmail) {
      filtered = filtered.filter((o) => o.customerEmail?.toLowerCase() === customerEmail.toLowerCase());
    }
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
    let activeCustomers = 42;
    let recent = mockOrders;
    let pipelineCounts: Record<string, number> = {
      pending: 3,
      confirmed: 2,
      production: 4,
      printing: 5,
      qc: 2,
      dispatched: 3,
      delivered: 8,
    };
    let topProducts = [
      { title: 'Kerala Gods Own Country', units: 48, revenue: 95952, category: 'South India' },
      { title: 'Netravati Peak Cloud Trails', units: 42, revenue: 83958, category: 'South India' },
      { title: 'Himalayan Summit Chronicles', units: 36, revenue: 89964, category: 'Himalayas' },
      { title: 'Paris Journey Hardcover', units: 32, revenue: 63968, category: 'Global' },
      { title: 'Rajasthan Land of Kings', units: 28, revenue: 69972, category: 'Heritage' },
    ];
    let topCities = [
      { city: 'Bengaluru', orders: 420, revenue: 840000, share: 34 },
      { city: 'Mumbai', orders: 280, revenue: 560000, share: 23 },
      { city: 'New Delhi', orders: 210, revenue: 420000, share: 17 },
      { city: 'Pune', orders: 125, revenue: 250000, share: 10 },
      { city: 'Hyderabad', orders: 110, revenue: 220000, share: 9 },
    ];

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

        const pending = await Order.countDocuments({ status: { $in: ['pending', 'production', 'printing', 'qc'] } });
        pendingPrints = pending;

        // User count
        const userCount = await User.countDocuments();
        if (userCount > 0) activeCustomers = userCount;

        // Pipeline aggregation
        const stageAgg = await Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        stageAgg.forEach((s: any) => {
          if (s._id) pipelineCounts[s._id] = s.count;
        });

        // Top products aggregation
        const prodAgg = await Order.aggregate([
          { $group: { _id: '$title', units: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { revenue: -1 } },
          { $limit: 5 }
        ]);
        if (prodAgg && prodAgg.length > 0) {
          topProducts = prodAgg.map((p: any) => ({
            title: p._id || 'Custom Photobook Keepsake',
            units: p.units,
            revenue: p.revenue,
            category: 'Luxury Edition',
          }));
        }

        // Top cities aggregation
        const cityAgg = await Order.aggregate([
          { $match: { 'shippingAddress.city': { $exists: true, $ne: '' } } },
          { $group: { _id: '$shippingAddress.city', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
          { $sort: { orders: -1 } },
          { $limit: 5 }
        ]);
        if (cityAgg && cityAgg.length > 0) {
          const totalCityOrders = cityAgg.reduce((acc: number, c: any) => acc + c.orders, 0) || 1;
          topCities = cityAgg.map((c: any) => ({
            city: c._id || 'Bengaluru',
            orders: c.orders,
            revenue: c.revenue,
            share: Math.round((c.orders / totalCityOrders) * 100),
          }));
        }

        const docs = await Order.find().sort({ createdAt: -1 }).limit(6);
        if (docs.length > 0) recent = docs as any;
      } catch (err: any) {
        logger.error('Error fetching aggregate dashboard stats:', err.message);
      }
    }

    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 2150;
    const repeatRate = 28.5; // Benchmark archival recurring rate

    const revenueData = [
      { name: "Apr", revenue: 190000, orders: 85, aov: 2235 },
      { name: "May", revenue: 240000, orders: 110, aov: 2181 },
      { name: "Jun", revenue: 290000, orders: 130, aov: 2230 },
      { name: "Jul", revenue: 340000, orders: 155, aov: 2193 },
      { name: "Aug", revenue: 395000, orders: 175, aov: 2257 },
      { name: "Sep", revenue: totalRevenue > 400000 ? totalRevenue : 465000, orders: totalOrders, aov: aov },
    ];

    return {
      summary: {
        totalRevenue,
        totalOrders,
        aov,
        activeCustomers,
        pendingPrints,
        repeatRate,
        grossMargin: '68.4%',
      },
      stats: [
        { 
          label: "Gross Revenue", 
          value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
          trend: "+14.8%", 
          trendUp: true,
          subtitle: "Direct online & studio sales"
        },
        { 
          label: "Total Orders", 
          value: totalOrders.toLocaleString('en-IN'), 
          trend: "+11.2%", 
          trendUp: true,
          subtitle: "100% Layflat photobooks"
        },
        { 
          label: "Average Order Value", 
          value: `₹${aov.toLocaleString('en-IN')}`, 
          trend: "+5.4%", 
          trendUp: true,
          subtitle: "High 10\" leather attachment"
        },
        { 
          label: "Active Collectors", 
          value: activeCustomers.toString(), 
          trend: "+18%", 
          trendUp: true,
          subtitle: "Registered verified users"
        },
      ],
      pipeline: pipelineCounts,
      topProducts,
      topCities,
      revenueData,
      recentOrders: recent,
    };
  }
}

export default OrderRepository;
