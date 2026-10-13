
const express = require("express");

const {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { validateRequest } = require("../middleware/validationMiddleware");

const { apiLimiter } = require("../middleware/rateLimiterMiddleware");

const { body, param } = require("express-validator");

const router = express.Router();

const profileValidation = [
    body("name").optional().isString().isLength({ min: 2 }),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("age").optional().isInt({ min: 1 }),
    body("gender").optional().isString(),
    body("contactNumber").optional().isString(),
    body("email").optional().isEmail().normalizeEmail(),
    body("username").optional().isString(),
    body("address").optional().isString(),
    validateRequest
];

const userUpdateValidation = [
    body("name").optional().isString().isLength({ min: 2 }),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("age").optional().isInt({ min: 1 }),
    body("gender").optional().isString(),
    body("contactNumber").optional().isString(),
    body("email").optional().isEmail().normalizeEmail(),
    body("username").optional().isString(),
    body("address").optional().isString(),
    body("role").optional().isIn(["customer", "admin"]),
    body("type").optional().isIn(["admin", "editor", "viewer"]),
    body("isActive").optional().isBoolean(),
    validateRequest
];

const passwordValidation = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),
    validateRequest
];

const userIdValidation = [
    param("id").isMongoId().withMessage("Invalid user ID"),
    validateRequest
];

router.use(apiLimiter);

router.get(
    "/profile",
    protect,
    getProfile
);

router.put(
    "/profile",
    protect,
    profileValidation,
    updateProfile
);

router.put(
    "/change-password",
    protect,
    passwordValidation,
    changePassword
);

router.get(
    "/admin-only",
    protect,
    authorizeRoles("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Admin"
        });
    }
);

router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getAllUsers
);

router.get(
    "/:id",
    protect,
    authorizeRoles("admin"),
    userIdValidation,
    getUserById
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    userIdValidation,
    userUpdateValidation,
    updateUser
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    userIdValidation,
    deleteUser
);

module.exports = router;
