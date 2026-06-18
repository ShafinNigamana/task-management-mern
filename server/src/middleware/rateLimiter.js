import { rateLimit } from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per window to allow regular polling
  standardHeaders: 'draft-7', // combined RateLimit header
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 auth requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});
