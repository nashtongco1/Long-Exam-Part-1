
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { HttpStatus } = require("../config/constants");

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: "Not authorized, no token"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(HttpStatus.FORBIDDEN).json({
                message: "Account is inactive"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            message: "Not authorized, token failed"
        });
    }
};

module.exports = protect;
