export const revenueData = [
  { name: 'Jan', revenue: 400000 },
  { name: 'Feb', revenue: 300000 },
  { name: 'Mar', revenue: 500000 },
  { name: 'Apr', revenue: 278000 },
  { name: 'May', revenue: 189000 },
  { name: 'Jun', revenue: 239000 },
  { name: 'Jul', revenue: 349000 },
  { name: 'Aug', revenue: 600000 },
  { name: 'Sep', revenue: 450000 },
  { name: 'Oct', revenue: 700000 },
  { name: 'Nov', revenue: 900000 },
  { name: 'Dec', revenue: 1200000 },
];

export const recentOrders = [
  { id: 'WB-8491', customer: 'Praveen K.', date: 'Oct 24, 2024', pages: 40, size: '8x8', status: 'confirmed', amount: 3247, packagingBadges: ['🎁 Velvet Box', '🎀 Ribbon Wrap', '📷 Polaroids'], isGift: true },
  { id: 'WB-8490', customer: 'Anjali Sharma', date: 'Oct 24, 2024', pages: 60, size: '10x10', status: 'printing', amount: 4049, packagingBadges: ['🛡️ UV Glaze'] },
  { id: 'WB-8489', customer: 'Rahul Verma', date: 'Oct 23, 2024', pages: 30, size: '8x8', status: 'dispatched', amount: 1800 },
  { id: 'WB-8488', customer: 'Sneha Patel', date: 'Oct 23, 2024', pages: 100, size: '12x12', status: 'pending', amount: 7248, packagingBadges: ['🎁 Velvet Box', '🛡️ UV Glaze'] },
  { id: 'WB-8487', customer: 'Vikram Singh', date: 'Oct 22, 2024', pages: 50, size: '10x10', status: 'delivered', amount: 3200 },
  { id: 'WB-8486', customer: 'Priya Raj', date: 'Oct 22, 2024', pages: 40, size: '8x8', status: 'returned', amount: 2400 },
  { id: 'WB-8485', customer: 'Rohan Gupta', date: 'Oct 21, 2024', pages: 80, size: '10x10', status: 'printing', amount: 4800 },
  { id: 'WB-8484', customer: 'Kavita Das', date: 'Oct 21, 2024', pages: 30, size: '8x8', status: 'confirmed', amount: 1999, packagingBadges: ['🎀 Ribbon Wrap'], isGift: true },
  { id: 'WB-8483', customer: 'Amit Kumar', date: 'Oct 20, 2024', pages: 60, size: '12x12', status: 'dispatched', amount: 4200 },
  { id: 'WB-8482', customer: 'Neha Jain', date: 'Oct 20, 2024', pages: 40, size: '10x10', status: 'delivered', amount: 2800 },
];

export const customers = [
  { id: 'CUST-101', name: 'Praveen K.', phone: '+91 9876543210', email: 'praveen@example.com', ordersCount: 3, totalSpent: 7200, joinedDate: 'Jan 15, 2024' },
  { id: 'CUST-102', name: 'Anjali Sharma', phone: '+91 9876543211', email: 'anjali@example.com', ordersCount: 1, totalSpent: 3800, joinedDate: 'Oct 24, 2024' },
  { id: 'CUST-103', name: 'Rahul Verma', phone: '+91 9876543212', email: 'rahul@example.com', ordersCount: 5, totalSpent: 12500, joinedDate: 'Mar 10, 2023' },
];

export const tickets = [
  { id: 'TKT-501', customer: 'Sneha Patel', type: 'Address Change', subject: 'Change shipping address for WB-8488', status: 'Open', createdDate: 'Oct 24, 2024' },
  { id: 'TKT-502', customer: 'Priya Raj', type: 'Damage Report', subject: 'Cover corner slightly bent', status: 'In Progress', createdDate: 'Oct 23, 2024' },
  { id: 'TKT-503', customer: 'Rahul Verma', type: 'Reprint Request', subject: 'Wrong photos printed', status: 'Resolved', createdDate: 'Oct 20, 2024' },
];
