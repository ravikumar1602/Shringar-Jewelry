'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

const app = express();

// ─── Database Connection ────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes.' },
});

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'exp://localhost:8081',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
}));

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Data Sanitization ──────────────────────────────────────────────────────
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['price', 'rating', 'category', 'sort', 'fields', 'page', 'limit'] }));

// ─── Compression & Logging ──────────────────────────────────────────────────
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
const API = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/reviews`, reviewRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.message}`);
  server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  process.exit(1);
});

module.exports = app;
