import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/Product';
import { Order } from './models/Order';
import { Project } from './models/Project';
import { User } from './models/User';
import { Ticket } from '../models/Ticket';
import bcrypt from 'bcryptjs';
import { defaultBooks } from '../data/defaultBooks';
import { connectRedis, cacheFlushAll } from '../cache/redis';

async function runSeed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfectpic';

  console.log('====================================================');
  console.log('🌱 Starting PerfectPic Database Seed & Migration');
  console.log('====================================================');
  console.log(`📡 Connecting to MongoDB Atlas: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { 
      serverSelectionTimeoutMS: 15000,
      dbName: 'perfectpic'
    });
    console.log(`✅ MongoDB Atlas connected successfully to database: "${mongoose.connection.name}"`);

    // 1. Seed Products (35 Destination & Themed Books with Full Trip Photos)
    console.log(`\n📦 Step 1: Seeding ${defaultBooks.length} destination and themed photobooks...`);
    await Product.deleteMany({});
    console.log('  🧹 Cleared existing products collection in Atlas.');

    const createdProducts = [];
    for (const book of defaultBooks) {
      const p = await Product.create({
        ...book,
        defaultOptions: {
          size: '8.25x8.25',
          cover: 'cov-1',
          theme: 'theme-4',
          color: 'col-1',
          packaging: 'pack-1'
        }
      });
      createdProducts.push(p);
    }
    console.log(`  ✨ Successfully inserted ${createdProducts.length} photobook templates into Atlas with rich trip photos!`);

    // 2. Seed Users (Admin, Personal, Key Customers & 30 Standard Users)
    console.log('\n👥 Step 2: Seeding User Accounts (Admin, Personal & Customers)...');
    await User.deleteMany({});
    console.log('  🧹 Cleared existing users collection in Atlas.');

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const coreUsers: Array<{
      name: string;
      email: string;
      phone: string;
      password: string;
      role: 'admin' | 'user';
      avatar: string;
    }> = [
      {
        name: 'Admin PerfectPic',
        email: 'admin@perfectpic.in',
        phone: '+91 99999 00000',
        password: defaultPasswordHash,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop'
      },
      {
        name: 'Praveen Kurupati',
        email: 'praveen@perfectpic.in',
        phone: '+91 98765 43210',
        password: defaultPasswordHash,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 98765 43210',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        phone: '+91 98123 45678',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop'
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya@example.com',
        phone: '+91 97654 32109',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop'
      },
      {
        name: 'Arjun Kapoor',
        email: 'arjun@example.com',
        phone: '+91 98111 22334',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop'
      },
      {
        name: 'Sneha Rao',
        email: 'sneha@example.com',
        phone: '+91 98490 11223',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop'
      },
      {
        name: 'Kavya Pillai',
        email: 'kavya@example.com',
        phone: '+91 94470 55667',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop'
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan@example.com',
        phone: '+91 98250 99887',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop'
      },
      {
        name: 'Diya Patel',
        email: 'diya@example.com',
        phone: '+91 98980 77665',
        password: defaultPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop'
      }
    ];

    for (const u of coreUsers) {
      await User.create(u);
    }

    const indianNames = [
      'Aarav Sharma', 'Diya Patel', 'Rohan Verma', 'Ananya Iyer', 'Kabir Mehta',
      'Ishaan Nair', 'Mira Reddy', 'Aditya Joshi', 'Pooja Bhatt', 'Vikram Singh',
      'Sneha Rao', 'Arjun Kapoor', 'Tanvi Desai', 'Siddharth Roy', 'Rhea Sen',
      'Karan Malhotra', 'Tara Nambiar', 'Dev Singhania', 'Kavya Pillai', 'Varun Dhawan',
      'Nisha Hegde', 'Gautam Chopra', 'Meera Kulkarni', 'Dhruv Saxena', 'Avani Banerji',
      'Harsh Vardhan', 'Shreya Ghoshal', 'Nikhil Kamath', 'Alia Bhatt', 'Sanya Kapoor'
    ];

    const usersToInsert = [];
    for (let i = 1; i <= 30; i++) {
      usersToInsert.push({
        name: indianNames[i - 1] || `Customer ${i}`,
        email: `user${i}@perfectpic.in`,
        phone: `+91 98000 ${String(i).padStart(5, '0')}`,
        password: defaultPasswordHash,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
      });
    }

    const createdNumberedUsers = await User.insertMany(usersToInsert as any[]);
    console.log(`  ✨ Successfully inserted ${coreUsers.length + createdNumberedUsers.length} user accounts!`);
    console.log('     🔑 Admin: admin@perfectpic.in / password123');
    console.log('     🔑 Personal: praveen@perfectpic.in / password123');
    console.log('     🔑 Customers: priya@example.com, rahul@example.com, etc. / password123');
    console.log('     🔑 Test Users: user1@perfectpic.in to user30@perfectpic.in / password123');

    // 3. Seed Sample Orders with Rich Trip Themes & Full Stages
    console.log('\n📦 Step 3: Seeding realistic production orders...');
    await Order.deleteMany({});
    const initialOrders = [
      {
        orderNumber: 'PP-8491',
        title: 'Kerala Gods Own Country',
        customerName: 'Priya Sharma',
        customerEmail: 'priya@example.com',
        customerPhone: '+91 98765 43210',
        amount: 1999,
        total: 1999,
        status: 'production',
        thumbnail: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
        pageCount: 40,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Priya Sharma',
          addressLine1: 'Flat 402, Lotus Residency, 12th Main',
          addressLine2: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          country: 'India'
        },
        paymentDetails: {
          provider: 'razorpay',
          paymentId: 'pay_O8491KeralaTest',
          status: 'captured',
          amount: 1999
        }
      },
      {
        orderNumber: 'PP-7201',
        title: 'Netravati Peak Cloud Trails',
        customerName: 'Rahul Verma',
        customerEmail: 'rahul@example.com',
        customerPhone: '+91 98123 45678',
        amount: 1999,
        total: 1999,
        status: 'delivered',
        thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
        pageCount: 32,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Rahul Verma',
          addressLine1: 'Villa 14, Palm Grove',
          addressLine2: 'Sector 54, Golf Course Road',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122002',
          country: 'India'
        },
        paymentDetails: {
          provider: 'razorpay',
          paymentId: 'pay_O7201Netravati',
          status: 'captured',
          amount: 1999
        }
      },
      {
        orderNumber: 'PP-6350',
        title: 'Himalayan Summit Chronicles',
        customerName: 'Ananya Deshmukh',
        customerEmail: 'ananya@example.com',
        customerPhone: '+91 97654 32109',
        amount: 2499,
        total: 2499,
        status: 'dispatched',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
        pageCount: 48,
        dimensions: '10" × 10"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Ananya Deshmukh',
          addressLine1: 'B-701, Sea Breeze Apartments',
          addressLine2: 'Carter Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India'
        },
        paymentDetails: {
          provider: 'razorpay',
          paymentId: 'pay_O6350Himalaya',
          status: 'captured',
          amount: 2499
        }
      },
      {
        orderNumber: 'PP-5120',
        title: 'Rajasthan Land of Kings',
        customerName: 'Arjun Kapoor',
        customerEmail: 'arjun@example.com',
        customerPhone: '+91 98111 22334',
        amount: 2499,
        total: 2499,
        status: 'printing',
        thumbnail: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop',
        pageCount: 40,
        dimensions: '10" × 10"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Arjun Kapoor',
          addressLine1: '32 Barakhamba Road',
          addressLine2: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-4090',
        title: 'Goa Golden Shores',
        customerName: 'Sneha Rao',
        customerEmail: 'sneha@example.com',
        customerPhone: '+91 98490 11223',
        amount: 1999,
        total: 1999,
        status: 'qc',
        thumbnail: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop',
        pageCount: 32,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Sneha Rao',
          addressLine1: 'Plot 88, Road No. 36',
          addressLine2: 'Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-3840',
        title: 'Varkala Bohemian Cliffs',
        customerName: 'Kavya Pillai',
        customerEmail: 'kavya@example.com',
        customerPhone: '+91 94470 55667',
        amount: 1999,
        total: 1999,
        status: 'production',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        pageCount: 32,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Kavya Pillai',
          addressLine1: 'Heritage Villa 7, Rose Street',
          addressLine2: 'Fort Kochi',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-3210',
        title: 'Ladakh Moonland & Monasteries',
        customerName: 'Rohan Mehta',
        customerEmail: 'rohan@example.com',
        customerPhone: '+91 98250 99887',
        amount: 2999,
        total: 2999,
        status: 'confirmed',
        thumbnail: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        pageCount: 48,
        dimensions: '10" × 10"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Rohan Mehta',
          addressLine1: 'A-42, Bodakdev',
          addressLine2: 'SG Highway',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380054',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-2890',
        title: 'Paris Journey Hardcover',
        customerName: 'Diya Patel',
        customerEmail: 'diya@example.com',
        customerPhone: '+91 98980 77665',
        amount: 1999,
        total: 1999,
        status: 'pending',
        thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        pageCount: 40,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Diya Patel',
          addressLine1: 'Flat 12, City Light Road',
          addressLine2: 'Athwa',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395007',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-2450',
        title: 'Kudremukh Rolling Meadows',
        customerName: 'Aditya Joshi',
        customerEmail: 'aditya@example.com',
        customerPhone: '+91 98220 33445',
        amount: 1999,
        total: 1999,
        status: 'delivered',
        thumbnail: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
        pageCount: 32,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Aditya Joshi',
          addressLine1: 'Bungalow 9, Model Colony',
          addressLine2: 'Shivajinagar',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411016',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-2100',
        title: 'Munnar Emerald Hills',
        customerName: 'Vikram Singh',
        customerEmail: 'vikram@example.com',
        customerPhone: '+91 94140 12345',
        amount: 1999,
        total: 1999,
        status: 'dispatched',
        thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
        pageCount: 32,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Vikram Singh',
          addressLine1: 'C-18, Malviya Nagar',
          addressLine2: 'Airport Road',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302017',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-1920',
        title: 'Our 1st Anniversary Keepsake',
        customerName: 'Praveen Kurupati',
        customerEmail: 'praveen@perfectpic.in',
        customerPhone: '+91 98765 43210',
        amount: 2499,
        total: 2499,
        status: 'delivered',
        thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
        pageCount: 36,
        dimensions: '10" × 10"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Praveen Kurupati',
          addressLine1: 'Penthouse 1802, Prestige Tower',
          addressLine2: 'Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
          country: 'India'
        }
      },
      {
        orderNumber: 'PP-1680',
        title: 'Spiti Valley Stark Beauty',
        customerName: 'Praveen Kurupati',
        customerEmail: 'praveen@perfectpic.in',
        customerPhone: '+91 98765 43210',
        amount: 2499,
        total: 2499,
        status: 'printing',
        thumbnail: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        pageCount: 40,
        dimensions: '8.25" × 8.25"',
        itemsCount: 1,
        shippingAddress: {
          fullName: 'Praveen Kurupati',
          addressLine1: 'Penthouse 1802, Prestige Tower',
          addressLine2: 'Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
          country: 'India'
        }
      }
    ];

    for (const order of initialOrders) {
      await Order.create(order);
    }
    console.log(`  ✨ Successfully inserted ${initialOrders.length} production orders across all status stages!`);

    // 4. Seed User Projects (Ready-to-Test Drafts with Full Photo Sets)
    console.log('\n📦 Step 4: Seeding ready-to-test user draft photobooks...');
    await Project.deleteMany({});
    const initialProjects = [
      {
        title: 'Kerala Backwaters & Houseboat Trip',
        template: 'travel-series-kerala',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
        pageCount: 32,
        bookSize: '8.25x8.25',
        theme: 'Minimal Modern',
        color: '#3B7A57',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop', name: 'Houseboat' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop', name: 'Canal' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop', name: 'Temple' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop', name: 'Tea Hills' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop', name: 'Sunset' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop', name: 'Beach' },
          { id: 'p7', url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop', name: 'Resort' },
          { id: 'p8', url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop', name: 'Tropical' }
        ]
      },
      {
        title: 'Netravati Peak Monsoon Ridge Trek',
        template: 'trek-series-nethravathi',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
        pageCount: 32,
        bookSize: '8.25x8.25',
        theme: 'Wanderlust',
        color: '#4E7055',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop', name: 'Summit' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop', name: 'Forest' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', name: 'Valley' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop', name: 'Fog' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop', name: 'Meadow' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop', name: 'Trail' },
          { id: 'p7', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop', name: 'Sunrise' },
          { id: 'p8', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop', name: 'Deep Woods' }
        ]
      },
      {
        title: 'Himalayan Summit Diaries',
        template: 'trek-series-himalaya',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
        pageCount: 40,
        bookSize: '10x10',
        theme: 'Classic Cream',
        color: '#415A77',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop', name: 'Peaks' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop', name: 'Ridge' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop', name: 'Pass' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop', name: 'Camp' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop', name: 'Mountaineer' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', name: 'Glacier' }
        ]
      },
      {
        title: 'Ladakh Moonland & Monasteries',
        template: 'travel-series-ladakh',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop',
        pageCount: 40,
        bookSize: '10x10',
        theme: 'Dark Luxe',
        color: '#D4A373',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop', name: 'Pangong' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', name: 'Monastery' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop', name: 'Valley' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop', name: 'Pass' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop', name: 'Prayer Flags' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop', name: 'Stars' }
        ]
      },
      {
        title: 'Royal Rajasthan Forts & Desert',
        template: 'travel-series-rajasthan',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop',
        pageCount: 32,
        bookSize: '8.25x8.25',
        theme: 'Romance',
        color: '#D87040',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop', name: 'Hawa Mahal' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop', name: 'Amer Fort' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop', name: 'Dunes' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop', name: 'Lake' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop', name: 'Jharokha' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop', name: 'Courtyard' }
        ]
      },
      {
        title: 'The Paris Chapter Edit',
        template: 'travel-series-paris',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        pageCount: 40,
        bookSize: '8.25x8.25',
        theme: 'Minimal Modern',
        color: '#F8BAC7',
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop', name: 'Eiffel Tower' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop', name: 'Louvre' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=800&auto=format&fit=crop', name: 'Cafe' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1471623432079-b009d30b6729?w=800&auto=format&fit=crop', name: 'Montmartre' },
          { id: 'p5', url: 'https://images.unsplash.com/photo-1520939817895-060bdef4dc1b?w=800&auto=format&fit=crop', name: 'Seine' },
          { id: 'p6', url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop', name: 'Illumination' }
        ]
      }
    ];

    for (const proj of initialProjects) {
      await Project.create(proj);
    }
    console.log(`  ✨ Successfully inserted ${initialProjects.length} initial test drafts with full trip photo sets!`);

    // 5. Seed Support Tickets
    console.log('\n🎫 Step 5: Seeding support desk tickets...');
    await Ticket.deleteMany({});
    const initialTickets: any[] = [
      {
        ticketNumber: 'TCK-1001',
        type: 'Address Change',
        subject: 'Update shipping address for Order PP-8491 before dispatch',
        customerName: 'Priya Sharma',
        customerEmail: 'priya@example.com',
        orderNumber: 'PP-8491',
        status: 'In Progress',
        priority: 'Medium',
        messages: [
          { sender: 'customer', text: 'Hi, I shifted to a new apartment in Indiranagar. Please update my flat number to 402.' },
          { sender: 'support', text: 'Hello Priya, we have noted your new apartment number and updated the shipping label with our courier partner.' }
        ]
      },
      {
        ticketNumber: 'TCK-1002',
        type: 'Damage Report',
        subject: 'Corners bent in courier transit for PP-7201',
        customerName: 'Rahul Verma',
        customerEmail: 'rahul@example.com',
        orderNumber: 'PP-7201',
        status: 'Open',
        priority: 'High',
        messages: [
          { sender: 'customer', text: 'Received the book today, outer box had water damage and the back corner was dented.' },
          { sender: 'system', text: '7-Day Reprint Guarantee triggered. Support team notified.' }
        ]
      },
      {
        ticketNumber: 'TCK-1003',
        type: 'General Query',
        subject: 'Tracking link not active for PP-6350',
        customerName: 'Ananya Deshmukh',
        customerEmail: 'ananya@example.com',
        orderNumber: 'PP-6350',
        status: 'Resolved',
        priority: 'Low',
        messages: [
          { sender: 'customer', text: 'BlueDart tracking shows manifest created, when will it update?' },
          { sender: 'support', text: 'BlueDart scans take 4-6 hours to sync. It is currently in transit to Mumbai hub.' }
        ]
      },
      {
        ticketNumber: 'TCK-1004',
        type: 'General Query',
        subject: 'Can I add 20 extra pages to Himalayan book?',
        customerName: 'Arjun Kapoor',
        customerEmail: 'arjun@example.com',
        orderNumber: 'PP-5120',
        status: 'Closed',
        priority: 'Low',
        messages: [
          { sender: 'customer', text: 'Can I add more pages during the design phase?' },
          { sender: 'support', text: 'Yes, up to 120 pages are supported at ₹20 per page.' }
        ]
      }
    ];

    for (const ticket of initialTickets) {
      await Ticket.create(ticket);
    }
    console.log(`  ✨ Successfully inserted ${initialTickets.length} support tickets into Atlas!`);

    // 6. Redis Cache Flush
    console.log('\n⚡ Step 6: Invalidating Redis cache...');
    try {
      await connectRedis();
      await cacheFlushAll();
      console.log('  ✨ Redis cache refreshed successfully!');
    } catch (e: any) {
      console.log(`  ℹ️ Redis cache skip: ${e.message}`);
    }

    console.log('\n====================================================');
    console.log('🎉 PERFECTPIC ATLAS DATABASE SEED COMPLETE!');
    console.log('====================================================\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSeed();
