const multer = require("multer");

const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode =
        res.statusCode === 200
            ? 500
            : res.statusCode;

    let message = err.message;

    if (err instanceof multer.MulterError) {
        statusCode = 400;

        if (err.code === "LIMIT_FILE_SIZE") {
            message = "Image file is too large. Maximum size is 5MB.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected image upload field.";
        } else {
            message = err.message;
        }
    }

    if (
        err.message ===
        "Only JPEG, PNG, and WebP image files are allowed."
    ) {
        statusCode = 400;
        message =
            "Only JPEG, PNG, and WebP image files are allowed.";
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource ID";
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate value entered";
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = {
    notFound,
    errorHandler
};