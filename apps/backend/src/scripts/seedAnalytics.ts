// apps/backend/src/scripts/seedAnalytics.ts
import mongoose from 'mongoose';
import { AnalyticsEvent } from '../db/models/AnalyticsEvent';
import { logger } from '../utils/logger';

export async function generateRealisticEvents(count: number = 160) {
  const events: any[] = [];
  const cities = [
    { name: 'Bengaluru', weight: 0.35 },
    { name: 'Mumbai', weight: 0.24 },
    { name: 'New Delhi', weight: 0.18 },
    { name: 'Pune', weight: 0.10 },
    { name: 'Hyderabad', weight: 0.08 },
    { name: 'Chennai', weight: 0.05 },
  ];

  const devices = [
    { type: 'desktop', weight: 0.62 },
    { type: 'mobile', weight: 0.33 },
    { type: 'tablet', weight: 0.05 },
  ];

  const sources = [
    { name: 'social', label: 'Instagram Ads', weight: 0.38 },
    { name: 'organic', label: 'Google Search', weight: 0.28 },
    { name: 'direct', label: 'Direct / Bookmarks', weight: 0.20 },
    { name: 'email', label: 'Email Newsletter', weight: 0.09 },
    { name: 'campaign', label: 'Travel Influencer', weight: 0.05 },
  ];

  const layouts = [
    '1-photo',
    '1-photo-full',
    '2-page-panoramic',
    '2-photo-v',
    '2-photo-h',
    '3-photo',
    '4-photo',
    '6-photo-grid',
  ];
  const foils = ['gold', 'silver', 'rose-gold', 'black'];
  const templates = ['sri-lanka-travel', 'colombia-adventure', 'annapurna-base-camp', 'first-anniversary'];

  function weightedPick<T extends { weight: number }>(items: T[]): T {
    const r = Math.random();
    let acc = 0;
    for (const item of items) {
      acc += item.weight;
      if (r <= acc) return item;
    }
    return items[0]!;
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const sessionRandom = Math.random();
    const sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    const anonymousId = `anon_${Math.random().toString(36).substring(2, 9)}`;
    const city = weightedPick(cities).name;
    const device = weightedPick(devices).type;
    const sourceObj = weightedPick(sources);
    const source = sourceObj.name;

    // Time offset (spread over 30 days with more in the last 7 days)
    const daysAgo = Math.pow(Math.random(), 1.6) * thirtyDaysMs;
    let eventTime = new Date(now - daysAgo);

    const isMember = Math.random() < 0.28;
    const userId = isMember ? `usr_${Math.floor(100 + Math.random() * 900)}` : undefined;

    // Step 1: Storefront Landing
    events.push({
      anonymousId,
      sessionId,
      userId,
      isLoggedIn: isMember,
      eventType: 'pageview',
      eventName: 'Landed on Storefront',
      path: '/',
      device,
      city,
      source,
      metadata: { referrer: sourceObj.label },
      timestamp: new Date(eventTime),
    });

    // 75% advance to Configurator
    if (Math.random() < 0.75) {
      eventTime = new Date(eventTime.getTime() + 1000 * (25 + Math.floor(Math.random() * 50)));
      const template = templates[Math.floor(Math.random() * templates.length)];
      const size = Math.random() < 0.65 ? '10x10' : '8.25x8.25';
      const pages = Math.random() < 0.7 ? 40 : 60;

      events.push({
        anonymousId,
        sessionId,
        userId,
        isLoggedIn: isMember,
        eventType: 'config_change',
        eventName: `Configured Book: ${size} (${pages} Pages)`,
        path: `/configure?template=${template}`,
        device,
        city,
        source,
        metadata: { template, size, pageCount: pages, price: size === '10x10' ? 2499 : 1999 },
        timestamp: new Date(eventTime),
      });

      // 55% advance to Studio Editor & Upload
      if (Math.random() < 0.55) {
        eventTime = new Date(eventTime.getTime() + 1000 * (40 + Math.floor(Math.random() * 90)));
        const photoCount = Math.floor(12 + Math.random() * 32);

        events.push({
          anonymousId,
          sessionId,
          userId,
          isLoggedIn: isMember,
          eventType: 'photo_upload',
          eventName: `Uploaded ${photoCount} Photos`,
          path: '/upload/new-project',
          device,
          city,
          source,
          metadata: { photosCount: photoCount },
          timestamp: new Date(eventTime),
        });

        // Editor layout & foil actions
        const chosenLayout = layouts[Math.floor(Math.random() * layouts.length)];
        const chosenFoil = foils[Math.floor(Math.random() * foils.length)];

        eventTime = new Date(eventTime.getTime() + 1000 * (30 + Math.floor(Math.random() * 120)));
        events.push({
          anonymousId,
          sessionId,
          userId,
          isLoggedIn: isMember,
          eventType: 'editor_action',
          eventName: `Selected Layout: ${chosenLayout}`,
          path: '/editor/new-project',
          device,
          city,
          source,
          metadata: { layout: chosenLayout, page: 3 },
          timestamp: new Date(eventTime),
        });

        eventTime = new Date(eventTime.getTime() + 1000 * (20 + Math.floor(Math.random() * 60)));
        events.push({
          anonymousId,
          sessionId,
          userId,
          isLoggedIn: isMember,
          eventType: 'editor_action',
          eventName: `Selected Foil: ${chosenFoil}`,
          path: '/editor/new-project',
          device,
          city,
          source,
          metadata: { foilColor: chosenFoil },
          timestamp: new Date(eventTime),
        });

        // 38% advance to Cart
        if (Math.random() < 0.38) {
          eventTime = new Date(eventTime.getTime() + 1000 * (45 + Math.floor(Math.random() * 90)));
          const price = size === '10x10' ? 2499 : 1999;

          events.push({
            anonymousId,
            sessionId,
            userId,
            isLoggedIn: isMember,
            eventType: 'cart_action',
            eventName: 'Added to Cart',
            path: '/cart',
            device,
            city,
            source,
            metadata: { cartTotal: price, itemsCount: 1 },
            timestamp: new Date(eventTime),
          });

          // 25% advance to Checkout
          if (Math.random() < 0.65) {
            eventTime = new Date(eventTime.getTime() + 1000 * (30 + Math.floor(Math.random() * 60)));

            events.push({
              anonymousId,
              sessionId,
              userId,
              isLoggedIn: isMember,
              eventType: 'checkout_step',
              eventName: 'Proceed to Checkout Clicked',
              path: '/checkout',
              device,
              city,
              source,
              metadata: { cartTotal: price },
              timestamp: new Date(eventTime),
            });

            // 18% complete purchase
            if (Math.random() < 0.72) {
              eventTime = new Date(eventTime.getTime() + 1000 * (60 + Math.floor(Math.random() * 120)));
              const orderNum = `PP-${Math.floor(1000 + Math.random() * 9000)}`;

              events.push({
                anonymousId,
                sessionId,
                userId: userId || `usr_${Math.floor(100 + Math.random() * 900)}`,
                isLoggedIn: true, // Converted or logged-in
                eventType: 'order_completed',
                eventName: `Order Placed (#${orderNum})`,
                path: `/confirmation/${orderNum}`,
                device,
                city,
                source,
                metadata: { orderNumber: orderNum, total: price, city },
                timestamp: new Date(eventTime),
              });
            }
          }
        }
      }
    }
  }

  return events;
}

export async function seedAnalyticsCollection() {
  try {
    const existing = await AnalyticsEvent.countDocuments();
    if (existing >= 50) {
      logger.info(`📊 AnalyticsEvent collection already contains ${existing} events. Skipping seed.`);
      return existing;
    }

    logger.info('🌱 Seeding realistic user journey interaction events into MongoDB...');
    const demoEvents = await generateRealisticEvents(180);
    await AnalyticsEvent.insertMany(demoEvents, { ordered: false });
    const total = await AnalyticsEvent.countDocuments();
    logger.info(`✅ Successfully seeded ${total} user behaviour telemetry events into MongoDB!`);
    return total;
  } catch (err: any) {
    logger.warn('Error during analytics seeding:', err.message);
    return 0;
  }
}
