import mongoose from 'mongoose';
import { Product } from './models/Product';
import { Order } from './models/Order';
import { Project } from './models/Project';
import { defaultBooks } from '../data/defaultBooks';

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfectpic';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      dbName: 'perfectpic',
    });
    
    isConnected = true;
    console.log(`🍃 MongoDB connected successfully: ${uri.includes('@') ? uri.split('@')[1] : uri}`);

    // Seed default template books if empty
    await seedDefaultData();
  } catch (error: any) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection error: ${error.message}`);
    console.warn(`👉 The application will continue running with in-memory fallbacks.`);
    console.warn(`👉 To use MongoDB, ensure mongod is running locally on port 27017 or set MONGODB_URI in apps/backend/.env.`);
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
  } catch (seedErr) {
    console.error('Error seeding MongoDB collections:', seedErr);
  }
}
