// public.routes.js
const express = require("express");
const { redirectIfAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.get("/", redirectIfAuthenticated, (req, res) => {
    return res.render("pages/login", {
        title: "Login",
        styles: [
            "/modules/login/login.css"
        ],
        scripts: [
            "/modules/login/login.js"
        ]
    });
});

router.get("/login", redirectIfAuthenticated, (req, res) => {
    return res.redirect("/");
});

module.exports = router;
