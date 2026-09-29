import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Address } from '../../db/models/Address';
import { isDbConnected } from '../../db/connection';

const router = Router();

// In-memory fallback addresses store
let mockAddresses = [
  {
    id: 'addr-default-1',
    fullName: 'Praveen Kumar',
    phone: '+91 98765 43210',
    addressLine1: 'Indiranagar 100ft Road, 4th Cross',
    addressLine2: 'Suite 204, Archival Heights',
    landmark: 'Near Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    type: 'home',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'addr-default-2',
    fullName: 'Praveen Kumar (Studio)',
    phone: '+91 98765 43210',
    addressLine1: 'Bandra West, Hill Road',
    addressLine2: 'Floor 3, Creative Studios',
    landmark: 'Opposite Mehboob Studio',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    type: 'studio',
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

// GET /api/addresses or /api/v1/addresses
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const addresses = await Address.find().sort({ isDefault: -1, createdAt: -1 });
      if (addresses && addresses.length > 0) {
        return res.json({ addresses, total: addresses.length });
      }
    }
  } catch (err) {
    console.error('MongoDB addresses get error:', err);
  }

  res.json({ addresses: mockAddresses, total: mockAddresses.length });
});

// POST /api/addresses
router.post('/', async (req: Request, res: Response) => {
  const body = req.body || {};
  const isDefault = Boolean(body.isDefault);

  try {
    if (isDbConnected()) {
      if (isDefault) {
        await Address.updateMany({}, { isDefault: false });
      }
      const newAddress = await Address.create({
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

  if (isDefault) {
    mockAddresses.forEach(a => { a.isDefault = false; });
  }

  const newAddr = {
    id: `addr-${Date.now()}`,
    fullName: body.fullName || 'Valued Customer',
    phone: body.phone || '',
    addressLine1: body.addressLine1 || '',
    addressLine2: body.addressLine2 || '',
    landmark: body.landmark || '',
    city: body.city || '',
    state: body.state || '',
    pincode: body.pincode || '',
    type: body.type || 'home',
    isDefault: isDefault || mockAddresses.length === 0,
    createdAt: new Date().toISOString()
  };

  mockAddresses.unshift(newAddr);
  res.status(201).json({ message: 'Address saved successfully', address: newAddr });
});

// PUT /api/addresses/:id
router.put('/:id', async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const body = req.body || {};
  const isDefault = Boolean(body.isDefault);

  try {
    if (isDbConnected()) {
      if (isDefault) {
        await Address.updateMany({ _id: { $ne: idParam } }, { isDefault: false });
      }
      let filter: any = { _id: idParam };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam };
      }
      const updated = await Address.findOneAndUpdate(filter, body, { new: true });
      if (updated) {
        return res.json({ message: 'Address updated successfully', address: updated });
      }
    }
  } catch (err) {
    console.error('MongoDB address update error:', err);
  }

  const idx = mockAddresses.findIndex(a => a.id === idParam);
  if (idx !== -1) {
    if (isDefault) {
      mockAddresses.forEach(a => { a.isDefault = false; });
    }
    mockAddresses[idx] = {
      ...mockAddresses[idx],
      ...body,
      id: idParam
    };
    return res.json({ message: 'Address updated successfully', address: mockAddresses[idx] });
  }

  res.status(404).json({ error: 'Address not found' });
});

// DELETE /api/addresses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      let filter: any = { _id: idParam };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam };
      }
      await Address.findOneAndDelete(filter);
      return res.json({ message: 'Address removed successfully' });
    }
  } catch (err) {
    console.error('MongoDB address delete error:', err);
  }

  mockAddresses = mockAddresses.filter(a => a.id !== idParam);
  res.json({ message: 'Address removed successfully' });
});

// PUT /api/addresses/:id/default
router.put('/:id/default', async (req: Request, res: Response) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      await Address.updateMany({}, { isDefault: false });
      let filter: any = { _id: idParam };
      if (!mongoose.isValidObjectId(idParam)) {
        filter = { id: idParam };
      }
      const defaultAddr = await Address.findOneAndUpdate(filter, { isDefault: true }, { new: true });
      const allAddresses = await Address.find().sort({ isDefault: -1, createdAt: -1 });
      return res.json({ message: 'Default address updated', addresses: allAddresses, address: defaultAddr });
    }
  } catch (err) {
    console.error('MongoDB set default address error:', err);
  }

  mockAddresses = mockAddresses.map(a => ({
    ...a,
    isDefault: a.id === idParam
  }));

  res.json({ message: 'Default address updated', addresses: mockAddresses });
});

export default router;
