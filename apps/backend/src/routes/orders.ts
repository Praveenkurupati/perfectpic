import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Mock authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const mockOrders = [
  { 
    id: 'PP-8491', 
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
    title: 'Our 1st Anniversary', 
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

router.get('/', (req, res) => {
  res.json({ orders: mockOrders, total: mockOrders.length });
});

router.get('/protected', authenticate, (req, res) => {
  res.json({ orders: mockOrders, total: mockOrders.length });
});

router.get('/:id', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id) || mockOrders[0];
  res.json({ order });
});

router.post('/', (req, res) => {
  const newId = `PP-${Math.floor(1000 + Math.random() * 9000)}`;
  res.status(201).json({ id: newId, status: 'created' });
});

export default router;
