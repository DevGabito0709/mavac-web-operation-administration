// public.routes.js
const express = require("express");
const { redirectIfAuthenticated } = require("../middlewares/auth");

const router = express.Router();

/* Página de login (renderizada con EJS) */
router.get("/", redirectIfAuthenticated, (req, res) => {
    return res.render("pages/login", {
        title: "Login",
        styles: ["/modules/login/login.css"],
        scripts: ["/modules/login/login.js"]
    });
});

router.get("/login.html", redirectIfAuthenticated, (req, res) => {
    return res.redirect("/");
});

router.get("/modules/login/login.html", redirectIfAuthenticated, (req, res) => {
    return res.redirect("/");
});

module.exports = router;
