const validator = require("validator");

const User = require("../models/user.models")

async function signup(req, res) {
    
    
    try {
        const {email, password, username} = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({success: false, message: "All fields are required"})
        } 
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({success: false, message: "Please provide all the data in the required format"})         
        }

        //TODO: Check for secure password also on backend-side

        const existingUserByEmail = await User.findOne({email: email})

        if (existingUserByEmail) {
            return res.status(400).json({success: false, message: "User with email already exists"})         
        }

        const existingUserByUsername = await User.findOne({Username: username})

        if (existingUserByUsername) {
            return res.status(400).json({success: false, message: "User with username already exists"})         
        }

        const newUser = new User({
            email,
            password,
            username
        })

        await newUser.save();

        res.status(201).json({success: true, user: {
            ...newUser._doc, password: ""
        }})

    } catch (error) {
        console.log("Error in signup controller: " +  error.message)

        res.status(500).json({success: false, message: "Internal Server Error"})
    }
    
}

async function login(req, res) {
  
}

async function logout(req, res) {
  
}

module.exports = {signup, login, logout};