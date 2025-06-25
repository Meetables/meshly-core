const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ENV_VARS } = require("../config/env-vars");

const User = require("../models/user.models");
const generateTokenAndSetCookie = require("../utils/generateToken");

const { getUserByIndividualFeatures, changeUserAttributs, mongo2object } = require("../middleware/databaseHandling");

async function signup(req, res) {
    try {
        const { email, password, username } = req.body;
        if (!password) return res.status(400).json({ success: false, message: "Password is required" })
        if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Invalid email format" })
        //TODO: Prevent XSS
        if(!validator.isAlphanumeric(username)) return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        //TODO: Check for secure password also on backend-side
        if (await User.findOne({ email: email })) return res.status(400).json({ success: false, message: "User with email already exists" })
        if (await User.findOne({ username: username })) return res.status(400).json({ success: false, message: "User with username already exists" })
 

        const newUser = new User({
            email,
            username,
            password: await bcryptjs.hash(password, await bcryptjs.genSalt(10)),
            clearance: ENV_VARS.USER_ROLES.NORMAL,
            confirmed: false
        })

        const confirmationToken = jwt.sign(
            { _id: newUser._id, forconfirmation: true },
            ENV_VARS.JWT_SECRET,
            { expiresIn: '30m' }
        );
        const confirmationUrl = `http://yourapp.com/confirm?token=${confirmationToken}`;
        console.log(`Confirmation link: ${confirmationUrl}`);

        //! SEND CONFIRMATION EMAIL HERE WITH UID AS PARAM!!!!!!!!!!!!!!!

        await newUser.save();

        return res.status(201).json({
            success: true, user: {...newUser._doc, password: undefined, _id: undefined}
        })

    } catch (error) {
        console.log("Error in signup controller: " + error.message)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
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

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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


async function login(req, res) {
    try {
        const { email, username, password } = req.body;

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

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            success: true,
            user: mongo2object(user, ["password", "_id"])
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function logout(req, res) {
    try {
		res.clearCookie("jwt-meshlycore");
		res.status(200).json({ success: true, message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
}


async function resetPassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const token = req.cookies["jwt-meshlycore"];

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
        return res.status(401).json({ authorized: "false", message: "Token missing" });
    }

    try {
        const user = await User.findById(jwt.verify(token, ENV_VARS.JWT_SECRET).userId).select("-password -_id");

        if (!user) {
            console.log("User not found even though valid token")
            return res.status(500).json({ authorized: "false", message: "Internal server error" });
        }

        return res.status(200).json({ authorized: "true", user: mongo2object(user) });
    } catch (err) {
        return res.status(401).json({ authorized: "false", message: "Invalid or expired token" });
    }
};



module.exports = { signup, login, logout, test, confirmation, resetPassword };