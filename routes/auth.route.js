const express = require('express');
const jwt = require('jsonwebtoken');

const { signup, login, logout, test, confirmation, resetPassword } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');



const router = express.Router();


router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", verifyAuth, logout)

router.get("/confirmation", confirmation)

router.post("/resetPassword", verifyAuth, resetPassword)

router.get("/test", verifyAuth, test)




module.exports = router;