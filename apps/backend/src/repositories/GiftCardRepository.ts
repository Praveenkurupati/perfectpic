// apps/backend/src/repositories/GiftCardRepository.ts
import crypto from 'crypto';
import mongoose from 'mongoose';
import { GiftCard, IGiftCard, IGiftCardDocument, GiftCardStatus, GiftCardTheme } from '../db/models/GiftCard';
import { GiftCardTransaction, IGiftCardTransaction } from '../db/models/GiftCardTransaction';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

export interface CreateGiftCardDTO {
  initialAmount: number;
  theme?: GiftCardTheme;
  recipient: {
    name: string;
    email: string;
    phone?: string;
  };
  sender: {
    name: string;
    email: string;
    phone?: string;
  };
  message?: string;
  deliveryMethod?: 'email' | 'whatsapp' | 'scheduled';
  scheduledDeliveryDate?: Date | string | null;
  expiresAt?: Date | string | null;
  purchaserOrderId?: string;
  issuedBy?: 'storefront_purchase' | 'admin_courtesy' | 'loyalty_reward';
  notes?: string;
  customCode?: string;
  pin?: string;
}

// In-memory fallback dataset for offline/mock development
let inMemoryGiftCards: any[] = [
  {
    id: 'gc-demo-2000',
    code: 'PPGC-GOLD-2026-HEIR',
    pin: '8492',
    initialAmount: 2000,
    currentBalance: 2000,
    currency: 'INR',
    status: 'active',
    theme: 'classic',
    recipient: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+919876543210',
    },
    sender: {
      name: 'Aditya & Ananya',
      email: 'aditya@example.com',
      phone: '+919876543211',
    },
    message: 'Happy Anniversary! Craft your beautiful memories into a luxury archival book.',
    deliveryMethod: 'email',
    scheduledDeliveryDate: null,
    isDelivered: true,
    deliveredAt: new Date('2026-09-01T10:00:00.000Z'),
    expiresAt: new Date('2027-09-01T10:00:00.000Z'),
    purchaserOrderId: 'ORD-DEMO-GC1',
    claimantUserId: null,
    claimedAt: null,
    issuedBy: 'storefront_purchase',
    notes: 'Demo gift card for local testing',
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  },
  {
    id: 'gc-demo-5000',
    code: 'PPGC-WEDD-HEIR-5000',
    pin: '1234',
    initialAmount: 5000,
    currentBalance: 3001,
    currency: 'INR',
    status: 'partially_redeemed',
    theme: 'wedding',
    recipient: {
      name: 'Rohan & Kavya',
      email: 'kavya@example.com',
      phone: '+919876543222',
    },
    sender: {
      name: 'Grandma Sita',
      email: 'sita@example.com',
    },
    message: 'To the wonderful couple. Preserve every ritual and smile of your big day.',
    deliveryMethod: 'email',
    isDelivered: true,
    deliveredAt: new Date('2026-08-15T10:00:00.000Z'),
    expiresAt: new Date('2027-08-15T10:00:00.000Z'),
    purchaserOrderId: 'ORD-DEMO-GC2',
    claimantUserId: null,
    claimedAt: null,
    issuedBy: 'storefront_purchase',
    notes: 'Partially redeemed wedding gift card',
    createdAt: new Date('2026-08-15T10:00:00.000Z'),
    updatedAt: new Date('2026-08-20T10:00:00.000Z'),
  },
];

let inMemoryTransactions: any[] = [
  {
    id: 'gctx-1',
    giftCardId: 'gc-demo-2000',
    giftCardCode: 'PPGC-GOLD-2026-HEIR',
    type: 'issuance',
    amount: 2000,
    balanceBefore: 0,
    balanceAfter: 2000,
    orderId: 'ORD-DEMO-GC1',
    customerEmail: 'aditya@example.com',
    description: 'Gift card purchase by Aditya & Ananya',
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
  },
  {
    id: 'gctx-2',
    giftCardId: 'gc-demo-5000',
    giftCardCode: 'PPGC-WEDD-HEIR-5000',
    type: 'issuance',
    amount: 5000,
    balanceBefore: 0,
    balanceAfter: 5000,
    orderId: 'ORD-DEMO-GC2',
    customerEmail: 'sita@example.com',
    description: 'Gift card purchase by Grandma Sita',
    createdAt: new Date('2026-08-15T10:00:00.000Z'),
  },
  {
    id: 'gctx-3',
    giftCardId: 'gc-demo-5000',
    giftCardCode: 'PPGC-WEDD-HEIR-5000',
    type: 'redemption',
    amount: -1999,
    balanceBefore: 5000,
    balanceAfter: 3001,
    orderNumber: 'PP-10492',
    customerEmail: 'kavya@example.com',
    description: 'Redeemed towards Order #PP-10492',
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
  },
];

