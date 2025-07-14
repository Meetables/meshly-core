const express = require('express');
const jwt = require('jsonwebtoken');

const { signup, login, logout, test, confirmation, resetPassword, setup2fa, verifyBasicCredentials } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');



const router = express.Router();


router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", verifyAuth, logout)

router.get("/confirmation", confirmation)

router.post("/resetPassword", verifyAuth, resetPassword)

router.get("/test", verifyAuth, test)

router.post("/setup2fa", verifyAuth, setup2fa)

router.post("/verifyBasicCredentials", verifyBasicCredentials)




module.exports = router;