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

    // Only catalog products, pricing tiers, and system configurations are seeded into empty collections.
    // Real customer orders and photobook projects are strictly user-generated to prevent data fabrication.

    // Seed realistic User Behaviour interaction events if collection empty
    const { seedAnalyticsCollection } = await import('../scripts/seedAnalytics');
    await seedAnalyticsCollection();

    // Seed production promo codes if collection empty
    const { PromoCodeRepository } = await import('../repositories/PromoCodeRepository');
    await PromoCodeRepository.seedDefaultsIfEmpty();

    // Seed/migrate authoritative 4-tier photobook bundles into MongoDB
    const { BundleRepository } = await import('../repositories/BundleRepository');
    await BundleRepository.seedDefaultsIfEmpty();

    // Seed 100+ authoritative customer reviews & ratings into MongoDB if empty
    const { ReviewRepository } = await import('../repositories/ReviewRepository');
    await ReviewRepository.seedReviewsIfEmpty();

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

    // Ensure authoritative Administrator account exists idempotently
    const { User } = await import('./models/User');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@perfectpic.in').toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const bcrypt = (await import('bcryptjs')).default;
      const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@PerfectPic2026!';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: 'PerfectPic Administrator',
        email: adminEmail,
        phone: '+919999900000',
        password: hashedPassword,
        role: 'admin',
        mustChangePassword: true,
      });
      console.log(`✅ Authoritative administrator account initialized in MongoDB (${adminEmail}, cost factor 12).`);
    }
  } catch (seedErr) {
    console.error('Error seeding MongoDB collections:', seedErr);
  }
}

export async function closeDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(false);
      isConnected = false;
      console.info('🍃 [MongoDB] Connection pool cleanly released.');
    } catch (err: any) {
      console.error('Error closing MongoDB connection pool:', err.message);
    }
  }
}
