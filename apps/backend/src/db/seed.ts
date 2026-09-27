import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/Product';
import { Order } from './models/Order';
import { Project } from './models/Project';
import { defaultBooks } from '../data/defaultBooks';
import { connectRedis, cacheDelByPrefix, cacheFlushAll } from '../cache/redis';

async function runSeed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfectpic';

  console.log('====================================================');
  console.log('🌱 Starting PerfectPic Database Seed & Migration');
  console.log('====================================================');
  console.log(`📡 Connecting to MongoDB at: ${uri.includes('@') ? uri.split('@')[1] : uri}`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connection established.');

    // 1. Seed Products (23 Destination & Themed Books)
    console.log(`\n📦 Step 1: Seeding ${defaultBooks.length} destination and themed photobooks...`);
    await Product.deleteMany({});
    console.log('  🧹 Cleared existing products collection.');

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
    console.log(`  ✨ Successfully inserted ${createdProducts.length} photobook templates into MongoDB!`);

    // 2. Seed Sample Orders
    console.log('\n📦 Step 2: Seeding initial orders...');
    await Order.deleteMany({});
    const initialOrders = [
      {
        orderNumber: 'PP-8491',
        title: 'Paris Journey Hardcover',
        customerName: 'Priya Sharma',
        customerEmail: 'priya@example.com',
        customerPhone: '+91 98765 43210',
        amount: 1999,
        total: 1999,
        status: 'production',
        thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
        pageCount: 40,
        dimensions: '8.25" × 8.25"',
        shippingAddress: {
          fullName: 'Priya Sharma',
          addressLine1: 'Flat 402, Lotus Residency, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038'
        }
      },
      {
        orderNumber: 'PP-7201',
        title: 'Our 1st Anniversary Keepsake',
        customerName: 'Rahul Verma',
        customerEmail: 'rahul@example.com',
        customerPhone: '+91 98123 45678',
        amount: 1999,
        total: 1999,
        status: 'delivered',
        thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
        pageCount: 36,
        dimensions: '8.25" × 8.25"',
        shippingAddress: {
          fullName: 'Rahul Verma',
          addressLine1: 'House 12, Sector 15',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122001'
        }
      },
      {
        orderNumber: 'PP-6350',
        title: 'Europe Vacation Highlights',
        customerName: 'Ananya Deshmukh',
        customerEmail: 'ananya@example.com',
        customerPhone: '+91 97654 32109',
        amount: 2499,
        total: 2499,
        status: 'dispatched',
        thumbnail: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
        pageCount: 48,
        dimensions: '10" × 10"'
      }
    ];

    for (const order of initialOrders) {
      await Order.create(order);
    }
    console.log(`  ✨ Successfully inserted ${initialOrders.length} sample orders!`);

    // 3. Seed Sample Projects (Drafts)
    console.log('\n📦 Step 3: Seeding initial user drafts...');
    await Project.deleteMany({});
    const initialProjects = [
      {
        title: 'Kyoto Zen Temples & Gardens',
        template: 'travel-series-kyoto',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
        pageCount: 40,
        bookSize: '8.25x8.25'
      },
      {
        title: 'Summer 2026 Coastal Moments',
        template: 'moments-series-summer',
        status: 'Draft',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        pageCount: 40,
        bookSize: '8.25x8.25'
      }
    ];

    for (const proj of initialProjects) {
      await Project.create(proj);
    }
    console.log(`  ✨ Successfully inserted ${initialProjects.length} initial drafts!`);

    // 4. Redis Cache Flush
    console.log('\n⚡ Step 4: Invalidating Redis cache...');
    try {
      await connectRedis();
      await cacheFlushAll();
      console.log('  ✨ Redis cache refreshed successfully!');
    } catch (e: any) {
      console.log(`  ℹ️ Redis cache skip: ${e.message}`);
    }

    console.log('\n====================================================');
    console.log('🎉 PERFECTPIC SEEDING / MIGRATION COMPLETE!');
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
