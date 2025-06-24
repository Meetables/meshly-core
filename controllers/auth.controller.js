//import dependencies
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ENV_VARS } = require("../config/env-vars");

//load User model/document from database
const User = require("../models/user.models");

//load helper function to generate the JWT and send it as a cookie
const generateTokenAndSetCookie = require("../utils/generateToken");

//sign up function
async function signup(req, res) {

    try {
        //this function requires an email, password as well as a username for the newly created user.
         const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        //use validator instead of regex (🤮) to verify whether the provided mail address is actually one.
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Prevent XSS

        if(!validator.isAlphanumeric(username)){
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Check for secure password also on backend-side

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
            password: hashedPassword,
            username,
            clearance: ENV_VARS.USER_ROLES.NORMAL
        })

        //generate a token, then send it as a 🍪 to the user
        generateTokenAndSetCookie(newUser._id, res)

        //then save the document
        await newUser.save();

        res.status(201).json({
            success: true, user: {...newUser._doc, password: undefined}
        })

    } catch (error) {
        //error handling
        console.log("Error in signup controller: " + error.message)

        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }

}

//login function
async function login(req, res) {
    try {
        //this function requires an email and password to authenticate the user.
        const { email, password } = req.body;

        //check if all fields are provided
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        //find the user by email
        const user = await User.findOne({ email: email });

        //if user is not found, return an error
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        //compare the provided password with the hashed password in the database
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);

        //if password is incorrect, return an error
        if (!isPasswordCorrect) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        //generate a token and send it as a cookie to the user
        generateTokenAndSetCookie(user._id, res);

        //return the user data without the password
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
        //clear the jwt cookie
        res.clearCookie("jwt-meshlycore");
        res.sendStatus(204);
    } catch (error) {
        console.log("Error in logout controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
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



module.exports = { signup, login, logout, test };