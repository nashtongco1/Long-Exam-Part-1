
const { HttpStatus } = require("../config/constants");

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Not authorized"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = authorizeRoles;
