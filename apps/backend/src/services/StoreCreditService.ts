// apps/backend/src/services/StoreCreditService.ts
import { User, IUser } from '../db/models/User';
import { StoreCreditLedger, IStoreCreditLedger } from '../db/models/StoreCreditLedger';
import { GiftCardRepository } from '../repositories/GiftCardRepository';
import { UserRepository } from '../repositories/UserRepository';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

// In-memory wallet storage fallback for offline dev/tests
const inMemoryUserWallets: Map<string, number> = new Map([
  ['mock-user-1', 2500],
  ['user_priya', 1500],
]);

const inMemoryLedgers: any[] = [
  {
    id: 'scl-demo-1',
    userId: 'mock-user-1',
    userEmail: 'priya@example.com',
    type: 'gift_card_claim',
    amount: 2500,
    balanceBefore: 0,
    balanceAfter: 2500,
    referenceId: 'PPGC-GOLD-2026-HEIR',
    description: 'Claimed gift card PPGC-GOLD-2026-HEIR',
    createdAt: new Date('2026-09-02T12:00:00.000Z'),
  },
];

export class StoreCreditService {
  /**
   * Retrieves the current available store credit balance for a user
   */
  public static async getUserBalance(userId: string): Promise<number> {
    if (!userId) return 0;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      return Math.max(0, Number(user?.storeCredit) || 0);
    }

