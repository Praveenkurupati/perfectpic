// apps/backend/src/scripts/seed-reviews.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../db/connection';
import { ReviewRepository } from '../repositories/ReviewRepository';

async function run() {
  console.log('🌱 Starting 100+ Reviews & Ratings Seed...');
  await connectDB();
  const count = await ReviewRepository.seedReviewsIfEmpty(true);
  console.log(`✅ Finished seeding! Total reviews in MongoDB: ${count}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Failed to seed reviews:', err);
  process.exit(1);
});
