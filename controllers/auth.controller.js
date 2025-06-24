const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ENV_VARS } = require("../config/env-vars");

const User = require("../models/user.models");
const generateTokenAndSetCookie = require("../utils/generateToken");

async function signup(req, res) {


    try {
         const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Prevent XSS

        if(!validator.isAlphanumeric(username)){
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Check for secure password also on backend-side

        const existingUserByEmail = await User.findOne({ email: email })

        if (existingUserByEmail) {
            return res.status(400).json({ success: false, message: "User with email already exists" })
        }

        const existingUserByUsername = await User.findOne({ username: username })

        if (existingUserByUsername) {
            return res.status(400).json({ success: false, message: "User with username already exists" })
        }
 
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newUser = new User({
            confirmed: false,
            email,
            password: hashedPassword,
            username,
            clearance: ENV_VARS.USER_ROLES.NORMAL
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

        if ((!email && !username) || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        let query = {};
        if (email) query.email = email;
        if (username) query.username = username;

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.confirmed) {
            return res.status(403).json({ success: false, message: "Email not confirmed" });
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: undefined
            },
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

const test = async (req, res) => {
    const token = req.cookies["jwt-meshlycore"];

    try {
        const user = await User.findById(jwt.verify(token, ENV_VARS.JWT_SECRET).userId).select("-password");
        if (!user) {
            res.status(500).json({ "authorized": "false", "message": "User not found even though valid Token" });
        } else {
            res.status(200).json({ authorized: "true", user: user._doc });
        }
    } catch (err) {
        res.status(401).json({ "authorized": "false", "message": "Invalid token"});
    }
}



module.exports = { signup, login, logout, test, confirmation };