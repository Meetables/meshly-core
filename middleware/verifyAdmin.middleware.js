const jwt =  require("jsonwebtoken");
const { ENV_VARS } = require("../config/env-vars");
const User = require("../models/user.models");


const verifyAdminAuth = async (req, res, next) => {
	try {

		console.log(req.headers.cookie)

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
		console.log("Error in verifyAdminAuth middleware: ", error.message);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

module.exports = verifyAdminAuth;