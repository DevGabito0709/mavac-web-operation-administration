require("dotenv").config();

const requiredEnv = [
    "JWT_SECRET",
    "DB_PASSWORD",
    "FRONT_ORIGIN",
    "COOKIE_DOMAIN",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_NAME"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`ERROR: Falta variable de entorno ${key}`);
        process.exit(1);
    }
}

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const publicRoutes = require("./routes/public.routes");
const authRoutes = require("./routes/auth.routes");
const inicioOficinaRoutes = require("./routes/inicio_oficina.routes");
const cobranzasRoutes = require("./routes/cobranzas.routes");
const administracionRoutes = require("./routes/administracion.routes");
const cobranzasApiRoutes = require("./routes/cobranzas.api.routes");

const app = express();

const PORT = process.env.PORT || 3000;
const FRONT_ORIGIN = process.env.FRONT_ORIGIN;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

/* Estáticos desde carpeta public del backend */
const publicDir = path.join(__dirname, "public");
app.use("/shared", express.static(path.join(publicDir, "shared")));
app.use("/modules", express.static(path.join(publicDir, "modules")));

app.use(
    cors({
        origin: FRONT_ORIGIN,
        credentials: true
    })
);

app.get("/health", (req, res) => {
    return res.status(200).json({
        ok: true,
        service: "backend",
        timestamp: new Date().toISOString()
    });
});

app.use(publicRoutes);
app.use(authRoutes);
app.use(inicioOficinaRoutes);
app.use(cobranzasRoutes);
app.use(administracionRoutes);
app.use(cobranzasApiRoutes);

app.listen(PORT, () => {
    console.log("Node escuchando en http://127.0.0.1:" + PORT);
    console.log("Entrar por Caddy en: " + FRONT_ORIGIN);
});