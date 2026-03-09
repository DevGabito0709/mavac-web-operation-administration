// administracion.routes.js
const express = require("express");
const { authPage, requireRole } = require("../middlewares/auth");

const router = express.Router();

const SIDEBAR_BUTTONS = [
    { id: "btnVolver", label: "Regresar" }
];

router.get("/administracion", authPage, requireRole("admin"), (req, res) => {
    return res.render("pages/administracion", {
        title: "Administración",
        styles: [
            "/modules/administracion/administracion.css"
        ],
        scripts: [
            "/modules/administracion/administracion.js"
        ],
        sidebarTitle: "Administración",
        buttons: SIDEBAR_BUTTONS,
        auth: req.auth
    });
});

module.exports = router;


