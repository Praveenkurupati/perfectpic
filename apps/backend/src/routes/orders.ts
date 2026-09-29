import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';

const router = Router();

// Mock authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const mockOrders = [
  { 
    id: 'PP-8491', 
    orderNumber: 'PP-8491',
    title: 'Sri Lanka Travel Diary', 
    date: '2026-09-25', 
    createdAt: '2026-09-25T10:30:00.000Z',
    amount: 2499, 
    total: 2499,
    status: 'production', 
    thumbnail: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 40,
    dimensions: '8.25" × 8.25"'
  },
  { 
    id: 'PP-7201', 
    orderNumber: 'PP-7201',
    title: 'Our 1st Anniversary Keepsake', 
    date: '2026-08-14', 
    createdAt: '2026-08-14T14:15:00.000Z',
    amount: 1999, 
    total: 1999,
    status: 'delivered', 
    thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 36,
    dimensions: '8.25" × 8.25"'
  },
  { 
    id: 'PP-6350', 
    orderNumber: 'PP-6350',
    title: 'Annapurna Base Camp Sanctuary', 
    date: '2026-07-02', 
    createdAt: '2026-07-02T09:00:00.000Z',
    amount: 2999, 
    total: 2999,
    status: 'dispatched', 
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    itemsCount: 1,
    pageCount: 48,
    dimensions: '10" × 10"'
  }
];

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ orders, total: orders.length });
    }
  } catch (err) {
    console.error('MongoDB orders query error:', err);
  }

  res.json({ orders: mockOrders, total: mockOrders.length });
});

router.get('/protected', authenticate, async (req, res) => {
  try {
    if (isDbConnected()) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ orders, total: orders.length });
    }
  } catch (err) {
    console.error('MongoDB orders protected error:', err);
  }

  res.json({ orders: mockOrders, total: mockOrders.length });
});

router.get('/:id', async (req, res) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      let filter: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ orderNumber: idParam }, { _id: idParam }] };
      }
      const order = await Order.findOne(filter);
      if (order) {
        return res.json({ order });
      }
    }
  } catch (err) {
    console.error('MongoDB single order query error:', err);
  }

  const foundOrder = mockOrders.find(o => o.id === idParam || o.orderNumber === idParam);
  const order = foundOrder || {
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
      }
    ],
    amount: 2499,
    total: 2499,
    status: 'paid',
  };
  res.json({ order });
});

// Create new order
router.post('/', async (req, res) => {
  const newOrderNumber = `PP-${Math.floor(1000 + Math.random() * 9000)}`;
  const body = req.body || {};

  const orderData = {
    orderNumber: body.orderNumber || newOrderNumber,
    title: body.title || 'Custom Photobook Order',
    customerName: body.customerName || body.shippingAddress?.fullName || 'Guest User',
    customerEmail: body.customerEmail || body.email,
    customerPhone: body.customerPhone || body.phone,
    amount: Number(body.amount || body.total) || 1999,
    total: Number(body.total || body.amount) || 1999,
    status: body.status || 'confirmed',
    coverUrl: body.coverUrl || body.thumbnail || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    thumbnail: body.thumbnail || body.coverUrl || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    dimensions: body.dimensions || '8.25" × 8.25"',
    pageCount: Number(body.pageCount) || 40,
    itemsCount: Number(body.itemsCount) || 1,
    shippingAddress: body.shippingAddress || {},
    paymentDetails: body.paymentDetails || {}
  };

  try {
    if (isDbConnected()) {
      const created = await Order.create(orderData);
      return res.status(201).json({ id: created.orderNumber, order: created, status: created.status });
    }
  } catch (err) {
    console.error('MongoDB order creation error:', err);
  }

  const newOrder = {
    id: orderData.orderNumber,
    ...orderData,
    date: new Date().toISOString().split('T')[0] || '',
    createdAt: new Date().toISOString()
  };
  mockOrders.unshift(newOrder);
  res.status(201).json({ id: orderData.orderNumber, order: newOrder, status: 'created' });
});

// PUT /api/orders/:id/status (or /:id) to update order status
router.put(['/:id/status', '/:id'], async (req, res) => {
  const idParam = req.params.id;
  const { status } = req.body;

  try {
    if (isDbConnected()) {
      let filter: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ orderNumber: idParam }, { _id: idParam }] };
      }
      const updated = await Order.findOneAndUpdate(
        filter,
        { status: status || 'production' },
        { new: true }
      );
      if (updated) {
        return res.json({ message: 'Order status updated in MongoDB', order: updated });
      }
    }
  } catch (err) {
    console.error('MongoDB order status update error:', err);
  }

  const orderIndex = mockOrders.findIndex(o => o.id === idParam || o.orderNumber === idParam);
  if (orderIndex !== -1) {
    mockOrders[orderIndex]!.status = status || mockOrders[orderIndex]!.status;
    return res.json({ message: 'Order status updated', order: mockOrders[orderIndex] });
  }

  res.status(404).json({ error: 'Order not found' });
});

// GET /api/orders/:id/review
router.get('/:id/review', async (req, res) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      let filter: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ orderNumber: idParam }, { _id: idParam }] };
      }
      const order = await Order.findOne(filter);
      if (order) {
        return res.json({ review: (order as any).review || null });
      }
    }
  } catch (err) {
    console.error('MongoDB get order review error:', err);
  }

  const found = mockOrders.find(o => o.id === idParam || o.orderNumber === idParam);
  if (found) {
    return res.json({ review: (found as any).review || null });
  }

  res.status(404).json({ error: 'Order not found' });
});

// POST /api/orders/:id/review
router.post('/:id/review', async (req, res) => {
  const idParam = req.params.id;
  const reviewData = {
    ...req.body,
    submittedAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      let filter: any = { orderNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ orderNumber: idParam }, { _id: idParam }] };
      }
      const updated = await Order.findOneAndUpdate(filter, { review: reviewData }, { new: true });
      if (updated) {
        return res.json({ message: 'Review submitted successfully', review: reviewData });
      }
    }
  } catch (err) {
    console.error('MongoDB submit review error:', err);
  }

  const orderIndex = mockOrders.findIndex(o => o.id === idParam || o.orderNumber === idParam);
  if (orderIndex !== -1) {
    (mockOrders[orderIndex] as any).review = reviewData;
    return res.json({ message: 'Review submitted successfully', review: reviewData });
  }

  res.status(404).json({ error: 'Order not found' });
});

export default router;
