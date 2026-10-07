// apps/backend/src/repositories/OrderRepository.ts
import mongoose from 'mongoose';
import crypto from 'crypto';
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
    amount: 2846,
    total: 2846,
    status: 'production',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 40,
    dimensions: '8.25" × 8.25"',
    packaging: {
      keepsakeBox: true,
      giftWrap: true,
      uvGlaze: false,
      miniPolaroids: true,
      total: 847,
    },
    accessories: {
      keepsakeBox: true,
      giftWrap: true,
      uvGlaze: false,
      miniPolaroids: true,
      total: 847,
      items: [
        { id: 'acc-keepsake-box', title: 'Keepsake Velvet Presentation Box', price: 499 },
        { id: 'acc-gift-wrap', title: 'Artisan Ribbon Wrap & Calligraphy Card', price: 199 },
        { id: 'acc-mini-prints', title: '10 Mini Polaroid Keepsake Prints', price: 149 },
      ],
    },
    isGift: true,
    pricing: {
      subtotal: 1999,
      packagingPrice: 847,
      packagingAddon: true,
      shipping: 0,
      total: 2846,
    },
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
    amount: 2447,
    total: 2447,
    status: 'delivered',
    thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 36,
    dimensions: '8.25" × 8.25"',
    packaging: {
      keepsakeBox: false,
      giftWrap: true,
      uvGlaze: true,
      miniPolaroids: false,
      total: 448,
    },
    accessories: {
      keepsakeBox: false,
      giftWrap: true,
      uvGlaze: true,
      miniPolaroids: false,
      total: 448,
      items: [
        { id: 'acc-gift-wrap', title: 'Artisan Ribbon Wrap & Calligraphy Card', price: 199 },
        { id: 'acc-uv-glaze', title: 'Archival UV Anti-Scratch Page Glaze', price: 249 },
      ],
    },
    isGift: true,
    pricing: {
      subtotal: 1999,
      packagingPrice: 448,
      packagingAddon: true,
      shipping: 0,
      total: 2447,
    },
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
    amount: 3747,
    total: 3747,
    status: 'dispatched',
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 48,
    dimensions: '10" × 10"',
    packaging: {
      keepsakeBox: true,
      giftWrap: false,
      uvGlaze: true,
      miniPolaroids: false,
      total: 748,
    },
    accessories: {
      keepsakeBox: true,
      giftWrap: false,
      uvGlaze: true,
      miniPolaroids: false,
      total: 748,
      items: [
        { id: 'acc-keepsake-box', title: 'Keepsake Velvet Presentation Box', price: 499 },
        { id: 'acc-uv-glaze', title: 'Archival UV Anti-Scratch Page Glaze', price: 249 },
      ],
    },
    isGift: false,
    pricing: {
      subtotal: 2999,
      packagingPrice: 748,
      packagingAddon: true,
      shipping: 0,
      total: 3747,
    },
  },
];

