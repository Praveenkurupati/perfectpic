import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB, isDbConnected } from "./db/connection";
import { connectRedis, isRedisConnected } from "./cache/redis";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import projectRoutes from "./routes/projects";
import orderRoutes from "./routes/orders";
import paymentRoutes from "./routes/payments";
import shippingRoutes from "./routes/shipping";
import productRoutes from "./routes/products";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" })); // for base64 images if needed
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check with DB and Cache status
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    database: isDbConnected() ? "mongodb" : "in-memory",
    cache: isRedisConnected() ? "redis" : "disabled",
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/products", productRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`🚀 PerfectPic Backend server running on port ${PORT}`);
  // Connect to MongoDB
  await connectDB();
  // Connect to Redis Cache
  await connectRedis();
});
