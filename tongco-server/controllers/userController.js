
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { HttpStatus } = require("../config/constants");

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Profile retrieved successfully",
            count: 1,
            data: [user]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve profile",
            error: error.message
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const {
            name,
            firstName,
            lastName,
            age,
            gender,
            contactNumber,
            email,
            username,
            address
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });

            if (emailExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Email is already in use"
                });
            }
        }

        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username });

            if (usernameExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Username is already in use"
                });
            }
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (firstName !== undefined) {
            user.firstName = firstName;
        }

        if (lastName !== undefined) {
            user.lastName = lastName;
        }

        if (age !== undefined) {
            user.age = age;
        }

        if (gender !== undefined) {
            user.gender = gender;
        }

        if (contactNumber !== undefined) {
            user.contactNumber = contactNumber;
        }

        if (email !== undefined) {
            user.email = email;
        }

        if (username !== undefined) {
            user.username = username;
        }

        if (address !== undefined) {
            user.address = address;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select("-password");

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Profile updated successfully",
            count: 1,
            data: [updatedUser]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatch) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(
            newPassword,
            salt
        );

        await user.save();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to change password",
            error: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Users retrieved successfully",
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "User retrieved successfully",
            count: 1,
            data: [user]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve user",
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const {
            name,
            firstName,
            lastName,
            age,
            gender,
            contactNumber,
            email,
            username,
            address,
            role,
            type,
            isActive
        } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: user._id }
            });

            if (emailExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Email is already in use"
                });
            }
        }

        if (username && username !== user.username) {
            const usernameExists = await User.findOne({
                username,
                _id: { $ne: user._id }
            });

            if (usernameExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Username is already in use"
                });
            }
        }

        if (role !== undefined && !["customer", "admin"].includes(role)) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Invalid role"
            });
        }

        if (
            type !== undefined &&
            !["admin", "editor", "viewer"].includes(type)
        ) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Invalid user type"
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (firstName !== undefined) {
            user.firstName = firstName;
        }

        if (lastName !== undefined) {
            user.lastName = lastName;
        }

        if (age !== undefined) {
            user.age = age;
        }

        if (gender !== undefined) {
            user.gender = gender;
        }

        if (contactNumber !== undefined) {
            user.contactNumber = contactNumber;
        }

        if (email !== undefined) {
            user.email = email;
        }

        if (username !== undefined) {
            user.username = username;
        }

        if (address !== undefined) {
            user.address = address;
        }

        if (role !== undefined) {
            user.role = role;
        }

        if (type !== undefined) {
            user.type = type;
        }

        if (isActive !== undefined) {
            user.isActive = isActive;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select("-password");

        res.status(HttpStatus.OK).json({
            success: true,
            message: "User updated successfully",
            count: 1,
            data: [updatedUser]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        await user.deleteOne();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "User deleted successfully",
            count: 1,
            data: []
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};