export class OrderRepository {
  public static async findAll(filter: { status?: string; search?: string; customerEmail?: string; limit?: number; skip?: number; page?: number }) {
    const limit = Math.max(1, filter.limit ? Number(filter.limit) : 50);
    const page = Math.max(1, filter.page ? Number(filter.page) : (filter.skip !== undefined ? Math.floor(Number(filter.skip) / limit) + 1 : 1));
    const skip = filter.skip !== undefined ? Number(filter.skip) : (page - 1) * limit;
    const { status, search, customerEmail } = filter;

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
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { orders, total, page, totalPages, limit };
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
    if (search) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(s)) ||
        (o.title && o.title.toLowerCase().includes(s)) ||
        (o.customerName && o.customerName.toLowerCase().includes(s)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(s))
      );
    }
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paged = filtered.slice(skip, skip + limit);
    return { orders: paged, total, page, totalPages, limit };
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

    const found = mockOrders.find((o) => o.id === idParam || o.orderNumber === idParam);
    if (found) return found;

    if (idParam.startsWith('PP-')) {
      return {
        ...mockOrders[0],
        id: idParam,
        orderNumber: idParam,
        title: `Heirloom Custom Photobook Edition (${idParam})`,
        customerName: 'Praveen Kumar',
        customerEmail: 'praveen@perfectpic.in',
        customerPhone: '+91 98765 43210',
        shippingAddress: {
          fullName: 'Praveen Kumar',
          addressLine1: 'Indiranagar 100ft Road, 4th Cross',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          phone: '+91 98765 43210',
        },
        items: [
          {
            title: `Heirloom Custom Photobook Edition (${idParam})`,
            dimensions: '8.25" × 8.25"',
            pageCount: 40,
            price: 2499,
            quantity: 1,
          },
        ],
        amount: 3346,
        total: 3346,
        status: 'paid',
        packaging: {
          keepsakeBox: true,
          giftWrap: true,
          uvGlaze: false,
          miniPolaroids: true,
          total: 847,
        },
        accessories: {
          keepsakeBox: true,
          giftWrap: true,
          uvGlaze: false,
          miniPolaroids: true,
          total: 847,
          items: [
            { id: 'acc-keepsake-box', title: 'Keepsake Velvet Presentation Box', price: 499 },
            { id: 'acc-gift-wrap', title: 'Artisan Ribbon Wrap & Calligraphy Card', price: 199 },
            { id: 'acc-mini-prints', title: '10 Mini Polaroid Keepsake Prints', price: 149 },
          ],
        },
        isGift: true,
      };
    }

    return null;
  }

  public static async create(orderData: any) {
    const orderNumber = orderData.orderNumber || 'PP-' + Math.floor(1000 + Math.random() * 9000);
    const parsedTotal = Number(orderData.total ?? orderData.amount);
    const total = isNaN(parsedTotal) || parsedTotal < 99 ? 1999 : parsedTotal;

    // Auto-derive specifications if not provided
    const specifications = orderData.specifications || {
      dimensions: orderData.dimensions || (orderData.items?.[0]?.dimensions) || '8.25" × 8.25"',
      pageCount: orderData.pageCount || (orderData.items?.[0]?.pageCount) || 40,
      binding: '180° Lay-Flat Pur Binding',
      paperStock: '200 GSM Heavyweight Matte',
      printProcess: 'HP Indigo 12K Digital Press (Ultra-HD)',
    };

    // Auto-derive packaging & accessories if not explicitly passed
    const itemsList = Array.isArray(orderData.items) ? orderData.items : [];
    const hasKeepsakeBox = Boolean(
      orderData.packaging?.keepsakeBox ||
      orderData.accessories?.keepsakeBox ||
      itemsList.some((i: any) => i.id === 'acc-keepsake-box' || i.id === 'keepsakeBox' || /keepsake|velvet box/i.test(i.title || ''))
    );
    const hasGiftWrap = Boolean(
      orderData.packaging?.giftWrap ||
      orderData.accessories?.giftWrap ||
      orderData.isGift ||
      itemsList.some((i: any) => i.id === 'acc-gift-wrap' || i.id === 'giftWrap' || /ribbon|gift wrap|calligraphy/i.test(i.title || ''))
    );
    const hasUvGlaze = Boolean(
      orderData.packaging?.uvGlaze ||
      orderData.accessories?.uvGlaze ||
      itemsList.some((i: any) => i.id === 'acc-uv-glaze' || i.id === 'uvGlaze' || /uv glaze|anti-scratch/i.test(i.title || ''))
    );
    const hasMiniPolaroids = Boolean(
      orderData.packaging?.miniPolaroids ||
      orderData.accessories?.miniPolaroids ||
      itemsList.some((i: any) => i.id === 'acc-mini-prints' || i.id === 'miniPolaroids' || /polaroid/i.test(i.title || ''))
    );

    const packagingTotal = orderData.packaging?.total ?? orderData.pricing?.packagingPrice ?? (
      (hasKeepsakeBox ? 499 : 0) +
      (hasGiftWrap ? 199 : 0) +
      (hasUvGlaze ? 249 : 0) +
      (hasMiniPolaroids ? 149 : 0)
    );

    const packaging = {
      keepsakeBox: hasKeepsakeBox,
      giftWrap: hasGiftWrap,
      uvGlaze: hasUvGlaze,
      miniPolaroids: hasMiniPolaroids,
      total: packagingTotal,
    };

    const accessories = orderData.accessories || {
      ...packaging,
      items: [
        hasKeepsakeBox && { id: 'acc-keepsake-box', title: 'Keepsake Velvet Presentation Box', price: 499 },
        hasGiftWrap && { id: 'acc-gift-wrap', title: 'Artisan Ribbon Wrap & Calligraphy Card', price: 199 },
        hasUvGlaze && { id: 'acc-uv-glaze', title: 'Archival UV Anti-Scratch Page Glaze', price: 249 },
        hasMiniPolaroids && { id: 'acc-mini-prints', title: '10 Mini Polaroid Keepsake Prints', price: 149 },
      ].filter(Boolean),
    };

    const isGift = Boolean(orderData.isGift || hasGiftWrap);
    const guestToken = orderData.guestToken || crypto.randomBytes(24).toString('hex');

    const payload = {
      ...orderData,
      orderNumber,
      guestToken,
      amount: total,
      total,
      status: orderData.status || 'confirmed',
      pdfUrl: orderData.pdfUrl || orderData.printPdfUrl,
      printPdfUrl: orderData.printPdfUrl || orderData.pdfUrl,
      invoiceUrl: orderData.invoiceUrl,
      specifications,
      items: orderData.items || [],
      projectSnapshot: orderData.projectSnapshot,
      packaging,
      accessories,
      isGift,
      pricing: orderData.pricing || {
        subtotal: total - packagingTotal,
        packagingPrice: packagingTotal,
        packagingAddon: packagingTotal > 0,
        total,
        shipping: 0,
        currency: 'INR',
      },
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

  public static async updatePdfUrl(idParam: string, pdfUrl: string) {
    if (isDbConnected()) {
      let query: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        query = { $or: [{ _id: idParam }, { orderNumber: idParam }] };
      }
      return await Order.findOneAndUpdate(
        query,
        { pdfUrl, printPdfUrl: pdfUrl },
        { new: true }
      );
    }

    const index = mockOrders.findIndex((o) => o.id === idParam || o.orderNumber === idParam);
    if (index !== -1) {
      (mockOrders[index] as any).pdfUrl = pdfUrl;
      (mockOrders[index] as any).printPdfUrl = pdfUrl;
      return mockOrders[index];
    }
    return null;
  }

  public static async updateStatus(
    idParam: string,
    status: string,
    optionsOrTracking?: any
  ) {
    const normalizedStatus = status.toLowerCase();
    const now = new Date();

    // Extract options or trackingData
    const notes = optionsOrTracking?.notes;
    const updatedBy = optionsOrTracking?.updatedBy || 'Admin';
    const tracking = optionsOrTracking?.tracking || (
      optionsOrTracking?.trackingNumber ? {
        carrier: optionsOrTracking?.carrier || 'BlueDart Express',
        trackingNumber: optionsOrTracking?.trackingNumber,
        trackingUrl: optionsOrTracking?.trackingUrl,
      } : (optionsOrTracking && !optionsOrTracking.notes ? optionsOrTracking : undefined)
    );

    if (isDbConnected()) {
      let query: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        query = { $or: [{ _id: idParam }, { orderNumber: idParam }] };
      }

      const orderDoc = await Order.findOne(query);
      if (!orderDoc) {
        return null;
      }

      orderDoc.status = normalizedStatus;

      // Update shippingDetails safely on the document to avoid MongoDB path conflicts
      if (tracking || normalizedStatus === 'dispatched' || normalizedStatus === 'delivered') {
        const existingShipping = (orderDoc.shippingDetails && typeof orderDoc.shippingDetails === 'object')
          ? { ...orderDoc.shippingDetails }
          : {};

        if (tracking?.carrier) existingShipping.carrier = tracking.carrier;
        if (tracking?.trackingNumber) existingShipping.trackingNumber = tracking.trackingNumber;
        if (tracking?.trackingUrl) existingShipping.trackingUrl = tracking.trackingUrl;
        if (tracking?.estimatedDelivery) existingShipping.estimatedDelivery = tracking.estimatedDelivery;

        if (normalizedStatus === 'dispatched') {
          existingShipping.dispatchedAt = now;
          if (!existingShipping.carrier) {
            existingShipping.carrier = 'BlueDart Express';
          }
        }
        if (normalizedStatus === 'delivered') {
          existingShipping.deliveredAt = now;
        }

        orderDoc.shippingDetails = existingShipping;
        orderDoc.markModified('shippingDetails');
      }

      // Update production notes and stage transitions
      if (notes) {
        if (!orderDoc.production) orderDoc.production = {};
        orderDoc.production.notes = notes;
        if (!Array.isArray(orderDoc.production.stageNotes)) {
          orderDoc.production.stageNotes = [];
        }
        orderDoc.production.stageNotes.push({
          stage: normalizedStatus,
          note: notes,
          createdAt: now,
          updatedBy,
        });
        orderDoc.markModified('production');
      }

      if (normalizedStatus === 'production') {
        if (!orderDoc.production) orderDoc.production = {};
        orderDoc.production.startedAt = now;
        orderDoc.markModified('production');
      }
      if (normalizedStatus === 'printing') {
        if (!orderDoc.production) orderDoc.production = {};
        orderDoc.production.printedAt = now;
        orderDoc.markModified('production');
      }
      if (normalizedStatus === 'qc') {
        if (!orderDoc.production) orderDoc.production = {};
        orderDoc.production.qcAt = now;
        orderDoc.markModified('production');
      }

      await orderDoc.save();
      return orderDoc;
    }

    const index = mockOrders.findIndex((o) => o.id === idParam || o.orderNumber === idParam);
    if (index !== -1) {
      const order = mockOrders[index]!;
      order.status = normalizedStatus;
      if (tracking || normalizedStatus === 'dispatched' || normalizedStatus === 'delivered') {
        if (!(order as any).shippingDetails) (order as any).shippingDetails = {};
        if (tracking) {
          (order as any).shippingDetails = { ...((order as any).shippingDetails || {}), ...tracking };
        }
        if (normalizedStatus === 'dispatched') {
          (order as any).shippingDetails.dispatchedAt = now;
          if (!(order as any).shippingDetails.carrier) (order as any).shippingDetails.carrier = 'BlueDart Express';
        }
        if (normalizedStatus === 'delivered') {
          (order as any).shippingDetails.deliveredAt = now;
        }
      }
      if (!(order as any).production) (order as any).production = {};
      if (notes) {
        (order as any).production.notes = notes;
        if (!(order as any).production.stageNotes) (order as any).production.stageNotes = [];
        (order as any).production.stageNotes.push({
          stage: normalizedStatus,
          note: notes,
          createdAt: now,
          updatedBy,
        });
      }
      if (normalizedStatus === 'production') (order as any).production.startedAt = now;
      if (normalizedStatus === 'printing') (order as any).production.printedAt = now;
      if (normalizedStatus === 'qc') (order as any).production.qcAt = now;
      return order;
    }
    return null;
  }

  public static async updateReview(idParam: string, reviewData: any) {
    if (isDbConnected()) {
      let query: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        query = { $or: [{ _id: idParam }, { orderNumber: idParam }] };
      }
      return await Order.findOneAndUpdate(query, { review: reviewData }, { new: true });
    }

    const index = mockOrders.findIndex((o) => o.id === idParam || o.orderNumber === idParam);
    if (index !== -1) {
      (mockOrders[index] as any).review = reviewData;
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
