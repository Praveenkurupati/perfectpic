// apps/backend/src/controllers/ShippingController.ts
import { Request, Response } from 'express';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';

interface PincodeDirectoryEntry {
  city: string;
  state: string;
  tier: 'Metro Tier-1' | 'Tier-2 Major City' | 'Regional';
  hours: string;
  days: string;
}

const PINCODE_PREFIX_MAP: Record<string, PincodeDirectoryEntry> = {
  // Metro Tier-1
  '11': { city: 'New Delhi', state: 'Delhi NCR', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '40': { city: 'Mumbai', state: 'Maharashtra', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '41': { city: 'Pune', state: 'Maharashtra', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '56': { city: 'Bengaluru', state: 'Karnataka', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '50': { city: 'Hyderabad', state: 'Telangana', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '60': { city: 'Chennai', state: 'Tamil Nadu', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '70': { city: 'Kolkata', state: 'West Bengal', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },
  '38': { city: 'Ahmedabad', state: 'Gujarat', tier: 'Metro Tier-1', hours: '24 - 36 Hours', days: '1-2 Business Days' },

  // Tier-2 Major Cities & Clusters
  '12': { city: 'Gurugram / Faridabad', state: 'Haryana', tier: 'Tier-2 Major City', hours: '36 - 48 Hours', days: '2-3 Business Days' },
  '13': { city: 'Ambala / Panipat', state: 'Haryana', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '14': { city: 'Ludhiana / Jalandhar', state: 'Punjab', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '16': { city: 'Chandigarh', state: 'Punjab / Haryana', tier: 'Tier-2 Major City', hours: '36 - 48 Hours', days: '2-3 Business Days' },
  '20': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh', tier: 'Tier-2 Major City', hours: '36 - 48 Hours', days: '2-3 Business Days' },
  '22': { city: 'Lucknow', state: 'Uttar Pradesh', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '30': { city: 'Jaipur', state: 'Rajasthan', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '45': { city: 'Indore', state: 'Madhya Pradesh', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '53': { city: 'Visakhapatnam', state: 'Andhra Pradesh', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '57': { city: 'Mangaluru / Mysuru', state: 'Karnataka', tier: 'Tier-2 Major City', hours: '36 - 48 Hours', days: '2-3 Business Days' },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu', tier: 'Tier-2 Major City', hours: '36 - 48 Hours', days: '2-3 Business Days' },
  '68': { city: 'Kochi', state: 'Kerala', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '75': { city: 'Bhubaneswar', state: 'Odisha', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '78': { city: 'Guwahati', state: 'Assam', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '3-4 Business Days' },
  '80': { city: 'Patna', state: 'Bihar', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },
  '83': { city: 'Ranchi', state: 'Jharkhand', tier: 'Tier-2 Major City', hours: '48 - 72 Hours', days: '2-3 Business Days' },

  // Regional Zones (First Digit)
  '1': { city: 'Northern Region', state: 'North India', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '2': { city: 'Central Uttar Pradesh', state: 'Uttar Pradesh', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '3': { city: 'Western Region', state: 'Rajasthan / Gujarat', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '4': { city: 'Western Maharashtra & MP', state: 'Maharashtra', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '5': { city: 'Southern Andhra / Karnataka', state: 'South India', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '6': { city: 'Southern Tamil Nadu / Kerala', state: 'South India', tier: 'Regional', hours: '72 - 96 Hours', days: '3-5 Business Days' },
  '7': { city: 'Eastern Region', state: 'East India', tier: 'Regional', hours: '72 - 120 Hours', days: '4-6 Business Days' },
  '8': { city: 'Eastern Gangetic Plain', state: 'Bihar / Jharkhand', tier: 'Regional', hours: '72 - 120 Hours', days: '4-6 Business Days' },
};

export class ShippingController {
  public static async calculate(req: Request, res: Response) {
    const { items, deliveryOption } = req.body || {};
    let fee = 0;
    let label = 'Free Pan-India Insured White-Glove Delivery';

    if (deliveryOption === 'rush') {
      fee = 499;
      label = 'Priority 1 Artisan Rush Dispatch (Within 24 Hours)';
    } else if (deliveryOption === 'express') {
      fee = 299;
      label = 'Express Courier Air Dispatch (2-3 Business Days)';
    }

    return res.status(200).json({
      cost: fee,
      currency: 'INR',
      note: label,
      insuranceIncluded: true,
      maxInsuredValue: 25000,
    });
  }

  public static async pincodeLookup(req: Request, res: Response) {
    const rawPin = String(req.body.pincode || req.query.pincode || '').trim().replace(/\D/g, '');
    
    // Valid Indian postal codes are exactly 6 digits starting with 1 to 8
    if (!rawPin || rawPin.length !== 6 || rawPin.startsWith('0') || rawPin.startsWith('9')) {
      return res.status(200).json({
        pincode: rawPin || '',
        city: 'Unknown',
        state: 'Unknown',
        tier: 'Unserviceable',
        isServiceable: false,
        serviceable: false,
        estimatedDays: 'N/A',
        estimatedHours: 'N/A',
        courierPartner: 'None',
        preferredCarrier: 'None',
        insuredTransit: 'Unserviceable',
        message: 'Invalid Indian Postal Code. Must be 6 digits.',
      });
    }

    // Two-digit prefix lookup, falling back to 1-digit zone
    const prefix2 = rawPin.substring(0, 2);
    const prefix1 = rawPin.substring(0, 1);
    const resolved = PINCODE_PREFIX_MAP[prefix2] || PINCODE_PREFIX_MAP[prefix1] || {
      city: 'Pan-India Destination',
      state: 'India',
      tier: 'Regional' as const,
      hours: '72 - 96 Hours',
      days: '3-5 Business Days',
    };

    return res.status(200).json({
      pincode: rawPin,
      city: resolved.city,
      state: resolved.state,
      tier: resolved.tier,
      isServiceable: true,
      serviceable: true,
      estimatedDays: resolved.days,
      estimatedHours: resolved.hours,
      courierPartner: resolved.tier === 'Metro Tier-1' ? 'BlueDart Express Air' : 'BlueDart Express',
      preferredCarrier: resolved.tier === 'Metro Tier-1' ? 'BlueDart Express Air' : 'BlueDart Express',
      insuredTransit: 'Full Archival Guarantee (Up to ₹25,000)',
    });
  }

  public static async createLabel(req: Request, res: Response) {
    const { orderId } = req.body;
    const cleanId = String(orderId || 'ORD-DEFAULT').trim();
    const trackingId = `BLD-${Math.floor(100000000 + Math.random() * 900000000)}`;

    if (isDbConnected() && orderId) {
      try {
        await Order.findOneAndUpdate(
          { $or: [{ _id: cleanId }, { orderNumber: cleanId }] },
          {
            $set: {
              'shippingDetails.trackingNumber': trackingId,
              'shippingDetails.carrier': 'BlueDart Express Air',
              'shippingDetails.trackingUrl': `https://www.bluedart.com/tracking?awb=${trackingId}`,
              'shippingDetails.labelGeneratedAt': new Date(),
            },
          }
        );
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      orderId: cleanId,
      labelUrl: `https://perfectpic.in/api/v1/orders/${cleanId}/label.pdf`,
      trackingId,
      carrier: 'BlueDart Express Air',
      serviceType: 'Air Express',
    });
  }

  public static async track(req: Request, res: Response) {
    const { trackingId } = req.params;
    const cleanTracking = String(trackingId || '').trim();

    if (isDbConnected()) {
      try {
        const order = await Order.findOne({
          $or: [
            { 'shippingDetails.trackingNumber': cleanTracking },
            { orderNumber: cleanTracking },
            { _id: cleanTracking },
          ],
        }).lean();

        if (order) {
          return res.status(200).json({
            trackingId: (order as any).shippingDetails?.trackingNumber || cleanTracking,
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            city: (order as any).shippingAddress?.city || 'Bengaluru',
            state: (order as any).shippingAddress?.state || 'Karnataka',
            carrier: (order as any).shippingDetails?.carrier || 'BlueDart Express Air',
            trackingUrl: (order as any).shippingDetails?.trackingUrl || `https://www.bluedart.com/tracking?awb=${cleanTracking}`,
            lastUpdated: order.updatedAt || new Date().toISOString(),
          });
        }
      } catch (_) {}
    }

    return res.status(200).json({
      trackingId: cleanTracking || 'TRK-98214',
      status: 'In Transit',
      location: 'Hub Dispatched',
      carrier: 'BlueDart Express Air',
      lastUpdated: new Date().toISOString(),
    });
  }
}

export default ShippingController;
