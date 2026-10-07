import mongoose from 'mongoose';
import { Product } from './models/Product';
import { Order } from './models/Order';
import { Project } from './models/Project';
import { defaultBooks } from '../data/defaultBooks';

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfectpic';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

  try {
    mongoose.set('strictQuery', false);

    // Attach Atlas cluster lifecycle event monitors once
    if (mongoose.connection.listeners('disconnected').length === 0) {
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        console.warn('⚠️ [MongoDB Atlas] Database connection lost. Reconnecting...');
      });
      mongoose.connection.on('reconnected', () => {
        isConnected = true;
        console.info('🍃 [MongoDB Atlas] Reconnection established successfully.');
      });
      mongoose.connection.on('error', (err) => {
        console.error('❌ [MongoDB Atlas] Connection error:', err.message);
      });
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 45000,
      waitQueueTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      dbName: 'perfectpic',
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    
    isConnected = true;
    const host = mongoose.connection.host || (uri.includes('@') ? (uri.split('@')[1] || '').split('/')[0] : 'localhost');
    console.log(`🍃 [MongoDB ${isAtlas ? 'Atlas' : 'Cluster'}] Connected successfully to host: ${host} (db: ${mongoose.connection.name})`);

    // Seed default template books if empty
    await seedDefaultData();
  } catch (error: any) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection error: ${error.message}`);
    console.warn(`👉 The application will continue running with in-memory fallbacks.`);
    console.warn(`👉 To use MongoDB Atlas, configure MONGODB_URI in apps/backend/.env.`);
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

async function seedDefaultData() {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log(`🌱 Seeding initial ${defaultBooks.length} destination and themed books into MongoDB...`);
      for (const book of defaultBooks) {
        await Product.create({
          ...book,
          defaultOptions: {
            size: '8.25x8.25',
            cover: 'cov-1',
            theme: 'theme-4',
            color: 'col-1',
            packaging: 'pack-1'
          }
        });
      }
      console.log(`✅ ${defaultBooks.length} books successfully seeded into MongoDB!`);
    }

    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      await Order.create([
        {
          orderNumber: 'PP-8491',
          title: 'Paris Journey Hardcover',
          customerName: 'Priya Sharma',
          customerEmail: 'priya@example.com',
          amount: 1999,
          total: 1999,
          status: 'production',
          thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
          coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
          pageCount: 40,
          dimensions: '8.25" × 8.25"'
        },
        {
          orderNumber: 'PP-7201',
          title: 'Our 1st Anniversary Keepsake',
          customerName: 'Rahul Verma',
          customerEmail: 'rahul@example.com',
          amount: 1999,
          total: 1999,
          status: 'delivered',
          thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
          coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
          pageCount: 36,
          dimensions: '8.25" × 8.25"'
        }
      ]);
    }

    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.create([
        {
          title: 'Summer 2026 Coastal Moments',
          template: 'moments-series-summer',
          status: 'Draft',
          coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
          pageCount: 40
        },
        {
          title: 'Kyoto Zen Temples',
          template: 'travel-series-kyoto',
          status: 'Draft',
          coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
          pageCount: 40
        }
      ]);
    }

    // Seed realistic User Behaviour interaction events if collection empty
    const { seedAnalyticsCollection } = await import('../scripts/seedAnalytics');
    await seedAnalyticsCollection();

    // Seed production promo codes if collection empty
    const { PromoCodeRepository } = await import('../repositories/PromoCodeRepository');
    await PromoCodeRepository.seedDefaultsIfEmpty();

    // Seed production page options if collection empty
    const { PageOption } = await import('./models/PageOption');
    const { pageCountOptions } = await import('../data/templates');
    const pageOptionCount = await PageOption.countDocuments();
    if (pageOptionCount === 0) {
      console.log('🌱 Seeding initial page options into MongoDB...');
      for (const opt of pageCountOptions) {
        await PageOption.create(opt);
      }
      console.log(`✅ ${pageCountOptions.length} page options seeded into MongoDB!`);
    }

    // Ensure dedicated Administrator account exists
    const { User } = await import('./models/User');
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      const bcrypt = (await import('bcryptjs')).default;
      const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: 'PerfectPic Administrator',
        email: (process.env.ADMIN_EMAIL || 'admin@perfectpic.in').toLowerCase().trim(),
        phone: '+919999999999',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Administrator account initialized in MongoDB!');
    }
  } catch (seedErr) {
    console.error('Error seeding MongoDB collections:', seedErr);
  }
}
