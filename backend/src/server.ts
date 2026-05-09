import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import logger from './utils/logger';
import { initializePrisma } from './lib/prisma';
import { validateEnvOrCrash } from './utils/env';
import { getJwtSecrets, initializeSecretProvider } from './utils/secretProvider';
import { createRateLimiters, initializeRateLimiterStore } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initializeSecretProvider();
  validateEnvOrCrash(getJwtSecrets());
  await initializePrisma();

  const store = await initializeRateLimiterStore();
  const rateLimiters = createRateLimiters(store);

  // Import routes AFTER Prisma initialization
  const { default: createAuthRouter } = await import('./routes/auth');
  const { default: userRoutes } = await import('./routes/users');
  const { default: gradeRoutes } = await import('./routes/grades');
  const { default: scheduleRoutes } = await import('./routes/schedules');
  const { default: appointmentRoutes } = await import('./routes/appointments');
  const { default: settingsRoutes } = await import('./routes/settings');
  const { default: pagesRoutes } = await import('./routes/pages');
  const { default: uploadsRoutes } = await import('./routes/uploads');
  const { default: homepageRoutes } = await import('./routes/homepage');
  const { default: parentStudentRoutes } = await import('./routes/parentStudent');
  const { default: attendanceRoutes } = await import('./routes/attendance');
  const { default: teacherAttendanceRoutes } = await import('./routes/teacherAttendance');
  const { default: messagesRoutes } = await import('./routes/messages');
  const { default: behaviorRoutes } = await import('./routes/behavior');
  const { default: homeworkRoutes } = await import('./routes/homework');
  const { default: healthRoutes } = await import('./routes/health');
  const { default: pickupRoutes } = await import('./routes/pickup');
  const { default: classesRoutes } = await import('./routes/classes');
  const { default: coursesRoutes } = await import('./routes/courses');
  const { default: subjectsRoutes } = await import('./routes/subjects');
  const { default: academicYearsRoutes } = await import('./routes/academicYears');
  const { default: reportsRoutes } = await import('./routes/reports');
  const { default: gradeLocksRoutes } = await import('./routes/gradeLocks');
  const { default: securityRoutes } = await import('./routes/security');
  const { default: reportCardsRoutes } = await import('./routes/reportCards');

  const app = express();

  // ── Trust proxy (P0-5) ────────────────────────────────────────────────
  // Render (and any production reverse-proxy host) forwards client IPs
  // through `X-Forwarded-For`. Without this setting:
  //   - express-rate-limit sees the proxy IP for every request → either
  //     a single shared bucket (DoS auto-infligé) or trivial bypass.
  //   - Audit logs and security alerts log the load-balancer IP instead
  //     of the real client.
  // Default behaviour:
  //   * production → trust the first hop (Render gives us exactly one).
  //   * other envs → don't trust (otherwise dev clients can spoof X-F-F).
  // Override with TRUST_PROXY=<n>|true|false|<ip-list>.
  const trustProxyEnv = process.env.TRUST_PROXY;
  if (trustProxyEnv !== undefined && trustProxyEnv !== '') {
    // numeric string → number of hops
    const parsedNum = Number(trustProxyEnv);
    if (Number.isFinite(parsedNum) && Number.isInteger(parsedNum) && parsedNum >= 0) {
      app.set('trust proxy', parsedNum);
    } else if (trustProxyEnv === 'true') {
      app.set('trust proxy', true);
    } else if (trustProxyEnv === 'false') {
      app.set('trust proxy', false);
    } else {
      // raw passthrough (e.g. 'loopback', 'linklocal,uniquelocal', or an IP/CIDR list)
      app.set('trust proxy', trustProxyEnv);
    }
  } else if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ── Request ID for distributed tracing ────────────────────────────────
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    (req as any).requestId = requestId;
    next();
  });

  // ── Security headers (enterprise-grade Helmet) ────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],  // needed for inline styles
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // Permissions-Policy (restrict browser features)
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    );
    next();
  });

  // ── CORS ─────────────────────────────────────────────────────────────
  // In production, lock the origin down to FRONTEND_URL.
  // In development, accept any localhost / 127.0.0.1 origin so that local
  // dev tools and IDE-launched browser previews (which run on dynamic
  // loopback ports) can reach the API without CORS friction. Same-origin
  // calls (no Origin header) are also allowed.
  const isProd = process.env.NODE_ENV === 'production';
  const prodOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Accept:
  //   - loopback (localhost / 127.0.0.1)
  //   - 10.0.0.0/8        (Android emulator reaches host via 10.0.2.2)
  //   - 172.16.0.0/12     (Docker / corporate VPN subnets)
  //   - 192.168.0.0/16    (typical home Wi-Fi — real phones + Mobile Pilot)
  const devOriginRegex =
    /^https?:\/\/(localhost|127\.0\.0\.1|10\.(?:\d{1,3}\.){2}\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3})\.\d{1,3}|192\.168\.(?:\d{1,3})\.\d{1,3})(:\d+)?$/i;

  app.use(cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser tools (curl, server-to-server) → allow
      if (!origin) return callback(null, true);
      if (isProd) {
        return callback(null, origin === prodOrigin);
      }
      // Dev: allow configured FRONTEND_URL plus loopback + private-LAN origins
      if (origin === prodOrigin || devOriginRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 600, // preflight cache 10 min
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Structured request logger
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs,
      }, `${req.method} ${req.originalUrl} ${res.statusCode}`);
    });

    next();
  });

  // Static uploads — serve with security headers
  const uploadRoot = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
  app.use('/uploads', (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'");
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    next();
  }, express.static(uploadRoot));

  // Global rate limiting (general API protection)
  app.use('/api', rateLimiters.apiRateLimiter);
  // NOTE: Auth-specific rate limiting is handled in routes/auth.ts

  // Routes
  app.use('/api/auth', createAuthRouter({
    loginRateLimiter: rateLimiters.loginRateLimiter,
    refreshRateLimiter: rateLimiters.refreshRateLimiter,
    passwordChangeRateLimiter: rateLimiters.passwordChangeRateLimiter
  }));
  app.use('/api/users', userRoutes);
  app.use('/api/grades', gradeRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/pages', pagesRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/homepage', homepageRoutes);
  app.use('/api/admin/homepage', homepageRoutes);
  app.use('/api/parent-students', parentStudentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/teacher-attendance', teacherAttendanceRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/behavior', behaviorRoutes);
  app.use('/api/homework', homeworkRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/pickup', pickupRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/subjects', subjectsRoutes);
  app.use('/api/academic-years', academicYearsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/grade-locks', gradeLocksRoutes);
  app.use('/api/admin/security', securityRoutes);
  app.use('/api/report-cards', reportCardsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route non trouvée'
    });
  });

  // Global error handler
  app.use(errorHandler);

  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection');
  });

  // Catch uncaught exceptions — exit and let a process manager restart
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception — exiting');
    process.exit(1);
  });

  app.listen(PORT, () => {
    logger.info({ port: PORT, cors: process.env.FRONTEND_URL || 'http://localhost:5173' },
      `Forum de L'excellence API started on port ${PORT}`);
  });
};

startServer().catch((error) => {
  // Build a structured payload that survives log aggregators (no console.error,
  // no untagged JSON.stringify dumps that break JSONL parsers).
  const payload: Record<string, unknown> = {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
  };

  // Capture non-enumerable Prisma / Node error fields the default
  // serializer might miss (code, errno, syscall, clientVersion, …).
  if (error && typeof error === 'object') {
    for (const key of Object.getOwnPropertyNames(error)) {
      if (!(key in payload)) {
        payload[key] = (error as any)[key];
      }
    }
  }

  logger.fatal(payload, 'Fatal startup error');
  process.exit(1);
});