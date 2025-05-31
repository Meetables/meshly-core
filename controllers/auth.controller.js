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
            email,
            password: hashedPassword,
            username,
            clearanceLevel: 0
        })

        
        generateTokenAndSetCookie(newUser._id, res)
        await newUser.save();

        res.status(201).json({
            success: true, user: {
                ...newUser._doc, password: ""
            }
        })

    } catch (error) {
        console.log("Error in signup controller: " + error.message)

        res.status(500).json({ success: false, message: "Internal Server Error" })
    }

}

async function login(req, res) {
    try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ success: false, message: "All fields are required" });
		}

		const user = await User.findOne({ email: email });
		if (!user) {
			return res.status(404).json({ success: false, message: "Invalid credentials" });
		}

		const isPasswordCorrect = await bcryptjs.compare(password, user.password);

		if (!isPasswordCorrect) {
			return res.status(404).json({ success: false, message: "Invalid credentials" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			success: true,
			user: {
				...user._doc,
				password: "",
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
        const user = await User.findOne({_id: jwt.verify(token, ENV_VARS.JWT_SECRET).userId})
        if (!user) {
            res.status(500).json({ "authorized": "false", "message": "User not found even though valid Token" });
        } else {
            const { password, ...userWithoutPassword } = user.toObject();
            res.status(200).json({ authorized: "true", user: userWithoutPassword });
        }
    } catch (err) {
        res.status(401).json({ "authorized": "false", "message": "Invalid token"});
    }
}



module.exports = { signup, login, logout, test };