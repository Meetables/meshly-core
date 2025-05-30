//import dependencies: express, auth functions from auth controller, verifyAuth middleware
const express = require('express');
const { signup, login, logout } = require('../controllers/auth.controller');
const verifyAuth = require('../middleware/verifyAuth.middleware');

//create router
const router = express.Router();

//endpoints this router is offering

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.post("/test", verifyAuth, (req, res) => {
    res.status(200).json({"authorized": "true"})
})

//export router
module.exports = router; 
