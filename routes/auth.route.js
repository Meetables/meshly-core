const express = require('express');
const jwt = require('jsonwebtoken');

const { signup, login, logout } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');
const User = require("../models/user.models");
const { ENV_VARS } = require('../config/env-vars');



const router = express.Router();


router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.post("/test", verifyAuth, async (req, res) => {
    const token = req.cookies["jwt-meshlycore"];

    try {
        const user = await User.findOne({_id: jwt.verify(token, ENV_VARS.JWT_SECRET).userId})
        if (!user) {
            res.status(500).json({ "authorized": "false", "message": "User not found even though valid Token" });
        } else {
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json({ authorized: "true", user: userWithoutPassword });
        }
    } catch (err) {
        res.status(401).json({ "authorized": "false", "message": "Invalid token"});
    }
})




module.exports = router;