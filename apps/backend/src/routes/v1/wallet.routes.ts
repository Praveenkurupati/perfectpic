// apps/backend/src/routes/v1/wallet.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { StoreCreditService } from '../../services/StoreCreditService';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/apiError';

const router = Router();

/**
 * GET /api/v1/wallet/balance
 * Returns the authenticated user's current store credit balance and recent transactions
 */
router.get('/balance', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const balance = await StoreCreditService.getUserBalance(userId);
    const transactions = await StoreCreditService.getLedgerHistory(userId);

    res.status(200).json({
      success: true,
      balance,
      transactions: transactions.slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/wallet/transactions
 * Returns the full store credit ledger history for the authenticated user
 */
router.get('/transactions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const transactions = await StoreCreditService.getLedgerHistory(userId);

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallet/admin/credit
 * Admin endpoint to grant store credit to a user account
 */
router.post('/admin/credit', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) {
      throw ApiError.badRequest('User ID and credit amount are required.');
    }

    const adminEmail = (req as any).user?.email || 'admin@perfectpic.in';
    const result = await StoreCreditService.grantAdminCredit(
      userId,
      Number(amount),
      adminEmail,
      reason || 'Customer service courtesy adjustment'
    );

    res.status(200).json({
      success: true,
      message: `Granted ₹${result.grantedAmount} store credit to user.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
