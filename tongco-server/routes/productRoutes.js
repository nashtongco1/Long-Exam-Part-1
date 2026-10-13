const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    uploadProductImage,
    deleteProduct
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    productValidation
} = require("../middleware/validationMiddleware");
const upload = require("../middleware/uploadImageMiddleware");

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    upload.single("image"),
    upload.validateImageContent,
    productValidation,
    createProduct
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    upload.single("image"),
    upload.validateImageContent,
    updateProduct
);

router.post(
    "/:id/upload-image",
    protect,
    authorizeRoles("admin"),
    upload.single("image"),
    upload.validateImageContent,
    uploadProductImage
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteProduct
);

module.exports = router;