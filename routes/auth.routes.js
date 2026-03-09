// auth.routes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../base_datos/db");
const csrfProtection = require("../middlewares/csrf");
const { authApi } = require("../middlewares/auth");
const { loginRateLimit } = require("../middlewares/rateLimit");
const { logInfo, logWarn, logError } = require("../utils/logger");
const { generateCsrfToken } = require("../utils/csrfToken");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const USERNAME_REGEX = /^[a-z0-9._-]{3,50}$/;

if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está definido en variables de entorno");
    process.exit(1);
}

router.get("/api/csrf-token", (req, res) => {
    try {
        const csrfToken = generateCsrfToken();

        res.cookie("csrf_token", csrfToken, {
            httpOnly: false,
            sameSite: "lax",
            secure: true,
            maxAge: 2 * 60 * 60 * 1000,
            path: "/",
            domain: COOKIE_DOMAIN,
            priority: "high"
        });

        return res.status(200).json({
            ok: true
        });
    } catch (error) {
        return res.status(500).json({
            error: "No se pudo generar el token CSRF"
        });
    }
});

router.post("/api/login", loginRateLimit, csrfProtection, async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (typeof usuario !== "string" || typeof password !== "string") {
            logWarn(req, "login_failed", {
                usuario: typeof usuario === "string" ? usuario.trim().toLowerCase() : null,
                reason: "invalid_request_type"
            });

            return res.status(400).json({
                error: "Solicitud inválida"
            });
        }

        const usuarioLimpio = usuario.trim().toLowerCase();
        const passwordLimpio = password.trim();

        if (!usuarioLimpio || !passwordLimpio) {
            logWarn(req, "login_failed", {
                usuario: usuarioLimpio || null,
                reason: "empty_credentials"
            });

            return res.status(400).json({
                error: "Solicitud inválida"
            });
        }

        if (!USERNAME_REGEX.test(usuarioLimpio)) {
            logWarn(req, "login_failed", {
                usuario: usuarioLimpio,
                reason: "invalid_username_format"
            });

            return res.status(400).json({
                error: "Solicitud inválida"
            });
        }

        if (usuarioLimpio.length > 50 || passwordLimpio.length > 200) {
            logWarn(req, "login_failed", {
                usuario: usuarioLimpio,
                reason: "invalid_length"
            });

            return res.status(400).json({
                error: "Solicitud inválida"
            });
        }

        const resultado = await pool.query(
            "SELECT id, usuario, password_hash, rol FROM credenciales WHERE usuario = $1",
            [usuarioLimpio]
        );

        if (resultado.rowCount === 0) {
            logWarn(req, "login_failed", {
                usuario: usuarioLimpio,
                reason: "invalid_credentials"
            });

            await new Promise(resolve => setTimeout(resolve, 700));

            return res.status(401).json({
                error: "Credenciales inválidas"
            });
        }

        const credencial = resultado.rows[0];

        const passwordValido = await bcrypt.compare(
            passwordLimpio,
            credencial.password_hash
        );

        if (!passwordValido) {
            logWarn(req, "login_failed", {
                usuario: usuarioLimpio,
                reason: "invalid_credentials"
            });

            await new Promise(resolve => setTimeout(resolve, 700));

            return res.status(401).json({
                error: "Credenciales inválidas"
            });
        }

        const token = jwt.sign(
            {
                credencial_id: credencial.id,
                usuario: credencial.usuario,
                rol: credencial.rol
            },
            JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        const csrfToken = generateCsrfToken();

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            maxAge: 2 * 60 * 60 * 1000,
            path: "/",
            domain: COOKIE_DOMAIN,
            priority: "high"
        });

        res.cookie("csrf_token", csrfToken, {
            httpOnly: false,
            sameSite: "lax",
            secure: true,
            maxAge: 2 * 60 * 60 * 1000,
            path: "/",
            domain: COOKIE_DOMAIN,
            priority: "high"
        });

        logInfo(req, "login_success", {
            usuario: credencial.usuario,
            credencial_id: credencial.id
        });

        return res.status(200).json({
            ok: true,
            usuario: credencial.usuario
        });
    } catch (error) {
        logError(req, "login_error", {
            message: error.message
        });

        return res.status(500).json({
            error: "No se pudo procesar la solicitud"
        });
    }
});

router.post("/api/logout", authApi, csrfProtection, (req, res) => {
    logInfo(req, "logout", {
        usuario: req.auth.usuario,
        credencial_id: req.auth.credencial_id
    });

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        domain: COOKIE_DOMAIN
    });

    res.clearCookie("csrf_token", {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        domain: COOKIE_DOMAIN
    });

    return res.status(200).json({
        ok: true
    });
});

router.get("/api/session", authApi, (req, res) => {
    return res.status(200).json({
        ok: true,
        usuario: req.auth.usuario
    });
});

module.exports = router;