    // In-memory fallback
    return inMemoryUserWallets.get(userId) || 0;
  }

  /**
   * Claims an active gift card and deposits its full remaining balance into the user's digital wallet
   */
  public static async claimGiftCard(
    userId: string,
    code: string,
    pin: string
  ): Promise<{
    success: boolean;
    claimedAmount: number;
    newBalance: number;
    giftCardCode: string;
  }> {
    if (!userId) {
      throw new Error('Authentication required to claim gift card to account wallet.');
    }

    let userEmail = 'user@perfectpic.in';
    let currentBalance = 0;

    if (isDbConnected()) {
      const userDoc = await User.findById(userId);
      if (!userDoc) {
        throw new Error('User account not found.');
      }
      userEmail = userDoc.email;
      currentBalance = Number(userDoc.storeCredit) || 0;

      // 1. Claim card from repository (zeros card balance and marks fully_redeemed)
      const { card, claimedAmount } = await GiftCardRepository.claimToWallet(code, pin, userId, userEmail);

      // 2. Atomically credit the user's storeCredit
      const balanceBefore = currentBalance;
      const newBalance = balanceBefore + claimedAmount;

      userDoc.storeCredit = newBalance;
      await userDoc.save();

      // 3. Record immutable StoreCreditLedger entry
      await StoreCreditLedger.create({
        userId,
        userEmail,
        type: 'gift_card_claim',
        amount: claimedAmount,
        balanceBefore,
        balanceAfter: newBalance,
        referenceId: card.code,
        description: `Redeemed Gift Card ${card.code} (+₹${claimedAmount})`,
      });

      return {
        success: true,
        claimedAmount,
        newBalance,
        giftCardCode: card.code,
      };
    }

    // In-memory fallback
    const { card, claimedAmount } = await GiftCardRepository.claimToWallet(code, pin, userId, userEmail);
    const balanceBefore = inMemoryUserWallets.get(userId) || 0;
    const newBalance = balanceBefore + claimedAmount;
    inMemoryUserWallets.set(userId, newBalance);

    inMemoryLedgers.unshift({
      id: `scl_${Date.now()}`,
      userId,
      userEmail,
      type: 'gift_card_claim',
      amount: claimedAmount,
      balanceBefore,
      balanceAfter: newBalance,
      referenceId: card.code,
      description: `Redeemed Gift Card ${card.code} (+₹${claimedAmount})`,
      createdAt: new Date(),
    });

    return {
      success: true,
      claimedAmount,
      newBalance,
      giftCardCode: card.code,
    };
  }

  /**
   * Deducts store credit atomically when an order is placed
   */
  public static async deductCreditForOrder(
    userId: string,
    deductAmount: number,
    orderDetails: {
      orderId?: string;
      orderNumber?: string;
      customerEmail?: string;
    }
  ): Promise<{
    deducted: number;
    remainingBalance: number;
  }> {
    const amount = Math.max(0, Math.round(Number(deductAmount) || 0));
    if (amount <= 0 || !userId) {
      const balance = await this.getUserBalance(userId);
      return { deducted: 0, remainingBalance: balance };
    }

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found.');

      const available = Number(user.storeCredit) || 0;
      if (available <= 0) {
        throw new Error('Your account store credit balance is zero.');
      }

      const actualDeduct = Math.min(available, amount);
      const balanceBefore = available;
      const balanceAfter = balanceBefore - actualDeduct;

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          storeCredit: { $gte: actualDeduct },
        },
        {
          $inc: { storeCredit: -actualDeduct },
        },
        { new: true }
      );

      if (!updated) {
        throw new Error('Store credit deduction conflict. Balance could not be locked.');
      }

      await StoreCreditLedger.create({
        userId,
        userEmail: user.email,
        type: 'order_redemption',
        amount: -actualDeduct,
        balanceBefore,
        balanceAfter,
        referenceId: orderDetails.orderNumber || orderDetails.orderId || null,
        description: `Applied to Order #${orderDetails.orderNumber || orderDetails.orderId || 'Checkout'} (-₹${actualDeduct})`,
      });

      return {
        deducted: actualDeduct,
        remainingBalance: balanceAfter,
      };
    }

    // In-memory fallback
    const balanceBefore = inMemoryUserWallets.get(userId) || 0;
    const actualDeduct = Math.min(balanceBefore, amount);
    const balanceAfter = Math.max(0, balanceBefore - actualDeduct);
    inMemoryUserWallets.set(userId, balanceAfter);

    inMemoryLedgers.unshift({
      id: `scl_${Date.now()}`,
      userId,
      userEmail: orderDetails.customerEmail || 'user@perfectpic.in',
      type: 'order_redemption',
      amount: -actualDeduct,
      balanceBefore,
      balanceAfter,
      referenceId: orderDetails.orderNumber || orderDetails.orderId || null,
      description: `Applied to Order #${orderDetails.orderNumber || orderDetails.orderId || 'Checkout'} (-₹${actualDeduct})`,
      createdAt: new Date(),
    });

    return {
      deducted: actualDeduct,
      remainingBalance: balanceAfter,
    };
  }

  /**
   * Admin courtesy grant or goodwill compensation
   */
  public static async grantAdminCredit(
    userId: string,
    amount: number,
    adminEmail: string,
    reason: string
  ): Promise<{ newBalance: number; grantedAmount: number }> {
    const grant = Math.max(1, Math.round(Number(amount) || 0));

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found.');

      const balanceBefore = Number(user.storeCredit) || 0;
      const balanceAfter = balanceBefore + grant;

      user.storeCredit = balanceAfter;
      await user.save();

      await StoreCreditLedger.create({
        userId,
        userEmail: user.email,
        type: 'admin_grant',
        amount: grant,
        balanceBefore,
        balanceAfter,
        description: `Courtesy credit granted by ${adminEmail}: ${reason}`,
      });

      return { newBalance: balanceAfter, grantedAmount: grant };
    }

    // In-memory fallback
    const balanceBefore = inMemoryUserWallets.get(userId) || 0;
    const balanceAfter = balanceBefore + grant;
    inMemoryUserWallets.set(userId, balanceAfter);

    inMemoryLedgers.unshift({
      id: `scl_${Date.now()}`,
      userId,
      userEmail: 'user@perfectpic.in',
      type: 'admin_grant',
      amount: grant,
      balanceBefore,
      balanceAfter,
      description: `Courtesy credit granted by ${adminEmail}: ${reason}`,
      createdAt: new Date(),
    });

    return { newBalance: balanceAfter, grantedAmount: grant };
  }

  /**
   * Retrieves transaction ledger for user account wallet
   */
  public static async getLedgerHistory(userId: string): Promise<IStoreCreditLedger[]> {
    if (!userId) return [];

    if (isDbConnected()) {
      const docs = await StoreCreditLedger.find({ userId }).sort({ createdAt: -1 }).limit(50);
      return docs.map(d => d.toJSON() as IStoreCreditLedger);
    }

    return inMemoryLedgers.filter(l => l.userId === userId);
  }
}
