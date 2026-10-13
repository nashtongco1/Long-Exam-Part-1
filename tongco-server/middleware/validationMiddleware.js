
const { body, validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    next();
};

const registerValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isString().withMessage("Name must be a string")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

    body("firstName")
        .optional()
        .isString().withMessage("First name must be a string"),

    body("lastName")
        .optional()
        .isString().withMessage("Last name must be a string"),

    body("age")
        .optional()
        .isInt({ min: 1 }).withMessage("Age must be a positive integer"),

    body("gender")
        .optional()
        .isString().withMessage("Gender must be a string"),

    body("contactNumber")
        .optional()
        .isString().withMessage("Contact number must be a string"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("username")
        .optional()
        .isString().withMessage("Username must be a string"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    body("role")
        .optional()
        .isIn(["customer", "admin"]).withMessage("Invalid role"),

    body("type")
        .optional()
        .isIn(["admin", "editor", "viewer"]).withMessage("Invalid user type"),

    body("address")
        .optional()
        .isString().withMessage("Address must be a string"),

    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean"),

    validateRequest
];

const loginValidation = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),

    validateRequest
];

const productValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Product name is required"),

    body("description")
        .trim()
        .notEmpty().withMessage("Product description is required"),

    body("price")
        .notEmpty().withMessage("Product price is required")
        .isFloat({ min: 0 }).withMessage("Product price must be a valid non-negative number"),

    body("stock")
        .notEmpty()
        .withMessage("Product stock is required")
        .isInt({ min: 0 }).withMessage("Product stock must be a valid non-negative number"),

    body("category")
        .notEmpty().withMessage("Product category is required"),

    body("supplier")
        .notEmpty().withMessage("Product supplier is required"),

    validateRequest
];

module.exports = {
    validateRequest,
    registerValidation,
    loginValidation,
    productValidation
};
