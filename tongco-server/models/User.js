const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        firstName: {
            type: String,
            trim: true,
            default: ""
        },
        lastName: {
            type: String,
            trim: true,
            default: ""
        },
        age: {
            type: Number,
            min: 1
        },
        gender: {
            type: String,
            trim: true,
            default: ""
        },
        contactNumber: {
            type: String,
            trim: true,
            default: ""
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        username: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6
        },
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer"
        },
        type: {
            type: String,
            enum: ["admin", "editor", "viewer"],
            default: "viewer"
        },
        address: {
            type: String,
            trim: true,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        loginLockUntil: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
