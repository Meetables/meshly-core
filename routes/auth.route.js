const express = require('express');
const { signup } = require('../controllers/auth.controller');

const router = express.Router();


router.get("/signup", signup)

router.get("/login", (req, res) => {
    res.send("Login")
})

router.get("/logout", (req, res) => {
    res.send("Logout")
})


module.exports = router;
