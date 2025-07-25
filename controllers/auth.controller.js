//import dependencies
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ENV_VARS } = require("../config/env-vars");
const speakeasy = require("speakeasy");

const { sendConfirmationEmail } = require("../middleware/sendMail");
//load User model/document from database
const User = require("../models/user.models");

//load helper function to generate the JWT and send it as a cookie
const generateTokenAndSetCookie = require("../utils/generateToken");

const { getUserByIndividualFeatures, getUserByMongoID, mongo2object } = require("../middleware/databaseHandling");


// const KEYS_TO_REMOVE = ["password", "_id"];
// const KEYS_TO_REMOVE = ["_id", "confirmed", "clearance", "password", "profileTags", "stories", "ignoredRecommendations", "friends", "lastLocation", "notifications", "uid", "auth2FA"];
const KEYS_TO_REMOVE = ["_id", "confirmed", "clearance", "password", "stories", "notifications", "uid", "auth2FA"];




async function signup(req, res) {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        // Prevent XSS
        if (!validator.isAlphanumeric(username)) return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })

        //TODO: Check for secure password also on backend-side if config requires it

        //If there already exists a user with that email or username, refuse to newly create one

        const existingUserByEmail = await User.findOne({ email: email })

        if (existingUserByEmail) {
            return res.status(409).json({ success: false, message: "User with email already exists" })
        }

        const existingUserByUsername = await User.findOne({ username: username })

        if (existingUserByUsername) {
            return res.status(409).json({ success: false, message: "User with username already exists" })
        }

        //create password hash
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        //create the newly created user in db
        const newUser = new User({
            email,
            username,
            password: hashedPassword,
            clearance: ENV_VARS.USER_ROLES.NORMAL,
            confirmed: false
        })

        console.log(ENV_VARS.NODE_ENV)

        if (ENV_VARS.NODE_ENV === "development") {
            newUser.confirmed = true; // for development purposes, skip email confirmation
            await newUser.save();
            console.log("Skipping email confirmation in development mode");
        } else {
            const confirmationToken = jwt.sign(
                { _id: newUser._id, forconfirmation: true },
                ENV_VARS.JWT_SECRET,
                { expiresIn: '30m' }
            );
            const confirmationUrl = `${ENV_VARS.DOMAIN}/api/v1/auth/confirmation/?token=${confirmationToken}`; //! don't let user directly access this URL, use a frontend route instead + DONOT HARD CODE DOMAIN!!!!
            console.log("Confirmation URL: " + confirmationUrl);
            await sendConfirmationEmail(newUser.email, confirmationUrl);
            await newUser.save();
        }

        const trimmed_user = mongo2object(newUser, KEYS_TO_REMOVE)
        if (!trimmed_user.success) {
            return res.status(trimmed_user.outcome.status).json({ success: false, ...trimmed_user.outcome.result });
        }

        res.status(201).json({
            success: true,
            user: trimmed_user.outcome.result.user
        });

    } catch (error) {
        //error handling
        console.log("Error in signup controller: " + error.message)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }

}


