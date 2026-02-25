import rateLimit from "express-rate-limit";

/**
 * Rate limiters for different endpoint categories.
 *
 * In a multi-instance deployment the counters are per-pod (in-memory).
 * For strict global rate limiting, replace the default MemoryStore with
 * a shared Redis store (e.g. rate-limit-redis) once Redis is available.
 * The interface is identical — only the `store` option changes.
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

/** General API: 300 requests per minute per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Limite de pedidos excedido. Tente novamente em breve." },
});

/** Public storefront (read-only): 600 requests per minute per IP */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Limite de pedidos excedido." },
});
