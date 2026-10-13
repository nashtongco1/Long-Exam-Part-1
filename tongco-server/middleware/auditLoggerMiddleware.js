
const Log = require("../models/Log");

const auditLogger = (req, res, next) => {
    const startTime = new Date();

    res.on("finish", () => {
        const userId = req.user ? req.user._id : null;
        console.log(
            `[${startTime.toISOString()}] ${req.method}
            ${req.originalUrl} - Status: ${res.statusCode} - User: ${userId || "Guest"}`
        );

        Log.create({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            user: userId,
            ipAddress: req.ip,
            timestamp: startTime
        }).catch((error) => {
            console.error("Audit log error:", error.message);
        });
    });

    next();
};

module.exports = auditLogger;
