const express = require('express');
const jwt = require('jsonwebtoken');

const { signup, login, logout, test, confirmation, resetPassword } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');
const User = require("../models/user.models");
const { ENV_VARS } = require('../config/env-vars');



const router = express.Router();


router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", verifyAuth, logout)

router.post("/confirmation", confirmation)

router.post("/resetPassword", verifyAuth, resetPassword)

router.get("/test", verifyAuth, test)




module.exports = router;