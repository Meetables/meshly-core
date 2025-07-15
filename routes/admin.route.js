//NOT YET IN USE
const express = require('express');
const jwt = require('jsonwebtoken');

const { test } = require('../controllers/auth.controller');
const { verifyAuthAdmin } = require('../middleware/verifyAuth.middleware');
const { getUser, getUsers, userElevation, forceResetPassword } = require('../controllers/admin.controller');
const User = require('../models/user.models');
const { ENV_VARS } = require('../config/env-vars');



const router = express.Router();


router.get("/user", verifyAuthAdmin, getUser);

router.get("/users", verifyAuthAdmin, getUsers);

router.get("/test", verifyAuthAdmin, test)

router.post("/elevation", verifyAuthAdmin, userElevation)

router.post("/forcePasswordReset", verifyAuthAdmin, forceResetPassword)



module.exports = router;