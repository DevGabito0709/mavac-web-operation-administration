const { logWarn } = require("../utils/logger");

const TRUSTED_ORIGIN = process.env.FRONT_ORIGIN;

function csrfProtection(req, res, next) {
    const method = req.method.toUpperCase();
    const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (!protectedMethods.includes(method)) {
        return next();
    }

    const origin = req.get("origin");
    const csrfHeader = req.get("x-csrf-token");
    const csrfCookie = req.cookies?.csrf_token;

    if (origin && origin !== TRUSTED_ORIGIN) {
        logWarn(req, "csrf_blocked", {
            reason: "invalid_origin",
            origin: origin || null
        });

        return res.status(403).json({
            error: "Solicitud bloqueada por seguridad"
        });
    }

    if (!csrfHeader || !csrfCookie) {
        logWarn(req, "csrf_blocked", {
            reason: "missing_csrf_token"
        });

        return res.status(403).json({
            error: "Token CSRF faltante"
        });
    }

    if (csrfHeader !== csrfCookie) {
        logWarn(req, "csrf_blocked", {
            reason: "invalid_csrf_token"
        });

        return res.status(403).json({
            error: "Token CSRF inválido"
        });
    }

    return next();
}

module.exports = csrfProtection;