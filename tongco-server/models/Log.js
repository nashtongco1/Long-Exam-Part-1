
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
    {
        method: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        statusCode: {
            type: Number,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        ipAddress: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Log", logSchema);
