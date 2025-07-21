//import dependencies: express, auth functions from auth controller, verifyAuth middleware
const express = require('express');
const jwt = require('jsonwebtoken');

const { signup, login, logout, test, confirmation, resetPassword, setup2fa, verifyBasicCredentials } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');



//create router
const router = express.Router();

//endpoints this router is offering

router.post("/signup", signup)

router.post("/setup2fa", verifyAuth, setup2fa)

router.get("/confirmation", confirmation)

router.post("/verifyBasicCredentials", verifyBasicCredentials)

router.post("/login", login)

router.post("/logout", verifyAuth, logout)

router.post("/resetPassword", verifyAuth, resetPassword)

router.get("/test", verifyAuth, test)




module.exports = router;