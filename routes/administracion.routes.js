const express = require("express");
const { authPage } = require("../middlewares/auth");

const router = express.Router();

const SIDEBAR_BUTTONS = [
    { id: "btnVolver", label: "Regresar" }
];

router.get("/administracion.html", authPage, (req, res) => {
    return res.redirect("/administracion");
});

router.get("/administracion", authPage, (req, res) => {
    return res.render("pages/administracion", {
        title: "Administración",
        styles: ["/modules/administracion/administracion.css"],
        scripts: ["/modules/administracion/administracion.js"],
        sidebarTitle: "Administración",
        buttons: SIDEBAR_BUTTONS
    });
});

router.get("/modules/administracion/administracion.html", authPage, (req, res) => {
    return res.redirect("/administracion");
});

module.exports = router;
