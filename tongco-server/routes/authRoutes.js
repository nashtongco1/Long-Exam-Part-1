const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const {
    registerValidation,
    loginValidation
} = require("../middleware/validationMiddleware");

const {
    loginLimiter
} = require("../middleware/rateLimiterMiddleware");

const router = express.Router();

router.post(
    "/register",
    registerValidation,
    registerUser
);

router.post(
    "/login",
    loginLimiter,
    loginValidation,
    loginUser
);

module.exports = router;