export class GiftCardRepository {
  /**
   * Generates a collision-resistant, human-friendly alphanumeric code
   * Format: PPGC-XXXX-XXXX-XXXX
   * Uses characters 2-9 and A-Z excluding easily confused symbols (0, O, 1, I, L)
   */
  public static generateCode(): string {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const segment = (len: number) => {
      const bytes = crypto.randomBytes(len);
      let res = '';
      for (let i = 0; i < len; i++) {
        const byte = bytes[i] ?? 0;
        res += chars[byte % chars.length];
      }
      return res;
    };
    return `PPGC-${segment(4)}-${segment(4)}-${segment(4)}`;
  }

  /**
   * Generates a 4-digit numeric verification PIN
   */
  public static generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Creates a new Gift Card
   */
  public static async create(dto: CreateGiftCardDTO): Promise<IGiftCard> {
    const code = (dto.customCode || this.generateCode()).toUpperCase().trim();
    const pin = dto.pin || this.generatePin();
    const expiresAt = dto.expiresAt 
      ? new Date(dto.expiresAt) 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    const cardPayload: any = {
      code,
      pin,
      initialAmount: Number(dto.initialAmount),
      currentBalance: Number(dto.initialAmount),
      currency: 'INR',
      status: 'active',
      theme: dto.theme || 'classic',
      recipient: {
        name: dto.recipient.name.trim(),
        email: dto.recipient.email.toLowerCase().trim(),
        phone: dto.recipient.phone?.trim() || '',
      },
      sender: {
        name: dto.sender.name.trim(),
        email: dto.sender.email.toLowerCase().trim(),
        phone: dto.sender.phone?.trim() || '',
      },
      message: dto.message?.trim() || '',
      deliveryMethod: dto.deliveryMethod || 'email',
      scheduledDeliveryDate: dto.scheduledDeliveryDate ? new Date(dto.scheduledDeliveryDate) : null,
      isDelivered: !dto.scheduledDeliveryDate,
      deliveredAt: !dto.scheduledDeliveryDate ? new Date() : null,
      expiresAt,
      purchaserOrderId: dto.purchaserOrderId || '',
      claimantUserId: null,
      claimedAt: null,
      issuedBy: dto.issuedBy || 'storefront_purchase',
      notes: dto.notes || '',
    };

    if (isDbConnected()) {
      const doc = await GiftCard.create(cardPayload);
      const created = doc.toJSON() as IGiftCard;

      // Log issuance transaction
      await GiftCardTransaction.create({
        giftCardId: (created as any).id || (doc as any)._id,
        giftCardCode: created.code,
        type: 'issuance',
        amount: created.initialAmount,
        balanceBefore: 0,
        balanceAfter: created.initialAmount,
        orderId: dto.purchaserOrderId || null,
        customerEmail: dto.sender.email,
        description: `Gift card issued for ₹${created.initialAmount} (${created.issuedBy})`,
      });

      return created;
    }

    // In-memory fallback
    const id = `gc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      ...cardPayload,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryGiftCards.unshift(record);

    inMemoryTransactions.unshift({
      id: `gctx_${Date.now()}`,
      giftCardId: id,
      giftCardCode: record.code,
      type: 'issuance',
      amount: record.initialAmount,
      balanceBefore: 0,
      balanceAfter: record.initialAmount,
      orderId: dto.purchaserOrderId || null,
      customerEmail: dto.sender.email,
      description: `Gift card issued for ₹${record.initialAmount} (${record.issuedBy})`,
      createdAt: new Date(),
    });

    return record;
  }

  /**
   * Finds a gift card by its code (case-insensitive)
   */
  public static async findByCode(code: string): Promise<IGiftCard | null> {
    const normalized = (code || '').toUpperCase().trim();
    if (!normalized) return null;

    if (isDbConnected()) {
      const doc = await GiftCard.findOne({ code: normalized });
      return doc ? (doc.toJSON() as IGiftCard) : null;
    }

    const found = inMemoryGiftCards.find(c => c.code.toUpperCase() === normalized);
    return found ? { ...found } : null;
  }

  /**
   * Finds a gift card by its ID
   */
  public static async findById(id: string): Promise<IGiftCard | null> {
    if (isDbConnected()) {
      const doc = await GiftCard.findById(id);
      return doc ? (doc.toJSON() as IGiftCard) : null;
    }

    const found = inMemoryGiftCards.find(c => c.id === id || (c as any)._id === id);
    return found ? { ...found } : null;
  }

  /**
   * List cards with filters, search, and pagination (Admin Portal)
   */
  public static async list(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ cards: IGiftCard[]; total: number; totalPages: number }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      const query: any = {};
      if (options.status && options.status !== 'all') {
        query.status = options.status;
      }
      if (options.search) {
        const regex = new RegExp(options.search.trim(), 'i');
        query.$or = [
          { code: regex },
          { 'recipient.email': regex },
          { 'recipient.name': regex },
          { 'sender.email': regex },
          { 'sender.name': regex },
        ];
      }

      const [docs, total] = await Promise.all([
        GiftCard.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        GiftCard.countDocuments(query),
      ]);

      const cards = docs.map(d => d.toJSON() as IGiftCard);
      return { cards, total, totalPages: Math.ceil(total / limit) };
    }

    let filtered = [...inMemoryGiftCards];
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(c => c.status === options.status);
    }
    if (options.search) {
      const term = options.search.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.code.toLowerCase().includes(term) ||
        c.recipient.email.toLowerCase().includes(term) ||
        c.recipient.name.toLowerCase().includes(term) ||
        c.sender.name.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    return {
      cards: paginated,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atomically deducts balance from gift card for an order (Double-Spend Protection)
   */
  public static async deductBalance(
    code: string,
    deductionAmount: number,
    orderDetails: {
      orderId?: string;
      orderNumber?: string;
      customerEmail?: string;
      userId?: string;
    }
  ): Promise<{ success: boolean; deducted: number; remainingBalance: number; card: IGiftCard }> {
    const normalized = (code || '').toUpperCase().trim();
    const amount = Math.max(0, Math.round(Number(deductionAmount) || 0));
    if (amount <= 0) {
      const card = await this.findByCode(normalized);
      if (!card) throw new Error(`Gift card '${normalized}' not found.`);
      return { success: true, deducted: 0, remainingBalance: card.currentBalance, card };
    }

    if (isDbConnected()) {
      // Find card first to check validity
      const existing = await GiftCard.findOne({ code: normalized });
      if (!existing) {
        throw new Error(`Gift card code '${normalized}' does not exist.`);
      }
      if (existing.status !== 'active' && existing.status !== 'partially_redeemed') {
        throw new Error(`Gift card '${normalized}' is ${existing.status} and cannot be redeemed.`);
      }
      if (existing.expiresAt && new Date(existing.expiresAt) < new Date()) {
        existing.status = 'expired';
        await existing.save();
        throw new Error(`Gift card '${normalized}' expired on ${new Date(existing.expiresAt).toLocaleDateString()}.`);
      }
      if (existing.currentBalance <= 0) {
        throw new Error(`Gift card '${normalized}' has zero balance.`);
      }

      const actualDeduct = Math.min(existing.currentBalance, amount);
      const newBalance = existing.currentBalance - actualDeduct;
      const newStatus = newBalance === 0 ? 'fully_redeemed' : 'partially_redeemed';

      // Atomic conditional update to prevent double-spend concurrency
      const updated = await GiftCard.findOneAndUpdate(
        {
          _id: existing._id,
          currentBalance: { $gte: actualDeduct },
        },
        {
          $inc: { currentBalance: -actualDeduct },
          $set: { status: newStatus },
        },
        { new: true }
      );

      if (!updated) {
        throw new Error('Concurrent transaction conflict. Could not lock gift card balance. Please retry.');
      }

      // Record immutable ledger entry
      await GiftCardTransaction.create({
        giftCardId: updated._id.toString(),
        giftCardCode: updated.code,
        type: 'redemption',
        amount: -actualDeduct,
        balanceBefore: existing.currentBalance,
        balanceAfter: updated.currentBalance,
        orderId: orderDetails.orderId || null,
        orderNumber: orderDetails.orderNumber || null,
        userId: orderDetails.userId || null,
        customerEmail: orderDetails.customerEmail || '',
        description: `Redeemed ₹${actualDeduct} on Order #${orderDetails.orderNumber || orderDetails.orderId || 'Checkout'}`,
      });

      return {
        success: true,
        deducted: actualDeduct,
        remainingBalance: updated.currentBalance,
        card: updated.toJSON() as IGiftCard,
      };
    }

    // In-memory fallback
    const idx = inMemoryGiftCards.findIndex(c => c.code.toUpperCase() === normalized);
    if (idx === -1) {
      throw new Error(`Gift card '${normalized}' does not exist.`);
    }
    const card = inMemoryGiftCards[idx];
    if (card.status !== 'active' && card.status !== 'partially_redeemed') {
      throw new Error(`Gift card '${normalized}' is ${card.status} and cannot be redeemed.`);
    }
    if (card.currentBalance <= 0) {
      throw new Error(`Gift card '${normalized}' has zero balance.`);
    }

    const actualDeduct = Math.min(card.currentBalance, amount);
    const balanceBefore = card.currentBalance;
    card.currentBalance -= actualDeduct;
    card.status = card.currentBalance === 0 ? 'fully_redeemed' : 'partially_redeemed';
    card.updatedAt = new Date();

    inMemoryTransactions.unshift({
      id: `gctx_${Date.now()}`,
      giftCardId: card.id,
      giftCardCode: card.code,
      type: 'redemption',
      amount: -actualDeduct,
      balanceBefore,
      balanceAfter: card.currentBalance,
      orderId: orderDetails.orderId || null,
      orderNumber: orderDetails.orderNumber || null,
      userId: orderDetails.userId || null,
      customerEmail: orderDetails.customerEmail || '',
      description: `Redeemed ₹${actualDeduct} on Order #${orderDetails.orderNumber || 'Checkout'}`,
      createdAt: new Date(),
    });

    return {
      success: true,
      deducted: actualDeduct,
      remainingBalance: card.currentBalance,
      card: { ...card },
    };
  }

  /**
   * Claims a gift card balance into a user's digital wallet/account balance
   */
  public static async claimToWallet(
    code: string,
    pin: string,
    userId: string,
    userEmail: string
  ): Promise<{ card: IGiftCard; claimedAmount: number }> {
    const normalized = (code || '').toUpperCase().trim();
    const normalizedPin = (pin || '').trim();

    if (isDbConnected()) {
      const doc = await GiftCard.findOne({ code: normalized });
      if (!doc) throw new Error(`Gift card code '${normalized}' was not found.`);
      if (doc.pin && doc.pin !== normalizedPin) {
        throw new Error('Invalid 4-digit security PIN.');
      }
      if (doc.status !== 'active' && doc.status !== 'partially_redeemed') {
        throw new Error(`This gift card is ${doc.status} and cannot be claimed.`);
      }
      if (doc.currentBalance <= 0) {
        throw new Error('This gift card has already been completely redeemed.');
      }
      if (doc.claimantUserId) {
        throw new Error('This gift card has already been claimed to another user wallet.');
      }

      const claimedAmount = doc.currentBalance;
      const balanceBefore = doc.currentBalance;

      doc.currentBalance = 0;
      doc.status = 'fully_redeemed';
      doc.claimantUserId = userId;
      doc.claimedAt = new Date();
      await doc.save();

      await GiftCardTransaction.create({
        giftCardId: doc._id.toString(),
        giftCardCode: doc.code,
        type: 'wallet_claim',
        amount: -claimedAmount,
        balanceBefore,
        balanceAfter: 0,
        userId,
        customerEmail: userEmail,
        description: `Balance claimed to account wallet (${userEmail})`,
      });

      return {
        card: doc.toJSON() as IGiftCard,
        claimedAmount,
      };
    }

    // In-memory fallback
    const card = inMemoryGiftCards.find(c => c.code.toUpperCase() === normalized);
    if (!card) throw new Error(`Gift card code '${normalized}' was not found.`);
    if (card.pin && card.pin !== normalizedPin) {
      throw new Error('Invalid 4-digit security PIN.');
    }
    if (card.status !== 'active' && card.status !== 'partially_redeemed') {
      throw new Error(`This gift card is ${card.status} and cannot be claimed.`);
    }
    if (card.currentBalance <= 0) {
      throw new Error('This gift card has already been completely redeemed.');
    }
    if (card.claimantUserId) {
      throw new Error('This gift card has already been claimed to another user wallet.');
    }

    const claimedAmount = card.currentBalance;
    const balanceBefore = card.currentBalance;

    card.currentBalance = 0;
    card.status = 'fully_redeemed';
    card.claimantUserId = userId;
    card.claimedAt = new Date();
    card.updatedAt = new Date();

    inMemoryTransactions.unshift({
      id: `gctx_${Date.now()}`,
      giftCardId: card.id,
      giftCardCode: card.code,
      type: 'wallet_claim',
      amount: -claimedAmount,
      balanceBefore,
      balanceAfter: 0,
      userId,
      customerEmail: userEmail,
      description: `Balance claimed to account wallet (${userEmail})`,
      createdAt: new Date(),
    });

    return {
      card: { ...card },
      claimedAmount,
    };
  }

  /**
   * Update status (e.g. freeze, activate, cancel)
   */
  public static async updateStatus(id: string, status: GiftCardStatus, notes?: string): Promise<IGiftCard | null> {
    if (isDbConnected()) {
      const doc = await GiftCard.findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            ...(notes ? { notes } : {}),
          },
        },
        { new: true }
      );
      return doc ? (doc.toJSON() as IGiftCard) : null;
    }

    const card = inMemoryGiftCards.find(c => c.id === id || (c as any)._id === id);
    if (!card) return null;
    card.status = status;
    if (notes) card.notes = notes;
    card.updatedAt = new Date();
    return { ...card };
  }

  /**
   * Get card transactions
   */
  public static async getTransactions(giftCardCode: string): Promise<IGiftCardTransaction[]> {
    const normalized = (giftCardCode || '').toUpperCase().trim();
    if (isDbConnected()) {
      const docs = await GiftCardTransaction.find({ giftCardCode: normalized }).sort({ createdAt: -1 });
      return docs.map(d => d.toJSON() as IGiftCardTransaction);
    }
    return inMemoryTransactions.filter(t => t.giftCardCode.toUpperCase() === normalized);
  }

  /**
   * Get overall commerce gift card metrics for Admin Dashboard
   */
  public static async getMetrics(): Promise<{
    totalFloat: number;
    totalIssued: number;
    totalRedeemed: number;
    activeCount: number;
    partiallyRedeemedCount: number;
  }> {
    if (isDbConnected()) {
      const [cards, activeCount, partiallyRedeemedCount] = await Promise.all([
        GiftCard.find({}, { initialAmount: 1, currentBalance: 1, status: 1 }),
        GiftCard.countDocuments({ status: 'active' }),
        GiftCard.countDocuments({ status: 'partially_redeemed' }),
      ]);

      let totalIssued = 0;
      let totalFloat = 0;

      cards.forEach(c => {
        totalIssued += Number(c.initialAmount) || 0;
        if (c.status === 'active' || c.status === 'partially_redeemed') {
          totalFloat += Number(c.currentBalance) || 0;
        }
      });

      const totalRedeemed = Math.max(0, totalIssued - totalFloat);

      return {
        totalFloat,
        totalIssued,
        totalRedeemed,
        activeCount,
        partiallyRedeemedCount,
      };
    }

    let totalIssued = 0;
    let totalFloat = 0;
    let activeCount = 0;
    let partiallyRedeemedCount = 0;

    inMemoryGiftCards.forEach(c => {
      totalIssued += Number(c.initialAmount) || 0;
      if (c.status === 'active' || c.status === 'partially_redeemed') {
        totalFloat += Number(c.currentBalance) || 0;
      }
      if (c.status === 'active') activeCount++;
      if (c.status === 'partially_redeemed') partiallyRedeemedCount++;
    });

    const totalRedeemed = Math.max(0, totalIssued - totalFloat);

    return {
      totalFloat,
      totalIssued,
      totalRedeemed,
      activeCount,
      partiallyRedeemedCount,
    };
  }
}
