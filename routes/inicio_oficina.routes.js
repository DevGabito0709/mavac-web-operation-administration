// inicio_oficina.routes.js
const express = require("express");
const { authPage } = require("../middlewares/auth");

const router = express.Router();

const SIDEBAR_BUTTONS = [
    { id: "btnCobranzas", label: "Cobranzas" },
    { id: "btnAdministracion", label: "Administración" },
    { id: "btnCerrarSesion", label: "Cerrar sesión" }
];

router.get("/inicio_oficina.html", authPage, (req, res) => {
    return res.redirect("/inicio-oficina");
});

router.get("/inicio-oficina", authPage, (req, res) => {
    return res.render("pages/inicio_oficina", {
        title: "Inicio Oficina",
        styles: ["/modules/inicio_oficina/inicio_oficina.css"],
        scripts: ["/modules/inicio_oficina/inicio_oficina.js"],
        sidebarTitle: "Inicio Oficina",
        buttons: SIDEBAR_BUTTONS,
        auth: req.auth
    });
});

router.get("/modules/inicio_oficina/inicio_oficina.html", authPage, (req, res) => {
    return res.redirect("/inicio-oficina");
});

module.exports = router;
