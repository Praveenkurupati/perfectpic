import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Address } from '../../db/models/Address';
import { isDbConnected } from '../../db/connection';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Enforce authentication across all address management routes (SEC-ADDR-01)
router.use(authenticate);

// Per-user in-memory fallback address store (keyed by userId) for offline resilience
const mockUserAddresses = new Map<string, any[]>();

// GET /api/v1/addresses (Scoped strictly to authenticated user)
router.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId || 'anonymous';

  try {
    if (isDbConnected()) {
      const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
      return res.json({ addresses: addresses || [], total: addresses?.length || 0 });
    }
  } catch (err) {
    console.error('MongoDB addresses get error:', err);
  }

  const userAddrs = mockUserAddresses.get(userId) || [];
  res.json({ addresses: userAddrs, total: userAddrs.length });
});

// POST /api/v1/addresses
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId || 'anonymous';
  const body = req.body || {};
  const isDefault = Boolean(body.isDefault);

  try {
    if (isDbConnected()) {
      if (isDefault) {
        await Address.updateMany({ userId }, { isDefault: false });
      }
      const newAddress = await Address.create({
        userId,
        fullName: body.fullName,
        phone: body.phone,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || '',
        landmark: body.landmark || '',
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        type: body.type || 'home',
        isDefault: isDefault
      });
      return res.status(201).json({ message: 'Address saved successfully', address: newAddress });
    }
  } catch (err) {
    console.error('MongoDB address create error:', err);
  }

  const userAddrs = mockUserAddresses.get(userId) || [];
  if (isDefault) {
    userAddrs.forEach(a => { a.isDefault = false; });
  }

  const newAddr = {
    id: `addr-${Date.now()}`,
    userId,
    fullName: body.fullName || 'Valued Customer',
    phone: body.phone || '',
    addressLine1: body.addressLine1 || '',
    addressLine2: body.addressLine2 || '',
    landmark: body.landmark || '',
    city: body.city || '',
    state: body.state || '',
    pincode: body.pincode || '',
    type: body.type || 'home',
    isDefault: isDefault || userAddrs.length === 0,
    createdAt: new Date().toISOString()
  };

  userAddrs.unshift(newAddr);
  mockUserAddresses.set(userId, userAddrs);
  res.status(201).json({ message: 'Address saved successfully', address: newAddr });
});

// PUT /api/v1/addresses/:id
router.put('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId || 'anonymous';
  const idParam = req.params.id;
  const body = req.body || {};
  const isDefault = Boolean(body.isDefault);

  try {
    if (isDbConnected()) {
      if (isDefault) {
        await Address.updateMany({ userId, _id: { $ne: idParam } }, { isDefault: false });
      }
      let filter: any = { _id: idParam, userId };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam, userId };
      }
      const updated = await Address.findOneAndUpdate(filter, { ...body, userId }, { new: true });
      if (updated) {
        return res.json({ message: 'Address updated successfully', address: updated });
      }
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }
  } catch (err) {
    console.error('MongoDB address update error:', err);
  }

  const userAddrs = mockUserAddresses.get(userId) || [];
  const idx = userAddrs.findIndex(a => a.id === idParam);
  if (idx !== -1) {
    if (isDefault) {
      userAddrs.forEach(a => { a.isDefault = false; });
    }
    userAddrs[idx] = {
      ...userAddrs[idx],
      ...body,
      id: idParam,
      userId
    };
    mockUserAddresses.set(userId, userAddrs);
    return res.json({ message: 'Address updated successfully', address: userAddrs[idx] });
  }

  res.status(404).json({ error: 'Address not found' });
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId || 'anonymous';
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      let filter: any = { _id: idParam, userId };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam, userId };
      }
      const deleted = await Address.findOneAndDelete(filter);
      if (deleted) {
        return res.json({ message: 'Address removed successfully' });
      }
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }
  } catch (err) {
    console.error('MongoDB address delete error:', err);
  }

  const userAddrs = mockUserAddresses.get(userId) || [];
  const filtered = userAddrs.filter(a => a.id !== idParam);
  mockUserAddresses.set(userId, filtered);
  res.json({ message: 'Address removed successfully' });
});

// PUT /api/v1/addresses/:id/default
router.put('/:id/default', async (req: Request, res: Response) => {
  const userId = req.user?.id || req.user?.userId || 'anonymous';
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      await Address.updateMany({ userId }, { isDefault: false });
      let filter: any = { _id: idParam, userId };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam, userId };
      }
      const defaultAddr = await Address.findOneAndUpdate(filter, { isDefault: true }, { new: true });
      if (!defaultAddr) {
        return res.status(404).json({ error: 'Address not found or unauthorized' });
      }
      const allAddresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
      return res.json({ message: 'Default address updated', addresses: allAddresses, address: defaultAddr });
    }
  } catch (err) {
    console.error('MongoDB set default address error:', err);
  }

  const userAddrs = mockUserAddresses.get(userId) || [];
  const updated = userAddrs.map(a => ({
    ...a,
    isDefault: a.id === idParam
  }));
  mockUserAddresses.set(userId, updated);

  res.json({ message: 'Default address updated', addresses: updated });
});

export default router;
