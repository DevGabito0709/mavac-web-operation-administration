// auth.js
const jwt = require("jsonwebtoken");
const { logWarn } = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está definido en variables de entorno");
    process.exit(1);
}

function getValidTokenPayload(req) {
    const token = req.cookies?.token;

    if (!token) {
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function authPage(req, res, next) {
    const payload = getValidTokenPayload(req);

    if (!payload) {
        return res.redirect("/login");
    }

    req.auth = payload;
    return next();
}

function authApi(req, res, next) {
    const payload = getValidTokenPayload(req);

    if (!payload) {
        logWarn(req, "unauthorized_api_access", {
            reason: "missing_or_invalid_token"
        });

        return res.status(401).json({
            error: "No autorizado"
        });
    }

    req.auth = payload;
    return next();
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.auth || !allowedRoles.includes(req.auth.rol)) {
            return res.status(403).json({
                error: "No autorizado"
            });
        }

        return next();
    };
}

function redirectIfAuthenticated(req, res, next) {
    const payload = getValidTokenPayload(req);

    if (payload) {
        return res.redirect("/inicio_oficina");
    }

    return next();
}

module.exports = {
    getValidTokenPayload,
    authPage,
    authApi,
    requireRole,
    redirectIfAuthenticated
};