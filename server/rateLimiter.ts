import rateLimit from "express-rate-limit";

/**
 * Rate limiters for different endpoint categories.
 *
 * IMPORTANT: In production, each real user has their own IP address.
 * These limits are designed for real-world usage where 100+ concurrent users
 * each come from different IPs. Load tests from a single machine will hit
 * these limits because all requests share the same IP.
 *
 * Limits per IP:
 * - Auth: 20 attempts / 15 min (brute-force protection)
 * - API: 2000 req / min (~33 req/s per IP — generous for real users)
 * - Public: 5000 req / min (read-only, cacheable content)
 *
 * In a multi-instance deployment the counters are per-pod (in-memory).
 * For strict global rate limiting, replace the default MemoryStore with
 * a shared Redis store (e.g. rate-limit-redis) once Redis is available.
 */

/** Auth endpoints: login / register — 20 attempts per 15 minutes per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas tentativas. Tente novamente em 15 minutos." },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * General API: 2000 requests per minute per IP.
 * Allows ~33 req/s per real user IP — more than enough for normal usage.
 * Protects against automated abuse and DDoS from a single source.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Limite de pedidos excedido. Tente novamente em breve." },
});

/**
 * Public storefront (read-only): 5000 requests per minute per IP.
 * Higher limit for public pages since they are lightweight and read-only.
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Limite de pedidos excedido." },
});
