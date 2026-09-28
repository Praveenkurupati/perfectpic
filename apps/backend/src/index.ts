// apps/backend/src/index.ts
/**
 * PerfectPic Backend - Enterprise Layered TypeScript Architecture
 * 
 * Layers:
 * - controllers/ : HTTP Request/Response orchestration
 * - services/    : Domain business logic & communication dispatchers (Mail, SMS, WhatsApp, OTP)
 * - repositories/: Database operations (MongoDB Atlas with in-memory fallbacks) & Redis caching
 * - models/      : Mongoose schemas and entity models
 * - middlewares/ : Request pipeline, authentication, validation, and error logging
 * - utils/       : Enterprise logger, ApiResponse envelopes, ApiError, JWT, and OTP generators
 * - routes/v1/   : Versioned RESTful API routes with backward compatibility (/api/v1/* and /api/*)
 * - app.ts       : Express app setup and middleware pipeline
 * - server.ts    : Process bootstrap, database connection, and graceful shutdown
 */

import './server';

export { app } from './app';
export { server } from './server';
