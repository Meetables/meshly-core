const jwt =  require("jsonwebtoken");

const { ENV_VARS } = require("../config/env-vars");
const User = require("../models/user.models");


const verifyAuth = async (req, res, next) => {
	try {

		if(!req.cookies){
			return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
		}

		const token = req.cookies["jwt-meshlycore"];

		if (!token) {
			return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
		}

		const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("Error in verifyAuth middleware: ", error.message);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

const verifyAuthAdmin = async (req, res, next) => {
	try {
		if(!req.cookies){
			return res.status(401).json({ success: false, message: "No Token Provided" });
		}

		const token = req.cookies["jwt-meshlycore"];

		if (!token) {
			return res.status(401).json({ success: false, message: "No Token Provided" });
		}

		const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ success: false, message: "Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		if (user.clearanceLevel == 0) {
			return res.status(403).json({ success: false, message: "Insufficient Clearance Level" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("Error in verifyAuth middleware: ", error.message);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};


module.exports = { verifyAuth, verifyAuthAdmin };