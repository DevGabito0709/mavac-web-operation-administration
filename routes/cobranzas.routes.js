const express = require("express");
const { authPage } = require("../middlewares/auth");

const router = express.Router();

const SIDEBAR_BUTTONS = [
    { id: "btnVolver", label: "Regresar" }
];

router.get("/cobranzas.html", authPage, (req, res) => {
    return res.redirect("/cobranzas");
});

router.get("/cobranzas", authPage, (req, res) => {
    return res.render("pages/cobranzas", {
        title: "Cobranzas",
        styles: ["/modules/cobranzas/cobranzas.css"],
        scripts: ["/modules/cobranzas/cobranzas.js"],
        sidebarTitle: "Cobranzas",
        buttons: SIDEBAR_BUTTONS
    });
});

router.get("/modules/cobranzas/cobranzas.html", authPage, (req, res) => {
    return res.redirect("/cobranzas");
});

module.exports = router;
