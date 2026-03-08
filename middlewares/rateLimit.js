// rateLimit.js
const { rateLimit } = require("express-rate-limit");
const { getClientIp } = require("../utils/logger");

const loginRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "warn",
            event: "rate_limit_blocked",
            ip: getClientIp(req),
            method: req.method,
            path: req.originalUrl,
            userAgent: req.get("user-agent") || "desconocido"
        }));

        return res.status(429).json({
            error: "Demasiados intentos. Intente nuevamente más tarde."
        });
    }
});

const cobranzasRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "warn",
            event: "rate_limit_cobranzas_blocked",
            ip: getClientIp(req),
            method: req.method,
            path: req.originalUrl,
            userAgent: req.get("user-agent") || "desconocido"
        }));

        return res.status(429).json({
            error: "Demasiadas ejecuciones. Espere un momento."
        });
    }
});

module.exports = {
    loginRateLimit,
    cobranzasRateLimit
};