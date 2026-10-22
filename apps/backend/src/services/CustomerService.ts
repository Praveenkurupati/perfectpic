// apps/backend/src/services/CustomerService.ts
import { User } from '../db/models/User';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

const offlineDevCustomers = [
  { id: "CUST-001", name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", joinedDate: "Sep 15, 2026", ordersCount: 3, totalSpent: "5,997" },
  { id: "CUST-002", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 98765 43211", joinedDate: "Aug 20, 2026", ordersCount: 1, totalSpent: "1,999" },
  { id: "CUST-003", name: "Ananya Rao", email: "ananya@example.com", phone: "+91 98765 43212", joinedDate: "Jul 10, 2026", ordersCount: 2, totalSpent: "4,498" },
  { id: "CUST-004", name: "Vikram Malhotra", email: "vikram@example.com", phone: "+91 98765 43213", joinedDate: "Jun 05, 2026", ordersCount: 5, totalSpent: "11,995" },
];

export class CustomerService {
  public static async getCustomers(searchQuery?: string, page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    if (isDbConnected()) {
      try {
        const matchStage: any = { role: 'user' };
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
          const s = searchQuery.trim();
          const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          matchStage.$or = [{ name: regex }, { email: regex }, { phone: regex }];
        }

        const [facetResult] = await User.aggregate([
          { $match: matchStage },
          {
            $facet: {
              metadata: [{ $count: 'total' }],
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: safeLimit },
                {
                  $lookup: {
                    from: 'orders',
                    let: { userEmail: '$email' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $eq: [{ $toLower: '$customerEmail' }, { $toLower: '$$userEmail' }],
                          },
                        },
                      },
                      {
                        $group: {
                          _id: null,
                          ordersCount: { $sum: 1 },
                          totalSpent: { $sum: '$total' },
                        },
                      },
                    ],
                    as: 'orderStats',
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    createdAt: 1,
                    orderStats: { $arrayElemAt: ['$orderStats', 0] },
                  },
                },
              ],
            },
          },
        ]);

        const total = facetResult?.metadata?.[0]?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / safeLimit));
        const rawUsers = facetResult?.data || [];

        const customers = rawUsers.map((u: any, idx: number) => {
          const stats = u.orderStats || { ordersCount: 0, totalSpent: 0 };
          return {
            id: `CUST-${String(skip + idx + 1).padStart(3, '0')}`,
            userId: u._id.toString(),
            name: u.name || 'Customer',
            email: u.email,
            phone: u.phone || '+91 98765 00000',
            joinedDate: u.createdAt
              ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent',
            ordersCount: stats.ordersCount || 0,
            totalSpent: (stats.totalSpent || 0).toLocaleString('en-IN'),
          };
        });

        return { customers, total, page: safePage, totalPages, limit: safeLimit };
      } catch (err: any) {
        logger.error('Error in CustomerService aggregate query:', err.message);
        return { customers: [], total: 0, page: safePage, totalPages: 1, limit: safeLimit };
      }
    }

    // Offline development fallback when database is disconnected
    let result = [...offlineDevCustomers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const paged = result.slice(skip, skip + safeLimit);
    return { customers: paged, total, page: safePage, totalPages, limit: safeLimit };
  }
}

export default CustomerService;
