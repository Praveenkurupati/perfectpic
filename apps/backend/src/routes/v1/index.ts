// apps/backend/src/routes/v1/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './products.routes';
import orderRoutes from './orders.routes';
import projectRoutes from './projects.routes';
import customerRoutes from './customers.routes';
import productionRoutes from './production.routes';
import ticketRoutes from './tickets.routes';
import uploadRoutes from './upload.routes';
import paymentRoutes from './payments.routes';
import shippingRoutes from './shipping.routes';
import analyticsRoutes from './analytics.routes';
import addressesRoutes from './addresses.routes';
import promosRoutes from './promos.routes';
import pageOptionRoutes from './pageOptions.routes';

const v1Router = Router();

// Mount all v1 sub-routers
v1Router.use('/auth', authRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/projects', projectRoutes);
v1Router.use('/customers', customerRoutes);
v1Router.use('/production', productionRoutes);
v1Router.use('/tickets', ticketRoutes);
v1Router.use('/upload', uploadRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/shipping', shippingRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/addresses', addressesRoutes);
v1Router.use('/promos', promosRoutes);
v1Router.use('/page-options', pageOptionRoutes);

export default v1Router;
