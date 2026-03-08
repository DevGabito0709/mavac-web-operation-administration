// logger.js
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];

    if (forwarded && typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "ip_desconocida";
}

function buildLog(req, level, event, extra = {}) {
    return {
        timestamp: new Date().toISOString(),
        level,
        event,
        ip: getClientIp(req),
        method: req.method,
        path: req.originalUrl,
        userAgent: req.get("user-agent") || "desconocido",
        ...extra
    };
}

function logInfo(req, event, extra = {}) {
    console.log(JSON.stringify(buildLog(req, "info", event, extra)));
}

function logWarn(req, event, extra = {}) {
    console.warn(JSON.stringify(buildLog(req, "warn", event, extra)));
}

function logError(req, event, extra = {}) {
    console.error(JSON.stringify(buildLog(req, "error", event, extra)));
}

module.exports = {
    logInfo,
    logWarn,
    logError,
    getClientIp
};