async function setup2fa(req, res) {
    const token = req.cookies["jwt-meshlycore"];
    try {
        const user = await User.findById(jwt.verify(token, ENV_VARS.JWT_SECRET).userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const secret = speakeasy.generateSecret({ name: `Meetables: ${user.username}` });
        user.auth2FA.secret = secret.base32;
        user.auth2FA.enabled = true;
        await user.save();

        return res.status(201).json({
            success: true,
            qrCodeUrl: secret.otpauth_url
        });

    } catch (error) {
        console.log("Error in setup2fa controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function confirmation(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: "Confirmation token is required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        if (!decoded.forconfirmation) {
            return res.status(400).json({ success: false, message: "Token is not for confirmation" });
        }

        const result = await getUserByMongoID(decoded._id, ["password"]);
        if (!result.success) {
            return res.status(result.outcome.status).json({ success: false, ...result.outcome.result });
        }
        const user = result.outcome.result.user;

        if (user.confirmed) {
            return res.status(400).json({ success: false, message: "Email already confirmed" });
        }

        user.confirmed = true;
        await user.save();

        generateTokenAndSetCookie(user._id, res); // Optionally generate a JWT for the user after confirmation

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.log("Error in confirmation controller: " + error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


async function verifyBasicCredentials(req, res) {
    try {
        const { email, username, password } = req.body;

        if (!email && !username) {
            return res.status(400).json({ success: false, message: "Email or username is required" });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        get_user = await getUserByIndividualFeatures({ email, username }); // {success: <bool>, result: {status: <http code>, outcome: <data to be returned>}}
        if (!get_user.success) {
            return res.status(get_user.outcome.status).json({ success: false, ...get_user.outcome.result });
        }
        const user = get_user.outcome.result.user;

        if (!await bcryptjs.compare(password, user.password)) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.confirmed) {
            return res.status(403).json({ success: false, message: "Email not confirmed" });
        }

        if (!user.auth2FA.enabled) {
            return res.status(200).json({
                success: true,
                confirmation_required: false
            });
        }

        return res.status(202).json({
            success: true,
            confirmation_required: true
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function login(req, res) { //! FINISH
    try {
        const { email, username, password, verification_code } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        if (!email && !username) {
            return res.status(400).json({ success: false, message: "Email or username is required" });
        }

        get_user = await getUserByIndividualFeatures({ email, username }); // {success: <bool>, result: {status: <http code>, outcome: <data to be returned>}}
        if (!get_user.success) {
            return res.status(get_user.outcome.status).json({ success: false, ...get_user.outcome.result });
        }
        const user = get_user.outcome.result.user;

        if (!await bcryptjs.compare(password, user.password)) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.confirmed) {
            return res.status(403).json({ success: false, message: "Email not confirmed" });
        }



        // 2FA Check
        if (user.auth2FA.enabled) {
            if (!verification_code) {
                return res.status(400).json({ success: false, message: "Verification code is required" });
            }

            const verified = speakeasy.totp.verify({
                secret: user.auth2FA.secret,
                encoding: "base32",
                token: verification_code
            });

            if (!verified) {
                return res.status(401).json({ success: false, message: "Invalid verification code" });
            }
        }
        // End of 2FA Check



        generateTokenAndSetCookie(user._id, res);

        const trimmed_user = mongo2object(user, KEYS_TO_REMOVE);
        if (!trimmed_user.success) {
            return res.status(trimmed_user.outcome.status).json({ success: false, ...trimmed_user.outcome.result });
        }

        res.status(200).json({
            success: true,
            user: trimmed_user.outcome.result.user
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function logout(req, res) {
    try {
        //clear the jwt cookie
        res.clearCookie("jwt-meshlycore");
        res.sendStatus(204);
    } catch (error) {
        console.log("Error in logout controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function resetPassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const token = req.cookies["jwt-meshlycore"];

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Old and new password are required" });
    }

    try {
        const user = await User.findById(jwt.verify(token, ENV_VARS.JWT_SECRET).userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!await bcryptjs.compare(oldPassword, user.password)) {
            return res.status(400).json({ success: false, message: "Old password is incorrect" });
        }

        if (newPassword == oldPassword) {
            return res.status(400).json({ success: false, message: "New password cannot be the same as old password" });
        }

        user.password = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10));
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.log("Error in resetPassword controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


const test = async (req, res) => {
    const token = req.cookies["jwt-meshlycore"];

    if (!token) {
        return res.status(401).json({ success: false, message: "Token missing" });
    }

    try {
        const user = await User.findById(jwt.verify(token, ENV_VARS.JWT_SECRET).userId);

        if (!user) {
            console.log("User not found even though valid token")
            return res.status(500).json({ success: false, message: "Internal server error" });
        }


        const trimmed_user = mongo2object(user, KEYS_TO_REMOVE);
        if (!trimmed_user.success) {
            return res.status(trimmed_user.outcome.status).json({ success: false, ...trimmed_user.outcome.result });
        }

        return res.status(200).json({ success: true, user: trimmed_user.outcome.result.user });
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};



module.exports = { signup, login, logout, test, confirmation, resetPassword, setup2fa, verifyBasicCredentials };