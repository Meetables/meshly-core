const express = require('express');
const { signup, login, logout } = require('../controllers/auth.controller');
const verifyAuth = require('../middleware/verifyAuth.middleware');

const router = express.Router();


router.post("/test", verifyAuth, (req, res) => {
    res.status(200).json({"authorized": "true"})
})

module.exports = router; 
