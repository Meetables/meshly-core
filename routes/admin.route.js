const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyAuthAdmin } = require('../middleware/verifyAuth.middleware');
const { getUser, getUsers } = require('../controllers/getuser.controller');
const User = require('../models/user.models');
const { ENV_VARS } = require('../config/env-vars');



const router = express.Router();


router.get("/user", verifyAuthAdmin, getUser);

router.get("/users", verifyAuthAdmin, getUsers);

router.post("/test", verifyAuthAdmin, async (req, res) => {
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