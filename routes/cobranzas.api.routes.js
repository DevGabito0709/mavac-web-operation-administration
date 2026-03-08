// cobranzas.api.routes.js
const express = require("express");
const { authApi } = require("../middlewares/auth");
const csrfProtection = require("../middlewares/csrf");
const { cobranzasRateLimit } = require("../middlewares/rateLimit");
const { logInfo, logWarn, logError } = require("../utils/logger");
const { spawn } = require("child_process");

const router = express.Router();

const ENTIDADES_VALIDAS = new Set([
    "PACIFICO",
    "RIMAC",
    "POSITIVA",
    "MAPFRE"
]);

const ENTIDADES_EN_PROCESO = new Set();

router.get("/api/cobranzas/estado", authApi, (req, res) => {

    const enProceso = Array.from(ENTIDADES_EN_PROCESO);

    logInfo(req, "cobranzas_estado_consultado", {
        usuario: req.user?.usuario || "desconocido",
        en_proceso: enProceso
    });

    return res.json({
        total_en_proceso: enProceso.length,
        entidades: enProceso
    });

});

router.post("/api/cobranzas/procesar", authApi, csrfProtection, cobranzasRateLimit, async (req, res) => {
    try {
        const entidadesRecibidas = req.body?.entidades;

        if (!Array.isArray(entidadesRecibidas)) {
            return res.status(400).json({
                error: "El campo 'entidades' debe ser un arreglo"
            });
        }

        const entidades = [...new Set(
            entidadesRecibidas
                .map(x => String(x || "").trim().toUpperCase())
                .filter(Boolean)
        )];

        if (entidades.length === 0) {
            return res.status(400).json({
                error: "Debes seleccionar al menos una entidad"
            });
        }

        const entidadesInvalidas = entidades.filter(x => !ENTIDADES_VALIDAS.has(x));

        if (entidadesInvalidas.length > 0) {
            return res.status(400).json({
                error: "Se recibieron entidades no válidas",
                entidades_invalidas: entidadesInvalidas
            });
        }

        const entidadesOcupadas = entidades.filter(x => ENTIDADES_EN_PROCESO.has(x));

        if (entidadesOcupadas.length > 0) {
            return res.status(409).json({
                error: "Ya hay procesos en ejecución para una o más entidades",
                entidades_en_proceso: entidadesOcupadas
            });
        }

        for (const entidad of entidades) {
            ENTIDADES_EN_PROCESO.add(entidad);
        }

        const liberarEntidades = () => {
            for (const entidad of entidades) {
                ENTIDADES_EN_PROCESO.delete(entidad);
            }
        };

        const payload = JSON.stringify({
            entidades
        });

        logInfo(req, "cobranzas_proceso_iniciado", {
            usuario: req.user?.usuario || "desconocido",
            entidades
        });

        const python = spawn(
            "python",
            [
                "-X",
                "utf8",
                "../z_cobranzas_automatizaciones/api_cobranzas_runner.py",
                payload
            ],
            {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "utf-8"
                }
            }
        );

        python.stdout.on("data", (data) => {
            logInfo(req, "cobranzas_python_stdout", {
                entidades,
                output: data.toString().trim()
            });
        });

        python.stderr.on("data", (data) => {
            logInfo(req, "cobranzas_python_log", {
                entidades,
                output: data.toString().trim()
            });
        });

        python.on("error", (error) => {
            logError(req, "cobranzas_python_error", {
                usuario: req.user?.usuario || "desconocido",
                entidades,
                message: error.message
            });

            liberarEntidades();
        });

        python.on("close", (code) => {

            if (code === 0) {
                logInfo(req, "cobranzas_proceso_finalizado", {
                    usuario: req.user?.usuario || "desconocido",
                    entidades,
                    code
                });
            } else {
                logError(req, "cobranzas_proceso_error_finalizacion", {
                    usuario: req.user?.usuario || "desconocido",
                    entidades,
                    code
                });
            }

            liberarEntidades();
        });

        return res.status(200).json({
            ok: true,
            mensaje: "Proceso Python iniciado",
            entidades
        });

    } catch (error) {
        logError(req, "cobranzas_proceso_error", {
            message: error.message
        });

        return res.status(500).json({
            error: "Error ejecutando automatización"
        });
    }
});

module.exports = router;