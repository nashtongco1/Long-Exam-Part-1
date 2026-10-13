const bcrypt = require("bcryptjs");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { HttpStatus } = require("../config/constants");

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        if (password.length < 6) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "customer",
            type: "viewer",
            isActive: true
        });

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "Registration successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                type: user.type,
                isActive: user.isActive
            },
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        const now = new Date();

        if (user.loginLockUntil && user.loginLockUntil > now) {
            const remainingMinutes = Math.ceil(
                (user.loginLockUntil.getTime() - now.getTime()) / 60000
            );

            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
                failedLoginAttempts: user.failedLoginAttempts
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            const attempts = (user.failedLoginAttempts || 0) + 1;

            let lockMinutes = 0;

            if (attempts === 5) {
                lockMinutes = 3;
            } else if (attempts === 8) {
                lockMinutes = 5;
            } else if (attempts >= 10) {
                lockMinutes = 30;
            }

            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        failedLoginAttempts: attempts,
                        loginLockUntil: lockMinutes > 0
                            ? new Date(Date.now() + lockMinutes * 60000)
                            : null
                    }
                }
            );

            if (lockMinutes > 0) {
                return res.status(HttpStatus.FORBIDDEN).json({
                    success: false,
                    message: `Account temporarily locked for ${lockMinutes} minute(s).`,
                    failedLoginAttempts: attempts
                });
            }

            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid email or password",
                failedLoginAttempts: attempts
            });
        }

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    failedLoginAttempts: 0,
                    loginLockUntil: null
                }
            }
        );

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                type: user.type,
                isActive: user.isActive
            },
            token: generateToken(user._id)
        });

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
