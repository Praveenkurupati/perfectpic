// apps/backend/src/services/CustomerService.ts
import { UserRepository } from '../repositories/UserRepository';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

const fallbackCustomers = [
  { id: "CUST-001", name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", joinedDate: "Sep 15, 2026", ordersCount: 3, totalSpent: "5,997" },
  { id: "CUST-002", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 98765 43211", joinedDate: "Aug 20, 2026", ordersCount: 1, totalSpent: "1,999" },
  { id: "CUST-003", name: "Ananya Rao", email: "ananya@example.com", phone: "+91 98765 43212", joinedDate: "Jul 10, 2026", ordersCount: 2, totalSpent: "4,498" },
  { id: "CUST-004", name: "Vikram Malhotra", email: "vikram@example.com", phone: "+91 98765 43213", joinedDate: "Jun 05, 2026", ordersCount: 5, totalSpent: "11,995" },
];

export class CustomerService {
  public static async getCustomers(searchQuery?: string, page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    const { users } = await UserRepository.findAll(500, 0);

    if (users && users.length > 0) {
      // Real aggregation of user orders and total spent from MongoDB
      const userEmails = users.map((u: any) => (u.email || '').toLowerCase().trim()).filter(Boolean);
      const statsMap = new Map<string, { count: number; totalSpent: number }>();

      if (isDbConnected()) {
        try {
          const orderAgg = await Order.aggregate([
            { $match: { customerEmail: { $in: userEmails } } },
            {
              $group: {
                _id: { $toLower: '$customerEmail' },
                count: { $sum: 1 },
                totalSpent: { $sum: '$total' },
              },
            },
          ]);
          for (const s of orderAgg) {
            statsMap.set(String(s._id).toLowerCase(), {
              count: s.count || 0,
              totalSpent: s.totalSpent || 0,
            });
          }
        } catch (err: any) {
          logger.error('Error aggregating customer order metrics:', err.message);
        }
      }

      const customers = users.map((u: any, idx: number) => {
        const emailLower = (u.email || '').toLowerCase().trim();
        const stat = statsMap.get(emailLower) || { count: 0, totalSpent: 0 };
        return {
          id: `CUST-${String(idx + 1).padStart(3, '0')}`,
          name: u.name || 'Customer',
          email: u.email,
          phone: u.phone || '+91 98765 00000',
          joinedDate: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent',
          ordersCount: stat.count,
          totalSpent: stat.totalSpent.toLocaleString('en-IN'),
        };
      });

      let filtered = customers;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));
      const paged = filtered.slice(skip, skip + safeLimit);
      return { customers: paged, total, page: safePage, totalPages, limit: safeLimit };
    }

    if (isDbConnected()) {
      return { customers: [], total: 0, page: safePage, totalPages: 1, limit: safeLimit };
    }

    let result = [...fallbackCustomers];
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
